-- 问卷模块表结构与RLS策略
CREATE TABLE IF NOT EXISTS questionnaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  questions JSONB NOT NULL,
  total_score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_questionnaires_user_id ON questionnaires(user_id);

CREATE TABLE IF NOT EXISTS questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  questionnaire_id UUID NOT NULL,
  answers JSONB NOT NULL,
  score INTEGER NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_responses_user_id ON questionnaire_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_responses_questionnaire_id ON questionnaire_responses(questionnaire_id);

ALTER TABLE questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能访问自己的问卷" ON questionnaires FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "用户只能访问自己的问卷填写记录" ON questionnaire_responses FOR ALL USING (auth.uid() = user_id);