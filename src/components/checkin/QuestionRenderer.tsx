import React from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Question } from "@/types/questionnaire";

interface QuestionRendererProps {
  question: Question;
  index: number;
  answer: string | string[] | number | undefined;
  onAnswerChange: (questionId: string, value: string | string[] | number) => void;
  isPreview?: boolean;
  showScores?: boolean;
}

export function QuestionRenderer({
  question,
  index,
  answer,
  onAnswerChange,
  isPreview = false,
  showScores = false
}: QuestionRendererProps) {
  const renderQuestionContent = () => {
    switch (question.type) {
      case 'single':
        if (isPreview) {
          return (
            <div className="space-y-2">
              {question.options?.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name={question.id}
                    value={option.id}
                    checked={answer === option.id}
                    onChange={(e) => onAnswerChange(question.id, e.target.value)}
                    className="text-primary"
                  />
                  <span>{option.text}</span>
                  {showScores && (
                    <span className="text-sm text-muted-foreground ml-auto">{option.score}分</span>
                  )}
                </div>
              ))}
            </div>
          );
        }
        
        return (
          <RadioGroup
            value={(answer as string) || ""}
            onValueChange={(value) => onAnswerChange(question.id, value)}
          >
            {question.options?.map((option) => (
              <div key={option.id} className="flex items-center space-x-2 justify-between">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={option.id} id={`${question.id}-${option.id}`} />
                  <Label htmlFor={`${question.id}-${option.id}`}>{option.text}</Label>
                </div>
                {showScores && (
                  <span className="text-sm text-muted-foreground">{option.score}分</span>
                )}
              </div>
            ))}
          </RadioGroup>
        );

      case 'multiple':
        if (isPreview) {
          return (
            <div className="space-y-2">
              {question.options?.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    value={option.id}
                    checked={Array.isArray(answer) && answer.includes(option.id)}
                    onChange={(e) => {
                      const current = Array.isArray(answer) ? answer : [];
                      const value = e.target.value;
                      onAnswerChange(
                        question.id,
                        current.includes(value)
                          ? current.filter((v: string) => v !== value)
                          : [...current, value]
                      );
                    }}
                    className="text-primary"
                  />
                  <span>{option.text}</span>
                  {showScores && (
                    <span className="text-sm text-muted-foreground ml-auto">{option.score}分</span>
                  )}
                </div>
              ))}
            </div>
          );
        }

        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <div key={option.id} className="flex items-center space-x-2 justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`${question.id}-${option.id}`}
                    checked={Array.isArray(answer) && answer.includes(option.id)}
                    onCheckedChange={(checked: boolean) => {
                      const currentAnswers = Array.isArray(answer) ? answer : [];
                      if (checked) {
                        onAnswerChange(question.id, [...currentAnswers, option.id]);
                      } else {
                        onAnswerChange(question.id, currentAnswers.filter(id => id !== option.id));
                      }
                    }}
                  />
                  <Label htmlFor={`${question.id}-${option.id}`}>{option.text}</Label>
                </div>
                {showScores && (
                  <span className="text-sm text-muted-foreground">{option.score}分</span>
                )}
              </div>
            ))}
          </div>
        );

      case 'text':
        return (
          <Textarea
            value={(answer as string) || ""}
            onChange={(e) => onAnswerChange(question.id, e.target.value)}
            placeholder={isPreview ? "请输入..." : "请输入您的答案..."}
            className={isPreview ? "" : "min-h-[100px]"}
          />
        );

      case 'score':
        if (isPreview) {
          return (
            <div className="space-y-2">
              <Slider
                value={[Number(answer) || 0]}
                onValueChange={(value) => onAnswerChange(question.id, value[0])}
                max={question.maxScore || 10}
                step={1}
                className="w-full"
              />
              <div className="text-sm text-muted-foreground text-right">
                {Number(answer) || 0} / {question.maxScore || 10}
              </div>
            </div>
          );
        }

        return (
          <div className="flex items-center space-x-4">
            <Input
              type="number"
              min={0}
              max={question.maxScore || 10}
              value={(answer as number) || ""}
              onChange={(e) => onAnswerChange(question.id, parseInt(e.target.value) || 0)}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">
              / {question.maxScore || 10}分
            </span>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start space-x-2">
        <span className="text-sm font-medium text-muted-foreground min-w-[24px]">
          {index + 1}.
        </span>
        <div className="flex-1">
          <h3 className="font-medium mb-3">
            {question.title}
            {question.required && <span className="text-red-500 ml-1">*</span>}
          </h3>
          {renderQuestionContent()}
        </div>
      </div>
    </div>
  );
}