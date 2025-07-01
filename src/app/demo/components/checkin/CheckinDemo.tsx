"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// 模拟问卷数据
const mockQuestionnaire = [
  {
    id: 1,
    type: "radio",
    title: "今天的学习计划完成情况如何？",
    options: [
      { value: "完全完成", score: 10 },
      { value: "部分完成", score: 7 },
      { value: "基本未完成", score: 3 },
      { value: "完全未完成", score: 0 },
    ],
  },
  {
    id: 2,
    type: "score",
    title: "对今天的学习效果评分（0-10分）",
    maxScore: 10,
  },
  {
    id: 3,
    type: "text",
    title: "总结今天的学习收获（至少50字）",
  },
];

// 模拟奖励规则数据
const mockCashbackRules = [
  { threshold: 5, amount: 5 },
  { threshold: 10, amount: 10 },
];

export function CheckinDemo() {
  const [currentStep, setCurrentStep] = useState<"questionnaire" | "result">("questionnaire");
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [finalScore, setFinalScore] = useState(0);
  const [cashbackAmount, setCashbackAmount] = useState(0);

  const handleInputChange = (questionId: number, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const calculateScore = () => {
    let totalScore = 0;
    mockQuestionnaire.forEach((question) => {
      if (question.type === "radio" && question.options) {
        const selectedOption = question.options.find(
          (opt) => opt.value === answers[question.id]
        );
        if (selectedOption) {
          totalScore += selectedOption.score;
        }
      } else if (question.type === "score") {
        totalScore += Number(answers[question.id] || 0);
      }
    });
    return totalScore;
  };

  const calculateCashback = (score: number) => {
    // 找到最高的达标奖励规则
    const eligibleRules = mockCashbackRules
      .filter(rule => score >= rule.threshold)
      .sort((a, b) => b.amount - a.amount);
    
    return eligibleRules.length > 0 ? eligibleRules[0].amount : 0;
  };

  const handleSubmit = () => {
    const score = calculateScore();
    const cashback = calculateCashback(score);
    setFinalScore(score);
    setCashbackAmount(cashback);
    setCurrentStep("result");
  };

  return (
    <Card className="w-full max-w-[800px]">
      {currentStep === "questionnaire" ? (
        <>
          <CardHeader>
            <CardTitle>每日打卡</CardTitle>
            <p className="text-sm text-muted-foreground">
              2025年5月5日 - 截止时间：今天 22:00
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {mockQuestionnaire.map((question) => (
                <div key={question.id} className="space-y-4">
                  <h3 className="font-medium">{question.title}</h3>
                  {question.type === "radio" && question.options && (
                    <RadioGroup
                      onValueChange={(value) =>
                        handleInputChange(question.id, value)
                      }
                      value={answers[question.id] || ""}
                    >
                      {question.options.map((option) => (
                        <div
                          key={option.value}
                          className="flex items-center space-x-2"
                        >
                          <RadioGroupItem
                            value={option.value}
                            id={`${question.id}-${option.value}`}
                          />
                          <Label htmlFor={`${question.id}-${option.value}`}>
                            {option.value}
                          </Label>
                          <span className="ml-auto text-muted-foreground">
                            {option.score}分
                          </span>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                  {question.type === "score" && (
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        min={0}
                        max={question.maxScore}
                        value={answers[question.id] || ""}
                        onChange={(e) =>
                          handleInputChange(question.id, e.target.value)
                        }
                        className="max-w-[100px]"
                      />
                      <span className="w-12 text-center">
                        {answers[question.id] || 0}分
                      </span>
                    </div>
                  )}
                  {question.type === "text" && (
                    <textarea
                      value={answers[question.id] || ""}
                      onChange={(e) =>
                        handleInputChange(question.id, e.target.value)
                      }
                      className="w-full min-h-[100px] p-3 rounded-md border"
                      placeholder="请输入..."
                    />
                  )}
                </div>
              ))}
              <div className="flex justify-center pt-4">
                <Button onClick={handleSubmit}>提交打卡</Button>
              </div>
            </div>
          </CardContent>
        </>
      ) : (
        <>
          <CardHeader>
            <CardTitle className="text-center text-green-500">
              打卡成功！
            </CardTitle>
            <p className="text-center">感谢你的打卡，继续保持！</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">
                  {finalScore}分
                </div>
                <div className="text-sm text-gray-500">今日得分</div>
              </div>
              {cashbackAmount > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">
                    +¥{cashbackAmount}
                  </div>
                  <div className="text-sm text-gray-500">获得奖励</div>
                </div>
              )}
              <div className="text-center text-sm text-gray-500">
                • 累计打卡天数+1
                <br />
                • 连续打卡天数+1
                <br />
                • 累计积分+{finalScore}
              </div>
            </div>
          </CardContent>
          <div className="flex justify-center pb-6">
            <Button variant="outline" onClick={() => setCurrentStep("questionnaire")}>
              重新打卡
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}