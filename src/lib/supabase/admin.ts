import { createClient } from '@supabase/supabase-js';

// 创建服务端的supabase client，拥有管理员权限
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}