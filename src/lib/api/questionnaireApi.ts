import { Questionnaire } from '@/types/questionnaire';

// 获取问卷数据
export async function getQuestionnaire(id: string): Promise<{ questionnaire: Questionnaire }> {
  const response = await fetch(`/api/questionnaire/${id}`);
  if (!response.ok) {
    throw new Error('获取问卷数据失败');
  }
  return await response.json();
}