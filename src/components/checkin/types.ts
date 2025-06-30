import { Question } from "@/types/questionnaire";

export type FrequencyType = "daily" | "weekly" | "custom";

export interface Frequency {
  type: FrequencyType;
  weeklyDays?: number[]; // 0-6，表示周日到周六
  customDates?: string[]; // ISO 格式的日期字符串数组
}

export interface RewardRule {
  id?: string;      // 唯一ID
  threshold: number;  // 分数阈值
  amount: number;     // 奖励金额
}

export interface CheckinProfileForm {
  id?: string; // 用于区分新建还是编辑
  title: string;
  description: string;
  frequency: Frequency;
  reminderTime?: string;
  rewardRules: RewardRule[];
  questionnaire: {
    questions: Question[];
  };
}

export interface CheckinProfileFormProps {
  checkinProfile: CheckinProfileForm;
  onProfileChange: (profile: CheckinProfileForm) => void;
  loading?: boolean;
  error?: string;
  onSave: () => void;
  onReset?: () => void;
  onDelete?: () => void;
  isEditMode?: boolean;
}