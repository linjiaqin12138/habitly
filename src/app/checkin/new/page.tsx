"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { CheckinProfileCreateRequest } from "@/types/checkin";
import { Question } from "@/types/questionnaire";
import { toast } from "sonner";
import { CheckinProfileForm } from "@/components/checkin/CheckinProfileForm";
import { CheckinProfileForm as CheckinProfileFormType } from "@/components/checkin/types";

const defaultCheckinProfile: CheckinProfileFormType = {
  title: "每日习惯打卡",
  description: "记录你的每日习惯完成情况",
  frequency: {
    type: "daily",
    weeklyDays: [],
    customDates: [],
  },
  reminderTime: "09:00",
  rewardRules: [
    {
      id: "reward1",
      threshold: 80,
      amount: 5,
    },
    {
      id: "reward2", 
      threshold: 90,
      amount: 10,
    }
  ],
  questionnaire: {
    questions: [
      {
        id: "q1",
        type: "single",
        title: "今天的学习计划是否完成？",
        required: true,
        options: [
          { id: "o1", text: "完全完成", score: 10 },
          { id: "o2", text: "部分完成", score: 5 },
          { id: "o3", text: "未完成", score: 0 },
        ],
      },
      {
        id: "q2",
        type: "multiple",
        title: "今天完成了哪些运动？",
        required: false,
        options: [
          { id: "o1", text: "跑步", score: 3 },
          { id: "o2", text: "健身", score: 3 },
          { id: "o3", text: "瑜伽", score: 2 },
          { id: "o4", text: "游泳", score: 4 },
        ],
      },
      {
        id: "q3",
        type: "text",
        title: "今天的收获和感想是什么？",
        required: true,
      },
      {
        id: "q4",
        type: "score",
        title: "今天的整体表现评分",
        required: true,
        maxScore: 10,
      },
    ],
  },
};

export default function CheckinNewPage() {
  const router = useRouter();
  const [checkinProfile, setCheckinProfile] = useState<CheckinProfileFormType>(defaultCheckinProfile);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

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

  const handleSaveCheckinProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const apiData: CheckinProfileCreateRequest = {
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
          totalScore: calculateTotalScore()
        },
      };

      const response = await fetch('/api/checkin/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '保存打卡配置失败');
      }

      const data = await response.json();
      const savedProfile = data.profile;

      toast.success("打卡配置已保存！");
      
      router.replace(`/checkin/edit/${savedProfile.id}`);
    } catch (err: any) {
      const errorMessage = err.message || '保存打卡配置失败';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResetCheckinProfile = () => {
    setCheckinProfile(defaultCheckinProfile);
  };

  return (
    <div className="flex justify-center w-full min-h-[calc(100vh-80px)] pt-10 pb-20">
      <div className="w-full max-w-[1200px] space-y-6">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-2xl font-bold mb-2">打卡配置管理</h1>
          <p className="text-gray-500">创建和管理您的习惯打卡配置</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>打卡配置管理</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <CheckinProfileForm
              checkinProfile={checkinProfile}
              onProfileChange={setCheckinProfile}
              loading={loading}
              error={error}
              onSave={handleSaveCheckinProfile}
              onReset={handleResetCheckinProfile}
              isEditMode={false}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}