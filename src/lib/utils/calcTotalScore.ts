import { Question } from "@/types/questionnaire";

export function calculateTotalScore(questions: Question[]): number {
    let totalScore = 0;
    questions.forEach((question) => {
      if (question.type === "score") {
        totalScore += question.maxScore!;
      } else if (question.type === "multiple") {
        const options = question.options || [];
        totalScore += options.reduce((sum, option) => sum + option.score, 0);
      } else if (question.type === "single") {
        const options = question.options || [];
        const maxOption = options.reduce((max, option) => option.score > max.score ? option : max, { id: "", text: "", score: 0 });
        totalScore += maxOption.score;
      }
    });
    return totalScore;
  };

export function calculateCurrentScore(
  questions: Question[], 
  answers: Record<string, string | string[] | number>
): number {
  let totalScore = 0;
  
  questions.forEach((question) => {
    const answer = answers[question.id];
    if (!answer) return;

    switch (question.type) {
      case 'single':
        const selectedOption = question.options?.find(opt => opt.id === answer);
        if (selectedOption) {
          totalScore += selectedOption.score;
        }
        break;
      case 'multiple':
        if (Array.isArray(answer)) {
          answer.forEach(optionId => {
            const option = question.options?.find(opt => opt.id === optionId);
            if (option) {
              totalScore += option.score;
            }
          });
        }
        break;
      case 'score':
        totalScore += Number(answer) || 0;
        break;
      case 'text':
        // 文本题默认5分（如果有答案）
        if (answer && typeof answer === 'string' && answer.trim()) {
          totalScore += 5;
        }
        break;
    }
  });

  return totalScore;
}