import { Injectable, computed, inject, signal } from '@angular/core';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { Subscription } from 'rxjs';
import { SupabaseService } from '@services/supabase/supabase.service';
import { AuthService } from '@services/auth/auth.service';
import { RiderService } from '@services/rider/rider.service';
import { LocationService } from '@services/location/location.service';
import { RiderProfile } from '@appTypes/rider.types';
import { RiderPosition } from '@appTypes/location.types';
import { SHIFT } from '@constants/shift.constants';
import { SUPABASE_TABLES } from '@constants/supabase.constants';
import { ERROR_MESSAGES } from '@constants/messages.constants';
import { errorMessage } from '@utils/errors/errors.util';
import { onlineBlock } from '@utils/rider-status/rider-status.util';
import { distanceMeters } from '@utils/geo/geo.util';
import { MapPoint } from '@appTypes/order.types';

/**
 * The rider's shift: online/offline, sharing position while online, and hearing about job
 * changes as they happen.
 *
 * - Going online first reads the device position, so a rider with location off or denied stays
 *   offline and is told why (docs/DELIVERY.md §7). The database refuses an unverified rider.
 * - While online the position is reported at most every 10 s on a job and 60 s otherwise, and
 *   only once the rider has moved 15 m, with a 90 s heartbeat for a rider who is standing still.
 * - Changes to the rider's `delivery_jobs` rows arrive over Supabase Realtime and bump
 *   `jobsVersion`, which pages put in their resource params to reload (Rule 16: callbacks write
 *   signals).
 */
@Injectable({ providedIn: 'root' })
export class ShiftService {
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);
  private readonly riders = inject(RiderService);
  private readonly location = inject(LocationService);

  private readonly profileState = signal<RiderProfile | null>(null);
  private readonly onlineState = signal(false);
  private readonly busyState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly jobsVersionState = signal(0);
  private readonly activeJob = signal<string | null>(null);

  readonly profile = this.profileState.asReadonly();
  readonly online = this.onlineState.asReadonly();
  readonly busy = this.busyState.asReadonly();
  readonly error = this.errorState.asReadonly();
  /** Bumped on every change to the rider's jobs (Realtime) and after the rider acts on one. */
  readonly jobsVersion = this.jobsVersionState.asReadonly();
  readonly block = computed(() => onlineBlock(this.profileState()));

  private channel: RealtimeChannel | null = null;
  private watch: Subscription | null = null;
  private lastReport = 0;
  private lastPoint: MapPoint | null = null;

  /** Loads the rider's state and starts listening for job changes. Safe to call repeatedly. */
  async start(): Promise<void> {
    const uid = this.auth.userId();
    if (!uid) {
      return;
    }
    try {
      const profile = await this.riders.getProfile(uid);
      this.profileState.set(profile);
      this.onlineState.set(profile?.isOnline ?? false);
      if (profile && !this.channel) {
        this.listen(profile.riderId);
      }
      if (profile?.isOnline && !this.watch) {
        this.startWatch();
      }
    } catch (error) {
      this.errorState.set(errorMessage(error, ERROR_MESSAGES.DATA_FAILED));
    }
  }

  async goOnline(): Promise<void> {
    await this.run(async () => {
      const position = await this.location.getCurrentPosition();
      await this.riders.setOnline(true);
      this.onlineState.set(true);
      await this.report(position, true);
      this.startWatch();
    });
  }

  async goOffline(): Promise<void> {
    await this.run(async () => {
      this.stopWatch();
      await this.riders.setOnline(false);
      this.onlineState.set(false);
    });
  }

  /** The job being delivered now: positions are tied to it and sent more often. */
  setActiveJob(jobId: string | null): void {
    this.activeJob.set(jobId);
  }

  /** After the rider acts on a job, lists reload without waiting for Realtime. */
  jobsChanged(): void {
    this.jobsVersionState.update((n) => n + 1);
  }

  /** Stops sharing position and listening (sign-out). */
  stop(): void {
    this.stopWatch();
    void this.channel?.unsubscribe();
    this.channel = null;
    this.profileState.set(null);
    this.onlineState.set(false);
  }

  private listen(riderId: string): void {
    const client = this.supabase.client;
    if (!client) {
      return;
    }
    const filter = { event: SHIFT.REALTIME_ALL_EVENTS, schema: SHIFT.REALTIME_SCHEMA, table: SUPABASE_TABLES.DELIVERY_JOBS, filter: `${SHIFT.RIDER_FILTER_COLUMN}=eq.${riderId}` } as const;
    this.channel = client
      .channel(SHIFT.JOBS_CHANNEL_PREFIX + riderId)
      .on(SHIFT.REALTIME_EVENT, filter, () => this.jobsChanged())
      .subscribe();
  }

  private startWatch(): void {
    this.stopWatch();
    this.watch = this.location.watchPosition().subscribe({
      next: (position) => void this.report(position, false),
      error: (error: unknown) => this.errorState.set(errorMessage(error, ERROR_MESSAGES.DATA_FAILED)),
    });
  }

  private stopWatch(): void {
    this.watch?.unsubscribe();
    this.watch = null;
  }

  /** Sends the position when it is due: interval passed and moved 15 m, or the heartbeat is due. */
  private async report(position: RiderPosition, force: boolean): Promise<void> {
    const every = this.activeJob() ? SHIFT.REPORT_EVERY_ON_JOB_MS : SHIFT.REPORT_EVERY_IDLE_MS;
    const elapsed = position.timestamp - this.lastReport;
    const moved = !this.lastPoint || distanceMeters(this.lastPoint, position) >= SHIFT.MIN_MOVE_M;
    if (!force && !(elapsed >= every && moved) && elapsed < SHIFT.HEARTBEAT_MS) {
      return;
    }
    this.lastReport = position.timestamp;
    this.lastPoint = { lat: position.lat, lng: position.lng };
    try {
      await this.riders.reportLocation({ lat: position.lat, lng: position.lng }, this.activeJob());
    } catch {
      // A missed report is replaced by the next one; the owner's map shows "location stale" after 2 min.
    }
  }

  private async run(action: () => Promise<void>): Promise<void> {
    this.busyState.set(true);
    this.errorState.set(null);
    try {
      await action();
    } catch (error) {
      this.errorState.set(errorMessage(error, ERROR_MESSAGES.DATA_FAILED));
    } finally {
      this.busyState.set(false);
    }
  }
}
