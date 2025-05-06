-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建balances表
CREATE TABLE IF NOT EXISTS public.balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  refundable_amount NUMERIC NOT NULL DEFAULT 0,
  frozen_amount NUMERIC NOT NULL DEFAULT 0,
  cashback_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建transactions表
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('charge', 'refund', 'withdrawal')),
  related_charge_id UUID NULL REFERENCES public.transactions(id),
  reference_id TEXT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS balances_user_id_idx ON public.balances (user_id);
CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON public.transactions (user_id);
CREATE INDEX IF NOT EXISTS transactions_related_charge_id_idx ON public.transactions (related_charge_id);
CREATE INDEX IF NOT EXISTS transactions_created_at_idx ON public.transactions (created_at);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 添加更新时间触发器到balances表
DROP TRIGGER IF EXISTS balances_updated_at ON public.balances;
CREATE TRIGGER balances_updated_at
BEFORE UPDATE ON public.balances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- 添加更新时间触发器到transactions表
DROP TRIGGER IF EXISTS transactions_updated_at ON public.transactions;
CREATE TRIGGER transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- 创建处理充值成功的函数
CREATE OR REPLACE FUNCTION public.handle_charge_success(
  p_user_id UUID,
  p_transaction_id UUID,
  p_amount NUMERIC
) RETURNS VOID AS $$
DECLARE
  balance_exists BOOLEAN;
BEGIN
  -- 检查余额记录是否存在
  SELECT EXISTS(SELECT 1 FROM public.balances WHERE user_id = p_user_id) INTO balance_exists;
  
  -- 如果余额记录不存在，则创建一个
  IF NOT balance_exists THEN
    INSERT INTO public.balances (user_id, refundable_amount, frozen_amount, cashback_amount)
    VALUES (p_user_id, p_amount, 0, 0);
  ELSE
    -- 更新余额
    UPDATE public.balances
    SET refundable_amount = refundable_amount + p_amount
    WHERE user_id = p_user_id;
  END IF;
  
  -- 更新交易状态为成功
  UPDATE public.transactions
  SET status = 'succeeded'
  WHERE id = p_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建处理退款成功的函数
CREATE OR REPLACE FUNCTION public.handle_refund_success(
  p_user_id UUID,
  p_transaction_id UUID,
  p_amount NUMERIC
) RETURNS VOID AS $$
BEGIN
  -- 更新余额
  UPDATE public.balances
  SET refundable_amount = refundable_amount - p_amount
  WHERE user_id = p_user_id;
  
  -- 更新交易状态为成功
  UPDATE public.transactions
  SET status = 'succeeded'
  WHERE id = p_transaction_id;
  
  -- 将关联的充值交易标记为已退款
  UPDATE public.transactions
  SET status = 'refunded'
  WHERE id = (
    SELECT related_charge_id 
    FROM public.transactions 
    WHERE id = p_transaction_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建处理提现成功的函数
CREATE OR REPLACE FUNCTION public.handle_withdraw_success(
  p_user_id UUID,
  p_transaction_id UUID,
  p_amount NUMERIC
) RETURNS VOID AS $$
BEGIN
  -- 更新余额
  UPDATE public.balances
  SET cashback_amount = cashback_amount - p_amount
  WHERE user_id = p_user_id;
  
  -- 更新交易状态为成功
  UPDATE public.transactions
  SET status = 'succeeded'
  WHERE id = p_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建冻结过期可退余额的函数
CREATE OR REPLACE FUNCTION public.freeze_expired_refundable_balance()
RETURNS VOID AS $$
BEGIN
  -- 找出超过3天的充值交易
  WITH expired_charges AS (
    SELECT 
      t.user_id,
      t.amount
    FROM transactions t
    WHERE 
      t.type = 'charge' 
      AND t.status = 'succeeded'
      AND t.created_at < NOW() - INTERVAL '3 days'
      -- 排除已退款的充值
      AND NOT EXISTS (
        SELECT 1 
        FROM transactions r 
        WHERE r.related_charge_id = t.id 
          AND r.type = 'refund' 
          AND r.status = 'succeeded'
      )
  )
  -- 更新余额
  UPDATE balances b
  SET 
    refundable_amount = b.refundable_amount - COALESCE((
      SELECT SUM(ec.amount)
      FROM expired_charges ec
      WHERE ec.user_id = b.user_id
    ), 0),
    frozen_amount = b.frozen_amount + COALESCE((
      SELECT SUM(ec.amount)
      FROM expired_charges ec
      WHERE ec.user_id = b.user_id
    ), 0)
  WHERE b.user_id IN (SELECT user_id FROM expired_charges);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 设置RLS策略
ALTER TABLE public.balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的余额
CREATE POLICY "Users can view own balance"
ON public.balances FOR SELECT
USING (auth.uid() = user_id);

-- 用户可以查看自己的交易记录
CREATE POLICY "Users can view own transactions"
ON public.transactions FOR SELECT
USING (auth.uid() = user_id);

-- 用户可以创建交易（但状态必须是pending）
CREATE POLICY "Users can create pending transactions"
ON public.transactions FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND status = 'pending'
);

-- 添加状态枚举类型
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_status_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_status_check 
CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded'));