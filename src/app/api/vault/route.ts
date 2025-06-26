import { NextRequest, NextResponse } from 'next/server';
import { getVaultByUserId } from '@/lib/services/vaultService';
import { getUser } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: '请先登录' }, { status: 401 });
    }
    const vault = await getVaultByUserId(user.id);
    if (!vault) {
      return NextResponse.json({ error: 'VAULT_NOT_FOUND', message: '用户的小金库尚未创建' }, { status: 404 });
    }
    return NextResponse.json({ vault });
  } catch (e) {
    console.error('Error fetching vault:', e);
    return NextResponse.json({ error: 'INTERNAL_ERROR', message: '服务暂时不可用，请稍后重试' }, { status: 500 });
  }
}
