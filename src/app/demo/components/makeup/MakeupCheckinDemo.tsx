"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export function MakeupCheckinDemo() {
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
    // 在实际应用中，这里会提交到服务器
    alert("补救打卡已提交！");
  };

  return (
    <Card className="w-full max-w-[800px]">
      <CardHeader>
        <CardTitle>补救打卡</CardTitle>
        <p className="text-sm text-muted-foreground">
          2025年5月4日 - 你错过了昨天的打卡
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>
              请解释昨天为什么没有按时打卡（至少{minLength}字）：
            </Label>
            <div className="space-y-4">
              <textarea
                value={text}
                onChange={handleInput}
                onPaste={handlePaste}
                className="w-full min-h-[200px] p-4 rounded-md border resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入原因..."
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
            >
              清空
            </Button>
            <Button
              disabled={getWordCount() < minLength || isTooFast}
              onClick={handleSubmit}
            >
              提交补救
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );