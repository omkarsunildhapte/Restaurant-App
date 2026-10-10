import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '@services/supabase/supabase.service';
import { RiderWorkspaceService } from '@services/rider-workspace/rider-workspace.service';
import { RiderBankDetails, RiderDocuments, RiderPersonalInfo, RiderProfile, RiderRow, RiderVehicle } from '@appTypes/rider.types';
import { MapPoint } from '@appTypes/order.types';
import { NotImplementedError } from '@utils/errors/errors.util';
import { unwrap } from '@utils/supabase-result/supabase-result.util';
import { RIDER_COLUMNS, SUPABASE_RPC, SUPABASE_TABLES } from '@constants/supabase.constants';
import { ERROR_MESSAGES } from '@constants/messages.constants';
import { PERSONAL_DOCUMENT_PAGE } from '@constants/personal-document.constants';

type RiderPatch = Partial<Pick<RiderRow, 'full_name' | 'phone' | 'licence_number' | 'vehicle_type' | 'vehicle_number' | 'upi_id'>>;

/**
 * The rider's own `riders` row for the business they ride for (RiderWorkspaceService), and going
 * online and reporting position (migration 0005).
 *
 * A rider is invited by a restaurant (a `delivery` membership); the first save of personal
 * information creates the row, and Super Admin then verifies it. RLS lets a rider read and
 * change only their own row and only the detail columns; verification is never written here.
 * Document images and payout details are sensitive: never log them.
 */
@Injectable({ providedIn: 'root' })
export class RiderService {
  private readonly supabase = inject(SupabaseService);
  private readonly workspace = inject(RiderWorkspaceService);

  /** The rider's profile, or null before the first personal-information save. */
  async getProfile(uid: string): Promise<RiderProfile | null> {
    const row = await this.findRow(uid);
    return row ? toProfile(row) : null;
  }

  /**
   * Name, phone and licence number go to the `riders` row (created on the first save). The other
   * form fields have no column yet and are not stored; see docs/DELIVERY.md (rider details).
   */
  async savePersonalInfo(uid: string, info: RiderPersonalInfo): Promise<void> {
    const patch: RiderPatch = { full_name: `${info.firstName} ${info.lastName}`.trim(), phone: info.mobileNumber.trim(), licence_number: info.deliveryLicenseId.trim() || null };
    const { tenantId } = await this.workspace.current();
    const existing = await this.findRow(uid);
    const table = this.supabase.require().from(SUPABASE_TABLES.RIDERS);
    if (existing) {
      unwrap(await table.update(patch).eq('id', existing.id));
    } else {
      unwrap(await table.insert({ ...patch, tenant_id: tenantId, user_id: uid }));
    }
  }

  // TODO(Phase 5): private Storage bucket with a per-rider path (migration 0014), then photo_url, licence_url, id_proof_url
  async saveDocuments(_uid: string, _documents: RiderDocuments): Promise<void> {
    throw new NotImplementedError(PERSONAL_DOCUMENT_PAGE.SAVE_OPERATION);
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
