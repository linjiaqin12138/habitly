import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Question } from "@/types/questionnaire";

interface QuestionEditorProps {
  questions: Question[];
  onChange: (questions: Question[]) => void;
}

export function QuestionEditor({ questions, onChange }: QuestionEditorProps) {
  const handleQuestionChange = (index: number, field: keyof Question, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = {
      ...newQuestions[index],
      [field]: value,
    };
    onChange(newQuestions);
  };

  const handleQuestionTypeChange = (index: number, type: Question['type']) => {
    const newQuestions = [...questions];
    newQuestions[index] = {
      ...newQuestions[index],
      type,
      options: type === "single" || type === "multiple"
        ? [{ id: "o1", text: "选项1", score: 0 }]
        : undefined,
    };
    onChange(newQuestions);
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, field: 'text' | 'score', value: any) => {
    const newQuestions = [...questions];
    const newOptions = [...(newQuestions[questionIndex].options || [])];
    newOptions[optionIndex] = {
      ...newOptions[optionIndex],
      [field]: field === 'score' ? (parseInt(value) || 0) : value,
    };
    newQuestions[questionIndex] = {
      ...newQuestions[questionIndex],
      options: newOptions,
    };
    onChange(newQuestions);
  };

  const handleAddOption = (questionIndex: number) => {
    const question = questions[questionIndex];
    const newOption = {
      id: `o${(question.options?.length || 0) + 1}`,
      text: `选项${(question.options?.length || 0) + 1}`,
      score: 0,
    };
    const newQuestions = [...questions];
    newQuestions[questionIndex] = {
      ...question,
      options: [...(question.options || []), newOption],
    };
    onChange(newQuestions);
  };

  const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...questions];
    const newOptions = [...(newQuestions[questionIndex].options || [])];
    newOptions.splice(optionIndex, 1);
    newQuestions[questionIndex] = {
      ...newQuestions[questionIndex],
      options: newOptions,
    };
    onChange(newQuestions);
  };

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: `q${questions.length + 1}`,
      type: "single",
      title: "新问题",
      required: true,
      options: [
        { id: "o1", text: "选项1", score: 0 },
      ],
    };
    onChange([...questions, newQuestion]);
  };

  const handleRemoveQuestion = (index: number) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    onChange(newQuestions);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>问题列表</CardTitle>
        <Button onClick={handleAddQuestion} size="sm">
          添加问题
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {questions.map((question, index) => (
          <Card key={question.id}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">问题 {index + 1}: {question.title}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveQuestion(index)}
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
                  onValueChange={(value: Question['type']) => handleQuestionTypeChange(index, value)}
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
                  onChange={(e) => handleQuestionChange(index, 'title', e.target.value)}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">必答</Label>
                <div className="col-span-3">
                  <Switch
                    checked={question.required}
                    onCheckedChange={(checked) => handleQuestionChange(index, 'required', checked)}
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
                      onClick={() => handleAddOption(index)}
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
                          onChange={(e) => handleOptionChange(index, optionIndex, 'text', e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          value={option.score}
                          onChange={(e) => handleOptionChange(index, optionIndex, 'score', e.target.value)}
                          className="w-20"
                          placeholder="分数"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveOption(index, optionIndex)}
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
                    onChange={(e) => handleQuestionChange(index, 'maxScore', parseInt(e.target.value) || 10)}
                    className="col-span-3"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}