import { adminClient } from '@config/supabase.config.js';
import { config } from '@config/env.config.js';
import { AppError } from '@utils/app-error.utils.js';

/** Supabase Auth admin calls (service role). Kept apart so nothing else reaches for that key. */
export const authAdminDao = {
  /** Emails a link that creates the account; the person sets a password on /business/welcome. */
  async inviteByEmail(email: string, fullName?: string): Promise<void> {
    const { error } = await adminClient().auth.admin.inviteUserByEmail(email, {
      redirectTo: `${config.consoleUrl}/business/welcome`,
      data: fullName ? { full_name: fullName } : undefined,
    });
    if (error) {
      if (/already (been )?registered|already exists/i.test(error.message)) {
        throw AppError.conflict('This email already has an account. Sign in instead.');
      }
      // The invitation row is saved; the owner can resend from the staff screen.
      throw AppError.upstream(`Saved, but the invite email could not be sent: ${error.message}`);
    }
  },
};
