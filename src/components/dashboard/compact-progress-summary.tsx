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
  const isBeginner = completedLessonsCount === 0 && streakDays === 0;
  const completionPct = Math.round((completedLessonsCount / (totalLessonsCount || 1)) * 100);

  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Studio Progress
        </h3>
        <span className="text-[11px] font-mono text-muted-foreground">
          {completedLessonsCount} / {totalLessonsCount} Lessons
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        {/* Streak */}
        <div className="flex items-start gap-2.5 p-2 rounded-lg bg-background/40 border border-border/30">
          <div className="h-7 w-7 rounded-md bg-primary/10 grid place-items-center text-primary shrink-0 mt-0.5">
            <Flame className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-muted-foreground">Streak</div>
            <div className="text-sm font-bold tracking-tight text-foreground">
              {streakDays > 0 ? `${streakDays} days` : "Ready"}
            </div>
            {bestStreakDays && bestStreakDays > streakDays && streakDays > 0 ? (
              <div className="text-[10px] text-muted-foreground">Best {bestStreakDays}d</div>
            ) : null}
          </div>
        </div>

        {/* Completed Lessons */}
        <div className="flex items-start gap-2.5 p-2 rounded-lg bg-background/40 border border-border/30">
          <div className="h-7 w-7 rounded-md bg-emerald-500/10 grid place-items-center text-emerald-500 shrink-0 mt-0.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-muted-foreground">Completed</div>
            <div className="text-sm font-bold tracking-tight text-foreground">
              {isBeginner ? "0 completed" : `${completionPct}%`}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {isBeginner ? "Start lesson 1" : `${completedLessonsCount}/${totalLessonsCount} done`}
            </div>
          </div>
        </div>

        {/* Study Time */}
        <div className="flex items-start gap-2.5 p-2 rounded-lg bg-background/40 border border-border/30">
          <div className="h-7 w-7 rounded-md bg-muted grid place-items-center text-muted-foreground shrink-0 mt-0.5">
            <Clock className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-muted-foreground">Study Time</div>
            <div className="text-sm font-bold tracking-tight text-foreground font-mono">
              {Number(totalHours) > 0 ? `${totalHours}h` : "0h"}
            </div>
            <div className="text-[10px] text-muted-foreground">Logged practice</div>
          </div>
        </div>

        {/* Achievements */}
        <div className="flex items-start gap-2.5 p-2 rounded-lg bg-background/40 border border-border/30">
          <div className="h-7 w-7 rounded-md bg-amber-500/10 grid place-items-center text-amber-500 shrink-0 mt-0.5">
            <Trophy className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-muted-foreground">Badges</div>
            <div className="text-sm font-bold tracking-tight text-foreground">
              {unlockedAchievementsCount} / {totalAchievementsCount}
            </div>
            <div className="text-[10px] text-muted-foreground">Milestones</div>
          </div>
        </div>
      </div>
    </div>
  );
}
