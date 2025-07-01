"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import assert from "assert";
import { CheckinProfileForm } from "@/components/checkin/CheckinProfileForm";
import { CheckinProfileForm as CheckinProfileFormType } from "@/components/checkin/types";
import { getCheckinProfile, updateCheckinProfile, deleteCheckinProfile } from "@/lib/api/checkinApi";
import { getQuestionnaire } from "@/lib/api/questionnaireApi";
import { calculateTotalScore } from "@/lib/utils/calcTotalScore";

export default function CheckinEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [checkinProfile, setCheckinProfile] = useState<CheckinProfileFormType | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // 页面加载时获取打卡配置数据
  const loadCheckinProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      
      const data = await getCheckinProfile(id);
      const profile = data.profile;

      // 获取关联的问卷信息
      const questionnaireData = await getQuestionnaire(profile.questionnaireId);
      const questionnaire = questionnaireData.questionnaire;

      setCheckinProfile({
        id: profile.id,
        title: profile.title,
        description: profile.description,
        frequency: profile.frequency,
        reminderTime: profile.reminderTime,
        rewardRules: profile.rewardRules.map((rule: { threshold: number; amount: number }, index: number) => ({
          ...rule,
          id: `reward${index}_${Date.now()}` // 确保每个规则都有ID
        })),
        questionnaire: {
          questions: questionnaire.questions
        },
      });
    } catch (err) {
      if (err instanceof Error && err.message === 'NOT_FOUND') {
        router.push('/404');
        return;
      }
      const errorMessage = err instanceof Error ? err.message : '获取打卡配置失败';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    loadCheckinProfile();
  }, [id, loadCheckinProfile]);

  const handleSaveCheckinProfile = async () => {
    try {
      setSaveLoading(true);
      setError("");

      if (!checkinProfile) {
        return
      }

      // 更新现有打卡配置
      await updateCheckinProfile(id, {
        title: checkinProfile.title,
        description: checkinProfile.description,
        frequency: checkinProfile.frequency,
        reminderTime: checkinProfile.reminderTime,
        rewardRules: checkinProfile.rewardRules.map(r => ({
          threshold: r.threshold,
          amount: r.amount
        })),
        questionnaire: {
          questions: checkinProfile.questionnaire.questions,
          title: checkinProfile.title,
          description: checkinProfile.description,
          totalScore: calculateTotalScore(checkinProfile.questionnaire.questions)
        }
      });

      toast.success("打卡配置已更新！");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新打卡配置失败';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteCheckinProfile = async () => {
    try {
      setSaveLoading(true);
      setError("");

      await deleteCheckinProfile(id);

      toast.success("打卡配置已删除！");
      
      // 跳转到打卡列表页
      router.replace('/checkin');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除打卡配置失败';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaveLoading(false);
    }
  };

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <div className="flex justify-center w-full min-h-[calc(100vh-80px)] pt-10 pb-20">
        <div className="w-full max-w-[1200px] space-y-6">
          <div className="flex flex-col items-center mb-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-gray-500 mt-2">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  assert(checkinProfile !== undefined, "checkinProfile should be defined after loading")
 
  return (
    <div className="flex justify-center w-full min-h-[calc(100vh-80px)] pt-10 pb-20">
      <div className="w-full max-w-[1200px] space-y-6 px-8">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-2xl font-bold mb-2">编辑打卡配置</h1>
          <p className="text-gray-500">修改您的习惯打卡配置</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>编辑打卡配置</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <CheckinProfileForm
              checkinProfile={checkinProfile}
              onProfileChange={setCheckinProfile}
              loading={saveLoading}
              error={error}
              onSave={handleSaveCheckinProfile}
              onDelete={handleDeleteCheckinProfile}
              isEditMode={true}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
