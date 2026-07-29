import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="border-border/60 shadow-sm transition duration-200 hover:border-primary/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Daily Goal Target
          </CardTitle>
          <span className="text-xs font-semibold text-primary">
            {currentMinutes} / {dailyTargetMinutes} mins
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Today's Progress</span>
            <span className="font-medium text-foreground">{percent}%</span>
          </div>
          <Progress value={percent} className="h-2.5" />
        </div>

        {isGoalMet ? (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>Daily goal completed! You earned +50 XP today.</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>{dailyTargetMinutes - currentMinutes} more minutes to hit your daily goal</span>
          </div>
        )}

        <Button
          onClick={handleLogStudy}
          variant="outline"
          size="sm"
          className="w-full gap-1.5 text-xs bg-background/60"
        >
          <Zap className="h-3.5 w-3.5 text-amber-500" />
          Log +15 Min Practice Session
        </Button>
      </CardContent>
    </Card>
  );
}
