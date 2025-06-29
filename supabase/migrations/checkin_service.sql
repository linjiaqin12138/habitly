-- 打卡模块表结构及RLS策略

-- 1. checkin_profiles 表 (打卡配置表)
CREATE TABLE checkin_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  questionnaire_id UUID NOT NULL REFERENCES questionnaires(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  frequency JSONB NOT NULL,
  reminder_time TIME,
  reward_rules JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加索引
CREATE INDEX idx_checkin_profiles_user_id ON checkin_profiles(user_id);
CREATE INDEX idx_checkin_profiles_questionnaire_id ON checkin_profiles(questionnaire_id);
CREATE INDEX idx_checkin_profiles_is_active ON checkin_profiles(is_active);

-- 2. checkin_records 表 (打卡记录表)
CREATE TABLE checkin_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES checkin_profiles(id) ON DELETE CASCADE,
  questionnaire_response_id UUID NOT NULL REFERENCES questionnaire_responses(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL,
  score INTEGER NOT NULL,
  reward_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  is_remedial BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 约束：每个用户每天每个配置只能有一条记录
  CONSTRAINT unique_daily_checkin UNIQUE (user_id, profile_id, checkin_date)
);

-- 添加索引
CREATE INDEX idx_checkin_records_user_id ON checkin_records(user_id);
CREATE INDEX idx_checkin_records_profile_id ON checkin_records(profile_id);
CREATE INDEX idx_checkin_records_checkin_date ON checkin_records(checkin_date DESC);
CREATE INDEX idx_checkin_records_user_profile_date ON checkin_records(user_id, profile_id, checkin_date);

-- 3. RLS 策略
-- 启用 RLS
ALTER TABLE checkin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_records ENABLE ROW LEVEL SECURITY;

-- checkin_profiles 表策略：用户只能访问自己的打卡配置
CREATE POLICY "用户只能访问自己的打卡配置" ON checkin_profiles
  FOR ALL USING (auth.uid() = user_id);

-- checkin_records 表策略：用户只能访问自己的打卡记录
CREATE POLICY "用户只能访问自己的打卡记录" ON checkin_records
  FOR ALL USING (auth.uid() = user_id);

-- END