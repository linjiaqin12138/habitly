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

export const enum CheckinErrorCode {
    PROFILE_NOT_FOUND = 'PROFILE_NOT_FOUND',
    QUESTIONNAIRE_ERROR = 'QUESTIONNAIRE_ERROR', 
    ALREADY_CHECKED_IN = 'ALREADY_CHECKED_IN',
    INVALID_CHECKIN_DATE = 'INVALID_CHECKIN_DATE'
}

