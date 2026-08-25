import { Flame, Clock, CheckCircle2, Trophy } from "lucide-react";

interface CompactProgressSummaryProps {
  streakDays: number;
  bestStreakDays?: number;
  totalHours: string;
  completedLessonsCount: number;
  totalLessonsCount: number;
  unlockedAchievementsCount: number;
  totalAchievementsCount: number;
}

export function CompactProgressSummary({
  streakDays,
  bestStreakDays,
  totalHours,
  completedLessonsCount,
  totalLessonsCount,
  unlockedAchievementsCount,
  totalAchievementsCount,
}: CompactProgressSummaryProps) {
  const completionPct = Math.round((completedLessonsCount / (totalLessonsCount || 1)) * 100);

  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-4 sm:p-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-0 md:divide-x md:divide-border/40">
        {/* Streak */}
        <div className="flex items-center gap-3 md:px-4 first:md:pl-0">
          <div className="h-9 w-9 rounded-lg bg-primary/10 grid place-items-center text-primary shrink-0">
            <Flame className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Streak
            </div>
            <div className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-baseline gap-1.5">
              <span>{streakDays} days</span>
              {bestStreakDays && bestStreakDays > streakDays && (
                <span className="text-[10px] text-muted-foreground font-normal">
                  (Best {bestStreakDays}d)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Completed Lessons */}
        <div className="flex items-center gap-3 md:px-4">
          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 grid place-items-center text-emerald-500 shrink-0">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Completed
            </div>
            <div className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-baseline gap-1.5">
              <span>{completedLessonsCount}</span>
              <span className="text-[11px] font-normal text-muted-foreground">
                / {totalLessonsCount} ({completionPct}%)
              </span>
            </div>
          </div>
        </div>

        {/* Study Time */}
        <div className="flex items-center gap-3 md:px-4">
          <div className="h-9 w-9 rounded-lg bg-muted grid place-items-center text-muted-foreground shrink-0">
            <Clock className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Study Time
            </div>
            <div className="text-base sm:text-lg font-bold tracking-tight text-foreground font-mono">
              {totalHours}h
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="flex items-center gap-3 md:px-4 last:md:pr-0">
          <div className="h-9 w-9 rounded-lg bg-amber-500/10 grid place-items-center text-amber-500 shrink-0">
            <Trophy className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Achievements
            </div>
            <div className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-baseline gap-1.5">
              <span>{unlockedAchievementsCount}</span>
              <span className="text-[11px] font-normal text-muted-foreground">
                / {totalAchievementsCount}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
