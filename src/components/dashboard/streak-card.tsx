import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, Trophy, CalendarCheck2, Award } from "lucide-react";

interface StreakCardProps {
  streakDays: number;
  bestStreak?: number;
}

export function StreakCard({ streakDays = 12, bestStreak = 21 }: StreakCardProps) {
  return (
    <Card className="border-border/60 shadow-sm relative overflow-hidden transition duration-200 hover:border-primary/40">
      <div className="absolute top-0 right-0 -mt-6 -mr-6 h-28 w-28 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Flame className="h-4 w-4 text-amber-500 fill-amber-500" />
            Learning Streak
          </CardTitle>
          <Badge variant="outline" className="text-[10px] gap-1 border-amber-500/30 text-amber-500">
            <Trophy className="h-3 w-3" />
            Record: {bestStreak} Days
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-extrabold tracking-tight text-foreground">
            {streakDays}
          </span>
          <span className="text-sm font-medium text-muted-foreground">Days Active Streak</span>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 p-2.5 text-xs">
          <CalendarCheck2 className="h-4 w-4 text-emerald-500 shrink-0" />
          <span className="text-muted-foreground">
            Streak active today! Keep learning tomorrow to hit{" "}
            <strong className="text-foreground">{streakDays + 1} days</strong>.
          </span>
        </div>

        {/* Milestone Badges */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium block">
            Milestones
          </span>
          <div className="flex gap-2 text-xs">
            <Badge
              variant="secondary"
              className="gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            >
              <Award className="h-3 w-3" /> 7 Days
            </Badge>
            <Badge
              variant="outline"
              className={`gap-1 text-[10px] ${
                streakDays >= 14
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "opacity-60"
              }`}
            >
              <Award className="h-3 w-3" /> 14 Days
            </Badge>
            <Badge
              variant="outline"
              className={`gap-1 text-[10px] ${
                streakDays >= 30
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "opacity-60"
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
