"use client";

import { useState } from "react";
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
import { CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type FrequencyType = "daily" | "weekly" | "custom";

interface Frequency {
  type: FrequencyType;
  weeklyDays?: number[]; // 0-6，表示周日到周六
  customDates?: string[]; // ISO 格式的日期字符串数组
}

type QuestionType = "single" | "multiple" | "text" | "score";

interface Option {
  id: string;
  text: string;
  score: number;
}

interface Question {
  id: string;
  type: QuestionType;
  title: string;
  required: boolean;
  options?: Option[];
  maxScore?: number;
}

interface CashbackRule {
  threshold: number;  // 分数阈值
  amount: number;     // 返现金额
}

interface Questionnaire {
  title: string;
  description: string;
  questions: Question[];
  totalScore: number;
  deadline: string;
  frequency: Frequency;
  cashbackRules: CashbackRule[];  // 新增返现规则数组
}

const defaultQuestionnaire: Questionnaire = {
  title: "每日习惯打卡问卷",
  description: "记录你的每日习惯完成情况",
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
  totalScore: 100,
  deadline: "22:00",
  frequency: {
    type: "daily",
    weeklyDays: [],
    customDates: [],
  },
  cashbackRules: [
    {
      threshold: 80,
      amount: 5,
    },
    {
      threshold: 90,
      amount: 10,
    }
  ],
};

export function QuestionnaireDemo() {
  const [questionnaire, setQuestionnaire] = useState<Questionnaire>(defaultQuestionnaire);
  const [currentAnswer, setCurrentAnswer] = useState<Record<string, any>>({});

  const handleAnswerChange = (questionId: string, value: any) => {
    setCurrentAnswer((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  return (
    <div className="w-full max-w-[1200px] space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>问卷管理</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="edit" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit">编辑问卷</TabsTrigger>
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
                    <Label htmlFor="title" className="text-right">标题</Label>
                    <Input
                      id="title"
                      value={questionnaire.title}
                      onChange={(e) => setQuestionnaire({
                        ...questionnaire,
                        title: e.target.value,
                      })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">描述</Label>
                    <Textarea
                      id="description"
                      value={questionnaire.description}
                      onChange={(e) => setQuestionnaire({
                        ...questionnaire,
                        description: e.target.value,
                      })}
                      className="col-span-3"
                    />
                  </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="reminderTime" className="text-right">提醒打卡时间</Label>
                    <Input
                      id="reminderTime"
                      type="time"
                      value={questionnaire.deadline}
                      onChange={(e) => setQuestionnaire({
                      ...questionnaire,
                      deadline: e.target.value,
                      })}
                      className="col-span-3"
                    />
                    </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="frequency" className="text-right">打卡频率</Label>
                    <div className="col-span-3 space-y-4">
                      <Select
                        value={questionnaire.frequency.type}
                        onValueChange={(value: FrequencyType) => {
                          setQuestionnaire({
                            ...questionnaire,
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

                      {questionnaire.frequency.type === "weekly" && (
                        <div className="space-y-2">
                          <div className="grid grid-cols-4 gap-2">
                            {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                              <div key={day} className="flex items-center space-x-2">
                                <Switch
                                  checked={questionnaire.frequency.weeklyDays?.includes(day) || false}
                                  onCheckedChange={(checked) => {
                                    setQuestionnaire({
                                      ...questionnaire,
                                      frequency: {
                                        ...questionnaire.frequency,
                                        weeklyDays: checked
                                          ? [...(questionnaire.frequency.weeklyDays || []), day]
                                          : (questionnaire.frequency.weeklyDays || []).filter((d) => d !== day),
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

                      {questionnaire.frequency.type === "custom" && (
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
                                    {questionnaire.frequency.customDates?.length 
                                      ? `已选择 ${questionnaire.frequency.customDates.length} 个日期`
                                      : "选择打卡日期"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="multiple"
                                    selected={questionnaire.frequency.customDates?.map(date => new Date(date))}
                                    onSelect={(dates) => {
                                      setQuestionnaire({
                                        ...questionnaire,
                                        frequency: {
                                          ...questionnaire.frequency,
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
                          {questionnaire.frequency.customDates && questionnaire.frequency.customDates.length > 0 && (
                            <div className="grid grid-cols-4 gap-4">
                              <div className="text-right text-sm text-muted-foreground">已选日期：</div>
                              <div className="col-span-3 flex flex-wrap gap-2">
                                {questionnaire.frequency.customDates.sort().map((date) => (
                                  <Badge key={date} variant="secondary">
                                    {format(new Date(date), 'yyyy-MM-dd')}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-4 w-4 ml-1 p-0"
                                      onClick={() => {
                                        setQuestionnaire({
                                          ...questionnaire,
                                          frequency: {
                                            ...questionnaire.frequency,
                                            customDates: questionnaire.frequency.customDates?.filter(d => d !== date),
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

                  {/* 返现规则设置 */}
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right mt-2">返现规则</Label>
                    <div className="col-span-3 space-y-4">
                      {questionnaire.cashbackRules.map((rule, index) => (
                        <div key={index} className="flex items-center gap-4">
                          <div className="flex-1 grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                              <Label>分数阈值</Label>
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                value={rule.threshold}
                                onChange={(e) => {
                                  const newRules = [...questionnaire.cashbackRules];
                                  newRules[index] = {
                                    ...rule,
                                    threshold: parseInt(e.target.value) || 0,
                                  };
                                  setQuestionnaire({
                                    ...questionnaire,
                                    cashbackRules: newRules,
                                  });
                                }}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Label>返现金额</Label>
                              <Input
                                type="number"
                                min={0}
                                value={rule.amount}
                                onChange={(e) => {
                                  const newRules = [...questionnaire.cashbackRules];
                                  newRules[index] = {
                                    ...rule,
                                    amount: parseInt(e.target.value) || 0,
                                  };
                                  setQuestionnaire({
                                    ...questionnaire,
                                    cashbackRules: newRules,
                                  });
                                }}
                              />
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newRules = [...questionnaire.cashbackRules];
                              newRules.splice(index, 1);
                              setQuestionnaire({
                                ...questionnaire,
                                cashbackRules: newRules,
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
                          setQuestionnaire({
                            ...questionnaire,
                            cashbackRules: [
                              ...questionnaire.cashbackRules,
                              { threshold: 80, amount: 5 },
                            ],
                          });
                        }}
                      >
                        添加返现规则
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
                        id: `q${questionnaire.questions.length + 1}`,
                        type: "single",
                        title: "新问题",
                        required: true,
                        options: [
                          { id: "o1", text: "选项1", score: 0 },
                        ],
                      };
                      setQuestionnaire({
                        ...questionnaire,
                        questions: [...questionnaire.questions, newQuestion],
                      });
                    }}
                    size="sm"
                  >
                    添加问题
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {questionnaire.questions.map((question, index) => (
                    <Card key={question.id}>
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">问题 {index + 1}</CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newQuestions = [...questionnaire.questions];
                              newQuestions.splice(index, 1);
                              setQuestionnaire({
                                ...questionnaire,
                                questions: newQuestions,
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
                            onValueChange={(value: QuestionType) => {
                              const newQuestions = [...questionnaire.questions];
                              newQuestions[index] = {
                                ...question,
                                type: value,
                                options: value === "single" || value === "multiple" 
                                  ? [{ id: "o1", text: "选项1", score: 0 }]
                                  : undefined,
                              };
                              setQuestionnaire({
                                ...questionnaire,
                                questions: newQuestions,
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
                              const newQuestions = [...questionnaire.questions];
                              newQuestions[index] = {
                                ...question,
                                title: e.target.value,
                              };
                              setQuestionnaire({
                                ...questionnaire,
                                questions: newQuestions,
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
                                const newQuestions = [...questionnaire.questions];
                                newQuestions[index] = {
                                  ...question,
                                  required: checked,
                                };
                                setQuestionnaire({
                                  ...questionnaire,
                                  questions: newQuestions,
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
                                  const newQuestions = [...questionnaire.questions];
                                  const newOption = {
                                    id: `o${(question.options?.length || 0) + 1}`,
                                    text: `选项${(question.options?.length || 0) + 1}`,
                                    score: 0,
                                  };
                                  newQuestions[index] = {
                                    ...question,
                                    options: [...(question.options || []), newOption],
                                  };
                                  setQuestionnaire({
                                    ...questionnaire,
                                    questions: newQuestions,
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
                                      const newQuestions = [...questionnaire.questions];
                                      const newOptions = [...(question.options || [])];
                                      newOptions[optionIndex] = {
                                        ...option,
                                        text: e.target.value,
                                      };
                                      newQuestions[index] = {
                                        ...question,
                                        options: newOptions,
                                      };
                                      setQuestionnaire({
                                        ...questionnaire,
                                        questions: newQuestions,
                                      });
                                    }}
                                    className="flex-1"
                                  />
                                  <Input
                                    type="number"
                                    value={option.score}
                                    onChange={(e) => {
                                      const newQuestions = [...questionnaire.questions];
                                      const newOptions = [...(question.options || [])];
                                      newOptions[optionIndex] = {
                                        ...option,
                                        score: parseInt(e.target.value) || 0,
                                      };
                                      newQuestions[index] = {
                                        ...question,
                                        options: newOptions,
                                      };
                                      setQuestionnaire({
                                        ...questionnaire,
                                        questions: newQuestions,
                                      });
                                    }}
                                    className="w-20"
                                    placeholder="分数"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const newQuestions = [...questionnaire.questions];
                                      const newOptions = [...(question.options || [])];
                                      newOptions.splice(optionIndex, 1);
                                      newQuestions[index] = {
                                        ...question,
                                        options: newOptions,
                                      };
                                      setQuestionnaire({
                                        ...questionnaire,
                                        questions: newQuestions,
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
                                const newQuestions = [...questionnaire.questions];
                                newQuestions[index] = {
                                  ...question,
                                  maxScore: parseInt(e.target.value) || 10,
                                };
                                setQuestionnaire({
                                  ...questionnaire,
                                  questions: newQuestions,
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
            </TabsContent>

            <TabsContent value="preview" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>{questionnaire.title}</CardTitle>
                  <CardDescription>
                    {questionnaire.description}
                    <div className="mt-1">
                      截止时间：{questionnaire.deadline}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {questionnaire.questions.map((question, index) => (
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
                    <Button>提交答案</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}