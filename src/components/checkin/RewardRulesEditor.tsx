import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RewardRule } from "./types";

interface RewardRulesEditorProps {
  rewardRules: RewardRule[];
  onChange: (rules: RewardRule[]) => void;
}

export function RewardRulesEditor({ rewardRules, onChange }: RewardRulesEditorProps) {
  const handleRuleChange = (index: number, field: keyof RewardRule, value: number) => {
    const newRules = [...rewardRules];
    newRules[index] = {
      ...newRules[index],
      [field]: value,
    };
    onChange(newRules);
  };

  const handleRemoveRule = (index: number) => {
    const newRules = [...rewardRules];
    newRules.splice(index, 1);
    onChange(newRules);
  };

  const handleAddRule = () => {
    const newId = `reward${Date.now()}`;
    onChange([
      ...rewardRules,
      { id: newId, threshold: 80, amount: 5 },
    ]);
  };

  return (
    <div className="grid grid-cols-4 items-start gap-4">
      <Label className="text-right mt-2">奖励规则</Label>
      <div className="col-span-3 space-y-4">
        {rewardRules.map((rule, index) => (
          <div key={rule.id} className="flex items-center gap-4">
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Label className="w-full">分数阈值</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={rule.threshold}
                  onChange={(e) => handleRuleChange(index, 'threshold', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-full">奖励金额</Label>
                <Input
                  type="number"
                  min={0}
                  value={rule.amount}
                  onChange={(e) => handleRuleChange(index, 'amount', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveRule(index)}
            >
              删除
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddRule}
        >
          添加奖励规则
        </Button>
      </div>
    </div>
  );
}