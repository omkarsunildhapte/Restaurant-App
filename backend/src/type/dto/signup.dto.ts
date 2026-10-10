import { z } from 'zod';

/** POST /public/v1/signups: the website's "Start free trial" form. */
export const signupSchema = z.object({
  restaurantName: z.string().trim().min(2).max(120),
  ownerName: z.string().trim().min(2).max(120),
  email: z.email().transform((e) => e.toLowerCase()),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ]{8,16}$/, 'enter a phone number, e.g. +91 98220 11111')
    .optional(),
  city: z.string().trim().max(80).optional(),
  planId: z.enum(['starter', 'pro', 'chain']).default('pro'),
  source: z.string().trim().max(80).optional(),
  /** Honeypot: hidden on the form, so only bots fill it. */
  website: z.string().optional(),
});
export type SignupDto = z.infer<typeof signupSchema>;
