import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AuthService } from '../core/auth/auth.service';
import { notImplemented } from '../core/data/not-implemented';

export interface UserProfile {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  phoneNumber: string;
}

/**
 * User profile data. The Firestore 'users' collection was removed. Reads are served
 * from the signed-in Supabase auth user (email, phone, user_metadata.display_name);
 * writes are stubs until the profile table is wired (Phase 8).
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private auth: AuthService) { }

  private profileFromAuth(): UserProfile | null {
    const user = this.auth.currentUser;
    if (!user) return null;
    return {
      id: user.id,
      uid: user.id,
      email: user.email ?? '',
      displayName: (user.user_metadata?.['display_name'] as string) ?? '',
      phoneNumber: user.phone ?? '',
    };
  }

  // TODO(Phase 8): Supabase table profiles
  getUserByUID(_uid: string): Observable<UserProfile | null> {
    return of(this.profileFromAuth());
  }

  // TODO(Phase 8): Supabase table profiles
  getuserById(_id: string): Observable<UserProfile | null> {
    return of(this.profileFromAuth());
  }

  // TODO(Phase 8): Supabase table profiles
  updateAccount(_id: string, _data: Partial<UserProfile>): Observable<void> {
    return notImplemented('update account');
  }
}
