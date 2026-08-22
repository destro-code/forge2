import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Sparkles, HelpCircle, BookOpen, Compass, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InteractiveExerciseMode, ExerciseLeadIn } from "@/lib/types/lesson-player";

export interface ExerciseCardProps {
  title: string;
  mode?: InteractiveExerciseMode;
  leadIn?: ExerciseLeadIn;
  instructions?: string;
  isCompleted?: boolean;
  xpAwarded?: number;
  children: React.ReactNode;
  className?: string;
}

const MODE_LABELS: Record<
  InteractiveExerciseMode,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  "multiple-choice": { label: "Scenario Matching", icon: HelpCircle },
  prediction: { label: "Code Detective & Prediction", icon: Compass },
  reveal: { label: "Conceptual Lab & Inspection", icon: BookOpen },
  "code-completion": { label: "Code Completion", icon: Terminal },
  "code-fix": { label: "Code Repair", icon: Terminal },
  sandbox: { label: "Sandbox", icon: Terminal },
  project: { label: "Project Challenge", icon: Terminal },
};

export function ExerciseCard({
  title,
  mode = "reveal",
  leadIn,
  instructions,
  isCompleted = false,
  xpAwarded = 50,
  children,
  className,
}: ExerciseCardProps) {
  const modeMeta = MODE_LABELS[mode] || { label: "Interactive Exercise", icon: Sparkles };
  const ModeIcon = modeMeta.icon;

  return (
    <div
      className={cn(
        "flex flex-col w-full rounded-2xl border border-border/70 bg-card shadow-sm overflow-hidden text-foreground",
        className,
      )}
      data-testid="lightweight-exercise-card"
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-muted/40 px-4 py-3.5 sm:px-6 sm:py-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <ModeIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-semibold text-sm sm:text-base text-foreground truncate">
                {title}
              </h2>
              <Badge
                variant="outline"
                className="text-[10px] sm:text-xs font-medium border-border/70 text-muted-foreground"
              >
                {modeMeta.label}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isCompleted ? (
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-xs font-semibold px-2.5 py-1 gap-1"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Completed
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs font-medium px-2.5 py-1 gap-1"
            >
              <Sparkles className="h-3 w-3" />+{xpAwarded} XP
            </Badge>
          )}
        </div>
      </div>

      {/* Absorbed Lead-in Context if present */}
      {leadIn && (leadIn.text || (leadIn.sections && leadIn.sections.length > 0)) && (
        <div className="border-b border-border/50 bg-accent/20 px-4 py-3 sm:px-6 sm:py-3.5 text-xs sm:text-sm text-foreground/90 leading-relaxed">
          {leadIn.title && (
            <div className="font-semibold text-foreground text-xs sm:text-sm mb-1">
              {leadIn.title}
            </div>
          )}
          {leadIn.sections ? (
            leadIn.sections.map((sec, idx) => {
              if (sec.type === "paragraph" && "text" in sec) {
                return (
                  <p key={idx} className="mb-1.5 last:mb-0">
                    {sec.text}
                  </p>
                );
              }
              return null;
            })
          ) : (
            <p>{leadIn.text}</p>
          )}
        </div>
      )}

      {/* Main Instructions Brief */}
      {instructions && (
        <div className="border-b border-border/50 bg-muted/20 px-4 py-3.5 sm:px-6 sm:py-4">
          <p className="text-xs sm:text-sm font-medium text-foreground/90 leading-relaxed">
            {instructions}
          </p>
        </div>
      )}

      {/* Interactive Body Content */}
      <div className="flex-1 p-4 sm:p-6 sm:py-6">{children}</div>
    </div>
  );
}
