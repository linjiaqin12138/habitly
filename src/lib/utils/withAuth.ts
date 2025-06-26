import { getUser } from '@/lib/supabase/server';
import type { NextRequest } from 'next/server';
import type { ApiHandlerContext } from '@/types/apiContext';
import { AppError } from '@/types/error';

export function withAuth<TContext = any>(
  handler: (ctx: ApiHandlerContext<any, NextRequest, TContext>) => Promise<Response>
) {
  return async function (req: NextRequest, context: TContext) {
    const user = await getUser();
    if (!user) {
      throw new AppError('UNAUTHORIZED', '用户未登录');
    }
    return handler({ user, req, context });
  };
}
