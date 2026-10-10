import { config } from '@config/env.config.js';

/** Console logging with a level; debug lines only in development. */
export const Logger = {
  info: (...args: unknown[]) => console.log(...args),
  warn: (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
  debug: (...args: unknown[]) => {
    if (config.appEnv === 'development') console.debug(...args);
  },
};
