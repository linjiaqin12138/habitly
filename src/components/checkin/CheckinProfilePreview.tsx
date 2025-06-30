import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { CheckinProfileForm } from "./types";

interface CheckinProfilePreviewProps {
  checkinProfile: CheckinProfileForm;
}

export function CheckinProfilePreview({ checkinProfile }: CheckinProfilePreviewProps) {
  const [currentAnswer, setCurrentAnswer] = useState<Record<string, any>>({});

  // 计算总分数
  const calculateTotalScore = (): number => {
    let totalScore = 0;
    checkinProfile.questionnaire.questions.forEach((question) => {
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

  // 计算当前分数
  const calculateCurrentScore = (): number => {
    let totalScore = 0;

    checkinProfile.questionnaire.questions.forEach((question) => {
      const answer = currentAnswer[question.id];

      if (!answer) return;

      switch (question.type) {
        case "single":
          const selectedOption = question.options?.find(option => option.id === answer);
          if (selectedOption) {
            totalScore += selectedOption.score;
          }
          break;

        case "multiple":
          if (Array.isArray(answer)) {
            answer.forEach((optionId) => {
              const option = question.options?.find(opt => opt.id === optionId);
              if (option) {
                totalScore += option.score;
              }
            });
          }
          break;

        case "text":
          if (answer && answer.trim()) {
            totalScore += 5; // 填空题默认5分
          }
          break;

        case "score":
          totalScore += Number(answer) || 0;
          break;
      }
    });

    return totalScore;
  };

  const handleAnswerChange = (questionId: string, value: any) => {
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
                {calculateCurrentScore()}/{calculateTotalScore()}
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
                      const currentScore = calculateCurrentScore();
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
          <div key={question.id} className="space-y-2">
            <Label>
              {index + 1}. {question.title}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </Label>

            {question.type === "single" && (
              <div className="space-y-2">
                {question.options?.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name={question.id}
                      value={option.id}
                      checked={currentAnswer[question.id] === option.id}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    />
                    <span>{option.text}</span>
                  </div>
                ))}
              </div>
            )}

            {question.type === "multiple" && (
              <div className="space-y-2">
                {question.options?.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      value={option.id}
                      checked={(currentAnswer[question.id] || []).includes(option.id)}
                      onChange={(e) => {
                        const current = currentAnswer[question.id] || [];
                        const value = e.target.value;
                        handleAnswerChange(
                          question.id,
                          current.includes(value)
                            ? current.filter((v: string) => v !== value)
                            : [...current, value]
                        );
                      }}
                    />
                    <span>{option.text}</span>
                  </div>
                ))}
              </div>
            )}

            {question.type === "text" && (
              <Textarea
                value={currentAnswer[question.id] || ""}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                placeholder="请输入..."
              />
            )}

            {question.type === "score" && (
              <div className="space-y-2">
                <Slider
                  value={[currentAnswer[question.id] || 0]}
                  onValueChange={(value) => handleAnswerChange(question.id, value[0])}
                  max={question.maxScore}
                  step={1}
                />
                <div className="text-sm text-muted-foreground text-right">
                  {currentAnswer[question.id] || 0} / {question.maxScore}
                </div>
              </div>
            )}
          </div>
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