import { createClient } from '@/lib/supabase/server';
import { AppError, GeneralErrorCode } from '@/types/error';
import { 
  Questionnaire, 
  QuestionnaireDb, 
  QuestionnaireResponse, 
  QuestionnaireResponseDb,
  questionnaireDbToModel,
  questionnaireResponseDbToModel,
  Question,
  AnswerValue
} from '@/types/questionnaire';

export async function getQuestionnaireList(userId: string): Promise<Questionnaire[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('questionnaires')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data!.map(questionnaireDbToModel);
}

export async function getQuestionnaireById(userId: string, id: string): Promise<Questionnaire | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('questionnaires')
    .select('*')
    .eq('user_id', userId)
    .eq('id', id)
    .single<QuestionnaireDb>();

    if (error && error.code !== 'PGRST116') {
        throw error;
    }

  return data ? questionnaireDbToModel(data) : null;
}

export async function createQuestionnaire(
  userId: string, 
  data: Pick<Questionnaire, 'title' | 'description' | 'questions' | 'totalScore'>
): Promise<Questionnaire> {
  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from('questionnaires')
    .insert({
      user_id: userId,
      title: data.title,
      description: data.description,
      questions: data.questions,
      total_score: data.totalScore,
    })
    .select()
    .single<QuestionnaireDb>();

  if (error) {
    throw new AppError(GeneralErrorCode.INTERNAL_ERROR, '创建问卷失败，请稍后重试');
  }

  return questionnaireDbToModel(created);
}

export async function updateQuestionnaire(
  userId: string, 
  id: string, 
  data: Partial<Pick<Questionnaire, 'title' | 'description' | 'questions' | 'totalScore'>>
): Promise<Questionnaire> {
  const supabase = await createClient();
  
  // 构建更新数据
  const updateData: Partial<QuestionnaireDb> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.questions !== undefined) updateData.questions = data.questions;
  if (data.totalScore !== undefined) updateData.total_score = data.totalScore;
  
  updateData.updated_at = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from('questionnaires')
    .update(updateData)
    .eq('user_id', userId)
    .eq('id', id)
    .select()
    .single<QuestionnaireDb>();

  if (error && error.code === 'PGRST116') {
    throw new AppError('NOT_FOUND', '问卷不存在');
  }
  if (error) {
    throw error
  }
  return questionnaireDbToModel(updated);
}

export async function deleteQuestionnaire(userId: string, id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('questionnaires')
    .delete()
    .eq('user_id', userId)
    .eq('id', id);

  if (error) {
    throw error
  }
}

export async function submitQuestionnaireResponse(
  userId: string, 
  questionnaireId: string, 
  answers: { [questionId: string]: AnswerValue }
): Promise<QuestionnaireResponse> {
  const supabase = await createClient();
  
  // 获取问卷信息用于验证和计算分数
  const questionnaire = await getQuestionnaireById(userId, questionnaireId);
  if (!questionnaire) {
    throw new AppError(GeneralErrorCode.NOT_FOUND, '问卷不存在');
  }

  // 验证答案格式和必填项
  validateAnswers(questionnaire.questions, answers);
  
  // 计算分数
  const score = calculateScore(questionnaire.questions, answers);

  const { data: response, error } = await supabase
    .from('questionnaire_responses')
    .insert({
      user_id: userId,
      questionnaire_id: questionnaireId,
      answers,
      score,
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single<QuestionnaireResponseDb>();

  if (error) {
    throw error
  }

  return questionnaireResponseDbToModel(response);
}

export async function getQuestionnaireResponses(
  userId: string, 
  questionnaireId: string, 
  limit = 50, 
  offset = 0
): Promise<{ responses: QuestionnaireResponse[]; total: number }> {
  const supabase = await createClient();
  
  // 先验证问卷是否存在且属于当前用户
  const questionnaire = await getQuestionnaireById(userId, questionnaireId);
  if (!questionnaire) {
    throw new AppError('NOT_FOUND', '问卷不存在');
  }

  const { data, error, count } = await supabase
    .from('questionnaire_responses')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .eq('questionnaire_id', questionnaireId)
    .order('submitted_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return {
    responses: (data || []).map(questionnaireResponseDbToModel),
    total: count || 0,
  };
}

// 验证答案格式和必填项
function validateAnswers(questions: Question[], answers: { [questionId: string]: AnswerValue }): void {
  for (const question of questions) {
    const answer = answers[question.id];
    
    // 检查必填项
    if (question.required && (answer === undefined || answer === null || answer === '')) {
      throw new AppError('VALIDATION_ERROR', `问题"${question.title}"为必填项`);
    }
    
    if (answer === undefined || answer === null || answer === '') {
      continue; // 跳过空答案的验证
    }
    
    // 根据题型验证答案格式
    switch (question.type) {
      case 'single':
        if (typeof answer !== 'string') {
          throw new AppError('VALIDATION_ERROR', `问题"${question.title}"答案格式错误`);
        }
        // 验证选项是否存在
        if (!question.options?.some(opt => opt.id === answer)) {
          throw new AppError('VALIDATION_ERROR', `问题"${question.title}"选项不存在`);
        }
        break;
      
      case 'multiple':
        if (!Array.isArray(answer) || !answer.every(a => typeof a === 'string')) {
          throw new AppError('VALIDATION_ERROR', `问题"${question.title}"答案格式错误`);
        }
        // 验证所有选项是否存在
        const validOptionIds = question.options?.map(opt => opt.id) || [];
        if (!answer.every(a => validOptionIds.includes(a))) {
          throw new AppError('VALIDATION_ERROR', `问题"${question.title}"包含无效选项`);
        }
        break;
      
      case 'text':
        if (typeof answer !== 'string') {
          throw new AppError('VALIDATION_ERROR', `问题"${question.title}"答案格式错误`);
        }
        break;
      
      case 'score':
        if (typeof answer !== 'number') {
          throw new AppError('VALIDATION_ERROR', `问题"${question.title}"答案格式错误`);
        }
        if (question.maxScore && answer > question.maxScore) {
          throw new AppError('VALIDATION_ERROR', `问题"${question.title}"分数不能超过${question.maxScore}`);
        }
        if (answer < 0) {
          throw new AppError('VALIDATION_ERROR', `问题"${question.title}"分数不能小于0`);
        }
        break;
    }
  }
}

// 计算问卷总分
function calculateScore(questions: Question[], answers: { [questionId: string]: AnswerValue }): number {
  let totalScore = 0;
  
  for (const question of questions) {
    const answer = answers[question.id];
    if (answer === undefined || answer === null || answer === '') {
      continue;
    }
    
    switch (question.type) {
      case 'single':
        const selectedOption = question.options?.find(opt => opt.id === answer);
        if (selectedOption) {
          totalScore += selectedOption.score;
        }
        break;
      
      case 'multiple':
        if (Array.isArray(answer)) {
          for (const optionId of answer) {
            const option = question.options?.find(opt => opt.id === optionId);
            if (option) {
              totalScore += option.score;
            }
          }
        }
        break;
      
      case 'score':
        if (typeof answer === 'number') {
          totalScore += answer;
        }
        break;
      
      case 'text':
        // 填空题不计分
        break;
    }
  }
  
  return totalScore;
}