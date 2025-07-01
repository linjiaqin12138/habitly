import { NextRequest, NextResponse } from 'next/server';
import { AppError, GeneralErrorCode } from '@/types/error';
import { getLogger } from '../logger';
import { ApiHandlerContext, NextApiContext } from '@/types/apiContext';

const logger = getLogger('withErrorHandling');
const DefaultErrorCodeToStatusMapping = {
    [GeneralErrorCode.UNAUTHORIZED]: 401,
    [GeneralErrorCode.FORBIDDEN]: 403,
    [GeneralErrorCode.NOT_FOUND]: 404,
    [GeneralErrorCode.INTERNAL_ERROR]: 500,
    [GeneralErrorCode.BAD_REQUEST]: 400,
    [GeneralErrorCode.CONFLICT]: 409,
    [GeneralErrorCode.SERVICE_UNAVAILABLE]: 503
}

export function withErrorHandling(
  handler: (ctx: Omit<ApiHandlerContext, 'user'>) => Promise<Response>,
  errorCodeToStatus: Record<string, number> = {}
) {
  errorCodeToStatus = { ...DefaultErrorCodeToStatusMapping, ...errorCodeToStatus };
  return async function (req: NextRequest, context: NextApiContext): Promise<Response> {
    try {
      return await handler({ req, context });
    } catch (e: unknown) {
      logger.error("Error:", e);
      if (e instanceof AppError) {
        const status = errorCodeToStatus[e.code] ?? 500;
        return NextResponse.json({ error: e.code, message: e.message }, { status });
      }
      return NextResponse.json({ error: 'INTERNAL_ERROR', message: '服务暂时不可用，请稍后重试' }, { status: 500 });
    }
  };
}
