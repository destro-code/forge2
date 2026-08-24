import { CheckCircle2, XCircle, Lightbulb, Sparkles } from "lucide-react";
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

  const activeHints = hints
    ? hints
        .slice(0, hintsRevealed)
        .map((h) => (typeof h === "string" ? h : h.content || (h as { text?: string }).text || ""))
    : [];

  // Parse enhanced diagnostic feedback if present
  const feedbackMessage = validationResult?.feedbackMessage || "";
  const hasDiagnostic = feedbackMessage.includes("[Diagnostic Insight]:");

  let mainFeedback = feedbackMessage;
  let diagnosticInsight: string | undefined;
  let diagnosticCorrection: string | undefined;

  if (hasDiagnostic) {
    const lines = feedbackMessage.split("\n\n");
    mainFeedback = lines[0];
    const insightLine = lines.find((l) => l.startsWith("[Diagnostic Insight]:"));
    const correctionLine = lines.find((l) => l.startsWith("[Correction]:"));

    if (insightLine) {
      diagnosticInsight = insightLine.replace("[Diagnostic Insight]:", "").trim();
    }
    if (correctionLine) {
      diagnosticCorrection = correctionLine.replace("[Correction]:", "").trim();
    }
  }

  return (
    <div className={cn("flex flex-col gap-3.5 w-full", className)}>
      {/* Active Hints */}
      {activeHints.length > 0 && (
        <div className="flex flex-col gap-2">
          {activeHints.map((hintText, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-4 rounded-lg bg-lesson-warning-bg border border-lesson-warning-border text-lesson-warning-text text-sm transition-all animate-in fade-in duration-150"
            >
              <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
              <div className="flex-1 space-y-1">
                <p className="font-semibold text-xs uppercase tracking-wider text-lesson-warning-text/80">
                  Hint {idx + 1}
                </p>
                <p className="leading-relaxed">{hintText}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Correct Validation Result State */}
      {isCorrect && (
        <div className="flex items-start gap-3.5 p-4 rounded-lg bg-lesson-success-bg border border-lesson-success-border text-lesson-success-text text-sm transition-all animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
          <div className="flex-1 space-y-1.5">
            <p className="font-semibold text-sm leading-snug">
              {mainFeedback || "Correct! Excellent work."}
            </p>
            {explanation && (
              <p className="text-xs opacity-90 leading-relaxed border-t border-lesson-success-border/40 pt-1.5 mt-1.5">
                {explanation}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Incorrect Validation Result State */}
      {isIncorrect && (
        <div className="flex flex-col gap-3 p-4 rounded-lg bg-lesson-error-bg border border-lesson-error-border text-lesson-error-text text-sm transition-all animate-in fade-in duration-200">
          <div className="flex items-start gap-3.5">
            <XCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            <div className="flex-1 space-y-1">
              <p className="font-semibold text-sm leading-snug">
                {mainFeedback || "Not quite right yet."}
              </p>
              {!hasDiagnostic && (
                <p className="text-xs opacity-85 leading-relaxed">
                  Review your selection or double-check the logic, then try again.
                </p>
              )}
            </div>
          </div>

          {/* Elegant Diagnostic Remediation sub-card */}
          {hasDiagnostic && (diagnosticInsight || diagnosticCorrection) && (
            <div className="mt-2 p-3.5 rounded bg-lesson-surface border border-lesson-border flex flex-col gap-2 text-lesson-text-primary animate-in slide-in-from-top-2 duration-200">
              {diagnosticInsight && (
                <div className="flex items-start gap-2.5 text-xs">
                  <Lightbulb className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                  <div>
                    <span className="font-semibold text-lesson-text-secondary block">
                      Conceptual Insight
                    </span>
                    <p className="text-lesson-text-secondary leading-relaxed mt-0.5">
                      {diagnosticInsight}
                    </p>
                  </div>
                </div>
              )}
              {diagnosticCorrection && (
                <div className="flex items-start gap-2.5 text-xs border-t border-lesson-border/60 pt-2 mt-1">
                  <Sparkles className="w-4 h-4 shrink-0 text-indigo-500 mt-0.5" />
                  <div>
                    <span className="font-semibold text-lesson-text-secondary block">
                      Suggested Correction
                    </span>
                    <p className="text-lesson-text-secondary leading-relaxed mt-0.5">
                      {diagnosticCorrection}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
