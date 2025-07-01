import { NextResponse } from 'next/server';
import { AppError, GeneralErrorCode } from '@/types/error';

const DefaultErrorCodeToStatusMapping = {
    [GeneralErrorCode.UNAUTHORIZED]: 401,
    [GeneralErrorCode.FORBIDDEN]: 403,
    [GeneralErrorCode.NOT_FOUND]: 404,
    [GeneralErrorCode.INTERNAL_ERROR]: 500,
    [GeneralErrorCode.BAD_REQUEST]: 400,
    [GeneralErrorCode.CONFLICT]: 409,
    [GeneralErrorCode.SERVICE_UNAVAILABLE]: 503
}

export function withErrorHandling<TContext = Record<string, unknown>>(
  handler: (ctx: TContext, ...args: unknown[]) => Promise<Response>,
  errorCodeToStatus: Record<string, number> = {}
) {
  errorCodeToStatus = { ...DefaultErrorCodeToStatusMapping, ...errorCodeToStatus };
  return async function (ctx: TContext, ...args: unknown[]) {
    try {
      return await handler(ctx, ...args);
    } catch (e: unknown) {
      console.log(e)
      if (e instanceof AppError) {
        const status = errorCodeToStatus[e.code] ?? 500;
        return NextResponse.json({ error: e.code, message: e.message }, { status });
      }
      return NextResponse.json({ error: 'INTERNAL_ERROR', message: '服务暂时不可用，请稍后重试' }, { status: 500 });
    }
  };
}
