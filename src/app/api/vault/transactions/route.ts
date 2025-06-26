import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getVaultTransactions } from '@/lib/services/vaultService';
import { getUser } from '@/lib/supabase/server';

const QuerySchema = z.object({
  type: z.enum(['adjust', 'reward', 'spend']).optional(),
  limit: z.coerce.number().min(1).max(100).default(50).optional(),
  offset: z.coerce.number().min(0).default(0).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
        return NextResponse.json({ error: 'UNAUTHORIZED', message: '请先登录' }, { status: 401 });
    }
    const url = new URL(req.url);
    const parse = QuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
    if (!parse.success) {
      return NextResponse.json({ error: 'INVALID_REQUEST', message: '参数错误' }, { status: 400 });
    }
    const { type, limit, offset } = parse.data;
    const result = await getVaultTransactions(user.id, type, limit, offset);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: 'INTERNAL_ERROR', message: '服务暂时不可用，请稍后重试' }, { status: 500 });
  }
}
