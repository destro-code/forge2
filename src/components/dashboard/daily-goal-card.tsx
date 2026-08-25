import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target, CheckCircle2, Zap, Clock } from "lucide-react";
import { useState } from "react";

interface DailyGoalCardProps {
  todayMinutes?: number;
  dailyTargetMinutes?: number;
  onAddMinutes?: (mins: number) => void;
}

export function DailyGoalCard({
  todayMinutes = 25,
  dailyTargetMinutes = 30,
  onAddMinutes,
}: DailyGoalCardProps) {
  const [currentMinutes, setCurrentMinutes] = useState(todayMinutes);
  const percent = Math.min(100, Math.round((currentMinutes / dailyTargetMinutes) * 100));
  const isGoalMet = currentMinutes >= dailyTargetMinutes;

  const handleLogStudy = () => {
    const updated = currentMinutes + 15;
    setCurrentMinutes(updated);
    onAddMinutes?.(15);
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <Target className="h-4 w-4" />
          Daily Goal
        </div>
        <span className="text-xs font-bold font-mono text-primary">
          {currentMinutes} / {dailyTargetMinutes} m
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground font-medium">Daily Target</span>
          <span className="font-semibold text-foreground">{percent}%</span>
        </div>
        <Progress value={percent} className="h-1.5" />
      </div>

      {isGoalMet ? (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-500 border border-emerald-500/20">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
          <span>Daily goal met! Keep going for extra momentum.</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>{dailyTargetMinutes - currentMinutes} more minutes to hit your goal</span>
        </div>
      )}

      <Button
        onClick={handleLogStudy}
        variant="outline"
        size="sm"
        className="w-full gap-1.5 text-xs border-border/60 h-8 font-medium"
      >
        <Zap className="h-3.5 w-3.5 text-primary" />
        Log +15 Min Practice
      </Button>
    </div>
  );
}
