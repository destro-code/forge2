import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface MomentumPanelProps {
  sessionsThisWeek: number;
  weeklyGoal?: number;
}

export function MomentumPanel({ sessionsThisWeek, weeklyGoal = 5 }: MomentumPanelProps) {
  const filled = Math.min(sessionsThisWeek, weeklyGoal);
  const remaining = Math.max(0, weeklyGoal - filled);
  const goalReached = remaining === 0;

  return (
    <section
      aria-label="Weekly momentum"
      className="rounded-lg border border-border bg-card px-5 py-5 sm:px-6"
    >
      <div className="flex items-center justify-between font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        <span>Momentum</span>
        <span className="text-muted-foreground/60">This week</span>
      </div>

      <h2 className="mt-2 font-serif text-2xl font-medium tracking-tight text-foreground">
        {goalReached ? "Fully forged." : "Keep the heat."}
      </h2>

      <div className="mt-5 flex items-center gap-5">
        <div className="flex shrink-0 items-baseline font-mono">
          <span className="text-4xl font-semibold tabular-nums text-foreground">{filled}</span>
          <span className="text-lg text-muted-foreground">/{weeklyGoal}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-xs text-muted-foreground">sessions completed</div>
          <div className="mt-2 flex items-center gap-1.5">
            {Array.from({ length: weeklyGoal }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-2 flex-1 rounded-full transition-colors",
                  i < filled ? "bg-primary" : "bg-muted",
                )}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
      </div>

      <p className="mt-4 inline-flex items-center gap-2 border-t border-border/60 pt-3 font-mono text-xs text-muted-foreground">
        <Flame className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        {goalReached
          ? "Weekly goal reached — the streak is yours to keep."
          : `${remaining} more session${remaining === 1 ? "" : "s"} to hit your weekly goal`}
      </p>
    </section>
  );
}
