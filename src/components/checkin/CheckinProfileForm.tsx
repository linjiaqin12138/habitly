import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CheckinProfileFormProps } from "./types";
import { FrequencySelector } from "./FrequencySelector";
import { RewardRulesEditor } from "./RewardRulesEditor";
import { QuestionEditor } from "./QuestionEditor";
import { CheckinProfilePreview } from "./CheckinProfilePreview";

export function CheckinProfileForm({
  checkinProfile,
  onProfileChange,
  loading = false,
  error,
  onSave,
  onReset,
  onDelete,
  isEditMode = false,
}: CheckinProfileFormProps) {
  const [enableReminder, setEnableReminder] = React.useState(
    Boolean(checkinProfile.reminderTime)
  );

  const handleBasicInfoChange = (field: keyof typeof checkinProfile, value?: string | number | object) => {
    onProfileChange({
      ...checkinProfile,
      [field]: value,
    });
  };

  const handleReminderToggle = (checked: boolean) => {
    setEnableReminder(checked);
    if (!checked) {
      handleBasicInfoChange('reminderTime');
    } else {
      handleBasicInfoChange('reminderTime', '21:00');
    }
  };

  return (
    <>
      {error && (
        <div className="text-red-500 text-sm mb-4">{error}</div>
      )}
      
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
                  onChange={(e) => handleBasicInfoChange('title', e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">打卡描述</Label>
                <Textarea
                  id="description"
                  value={checkinProfile.description}
                  onChange={(e) => handleBasicInfoChange('description', e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">提醒设置</Label>
                <div className="col-span-3 flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="enableReminder"
                      checked={enableReminder}
                      onCheckedChange={handleReminderToggle}
                    />
                    <Label htmlFor="enableReminder" className="whitespace-nowrap">启用提醒</Label>
                  </div>
                  
                  {enableReminder && (
                    <Input
                      type="time"
                      value={checkinProfile.reminderTime || ''}
                      onChange={(e) => handleBasicInfoChange('reminderTime', e.target.value)}
                      placeholder="请选择提醒时间"
                      className="w-fit min-w-0"
                    />
                  )}
                </div>
              </div>
              
              <FrequencySelector
                frequency={checkinProfile.frequency}
                onChange={(frequency) => handleBasicInfoChange('frequency', frequency)}
              />

              <RewardRulesEditor
                rewardRules={checkinProfile.rewardRules}
                onChange={(rewardRules) => handleBasicInfoChange('rewardRules', rewardRules)}
              />
            </CardContent>
          </Card>

          <QuestionEditor
            questions={checkinProfile.questionnaire.questions}
            onChange={(questions) => handleBasicInfoChange('questionnaire', {
              ...checkinProfile.questionnaire,
              questions,
            })}
          />

          {/* 保存按钮区域 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-end space-x-4">
                {isEditMode && onDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        删除打卡配置
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>
                          您确定要删除此打卡配置吗？此操作不可逆转。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={onDelete}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          确认删除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                
                {onReset && (
                  <Button
                    variant="outline"
                    onClick={onReset}
                    disabled={loading}
                  >
                    重置
                  </Button>
                )}

                <Button
                  onClick={onSave}
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
          <CheckinProfilePreview checkinProfile={checkinProfile} />
        </TabsContent>
      </Tabs>
    </>
  );
}