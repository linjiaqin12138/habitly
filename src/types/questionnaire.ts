// 问卷模块领域模型与数据库模型定义

// 数据库模型（下划线风格）
export interface QuestionnaireDb {
  id: string;
  user_id: string;
  title: string;
  description: string;
  questions: Question[];
  total_score: number;
  created_at: string;
  updated_at: string;
}

export interface QuestionnaireResponseDb {
  id: string;
  user_id: string;
  questionnaire_id: string;
  answers: { [questionId: string]: AnswerValue };
  score: number;
  submitted_at: string;
}

// 代码模型（驼峰风格）
export interface Questionnaire {
  id: string;
  userId: string;
  title: string;
  description: string;
  questions: Question[];
  totalScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionnaireResponse {
  id: string;
  userId: string;
  questionnaireId: string;
  answers: { [questionId: string]: AnswerValue };
  score: number;
  submittedAt: string;
}

// 共用的问题和选项模型
export interface Question {
  id: string;
  type: 'single' | 'multiple' | 'text' | 'score';
  title: string;
  required: boolean;
  options?: Option[];
  maxScore?: number;
}

export interface Option {
  id: string;
  text: string;
  score: number;
}

export type AnswerValue = string | string[] | number;

// 类型转换函数
export function questionnaireDbToModel(db: QuestionnaireDb): Questionnaire {
  return {
    id: db.id,
    userId: db.user_id,
    title: db.title,
    description: db.description,
    questions: db.questions,
    totalScore: db.total_score,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export function questionnaireResponseDbToModel(db: QuestionnaireResponseDb): QuestionnaireResponse {
  return {
    id: db.id,
    userId: db.user_id,
    questionnaireId: db.questionnaire_id,
    answers: db.answers,
    score: db.score,
    submittedAt: db.submitted_at,
  };
}