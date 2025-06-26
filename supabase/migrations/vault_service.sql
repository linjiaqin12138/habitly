-- 小金库模块表结构及RLS策略

-- 1. vaults 表
CREATE TABLE vaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- 小金库所属用户ID
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,                     -- 小金库总金额
  available_rewards DECIMAL(10,2) NOT NULL DEFAULT 0,                -- 可支配奖励余额
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT check_total_amount CHECK (total_amount >= 0 AND total_amount <= 10000),
  CONSTRAINT check_available_rewards CHECK (available_rewards >= 0)
);

-- 添加索引
CREATE INDEX idx_vaults_user_id ON vaults(user_id);

-- 2. vault_transactions 表
CREATE TABLE vault_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- 操作用户ID
  vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,    -- 关联小金库ID
  type VARCHAR(10) NOT NULL CHECK (type IN ('adjust', 'reward', 'spend')), -- 操作类型
  amount DECIMAL(10,2) NOT NULL,                                    -- 交易金额
  balance_after DECIMAL(10,2) NOT NULL,                             -- 交易后余额
  description TEXT NOT NULL,                                        -- 交易描述
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT check_amount CHECK (amount > 0),
  CONSTRAINT check_balance_after CHECK (balance_after >= 0)
);

-- 添加索引
CREATE INDEX idx_vault_transactions_user_id ON vault_transactions(user_id);
CREATE INDEX idx_vault_transactions_vault_id ON vault_transactions(vault_id);
CREATE INDEX idx_vault_transactions_type ON vault_transactions(type);
CREATE INDEX idx_vault_transactions_created_at ON vault_transactions(created_at DESC);

-- 3. RLS 策略
-- 启用 RLS
ALTER TABLE vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_transactions ENABLE ROW LEVEL SECURITY;

-- vaults 表策略：用户只能访问自己的小金库
CREATE POLICY "用户只能访问自己的小金库" ON vaults
  FOR ALL USING (auth.uid() = user_id);

-- vault_transactions 表策略：用户只能访问自己的交易记录
CREATE POLICY "用户只能访问自己的交易记录" ON vault_transactions
  FOR ALL USING (auth.uid() = user_id);

-- END
