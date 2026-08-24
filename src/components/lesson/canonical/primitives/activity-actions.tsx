import { Button } from "@/components/ui/button";
import { ArrowRight, Check, RotateCcw } from "lucide-react";
import type { ActivityInteractionStatus } from "../types";
import { cn } from "@/lib/utils";

export interface ActivityActionsProps {
  status: ActivityInteractionStatus;
  onSubmit?: () => void;
  onRetry?: () => void;
  onContinue?: () => void;
  canSubmit?: boolean;
  isInteractive?: boolean;
  submitLabel?: string;
  continueLabel?: string;
  className?: string;
}

export function ActivityActions({
  status,
  onSubmit,
  onRetry,
  onContinue,
  canSubmit = true,
  isInteractive = true,
  submitLabel = "Check Answer",
  continueLabel = "Continue",
  className,
}: ActivityActionsProps) {
  const isCorrect = status === "correct" || status === "completed";
  const isIncorrect = status === "incorrect";

  return (
    <div
      className={cn(
        "sticky bottom-0 sm:relative z-20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-4.5 border-t border-lesson-border bg-lesson-surface/95 backdrop-blur-sm sm:bg-lesson-surface-subtle/10 sm:backdrop-blur-none shadow-[0_-6px_20px_rgba(0,0,0,0.04)] sm:shadow-none pb-[calc(16px+env(safe-area-inset-bottom,0px))] sm:pb-4.5 rounded-b-xl sm:rounded-b-none",
        className,
      )}
    >
      <div className="flex items-center gap-2 w-full sm:w-auto">
        {isIncorrect && onRetry && (
          <Button
            variant="outline"
            onClick={onRetry}
            className="w-full sm:w-auto h-11 sm:h-10 text-sm gap-2 rounded-lg border-lesson-border bg-lesson-surface hover:bg-lesson-surface-subtle hover:text-lesson-text-primary text-lesson-text-secondary focus-visible:ring-2 focus-visible:ring-lesson-focus-ring focus-visible:ring-offset-2 transition-all font-semibold shadow-xs"
          >
            <RotateCcw className="w-4 h-4 shrink-0" />
            <span>Try Again</span>
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
        {isInteractive && !isCorrect && onSubmit && (
          <Button
            onClick={onSubmit}
            disabled={!canSubmit || status === "submitted"}
            className="w-full sm:w-auto h-11 sm:h-10 px-6 text-sm font-semibold rounded-lg bg-lesson-accent text-lesson-accent-foreground hover:bg-lesson-accent/90 disabled:opacity-45 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-lesson-focus-ring focus-visible:ring-offset-2 transition-all flex items-center justify-center gap-2 shadow-xs"
          >
            <Check className="w-4 h-4 shrink-0" />
            <span>{submitLabel}</span>
          </Button>
        )}

        {(isCorrect || !isInteractive) && onContinue && (
          <Button
            onClick={onContinue}
            className="w-full sm:w-auto h-11 sm:h-10 px-6 text-sm font-semibold rounded-lg bg-lesson-accent text-lesson-accent-foreground hover:bg-lesson-accent/90 disabled:opacity-45 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-lesson-focus-ring focus-visible:ring-offset-2 transition-all flex items-center justify-center gap-2 shadow-xs"
          >
            <span>{continueLabel}</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </Button>
        )}
      </div>
    </div>
  );
}
