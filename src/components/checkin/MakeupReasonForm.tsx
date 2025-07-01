import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface MakeupReasonFormProps {
  date: string;
  onSubmit: (reason: string) => void;
  disabled?: boolean;
}

export default function MakeupReasonForm({ date, onSubmit, disabled = false }: MakeupReasonFormProps) {
  const [text, setText] = useState("");
  const [lastInputTime, setLastInputTime] = useState<number>(0);
  const [isTooFast, setIsTooFast] = useState(false);
  const minLength = 50; // 最小字数要求
  const typingSpeedThreshold = 50; // 毫秒，用于检测是否复制粘贴

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const currentTime = Date.now();
    const timeDiff = currentTime - lastInputTime;
    
    // 检测输入速度，如果太快可能是复制粘贴
    if (timeDiff < typingSpeedThreshold && e.target.value.length > text.length + 1) {
      setIsTooFast(true);
      e.target.value = text; // 恢复之前的文本
      return;
    }

    setLastInputTime(currentTime);
    setIsTooFast(false);
    setText(e.target.value);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    setIsTooFast(true);
  };

  const getWordCount = () => {
    return text.trim().length;
  };

  const handleSubmit = () => {
    if (getWordCount() >= minLength && !isTooFast) {
      onSubmit(text);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>补救打卡说明</CardTitle>
        <p className="text-sm text-muted-foreground">
          {new Date(date).toLocaleDateString('zh-CN')} - 请说明未能按时打卡的原因
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>
              请详细说明当天为什么没有按时打卡（至少{minLength}字）：
            </Label>
            <div className="space-y-4">
              <textarea
                value={text}
                onChange={handleInput}
                onPaste={handlePaste}
                disabled={disabled}
                className="w-full min-h-[200px] p-4 rounded-md border resize-none focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="请手动输入原因，例如：工作加班到很晚、突发事件处理、身体不适等..."
              />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>当前字数：{getWordCount()}</span>
                <span>要求字数：{minLength}</span>
              </div>
              {isTooFast && (
                <p className="text-sm text-red-500">
                  检测到异常输入！请手动输入文字，不要复制粘贴。
                </p>
              )}
              {text.length > 0 && text.length < minLength && (
                <p className="text-sm text-orange-500">
                  字数不足，请继续输入...
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setText("")}
              disabled={disabled}
            >
              清空
            </Button>
            <Button
              disabled={getWordCount() < minLength || isTooFast || disabled}
              onClick={handleSubmit}
            >
              确认原因，继续打卡
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}