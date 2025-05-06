"use client";

import { useState } from "react";
import { Model } from "survey-core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import dynamic from 'next/dynamic';

// 导入 Survey.js 默认样式
import "survey-core/survey-core.min.css";
import "survey-creator-core/survey-creator-core.min.css";

// Dynamically import Survey and SurveyCreator components
const Survey = dynamic(() => import('survey-react-ui').then(mod => mod.Survey),
  { ssr: false, loading: () => <p>加载问卷预览...</p> }
);
const SurveyCreator = dynamic(() => import('survey-creator-react').then(mod => mod.SurveyCreator),
  { ssr: false, loading: () => <p>加载问卷编辑器...</p> }
);

// 情绪记录问卷模板
const emoQuestionnaireJson = {
  title: "每日情绪记录",
  description: "记录你的心情变化和情绪状态",
  locale: "zh-cn",
  completedHtml: "<h3>记录完成！</h3><h5>愿你每一天都能感受生活的美好</h5>",
  pages: [
    {
      name: "page1",
      elements: [
        {
          type: "rating",
          name: "mood_level",
          title: "今天的整体心情如何？",
          isRequired: true,
          rateMax: 5,
          minRateDescription: "很低落",
          maxRateDescription: "很开心",
          rateValues: [1, 2, 3, 4, 5]
        },
        {
          type: "checkbox",
          name: "emotions",
          title: "今天经历了哪些情绪？（可多选）",
          isRequired: true,
          choices: [
            { value: "joy", text: "快乐" },
            { value: "anger", text: "愤怒" },
            { value: "sadness", text: "悲伤" },
            { value: "anxiety", text: "焦虑" },
            { value: "peace", text: "平静" },
            { value: "excitement", text: "兴奋" },
            { value: "gratitude", text: "感恩" }
          ]
        },
        {
          type: "radiogroup",
          name: "energy_level",
          title: "今天的精力状态如何？",
          isRequired: true,
          choices: [
            { value: "very_high", text: "充沛" },
            { value: "high", text: "良好" },
            { value: "medium", text: "一般" },
            { value: "low", text: "疲惫" },
            { value: "very_low", text: "耗竭" }
          ]
        },
        {
          type: "text",
          name: "trigger_events",
          title: "有什么特殊的事件触发了这些情绪吗？",
          placeholder: "可以简单描述下..."
        },
        {
          type: "comment",
          name: "self_reflection",
          title: "对今天的情绪有什么样的思考？",
          placeholder: "记录一下你的感受和想法..."
        }
      ]
    }
  ],
  showQuestionNumbers: false,
  showProgressBar: "bottom",
  progressBarType: "buttons"
};

export function QuestionnaireEmoDemo() {
  const [activeTab, setActiveTab] = useState("preview");
  const [surveyJson, setSurveyJson] = useState(emoQuestionnaireJson);

  // 处理问卷完成
  const alertResults = (sender: any) => {
    const results = sender.data;
    console.log("情绪记录结果:", results);
  };

  // 创建问卷编辑器选项
  const creatorOptions = {
    showLogicTab: true,
    isAutoSave: true,
  };

  // 更新预览问卷模型
  const previewSurvey = new Model(surveyJson);
  previewSurvey.locale = "zh-cn";

  return (
    <div className="w-full max-w-[1200px] mx-auto space-y-6">
      <Card className="bg-white/50 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">每日情绪记录问卷管理</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preview">预览问卷</TabsTrigger>
              <TabsTrigger value="edit">编辑问卷</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {/* Render dynamically imported Survey */}
                  <Survey
                    model={previewSurvey}
                    onComplete={alertResults}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="edit" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="h-[800px]">
                    {/* Render dynamically imported SurveyCreator */}
                    <SurveyCreator
                      json={surveyJson}
                      options={creatorOptions}
                      onSurveyCreated={(creator) => {
                        creator.locale = "zh-cn";
                      }}
                      onSave={(saveNo, callback) => {
                        setSurveyJson(saveNo);
                        callback(saveNo, true);
                      }}
                    />
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