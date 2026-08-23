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
        "flex items-center justify-between gap-4 px-6 py-4 border-t border-border/60 bg-muted/10",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {isIncorrect && onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="text-xs gap-1.5 h-9">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {isInteractive && !isCorrect && onSubmit && (
          <Button
            onClick={onSubmit}
            disabled={!canSubmit || status === "submitted"}
            className="gap-2 h-9 px-5 text-sm font-medium"
          >
            <Check className="w-4 h-4" />
            <span>{submitLabel}</span>
          </Button>
        )}

        {(isCorrect || !isInteractive) && onContinue && (
          <Button
            onClick={onContinue}
            className="gap-2 h-9 px-6 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <span>{continueLabel}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
