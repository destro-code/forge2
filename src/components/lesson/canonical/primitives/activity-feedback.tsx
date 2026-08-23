import { CheckCircle2, XCircle, Lightbulb, AlertCircle, Info } from "lucide-react";
import type { ActivityInteractionStatus, ActivityValidationResult } from "../types";
import type { ActivityHint } from "@/lib/curriculum/types";
import { cn } from "@/lib/utils";

export interface ActivityFeedbackProps {
  status: ActivityInteractionStatus;
  validationResult?: ActivityValidationResult;
  hints?: ActivityHint[];
  hintsRevealed?: number;
  explanation?: string;
  className?: string;
}

export function ActivityFeedback({
  status,
  validationResult,
  hints,
  hintsRevealed = 0,
  explanation,
  className,
}: ActivityFeedbackProps) {
  const isCorrect =
    status === "correct" || (status === "completed" && validationResult?.isValid !== false);
  const isIncorrect =
    status === "incorrect" || (status === "submitted" && validationResult?.isValid === false);

  const activeHints = hints ? hints.slice(0, hintsRevealed) : [];

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Active Hints */}
      {activeHints.length > 0 && (
        <div className="flex flex-col gap-2">
          {activeHints.map((hint, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-sm"
            >
              <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-xs text-amber-600 dark:text-amber-400 mb-0.5">
                  Hint {idx + 1}
                </p>
                <p>{hint.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Validation Result State */}
      {isCorrect && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-100 text-sm animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="font-semibold text-emerald-700 dark:text-emerald-300">
              {validationResult?.feedbackMessage || "Correct! Excellent work."}
            </p>
            {explanation && (
              <p className="text-xs text-emerald-800/80 dark:text-emerald-200/80 leading-relaxed pt-1">
                {explanation}
              </p>
            )}
          </div>
        </div>
      )}

      {isIncorrect && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-900 dark:text-rose-100 text-sm animate-in fade-in duration-200">
          <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="font-semibold text-rose-700 dark:text-rose-300">
              {validationResult?.feedbackMessage || "Not quite right yet."}
            </p>
            <p className="text-xs text-rose-800/80 dark:text-rose-200/80">
              Review your answer or check the hints above, then try again.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
