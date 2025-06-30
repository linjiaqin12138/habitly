"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CheckinProfileCreateRequest } from "@/types/checkin";
import { Question } from "@/types/questionnaire";
import { toast } from "sonner";

type FrequencyType = "daily" | "weekly" | "custom";

interface Frequency {
  type: FrequencyType;
  weeklyDays?: number[]; // 0-6，表示周日到周六
  customDates?: string[]; // ISO 格式的日期字符串数组
}

interface RewardRule {
  id: string;        // 添加唯一ID
  threshold: number;  // 分数阈值
  amount: number;     // 奖励金额
}

interface CheckinProfileForm {
  id?: string; // 添加id字段用于区分新建还是编辑
  title: string;
  description: string;
  frequency: Frequency;
  reminderTime?: string;
  rewardRules: RewardRule[];
  questionnaire: {
    questions: Question[];
  };
}

const defaultCheckinProfile: CheckinProfileForm = {
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
  const [checkinProfile, setCheckinProfile] = useState<CheckinProfileForm>(defaultCheckinProfile);
  const [currentAnswer, setCurrentAnswer] = useState<Record<string, any>>({});
  // const [checkinProfileList, setCheckinProfileList] = useState<CheckinProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // 计算当前分数的函数
  const calculateCurrentScore = (): number => {
    let totalScore = 0;

    checkinProfile.questionnaire.questions.forEach((question) => {
      const answer = currentAnswer[question.id];

      if (!answer) return; // 没有回答则跳过

      switch (question.type) {
        case "single":
          // 单选题：找到选中选项的分数
          const selectedOption = question.options?.find(option => option.id === answer);
          if (selectedOption) {
            totalScore += selectedOption.score;
          }
          break;

        case "multiple":
          // 多选题：所有选中选项分数之和
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
          // 填空题：如果有内容则给予固定分数（可以根据需求调整）
          if (answer && answer.trim()) {
            totalScore += 5; // 填空题默认5分
          }
          break;

        case "score":
          // 评分题：直接使用用户设置的分数
          totalScore += Number(answer) || 0;
          break;
      }
    });

    return totalScore;
  };

  const calculateTotalScore = (): number => {
    let totalScore = 0;
    checkinProfile.questionnaire.questions.forEach((question) => {
      if (question.type === "score") {
        totalScore += question.maxScore!; // 默认最高分为10
      } else if (question.type === "multiple") {
        const options = question.options || [];
        totalScore += options.reduce((sum, option) => sum + option.score, 0);
      } else if (question.type === "single") {
        const options = question.options || [];
        // find the maximum score option
        const maxOption = options.reduce((max, option) => option.score > max.score ? option : max, { id: "", text: "", score: 0 });
        totalScore += maxOption.score;
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

  const handleSaveCheckinProfile = async () => {
    try {
      setLoading(true);
      setError("");

      // 准备API数据
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
      
      // 跳转到编辑页面，替换当前历史记录
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
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue="edit" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="edit">编辑配置</TabsTrigger>
                <TabsTrigger value="preview">预览效果</TabsTrigger>
              </TabsList>

              <TabsContent value="edit" className="mt-4 space-y-6">
                {/* 基本信息卡片 */}
                <Card>
                  <CardHeader>
                    <CardTitle>基本信息</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="title" className="text-right">打卡标题</Label>
                      <Input
                        id="title"
                        value={checkinProfile.title}
                        onChange={(e) => setCheckinProfile({
                          ...checkinProfile,
                          title: e.target.value,
                        })}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="description" className="text-right">打卡描述</Label>
                      <Textarea
                        id="description"
                        value={checkinProfile.description}
                        onChange={(e) => setCheckinProfile({
                          ...checkinProfile,
                          description: e.target.value,
                        })}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="reminderTime" className="text-right">提醒时间</Label>
                      <Input
                        id="reminderTime"
                        type="time"
                        value={checkinProfile.reminderTime}
                        onChange={(e) => setCheckinProfile({
                          ...checkinProfile,
                          reminderTime: e.target.value,
                        })}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="frequency" className="text-right">打卡频率</Label>
                      <div className="col-span-3 space-y-4">
                        <Select
                          value={checkinProfile.frequency.type}
                          onValueChange={(value: FrequencyType) => {
                            setCheckinProfile({
                              ...checkinProfile,
                              frequency: {
                                type: value,
                                weeklyDays: value === "weekly" ? [] : undefined,
                                customDates: value === "custom" ? [] : undefined,
                              },
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">每日打卡</SelectItem>
                            <SelectItem value="weekly">每周打卡</SelectItem>
                            <SelectItem value="custom">自定义打卡</SelectItem>
                          </SelectContent>
                        </Select>

                        {checkinProfile.frequency.type === "weekly" && (
                          <div className="space-y-2">
                            <div className="grid grid-cols-4 gap-2">
                              {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                                <div key={day} className="flex items-center space-x-2">
                                  <Switch
                                    checked={checkinProfile.frequency.weeklyDays?.includes(day) || false}
                                    onCheckedChange={(checked) => {
                                      setCheckinProfile({
                                        ...checkinProfile,
                                        frequency: {
                                          ...checkinProfile.frequency,
                                          weeklyDays: checked
                                            ? [...(checkinProfile.frequency.weeklyDays || []), day]
                                            : (checkinProfile.frequency.weeklyDays || []).filter((d) => d !== day),
                                        },
                                      });
                                    }}
                                  />
                                  <Label>
                                    {day === 0 && "周日"}
                                    {day === 1 && "周一"}
                                    {day === 2 && "周二"}
                                    {day === 3 && "周三"}
                                    {day === 4 && "周四"}
                                    {day === 5 && "周五"}
                                    {day === 6 && "周六"}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {checkinProfile.frequency.type === "custom" && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label className="text-right">选择日期</Label>
                              <div className="col-span-3">
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className="w-full justify-start text-left font-normal"
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {checkinProfile.frequency.customDates?.length
                                        ? `已选择 ${checkinProfile.frequency.customDates.length} 个日期`
                                        : "选择打卡日期"}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="multiple"
                                      selected={checkinProfile.frequency.customDates?.map(date => new Date(date))}
                                      onSelect={(dates) => {
                                        setCheckinProfile({
                                          ...checkinProfile,
                                          frequency: {
                                            ...checkinProfile.frequency,
                                            customDates: dates ? dates.map(date => format(date, 'yyyy-MM-dd')) : [],
                                          },
                                        });
                                      }}
                                      locale={zhCN}
                                      className="rounded-md border"
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </div>
                            {checkinProfile.frequency.customDates && checkinProfile.frequency.customDates.length > 0 && (
                              <div className="grid grid-cols-4 gap-4">
                                <div className="text-right text-sm text-muted-foreground">已选日期：</div>
                                <div className="col-span-3 flex flex-wrap gap-2">
                                  {checkinProfile.frequency.customDates.sort().map((date) => (
                                    <Badge key={date} variant="secondary">
                                      {format(new Date(date), 'yyyy-MM-dd')}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-4 w-4 ml-1 p-0"
                                        onClick={() => {
                                          setCheckinProfile({
                                            ...checkinProfile,
                                            frequency: {
                                              ...checkinProfile.frequency,
                                              customDates: checkinProfile.frequency.customDates?.filter(d => d !== date),
                                            },
                                          });
                                        }}
                                      >
                                        ×
                                      </Button>
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 奖励规则设置 */}
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label className="text-right mt-2">奖励规则</Label>
                      <div className="col-span-3 space-y-4">
                        {checkinProfile.rewardRules.map((rule, index) => (
                          <div key={rule.id} className="flex items-center gap-4">
                            <div className="flex-1 grid grid-cols-2 gap-4">
                              <div className="flex items-center gap-2">
                                <Label className="w-full">分数阈值</Label>
                                <Input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={rule.threshold}
                                  onChange={(e) => {
                                    const newRules = [...checkinProfile.rewardRules];
                                    newRules[index] = {
                                      ...rule,
                                      threshold: parseInt(e.target.value) || 0,
                                    };
                                    setCheckinProfile({
                                      ...checkinProfile,
                                      rewardRules: newRules,
                                    });
                                  }}
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <Label className="w-full">奖励金额</Label>
                                <Input
                                  type="number"
                                  min={0}
                                  value={rule.amount}
                                  onChange={(e) => {
                                    const newRules = [...checkinProfile.rewardRules];
                                    newRules[index] = {
                                      ...rule,
                                      amount: parseInt(e.target.value) || 0,
                                    };
                                    setCheckinProfile({
                                      ...checkinProfile,
                                      rewardRules: newRules,
                                    });
                                  }}
                                />
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newRules = [...checkinProfile.rewardRules];
                                newRules.splice(index, 1);
                                setCheckinProfile({
                                  ...checkinProfile,
                                  rewardRules: newRules,
                                });
                              }}
                            >
                              删除
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newId = `reward${Date.now()}`; // 使用时间戳确保唯一性
                            setCheckinProfile({
                              ...checkinProfile,
                              rewardRules: [
                                ...checkinProfile.rewardRules,
                                { id: newId, threshold: 80, amount: 5 },
                              ],
                            });
                          }}
                        >
                          添加奖励规则
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 问题列表卡片 */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle>问题列表</CardTitle>
                    <Button
                      onClick={() => {
                        const newQuestion: Question = {
                          id: `q${checkinProfile.questionnaire.questions.length + 1}`,
                          type: "single",
                          title: "新问题",
                          required: true,
                          options: [
                            { id: "o1", text: "选项1", score: 0 },
                          ],
                        };
                        setCheckinProfile({
                          ...checkinProfile,
                          questionnaire: {
                            ...checkinProfile.questionnaire,
                            questions: [...checkinProfile.questionnaire.questions, newQuestion],
                          },
                        });
                      }}
                      size="sm"
                    >
                      添加问题
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {checkinProfile.questionnaire.questions.map((question, index) => (
                      <Card key={question.id}>
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">问题 {index + 1}: {question.title}</CardTitle>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newQuestions = [...checkinProfile.questionnaire.questions];
                                newQuestions.splice(index, 1);
                                setCheckinProfile({
                                  ...checkinProfile,
                                  questionnaire: {
                                    ...checkinProfile.questionnaire,
                                    questions: newQuestions,
                                  },
                                });
                              }}
                            >
                              删除
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">类型</Label>
                            <Select
                              value={question.type}
                              onValueChange={(value: "single" | "multiple" | "text" | "score") => {
                                const newQuestions = [...checkinProfile.questionnaire.questions];
                                newQuestions[index] = {
                                  ...question,
                                  type: value,
                                  options: value === "single" || value === "multiple"
                                    ? [{ id: "o1", text: "选项1", score: 0 }]
                                    : undefined,
                                };
                                setCheckinProfile({
                                  ...checkinProfile,
                                  questionnaire: {
                                    ...checkinProfile.questionnaire,
                                    questions: newQuestions,
                                  },
                                });
                              }}
                            >
                              <SelectTrigger className="col-span-3">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="single">单选题</SelectItem>
                                <SelectItem value="multiple">多选题</SelectItem>
                                <SelectItem value="text">填空题</SelectItem>
                                <SelectItem value="score">评分题</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">问题</Label>
                            <Input
                              value={question.title}
                              onChange={(e) => {
                                const newQuestions = [...checkinProfile.questionnaire.questions];
                                newQuestions[index] = {
                                  ...question,
                                  title: e.target.value,
                                };
                                setCheckinProfile({
                                  ...checkinProfile,
                                  questionnaire: {
                                    ...checkinProfile.questionnaire,
                                    questions: newQuestions,
                                  },
                                });
                              }}
                              className="col-span-3"
                            />
                          </div>

                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">必答</Label>
                            <div className="col-span-3">
                              <Switch
                                checked={question.required}
                                onCheckedChange={(checked) => {
                                  const newQuestions = [...checkinProfile.questionnaire.questions];
                                  newQuestions[index] = {
                                    ...question,
                                    required: checked,
                                  };
                                  setCheckinProfile({
                                    ...checkinProfile,
                                    questionnaire: {
                                      ...checkinProfile.questionnaire,
                                      questions: newQuestions,
                                    },
                                  });
                                }}
                              />
                            </div>
                          </div>

                          {(question.type === "single" || question.type === "multiple") && (
                            <div className="space-y-2">
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">选项</Label>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newQuestions = [...checkinProfile.questionnaire.questions];
                                    const newOption = {
                                      id: `o${(question.options?.length || 0) + 1}`,
                                      text: `选项${(question.options?.length || 0) + 1}`,
                                      score: 0,
                                    };
                                    newQuestions[index] = {
                                      ...question,
                                      options: [...(question.options || []), newOption],
                                    };
                                    setCheckinProfile({
                                      ...checkinProfile,
                                      questionnaire: {
                                        ...checkinProfile.questionnaire,
                                        questions: newQuestions,
                                      },
                                    });
                                  }}
                                  className="col-span-3"
                                >
                                  添加选项
                                </Button>
                              </div>
                              {question.options?.map((option, optionIndex) => (
                                <div key={option.id} className="grid grid-cols-4 items-center gap-4">
                                  <div className="text-right text-sm text-muted-foreground">
                                    选项 {optionIndex + 1}
                                  </div>
                                  <div className="col-span-3 flex items-center gap-2">
                                    <Input
                                      value={option.text}
                                      onChange={(e) => {
                                        const newQuestions = [...checkinProfile.questionnaire.questions];
                                        const newOptions = [...(question.options || [])];
                                        newOptions[optionIndex] = {
                                          ...option,
                                          text: e.target.value,
                                        };
                                        newQuestions[index] = {
                                          ...question,
                                          options: newOptions,
                                        };
                                        setCheckinProfile({
                                          ...checkinProfile,
                                          questionnaire: {
                                            ...checkinProfile.questionnaire,
                                            questions: newQuestions,
                                          },
                                        });
                                      }}
                                      className="flex-1"
                                    />
                                    <Input
                                      type="number"
                                      value={option.score}
                                      onChange={(e) => {
                                        const newQuestions = [...checkinProfile.questionnaire.questions];
                                        const newOptions = [...(question.options || [])];
                                        newOptions[optionIndex] = {
                                          ...option,
                                          score: parseInt(e.target.value) || 0,
                                        };
                                        newQuestions[index] = {
                                          ...question,
                                          options: newOptions,
                                        };
                                        setCheckinProfile({
                                          ...checkinProfile,
                                          questionnaire: {
                                            ...checkinProfile.questionnaire,
                                            questions: newQuestions,
                                          },
                                        });
                                      }}
                                      className="w-20"
                                      placeholder="分数"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const newQuestions = [...checkinProfile.questionnaire.questions];
                                        const newOptions = [...(question.options || [])];
                                        newOptions.splice(optionIndex, 1);
                                        newQuestions[index] = {
                                          ...question,
                                          options: newOptions,
                                        };
                                        setCheckinProfile({
                                          ...checkinProfile,
                                          questionnaire: {
                                            ...checkinProfile.questionnaire,
                                            questions: newQuestions,
                                          },
                                        });
                                      }}
                                    >
                                      删除
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {question.type === "score" && (
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label className="text-right">最高分</Label>
                              <Input
                                type="number"
                                value={question.maxScore}
                                onChange={(e) => {
                                  const newQuestions = [...checkinProfile.questionnaire.questions];
                                  newQuestions[index] = {
                                    ...question,
                                    maxScore: parseInt(e.target.value) || 10,
                                  };
                                  setCheckinProfile({
                                    ...checkinProfile,
                                    questionnaire: {
                                      ...checkinProfile.questionnaire,
                                      questions: newQuestions,
                                    },
                                  });
                                }}
                                className="col-span-3"
                              />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>

                {/* 保存按钮区域 */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-end space-x-4">
                      <Button
                        variant="outline"
                        onClick={handleResetCheckinProfile}
                        disabled={loading}
                      >
                        重置
                      </Button>

                      <Button
                        onClick={handleSaveCheckinProfile}
                        disabled={loading}
                      >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        保存配置
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preview" className="mt-4">
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}