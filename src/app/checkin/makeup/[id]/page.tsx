"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getCheckinProfile, submitRemedialCheckin } from "@/lib/api/checkinApi";
import { getQuestionnaire } from "@/lib/api/questionnaireApi";
import { CheckinProfile } from "@/types/checkin";
import { Questionnaire } from "@/types/questionnaire";
import PageLoading from "@/components/pageload";
import MakeupReasonForm from "@/components/checkin/MakeupReasonForm";
import CheckinForm from "@/components/checkin/CheckinForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MakeupState {
  profile: CheckinProfile | null;
  questionnaire: Questionnaire | null;
  loading: boolean;
  submitting: boolean;
  error: string;
  reasonSubmitted: boolean;
  reason: string;
  submitted: boolean;
  finalScore: number;
  finalReward: number;
}

export default function MakeupCheckinPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const date = searchParams.get('date');

  const [state, setState] = useState<MakeupState>({
    profile: null,
    questionnaire: null,
    loading: true,
    submitting: false,
    error: "",
    reasonSubmitted: false,
    reason: "",
    submitted: false,
    finalScore: 0,
    finalReward: 0,
  });

  const loadData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: "" }));

      // 验证日期参数
      if (!date) {
        throw new Error('缺少补救日期参数');
      }

      // 验证日期格式和范围
      const makeupDate = new Date(date);
      const today = new Date();
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      if (isNaN(makeupDate.getTime())) {
        throw new Error('无效的日期格式');
      }

      if (makeupDate >= today) {
        throw new Error('只能补救过去的打卡');
      }

      if (makeupDate < threeDaysAgo) {
        throw new Error('只能补救最近3天内的缺卡');
      }

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
      const errorMessage = err instanceof Error ? err.message : '加载数据失败';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      toast.error(errorMessage);
    }
  }, [id, date, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleReasonSubmit = (reason: string) => {
    setState(prev => ({
      ...prev,
      reasonSubmitted: true,
      reason,
    }));
  };

  const handleCheckinSubmit = async (answers: Record<string, string | string[] | number>) => {
    if (!date) return;

    try {
      setState(prev => ({ ...prev, submitting: true, error: "" }));

      const data = await submitRemedialCheckin({
        profileId: id,
        answers,
        checkinDate: date,
      });

      const record = data.record;

      setState(prev => ({
        ...prev,
        submitted: true,
        finalScore: record.score,
        finalReward: record.rewardAmount,
        submitting: false,
      }));

      toast.success('补救打卡成功！');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '提交补救打卡失败';
      setState(prev => ({ ...prev, error: errorMessage, submitting: false }));
      toast.error(errorMessage);
    }
  };

  // 加载状态
  if (state.loading) {
    return <PageLoading />;
  }

  // 错误状态
  if (state.error && !state.profile) {
    return (
      <div className="flex justify-center w-full min-h-[calc(100vh-80px)] pt-10">
        <div className="text-center">
          <p className="text-red-500 mb-4">{state.error}</p>
          <Button onClick={loadData}>
            重试
          </Button>
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
                补救打卡成功！
              </CardTitle>
              <p className="text-center text-muted-foreground">
                感谢您的补救打卡，继续保持！
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary">
                    {state.finalScore}分
                  </div>
                  <div className="text-sm text-muted-foreground">补救打卡得分</div>
                </div>
                {state.finalReward > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">
                      +¥{state.finalReward}
                    </div>
                    <div className="text-sm text-muted-foreground">获得奖励（补救打卡奖励减半）</div>
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

  if (!state.profile || !state.questionnaire || !date) {
    return null;
  }

  return (
    <div className="flex justify-center w-full min-h-[calc(100vh-80px)] pt-10 pb-20">
      <div className="w-full max-w-[800px] space-y-6 px-8">
        {!state.reasonSubmitted ? (
          <MakeupReasonForm
            date={date}
            onSubmit={handleReasonSubmit}
            disabled={state.submitting}
          />
        ) : (
          <CheckinForm
            profile={state.profile}
            questionnaire={state.questionnaire}
            onSubmit={handleCheckinSubmit}
            submitting={state.submitting}
            isRemedial={true}
            remedialDate={date}
          />
        )}
      </div>
    </div>
  );
}