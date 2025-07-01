import React, { useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Clock, Trophy } from "lucide-react";
import { CheckinProfile } from "@/types/checkin";
import { Questionnaire, Question } from "@/types/questionnaire";

interface CheckinFormProps {
  profile: CheckinProfile;
  questionnaire: Questionnaire;
  onSubmit: (answers: Record<string, string | string[] | number>) => Promise<void>;
  submitting: boolean;
  isRemedial?: boolean;
  remedialDate?: string;
}

export default function CheckinForm({
  profile,
  questionnaire,
  onSubmit,
  submitting,
  isRemedial = false,
  remedialDate
}: CheckinFormProps) {
  const [answers, setAnswers] = useState<Record<string, string | string[] | number>>({});
  const [currentScore, setCurrentScore] = useState(0);
  const [possibleReward, setPossibleReward] = useState(0);
  const [error, setError] = useState('');

  // 计算当前分数
  const calculateCurrentScore = useCallback((): number => {
    let totalScore = 0;
    questionnaire.questions.forEach((question: Question) => {
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
          // 文本题不计分
          break;
      }
    });

    return totalScore;
  }, [questionnaire.questions, answers]);

  // 计算可能的奖励
  const calculatePossibleReward = useCallback((score: number): number => {
    const eligibleRules = profile.rewardRules
      .filter(rule => score >= rule.threshold)
      .sort((a, b) => b.amount - a.amount);

    const baseReward = eligibleRules.length > 0 ? eligibleRules[0].amount : 0;
    // 补救打卡奖励减半
    return isRemedial ? baseReward * 0.5 : baseReward;
  }, [profile.rewardRules, isRemedial]);

  // 实时计算分数和奖励
  useEffect(() => {
    const score = calculateCurrentScore();
    const reward = calculatePossibleReward(score);
    setCurrentScore(score);
    setPossibleReward(reward);
  }, [calculateCurrentScore, calculatePossibleReward]);

  const handleAnswerChange = (questionId: string, value: string | string[] | number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const validateAnswers = (): boolean => {
    for (const question of questionnaire.questions) {
      if (question.required) {
        const answer = answers[question.id];
        if (!answer || (Array.isArray(answer) && answer.length === 0)) {
          setError(`请回答必填问题：${question.title}`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateAnswers()) return;

    try {
      setError("");
      await onSubmit(answers);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '提交失败';
      setError(errorMessage);
    }
  };

  const renderQuestion = (question: Question) => {
    const answer = answers[question.id];

    switch (question.type) {
      case 'single':
        return (
          <RadioGroup
            value={(answer as string) || ""}
            onValueChange={(value) => handleAnswerChange(question.id, value)}
          >
            {question.options?.map((option) => (
              <div key={option.id} className="flex items-center space-x-2 justify-between">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={option.id} id={`${question.id}-${option.id}`} />
                  <Label htmlFor={`${question.id}-${option.id}`}>{option.text}</Label>
                </div>
                <span className="text-sm text-muted-foreground">{option.score}分</span>
              </div>
            ))}
          </RadioGroup>
        );

      case 'multiple':
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <div key={option.id} className="flex items-center space-x-2 justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`${question.id}-${option.id}`}
                    checked={Array.isArray(answer) && answer.includes(option.id)}
                    onCheckedChange={(checked: boolean) => {
                      const currentAnswers = Array.isArray(answer) ? answer : [];
                      if (checked) {
                        handleAnswerChange(question.id, [...currentAnswers, option.id]);
                      } else {
                        handleAnswerChange(question.id, currentAnswers.filter(id => id !== option.id));
                      }
                    }}
                  />
                  <Label htmlFor={`${question.id}-${option.id}`}>{option.text}</Label>
                </div>
                <span className="text-sm text-muted-foreground">{option.score}分</span>
              </div>
            ))}
          </div>
        );

      case 'text':
        return (
          <Textarea
            value={(answer as string) || ""}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="请输入您的答案..."
            className="min-h-[100px]"
          />
        );

      case 'score':
        return (
          <div className="flex items-center space-x-4">
            <Input
              type="number"
              min={0}
              max={question.maxScore}
              value={(answer as number) || ""}
              onChange={(e) => handleAnswerChange(question.id, parseInt(e.target.value) || 0)}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">
              / {question.maxScore}分
            </span>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* 打卡头部信息 */}
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-2xl font-bold mb-2">
          {isRemedial ? `补救打卡 - ${profile.title}` : profile.title}
        </h1>
        <p className="text-muted-foreground mb-4">{profile.description}</p>
        {isRemedial && remedialDate && (
          <p className="text-sm text-orange-600 mb-4">
            补救日期：{new Date(remedialDate).toLocaleDateString('zh-CN')}
          </p>
        )}
        
        {/* 实时分数和奖励显示 */}
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span>当前得分: {currentScore}分</span>
          </div>
          {possibleReward > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-green-500">
                可获得奖励: ¥{possibleReward}
                {isRemedial && <span className="text-xs ml-1">(补救打卡奖励减半)</span>}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 问卷卡片 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{questionnaire.title}</CardTitle>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{isRemedial ? '补救打卡' : '今日打卡'}</span>
            </div>
          </div>
          {questionnaire.description && (
            <p className="text-muted-foreground">{questionnaire.description}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {questionnaire.questions.map((question, index) => (
              <div key={question.id} className="space-y-4">
                <div className="flex items-start space-x-2">
                  <span className="text-sm font-medium text-muted-foreground min-w-[24px]">
                    {index + 1}.
                  </span>
                  <div className="flex-1">
                    <h3 className="font-medium mb-3">
                      {question.title}
                      {question.required && <span className="text-red-500 ml-1">*</span>}
                    </h3>
                    {renderQuestion(question)}
                  </div>
                </div>
              </div>
            ))}
            
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
            
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                size="lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    提交中...
                  </>
                ) : (
                  isRemedial ? '提交补救打卡' : '提交打卡'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}