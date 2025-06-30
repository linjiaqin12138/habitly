"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Clock, Trophy } from "lucide-react";
import { toast } from "sonner";
import { getCheckinProfile } from "@/lib/api/checkinApi";
import { getQuestionnaire } from "@/lib/api/questionnaireApi";
import { CheckinProfile } from "@/types/checkin";
import { Questionnaire, Question } from "@/types/questionnaire";

interface CheckinState {
  profile: CheckinProfile | null;
  questionnaire: Questionnaire | null;
  answers: Record<string, any>;
  currentScore: number;
  possibleReward: number;
  loading: boolean;
  submitting: boolean;
  error: string;
  submitted: boolean;
  finalScore: number;
  finalReward: number;
}

export default function CheckinPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [state, setState] = useState<CheckinState>({
    profile: null,
    questionnaire: null,
    answers: {},
    currentScore: 0,
    possibleReward: 0,
    loading: true,
    submitting: false,
    error: "",
    submitted: false,
    finalScore: 0,
    finalReward: 0,
  });

  // 加载打卡配置和问卷
  useEffect(() => {
    loadCheckinData();
  }, [id]);

  // 实时计算分数和奖励
  useEffect(() => {
    if (state.questionnaire && state.profile) {
      const score = calculateCurrentScore();
      const reward = calculatePossibleReward(score);
      setState(prev => ({ ...prev, currentScore: score, possibleReward: reward }));
    }
  }, [state.answers, state.questionnaire, state.profile]);

  const loadCheckinData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: "" }));

      // 获取打卡配置
      const profileData = await getCheckinProfile(id);
      const profile = profileData.profile;

      // 获取关联的问卷
      const questionnaireData = await getQuestionnaire(profile.questionnaireId);
      const questionnaire = questionnaireData.questionnaire;

      setState(prev => ({
        ...prev,
        profile,
        questionnaire,
        loading: false,
      }));
    } catch (err) {
      if (err instanceof Error && err.message === 'NOT_FOUND') {
        router.push('/404');
        return;
      }
      const errorMessage = err instanceof Error ? err.message : '加载打卡数据失败';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      toast.error(errorMessage);
    }
  };

  const calculateCurrentScore = (): number => {
    if (!state.questionnaire) return 0;

    let totalScore = 0;
    state.questionnaire.questions.forEach((question: Question) => {
      const answer = state.answers[question.id];
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
  };

  const calculatePossibleReward = (score: number): number => {
    if (!state.profile) return 0;

    const eligibleRules = state.profile.rewardRules
      .filter(rule => score >= rule.threshold)
      .sort((a, b) => b.amount - a.amount);

    return eligibleRules.length > 0 ? eligibleRules[0].amount : 0;
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: value,
      },
    }));
  };

  const validateAnswers = (): boolean => {
    if (!state.questionnaire) return false;

    for (const question of state.questionnaire.questions) {
      if (question.required) {
        const answer = state.answers[question.id];
        if (!answer || (Array.isArray(answer) && answer.length === 0)) {
          toast.error(`请回答必填问题：${question.title}`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateAnswers()) return;

    try {
      setState(prev => ({ ...prev, submitting: true, error: "" }));

      const response = await fetch('/api/checkin/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileId: id,
          answers: state.answers,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '提交打卡失败');
      }

      const data = await response.json();
      const record = data.record;

      setState(prev => ({
        ...prev,
        submitted: true,
        finalScore: record.score,
        finalReward: record.rewardAmount,
        submitting: false,
      }));

      toast.success('打卡成功！');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '提交打卡失败';
      setState(prev => ({ ...prev, error: errorMessage, submitting: false }));
      toast.error(errorMessage);
    }
  };

  const renderQuestion = (question: Question) => {
    const answer = state.answers[question.id];

    switch (question.type) {
      case 'single':
        return (
          <RadioGroup
            value={answer || ""}
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
            value={answer || ""}
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
              value={answer || ""}
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

  // 加载状态
  if (state.loading) {
    return (
      <div className="flex justify-center w-full min-h-[calc(100vh-80px)] pt-10">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-gray-500 mt-2">加载中...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (state.error && !state.profile) {
    return (
      <div className="flex justify-center w-full min-h-[calc(100vh-80px)] pt-10">
        <div className="text-center">
          <p className="text-red-500 mb-4">{state.error}</p>
          <Button onClick={loadCheckinData}>重试</Button>
        </div>
      </div>
    );
  }

  // 提交成功状态
  if (state.submitted) {
    return (
      <div className="flex justify-center w-full min-h-[calc(100vh-80px)] pt-10 pb-20">
        <div className="w-full max-w-[600px] px-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-green-500">
                打卡成功！
              </CardTitle>
              <p className="text-center text-muted-foreground">
                感谢您的打卡，继续保持！
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary">
                    {state.finalScore}分
                  </div>
                  <div className="text-sm text-muted-foreground">今日得分</div>
                </div>
                {state.finalReward > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">
                      +¥{state.finalReward}
                    </div>
                    <div className="text-sm text-muted-foreground">获得奖励</div>
                  </div>
                )}
                <div className="text-center text-sm text-muted-foreground">
                  奖励已自动添加到您的小金库中
                </div>
              </div>
            </CardContent>
            <div className="flex justify-center pb-6 space-x-4">
              <Button variant="outline" onClick={() => router.push('/checkin')}>
                返回打卡列表
              </Button>
              <Button onClick={() => router.push('/vault')}>
                查看小金库
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center w-full min-h-[calc(100vh-80px)] pt-10 pb-20">
      <div className="w-full max-w-[800px] space-y-6 px-8">
        {/* 打卡头部信息 */}
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-2xl font-bold mb-2">{state.profile?.title}</h1>
          <p className="text-muted-foreground mb-4">{state.profile?.description}</p>
          
          {/* 实时分数和奖励显示 */}
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span>当前得分: {state.currentScore}分</span>
            </div>
            {state.possibleReward > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-green-500">可获得奖励: ¥{state.possibleReward}</span>
              </div>
            )}
          </div>
        </div>

        {/* 问卷卡片 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{state.questionnaire?.title}</CardTitle>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>今日打卡</span>
              </div>
            </div>
            {state.questionnaire?.description && (
              <p className="text-muted-foreground">{state.questionnaire.description}</p>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {state.questionnaire?.questions.map((question, index) => (
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
              
              {state.error && (
                <div className="text-red-500 text-sm">{state.error}</div>
              )}
              
              <div className="flex justify-center pt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={state.submitting}
                  size="lg"
                >
                  {state.submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      提交中...
                    </>
                  ) : (
                    '提交打卡'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}