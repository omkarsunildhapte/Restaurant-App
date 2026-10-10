import { Injectable, computed, inject } from '@angular/core';
import { AccountForm, UserProfile } from '@appTypes/user.types';
import { STUB_OPERATIONS } from '@constants/messages.constants';
import { AuthService } from '@services/auth/auth.service';
import { notImplemented } from '@utils/not-implemented/not-implemented.util';

/**
 * The customer's profile. Reads come from the signed-in Supabase auth user (email, phone,
 * user_metadata.display_name); the write is a stub until the profiles table is wired (Phase 8).
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly auth = inject(AuthService);

  // TODO(Phase 8): Supabase table profiles
  readonly profile = computed<UserProfile | null>(() => {
    const user = this.auth.currentUser();
    if (!user) return null;
    return { id: user.id, email: user.email ?? '', displayName: this.auth.displayName(), phoneNumber: user.phone ?? '' };
  });

  // TODO(Phase 8): Supabase table profiles
  updateAccount(_id: string, _data: AccountForm): Promise<void> {
    return notImplemented(STUB_OPERATIONS.UPDATE_ACCOUNT);
  }
}
