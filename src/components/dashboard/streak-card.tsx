import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, Trophy, CalendarCheck2, Award } from "lucide-react";

interface StreakCardProps {
  streakDays: number;
  bestStreak?: number;
}

export function StreakCard({ streakDays = 12, bestStreak = 21 }: StreakCardProps) {
  return (
    <Card className="border-border/50 bg-card/80 transition duration-200 hover:border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Flame className="h-4 w-4 text-amber-500 fill-amber-500" />
            Learning Streak
          </CardTitle>
          <span className="text-xs text-amber-500 font-medium inline-flex items-center gap-1">
            <Trophy className="h-3 w-3" />
            Best: {bestStreak} Days
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-foreground">{streakDays}</span>
          <span className="text-xs font-medium text-muted-foreground">Days Active Streak</span>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-muted/40 p-2.5 text-xs">
          <CalendarCheck2 className="h-4 w-4 text-emerald-500 shrink-0" />
          <span className="text-muted-foreground">
            Streak active today! Keep learning tomorrow to hit{" "}
            <strong className="text-foreground">{streakDays + 1} days</strong>.
          </span>
        </div>

        {/* Milestone Badges */}
        <div className="space-y-2 pt-1">
          <span className="text-xs font-medium text-muted-foreground block">Milestones</span>
          <div className="flex gap-2 text-xs">
            <Badge
              variant="secondary"
              className="gap-1 text-xs font-medium bg-emerald-500/10 text-emerald-400 border-0"
            >
              <Award className="h-3 w-3" /> 7 Days
            </Badge>
            <Badge
              variant="outline"
              className={`gap-1 text-xs font-medium border-border/60 ${
                streakDays >= 14
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "text-muted-foreground opacity-60"
              }`}
            >
              <Award className="h-3 w-3" /> 14 Days
            </Badge>
            <Badge
              variant="outline"
              className={`gap-1 text-xs font-medium border-border/60 ${
                streakDays >= 30
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "text-muted-foreground opacity-60"
              }`}
            >
              <Award className="h-3 w-3" /> 30 Days
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
