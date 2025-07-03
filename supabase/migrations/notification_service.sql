-- 消息通知模块表结构及RLS策略

-- 1. user_notification_settings 表 (用户通知设置表)
CREATE TABLE user_notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pushplus_token VARCHAR(500),
    pushplus_enabled BOOLEAN DEFAULT FALSE,
    token_status VARCHAR(20) DEFAULT 'valid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 添加索引
CREATE INDEX idx_user_notification_settings_user_id ON user_notification_settings(user_id);

-- 2. notification_logs 表 (通知发送历史表)
CREATE TABLE notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    channel VARCHAR(20) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL,
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    response_data JSONB
);

-- 添加索引
CREATE INDEX idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX idx_notification_logs_sent_at ON notification_logs(sent_at DESC);
CREATE INDEX idx_notification_logs_status ON notification_logs(status);

-- 添加数据约束
ALTER TABLE user_notification_settings ADD CONSTRAINT chk_token_status 
    CHECK (token_status IN ('valid', 'invalid', 'expired'));

ALTER TABLE notification_logs ADD CONSTRAINT chk_channel 
    CHECK (channel IN ('pushplus'));
ALTER TABLE notification_logs ADD CONSTRAINT chk_status 
    CHECK (status IN ('success', 'failed', 'skipped'));

-- 3. RLS 策略
-- 启用 RLS
ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- user_notification_settings 表策略：用户只能访问自己的通知设置
CREATE POLICY "用户只能访问自己的通知设置" ON user_notification_settings
  FOR ALL USING (auth.uid() = user_id);

-- notification_logs 表策略：用户只能访问自己的通知历史
CREATE POLICY "用户只能访问自己的通知历史" ON notification_logs
  FOR ALL USING (auth.uid() = user_id);

-- END