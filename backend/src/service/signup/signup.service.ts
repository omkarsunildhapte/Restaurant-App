import { signupDao } from '@dao/signup/signup.dao.js';
import { authAdminDao } from '@dao/auth/auth-admin.dao.js';
import { Logger } from '@utils/logger.utils.js';
import type { SignupDto } from '@type/dto/signup.dto.js';

/**
 * "Start free trial": records the sign-up and emails a link. The business itself is created by
 * complete_signup() in the database once the owner opens the link and sets a password, so an
 * address that never confirms gets nothing.
 */
export const signupService = {
  async start(dto: SignupDto): Promise<void> {
    if (dto.website) {
      // Honeypot filled: a bot. Answer as if it worked so it learns nothing.
      Logger.warn('[signup] honeypot hit, ignored');
      return;
    }
    const id = await signupDao.create(dto);
    try {
      await authAdminDao.inviteByEmail(dto.email, dto.ownerName);
    } catch (error) {
      // No email went out (e.g. the address already has an account): drop the pending row.
      await signupDao.remove(id);
      throw error;
    }
  },
};
