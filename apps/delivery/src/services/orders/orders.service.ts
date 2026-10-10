import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '@services/supabase/supabase.service';
import { RiderWorkspaceService } from '@services/rider-workspace/rider-workspace.service';
import { CompleteDeliveryInput, DeliveryJobRow, DeliveryStatus, DeliveryStep, FailDeliveryInput, OrderSegment, RiderOrder } from '@appTypes/order.types';
import { HISTORY_LIMIT, SUPABASE_RPC } from '@constants/supabase.constants';
import { RESPONSE_STATUS } from '@constants/order.constants';
import { isFinished, toRiderOrder } from '@utils/delivery-job/delivery-job.util';
import { unwrap } from '@utils/supabase-result/supabase-result.util';

/**
 * The rider's delivery jobs and every step on them, through the delivery functions in
 * supabase/migrations (0005). The database checks who may do what and in which order (only the
 * rider on a job moves it; steps go forward; OTP or photo to finish), so this service passes the
 * rider's choice on and returns the server's wording when it refuses.
 */
@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly supabase = inject(SupabaseService);
  private readonly workspace = inject(RiderWorkspaceService);

  /** Active: offered and in-progress jobs, newest first. History: finished jobs, newest first. */
  async listOrders(segment: OrderSegment): Promise<RiderOrder[]> {
    const { tenantId } = await this.workspace.current();
    const args = { p_tenant: tenantId, p_open_only: segment === 'active' };
    const rows = unwrap<DeliveryJobRow[]>(await this.supabase.require().rpc(SUPABASE_RPC.MY_DELIVERIES, args)) ?? [];
    const orders = rows.map(toRiderOrder);
    return segment === 'active' ? orders : orders.filter(isFinished).slice(0, HISTORY_LIMIT);
  }

  /** Takes an offered job; resolves with its new status ('assigned'). */
  async accept(jobId: string): Promise<DeliveryStatus> {
    return this.respond(jobId, true, null);
  }

  /** Turns an offered job down; the restaurant offers it to someone else. */
  async reject(jobId: string, reason: string | null): Promise<DeliveryStatus> {
    return this.respond(jobId, false, reason);
  }

  /** Reached the restaurant, picked up, reached the customer (steps may be skipped, never undone). */
  async advance(jobId: string, step: DeliveryStep, position: { lat: number; lng: number } | null): Promise<void> {
    unwrap(await this.supabase.require().rpc(SUPABASE_RPC.ADVANCE_DELIVERY, { p_job: jobId, p_status: step, p_lat: position?.lat ?? null, p_lng: position?.lng ?? null }));
  }

  /** Delivered: with the customer's OTP (or a proof photo) and, for cash on delivery, the cash taken. */
  async complete(jobId: string, input: CompleteDeliveryInput): Promise<void> {
    const args = { p_job: jobId, p_otp: input.otp, p_photo_url: input.photoUrl, p_cod_collected: input.codCollected, p_lat: input.position?.lat ?? null, p_lng: input.position?.lng ?? null };
    unwrap(await this.supabase.require().rpc(SUPABASE_RPC.COMPLETE_DELIVERY, args));
  }

  /** Could not deliver (customer unreachable, wrong address, refused); the order goes back to the restaurant. */
  async fail(jobId: string, input: FailDeliveryInput): Promise<void> {
    const args = { p_job: jobId, p_reason: input.reason, p_photo_url: input.photoUrl, p_lat: input.position?.lat ?? null, p_lng: input.position?.lng ?? null };
    unwrap(await this.supabase.require().rpc(SUPABASE_RPC.FAIL_DELIVERY, args));
  }

  private async respond(jobId: string, accept: boolean, reason: string | null): Promise<DeliveryStatus> {
    const status = unwrap<DeliveryStatus>(await this.supabase.require().rpc(SUPABASE_RPC.RESPOND_TO_DELIVERY, { p_job: jobId, p_accept: accept, p_reason: reason }));
    return status ?? (accept ? RESPONSE_STATUS.ACCEPTED : RESPONSE_STATUS.REJECTED);
  }
}
