/** Form validation thresholds. */
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 3,
  PHONE_PATTERN: /^\d{10}$/,
  GUESTS_MIN: 1,
} as const;
