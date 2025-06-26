
export class AppError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const enum GeneralErrorCode {
    UNAUTHORIZED = 'UNAUTHORIZED',
    FORBIDDEN = 'FORBIDDEN',
    NOT_FOUND = 'NOT_FOUND',
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    BAD_REQUEST = 'BAD_REQUEST',
    CONFLICT = 'CONFLICT',
    SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE'
}

