import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckinProfileForm } from "./types";
import { calculateTotalScore, calculateCurrentScore } from "@/lib/utils/calcTotalScore";
import { QuestionRenderer } from "./QuestionRenderer";

interface CheckinProfilePreviewProps {
  checkinProfile: CheckinProfileForm;
}

export function CheckinProfilePreview({ checkinProfile }: CheckinProfilePreviewProps) {
  const [currentAnswer, setCurrentAnswer] = useState<Record<string, string | string[] | number>>({});

  const handleAnswerChange = (questionId: string, value: string | string[] | number) => {
    setCurrentAnswer((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{checkinProfile.title}</CardTitle>
        <CardDescription>
          {checkinProfile.description}
          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            <Badge variant="outline">
              频率: {checkinProfile.frequency.type === "daily" && "每日"}
              {checkinProfile.frequency.type === "weekly" && "每周"}
              {checkinProfile.frequency.type === "custom" && "自定义"}
            </Badge>
            {checkinProfile.reminderTime && (
              <Badge variant="outline">
                提醒: {checkinProfile.reminderTime}
              </Badge>
            )}
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 当前分数显示区域 */}
        <Card className="bg-muted/20">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">当前分数</CardTitle>
              <div className="text-2xl font-bold text-primary">
                {calculateCurrentScore(checkinProfile.questionnaire.questions, currentAnswer)}/{calculateTotalScore(checkinProfile.questionnaire.questions)}
              </div>
            </div>
            {/* 奖励规则显示 */}
            {checkinProfile.rewardRules.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">奖励规则：</div>
                <div className="flex flex-wrap gap-2">
                  {checkinProfile.rewardRules
                    .sort((a, b) => a.threshold - b.threshold)
                    .map((rule, index) => {
                      const currentScore = calculateCurrentScore(checkinProfile.questionnaire.questions, currentAnswer);
                      const isAchieved = currentScore >= rule.threshold;
                      return (
                        <Badge
                          key={index}
                          variant={isAchieved ? "default" : "secondary"}
                          className={isAchieved ? "bg-green-500" : ""}
                        >
                          {rule.threshold}分 → ¥{rule.amount}
                          {isAchieved && " ✓"}
                        </Badge>
                      );
                    })}
                </div>
              </div>
            )}
          </CardHeader>
        </Card>

        {checkinProfile.questionnaire.questions.map((question, index) => (
          <QuestionRenderer
            key={question.id}
            question={question}
            index={index}
            answer={currentAnswer[question.id]}
            onAnswerChange={handleAnswerChange}
            isPreview={true}
            showScores={false}
          />
        ))}

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={() => setCurrentAnswer({})}>
            重置
          </Button>
          <Badge variant="outline" className="px-3 py-1">
            预览模式 - 不支持实际提交
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}