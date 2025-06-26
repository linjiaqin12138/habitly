import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { setVaultAmount } from '@/lib/services/vaultService';
import { createClient } from '@supabase/supabase-js';
import { getUser } from '@/lib/supabase/server';

const AmountSchema = z.object({
  amount: z.number().min(1).max(10000),
});

export async function PUT(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
        return NextResponse.json({ error: 'UNAUTHORIZED', message: '请先登录' }, { status: 401 });
    }
    const body = await req.json();
    const parse = AmountSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ error: 'INVALID_REQUEST', message: '金额必须在1-10000元之间' }, { status: 400 });
    }
    const result = await setVaultAmount(user.id, parse.data.amount);
    if (!result) {
      return NextResponse.json({ error: 'VAULT_NOT_FOUND', message: '用户的小金库尚未创建' }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: 'INTERNAL_ERROR', message: '服务暂时不可用，请稍后重试' }, { status: 500 });
  }
}
