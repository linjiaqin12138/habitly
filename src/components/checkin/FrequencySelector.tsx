import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Frequency, FrequencyType } from "./types";

interface FrequencySelectorProps {
  frequency: Frequency;
  onChange: (frequency: Frequency) => void;
}

export function FrequencySelector({ frequency, onChange }: FrequencySelectorProps) {
  const handleTypeChange = (type: FrequencyType) => {
    onChange({
      type,
      weeklyDays: type === "weekly" ? [] : undefined,
      customDates: type === "custom" ? [] : undefined,
    });
  };

  const handleWeeklyDayChange = (day: number, checked: boolean) => {
    const weeklyDays = frequency.weeklyDays || [];
    onChange({
      ...frequency,
      weeklyDays: checked
        ? [...weeklyDays, day]
        : weeklyDays.filter((d) => d !== day),
    });
  };

  const handleCustomDatesChange = (dates: Date[] | undefined) => {
    onChange({
      ...frequency,
      customDates: dates ? dates.map(date => format(date, 'yyyy-MM-dd')) : [],
    });
  };

  const handleRemoveCustomDate = (dateToRemove: string) => {
    onChange({
      ...frequency,
      customDates: frequency.customDates?.filter(d => d !== dateToRemove),
    });
  };

  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="frequency" className="text-right">打卡频率</Label>
      <div className="col-span-3 space-y-4">
        <Select value={frequency.type} onValueChange={handleTypeChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">每日打卡</SelectItem>
            <SelectItem value="weekly">每周打卡</SelectItem>
            <SelectItem value="custom">自定义打卡</SelectItem>
          </SelectContent>
        </Select>

        {frequency.type === "weekly" && (
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                <div key={day} className="flex items-center space-x-2">
                  <Switch
                    checked={frequency.weeklyDays?.includes(day) || false}
                    onCheckedChange={(checked) => handleWeeklyDayChange(day, checked)}
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

        {frequency.type === "custom" && (
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
                      {frequency.customDates?.length
                        ? `已选择 ${frequency.customDates.length} 个日期`
                        : "选择打卡日期"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="multiple"
                      selected={frequency.customDates?.map(date => new Date(date))}
                      onSelect={handleCustomDatesChange}
                      locale={zhCN}
                      className="rounded-md border"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            {frequency.customDates && frequency.customDates.length > 0 && (
              <div className="grid grid-cols-4 gap-4">
                <div className="text-right text-sm text-muted-foreground">已选日期：</div>
                <div className="col-span-3 flex flex-wrap gap-2">
                  {frequency.customDates.sort().map((date) => (
                    <Badge key={date} variant="secondary">
                      {format(new Date(date), 'yyyy-MM-dd')}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 ml-1 p-0"
                        onClick={() => handleRemoveCustomDate(date)}
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
  );
}