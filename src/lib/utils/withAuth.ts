import { getUser } from '@/lib/supabase/server';
import type { ApiHandlerContext } from '@/types/apiContext';
import { AppError } from '@/types/error';

export function withAuth(
  handler: (ctx: ApiHandlerContext) => Promise<Response>
) {
  return async function (ctx: Omit<ApiHandlerContext, 'user'>): Promise<Response> {
    const user = await getUser();
    if (!user) {
      throw new AppError('UNAUTHORIZED', '用户未登录');
    }
    return handler({ ...ctx, user });
  };
}
