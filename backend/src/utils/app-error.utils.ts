import { ErrorCodes, HttpStatus, type ErrorCode } from '@type/utils/app-error.enum.js';

/**
 * The one error type the API throws on purpose. The error middleware turns it into
 * `{ error, errorCode }` with its status; anything else becomes a 500.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
    public readonly errorCode: ErrorCode = ErrorCodes.INTERNAL_ERROR,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static unauthorized(message: string): AppError {
    return new AppError(message, HttpStatus.UNAUTHORIZED, ErrorCodes.UNAUTHORIZED);
  }

  static forbidden(message: string): AppError {
    return new AppError(message, HttpStatus.FORBIDDEN, ErrorCodes.FORBIDDEN);
  }

  static notFound(message: string): AppError {
    return new AppError(message, HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND);
  }

  static conflict(message: string): AppError {
    return new AppError(message, HttpStatus.CONFLICT, ErrorCodes.ALREADY_EXISTS);
  }

  static upstream(message: string): AppError {
    return new AppError(message, HttpStatus.BAD_GATEWAY, ErrorCodes.UPSTREAM_ERROR);
  }
}

/** A required key is missing from the environment. 503 so it is not mistaken for a user error. */
export class ConfigError extends AppError {
  constructor(message: string) {
    super(message, HttpStatus.SERVICE_UNAVAILABLE, ErrorCodes.NOT_CONFIGURED);
    this.name = 'ConfigError';
  }
}
