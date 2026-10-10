import { DOCUMENT, Injectable, inject } from '@angular/core';
import { SupabaseService } from '@services/supabase/supabase.service';
import { RiderWorkspaceService } from '@services/rider-workspace/rider-workspace.service';
import { RiderBankDetails, RiderDetailsRow, RiderDocumentKey, RiderDocuments, RiderPersonalInfo, RiderProfile, RiderRow, RiderVehicle, SavedPersonalInfo } from '@appTypes/rider.types';
import { MapPoint } from '@appTypes/order.types';
import { unwrap } from '@utils/supabase-result/supabase-result.util';
import { isDataUrl, shrinkImage } from '@utils/image/image.util';
import { lastFour } from '@utils/mask/mask.util';
import { RIDER_COLUMNS, RIDER_DETAILS_COLUMNS, RIDER_DOCUMENTS, SUPABASE_RPC, SUPABASE_TABLES } from '@constants/supabase.constants';
import { DOCUMENT_IMAGE, RIDER_DOCUMENT_FILES } from '@constants/personal-document.constants';
import { ERROR_MESSAGES } from '@constants/messages.constants';

type RiderPatch = Partial<Pick<RiderRow, 'full_name' | 'phone' | 'licence_number' | 'vehicle_type' | 'vehicle_number' | 'upi_id' | 'photo_url' | 'licence_url' | 'id_proof_url'>>;
type DetailsPatch = Partial<Omit<RiderDetailsRow, 'rider_id' | 'tenant_id' | 'updated_at'>>;

/**
 * The rider's own records for the business they ride for (RiderWorkspaceService), plus going
 * online and reporting position (migrations 0005, 0014):
 *
 * - `riders`: name, phone, licence number, vehicle, UPI and the paths of the document photos.
 *   Restaurant staff see this row (they assign jobs to it).
 * - `rider_details`: date of birth, address, city, father's name, blood group and national ID.
 *   Only the rider and Super Admin can read it; the national ID is read back as its last 4 only.
 * - Storage bucket `rider-documents`: the photos, under "<tenant_id>/<user_id>/", shown through
 *   short-lived signed URLs.
 *
 * The first save of personal information creates the `riders` row; Super Admin then verifies it.
 * Document images, payout and ID details are sensitive: never log them.
 */
@Injectable({ providedIn: 'root' })
export class RiderService {
  private readonly supabase = inject(SupabaseService);
  private readonly workspace = inject(RiderWorkspaceService);
  private readonly document = inject(DOCUMENT);

  /** The rider's profile, or null before the first personal-information save. */
  async getProfile(uid: string): Promise<RiderProfile | null> {
    const row = await this.findRow(uid);
    return row ? toProfile(row) : null;
  }

  /** What the personal-information form showed when last saved (national ID as its last 4 only). */
  async getPersonalInfo(uid: string): Promise<SavedPersonalInfo | null> {
    const row = await this.findRow(uid);
    if (!row) {
      return null;
    }
    const details = await this.findDetails(row.id);
    const [firstName = '', ...rest] = row.full_name.trim().split(/\s+/);
    const info: RiderPersonalInfo = {
      firstName,
      lastName: rest.join(' '),
      fathersName: details?.fathers_name ?? '',
      dateOfBirth: details?.date_of_birth ?? '',
      mobileNumber: row.phone,
      bloodGroup: details?.blood_group ?? '',
      city: details?.city ?? '',
      address: details?.address ?? '',
      deliveryLicenseId: row.licence_number ?? '',
      nationalId: '',
    };
    return { info, nationalIdLast4: lastFour(details?.national_id ?? null) };
  }

  /**
   * Name, phone and licence number go to `riders` (created on the first save); the rest to the
   * rider-only `rider_details`. An empty national ID keeps the one saved before.
   */
  async savePersonalInfo(uid: string, info: RiderPersonalInfo): Promise<void> {
    const { tenantId } = await this.workspace.current();
    const riderPatch: RiderPatch = { full_name: `${info.firstName} ${info.lastName}`.trim(), phone: info.mobileNumber.trim(), licence_number: info.deliveryLicenseId.trim() || null };
    const existing = await this.findRow(uid);
    const riders = this.supabase.require().from(SUPABASE_TABLES.RIDERS);
    let riderId = existing?.id;
    if (existing) {
      unwrap(await riders.update(riderPatch).eq('id', existing.id));
    } else {
      riderId = unwrap<Pick<RiderRow, 'id'>>(await riders.insert({ ...riderPatch, tenant_id: tenantId, user_id: uid }).select('id').single())?.id;
    }
    if (!riderId) {
      throw new Error(ERROR_MESSAGES.DATA_FAILED);
    }
    const detailsPatch: DetailsPatch = {
      date_of_birth: info.dateOfBirth || null,
      address: info.address.trim() || null,
      city: info.city.trim() || null,
      fathers_name: info.fathersName.trim() || null,
      blood_group: info.bloodGroup || null,
      ...(info.nationalId.trim() ? { national_id: info.nationalId.trim() } : {}),
    };
    const details = this.supabase.require().from(SUPABASE_TABLES.RIDER_DETAILS);
    if (await this.findDetails(riderId)) {
      unwrap(await details.update(detailsPatch).eq('rider_id', riderId));
    } else {
      unwrap(await details.insert({ ...detailsPatch, rider_id: riderId, tenant_id: tenantId }));
    }
  }

  /** The saved photos as short-lived signed URLs ('' for one not uploaded yet). */
  async getDocuments(uid: string): Promise<RiderDocuments | null> {
    const row = await this.findRow(uid);
    if (!row) {
      return null;
    }
    const keys = Object.keys(RIDER_DOCUMENT_FILES) as RiderDocumentKey[];
    const urls = await Promise.all(keys.map((key) => this.signedUrl(row[RIDER_DOCUMENT_FILES[key].column])));
    return { profile: urls[0] ?? '', drivingLicence: urls[1] ?? '', nationalId: urls[2] ?? '' };
  }

  /** Uploads newly picked photos (shrunk to JPEG) to the rider's own folder and records their paths. */
  async saveDocuments(uid: string, documents: RiderDocuments): Promise<void> {
    const { tenantId } = await this.workspace.current();
    const row = await this.findRow(uid);
    if (!row) {
      throw new Error(ERROR_MESSAGES.PROFILE_FIRST);
    }
    const patch: RiderPatch = {};
    for (const key of Object.keys(RIDER_DOCUMENT_FILES) as RiderDocumentKey[]) {
      const value = documents[key];
      if (!value || !isDataUrl(value)) {
        continue;
      }
      const file = RIDER_DOCUMENT_FILES[key];
      const path = `${tenantId}/${uid}/${file.name}.${DOCUMENT_IMAGE.OUTPUT_EXTENSION}`;
      const blob = await shrinkImage(value, this.document);
      const upload = await this.supabase.require().storage.from(RIDER_DOCUMENTS.BUCKET).upload(path, blob, { upsert: true, contentType: blob.type || DOCUMENT_IMAGE.OUTPUT_MIME, cacheControl: RIDER_DOCUMENTS.CACHE_CONTROL });
      unwrap(upload);
      patch[file.column] = path;
    }
    if (Object.keys(patch).length) {
      unwrap(await this.supabase.require().from(SUPABASE_TABLES.RIDERS).update(patch).eq('id', row.id));
    }
  }

  async getVehicle(uid: string): Promise<RiderVehicle | null> {
    const row = await this.findRow(uid);
    return row ? { vehicleType: row.vehicle_type, vehicleNumber: row.vehicle_number ?? '' } : null;
  }

  async saveVehicle(uid: string, vehicle: RiderVehicle): Promise<void> {
    if (!vehicle.vehicleType) {
      return;
    }
    await this.update(uid, { vehicle_type: vehicle.vehicleType, vehicle_number: vehicle.vehicleNumber.trim().toUpperCase() || null });
  }

  async getBankDetails(uid: string): Promise<RiderBankDetails | null> {
    const row = await this.findRow(uid);
    return row ? { upiId: row.upi_id ?? '' } : null;
  }

  async saveBankDetails(uid: string, details: RiderBankDetails): Promise<void> {
    await this.update(uid, { upi_id: details.upiId.trim() || null });
  }

  /** Online = ready for jobs and sharing position. The database refuses until Super Admin has verified the rider. */
  async setOnline(online: boolean): Promise<void> {
    const { tenantId } = await this.workspace.current();
    unwrap(await this.supabase.require().rpc(SUPABASE_RPC.SET_RIDER_ONLINE, { p_tenant: tenantId, p_online: online }));
  }

  /** Current position, optionally tied to the job being delivered. Ignored by the database while offline. */
  async reportLocation(point: MapPoint, jobId: string | null): Promise<void> {
    const { tenantId } = await this.workspace.current();
    unwrap(await this.supabase.require().rpc(SUPABASE_RPC.REPORT_RIDER_LOCATION, { p_tenant: tenantId, p_lat: point.lat, p_lng: point.lng, p_job: jobId }));
  }

  private async findRow(uid: string): Promise<RiderRow | null> {
    const { tenantId } = await this.workspace.current();
    return unwrap<RiderRow>(await this.supabase.require().from(SUPABASE_TABLES.RIDERS).select(RIDER_COLUMNS).eq('tenant_id', tenantId).eq('user_id', uid).maybeSingle());
  }

  private async findDetails(riderId: string): Promise<RiderDetailsRow | null> {
    return unwrap<RiderDetailsRow>(await this.supabase.require().from(SUPABASE_TABLES.RIDER_DETAILS).select(RIDER_DETAILS_COLUMNS).eq('rider_id', riderId).maybeSingle());
  }

  private async signedUrl(path: string | null): Promise<string> {
    if (!path) {
      return '';
    }
    const signed = unwrap(await this.supabase.require().storage.from(RIDER_DOCUMENTS.BUCKET).createSignedUrl(path, RIDER_DOCUMENTS.SIGNED_URL_SECONDS));
    return signed?.signedUrl ?? '';
  }

  /** Changes detail columns of an existing row; personal information has to come first. */
  private async update(uid: string, patch: RiderPatch): Promise<void> {
    const existing = await this.findRow(uid);
    if (!existing) {
      throw new Error(ERROR_MESSAGES.PROFILE_FIRST);
    }
    unwrap(await this.supabase.require().from(SUPABASE_TABLES.RIDERS).update(patch).eq('id', existing.id));
  }
}

function toProfile(row: RiderRow): RiderProfile {
  return {
    uid: row.user_id,
    riderId: row.id,
    tenantId: row.tenant_id,
    displayName: row.full_name,
    phoneNumber: row.phone || undefined,
    verification: row.verification,
    rejectionReason: row.rejection_reason,
    isActive: row.is_active,
    isOnline: row.is_online,
  };
}
