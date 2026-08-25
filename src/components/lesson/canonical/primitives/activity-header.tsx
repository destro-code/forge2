import { Button } from "@/components/ui/button";
import type { CanonicalActivity } from "@/lib/curriculum/types";
import { Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActivityHeaderProps {
  activity: CanonicalActivity;
  title?: string;
  onRevealHint?: () => void;
  hintsRemaining?: number;
  className?: string;
}

const INTENT_LABELS: Record<string, string> = {
  orientation: "Orientation",
  understanding: "Concept study",
  recognition: "Visual model",
  retrieval: "Active recall",
  prediction: "Output prediction",
  application: "Coding practice",
  debugging: "Debug challenge",
  assessment: "Knowledge check",
  reflection: "Reflection",
  synthesis: "Synthesis",
  reinforcement: "Reinforcement",
};

export function ActivityHeader({
  activity,
  title,
  onRevealHint,
  hintsRemaining,
  className,
}: ActivityHeaderProps) {
  const label =
    activity.type === "interactive-code"
      ? "Interactive Code Challenge"
      : INTENT_LABELS[activity.intent] || "Learning activity";

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 border-b border-lesson-border px-5 py-3 sm:px-6",
        className,
      )}
    >
      <div className="min-w-0">
        <p className="text-xs font-medium text-lesson-text-muted">{label}</p>
        {title && (
          <p className="mt-0.5 truncate text-sm font-medium text-lesson-text-secondary">{title}</p>
        )}
      </div>

      {onRevealHint && typeof hintsRemaining === "number" && hintsRemaining > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRevealHint}
          className="min-h-9 shrink-0 gap-1.5 px-2.5 text-xs font-medium text-lesson-text-secondary hover:bg-lesson-surface-subtle hover:text-lesson-text-primary focus-visible:ring-2 focus-visible:ring-lesson-focus-ring"
        >
          <Lightbulb className="h-4 w-4" />
          <span>Hint ({hintsRemaining})</span>
        </Button>
      )}
    </div>
  );
}
