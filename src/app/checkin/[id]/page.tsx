"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { getCheckinProfile, submitCheckin } from "@/lib/api/checkinApi";
import { getQuestionnaire } from "@/lib/api/questionnaireApi";
import { CheckinProfile } from "@/types/checkin";
import { Questionnaire } from "@/types/questionnaire";
import PageLoading from "@/components/pageload";
import CheckinForm from "@/components/checkin/CheckinForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CheckinState {
  profile: CheckinProfile | null;
  questionnaire: Questionnaire | null;
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
    loading: true,
    submitting: false,
    error: "",
    submitted: false,
    finalScore: 0,
    finalReward: 0,
  });

  const loadCheckinData = useCallback(async () => {
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
  }, [id, router]);

  // 加载打卡配置和问卷
  useEffect(() => {
    loadCheckinData();
  }, [loadCheckinData]);

  const handleSubmit = async (answers: Record<string, string | string[] | number>) => {
    try {
      setState(prev => ({ ...prev, submitting: true, error: "" }));

      const data = await submitCheckin({
        profileId: id,
        answers,
      });

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

  // 加载状态
  if (state.loading) {
    return (
      <PageLoading />
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
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                返回仪表盘
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

  if (!state.profile || !state.questionnaire) {
    return null;
  }

  return (
    <div className="flex justify-center w-full min-h-[calc(100vh-80px)] pt-10 pb-20">
      <div className="w-full max-w-[800px] space-y-6 px-8">
        <CheckinForm
          profile={state.profile}
          questionnaire={state.questionnaire}
          onSubmit={handleSubmit}
          submitting={state.submitting}
        />
      </div>
    </div>
  );
}