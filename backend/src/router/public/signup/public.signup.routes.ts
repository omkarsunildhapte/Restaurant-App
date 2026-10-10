import { Router } from 'express';
import { signupLimiter } from '@middleware/rate-limit.middleware.js';
import { publicSignupController } from '@controller/public/signup/public.signup.controller.js';

/** Mounted at /public/v1 (no sign-in). */
const router = Router();

router.post('/signups', signupLimiter, publicSignupController.create);

export default router;
