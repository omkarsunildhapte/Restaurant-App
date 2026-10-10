import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ErrorCodes, HttpStatus } from '@type/utils/app-error.enum.js';
import { AppError } from '@utils/app-error.utils.js';
import { Logger } from '@utils/logger.utils.js';

/**
 * Last middleware: every failure becomes `{ error, errorCode }`. Express 5 forwards rejected
 * promises from async handlers here, so controllers just throw.
 */
export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) Logger.error(err.message);
    res.status(err.statusCode).json({ error: err.message, errorCode: err.errorCode });
  } else if (err instanceof ZodError) {
    res.status(HttpStatus.BAD_REQUEST).json({
      error: err.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; '),
      errorCode: ErrorCodes.VALIDATION_ERROR,
    });
  } else {
    Logger.error(err);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Something went wrong', errorCode: ErrorCodes.INTERNAL_ERROR });
  }
}
