import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { spendVault } from '@/lib/services/vaultService';
import { getUser } from '@/lib/supabase/server';

const SpendSchema = z.object({
  amount: z.number().min(0.01),
  description: z.string().max(200).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
        return NextResponse.json({ error: 'UNAUTHORIZED', message: '请先登录' }, { status: 401 });
    }
    const body = await req.json();
    const parse = SpendSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ error: 'INVALID_REQUEST', message: '消费金额无效' }, { status: 400 });
    }
    const result = await spendVault(user.id, parse.data.amount, parse.data.description);
    if (result === 'INSUFFICIENT_BALANCE') {
      return NextResponse.json({ error: 'INSUFFICIENT_BALANCE', message: '可用奖励余额不足' }, { status: 409 });
    }
    if (!result) {
      return NextResponse.json({ error: 'VAULT_NOT_FOUND', message: '用户的小金库尚未创建' }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: 'INTERNAL_ERROR', message: '服务暂时不可用，请稍后重试' }, { status: 500 });
  }
}
