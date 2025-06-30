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