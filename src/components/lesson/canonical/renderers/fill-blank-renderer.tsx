import { useState } from "react";
import type { FillBlankActivity } from "@/lib/curriculum/types";
import type { ActivityRendererProps } from "../types";
import { ActivityContainer } from "../primitives/activity-container";
import { ActivityHeader } from "../primitives/activity-header";
import { ActivityFeedback } from "../primitives/activity-feedback";
import { ActivityActions } from "../primitives/activity-actions";
import { Input } from "@/components/ui/input";
import { FormInput, Sparkles, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function FillBlankRenderer({
  activity,
  state,
  onResponse,
  onSubmit,
  onRetry,
  onContinue,
  onRevealHint,
  readOnly,
}: ActivityRendererProps<FillBlankActivity, string[]>) {
  const { prompt, template, blanks, explanation } = activity.content;

  // Blanks state array
  const rawValues = Array.isArray(state.response) ? state.response : [];
  const blankValues = blanks.map((_, idx) => rawValues[idx] || "");

  const isSubmitted =
    state.status === "submitted" || state.status === "correct" || state.status === "incorrect";
  const isCorrect = state.status === "correct" || state.status === "completed";
  const isIncorrect = state.status === "incorrect";

  const hintsRemaining = (activity.hints?.length || 0) - state.hintsRevealed;

  const handleBlankChange = (index: number, val: string) => {
    if (readOnly || (isSubmitted && isCorrect)) return;
    const next = [...blankValues];
    next[index] = val;
    onResponse(next);
  };

  const allFilled = blankValues.every((val) => val.trim().length > 0);

  return (
    <ActivityContainer id={`activity-${activity.id}`}>
      <ActivityHeader
        activity={activity}
        onRevealHint={onRevealHint}
        hintsRemaining={hintsRemaining}
      />

      <div className="p-6 md:p-8 flex flex-col gap-6">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <FormInput className="w-5 h-5 text-primary" />
            <span>{prompt}</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Fill in the missing values to complete the code or statement.
          </p>
        </div>

        {/* Code / Text Template Card */}
        <div className="p-5 rounded-xl bg-muted/40 border border-border/80 font-mono text-sm leading-relaxed overflow-x-auto">
          <div className="whitespace-pre-wrap text-foreground/90">{template}</div>
        </div>

        {/* Blanks Inputs */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Missing Values ({blanks.length})
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {blanks.map((blank, idx) => (
              <div
                key={blank.id}
                className="flex flex-col gap-1.5 p-3 rounded-lg border border-border/70 bg-card"
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                  <span>Blank #{idx + 1}</span>
                  {blank.placeholder && <span>({blank.placeholder})</span>}
                </div>
                <Input
                  value={blankValues[idx] || ""}
                  disabled={readOnly || (isSubmitted && isCorrect)}
                  placeholder={blank.placeholder || "Enter answer..."}
                  onChange={(e) => handleBlankChange(idx, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && allFilled && onSubmit) {
                      e.preventDefault();
                      onSubmit();
                    }
                  }}
                  className={cn(
                    "font-mono text-sm h-9",
                    isCorrect &&
                      "border-emerald-500 bg-emerald-500/10 focus-visible:ring-emerald-500",
                    isIncorrect && "border-rose-500 bg-rose-500/10 focus-visible:ring-rose-500",
                  )}
                  aria-label={`Blank ${idx + 1}: ${blank.placeholder || blank.id}`}
                />
                {blank.hint && isIncorrect && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                    Hint: {blank.hint}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Feedback Section */}
        <ActivityFeedback
          status={state.status}
          validationResult={state.validationResult}
          hints={activity.hints}
          hintsRevealed={state.hintsRevealed}
          explanation={explanation}
        />
      </div>

      <ActivityActions
        status={state.status}
        onSubmit={onSubmit}
        onRetry={onRetry}
        onContinue={onContinue}
        canSubmit={allFilled}
      />
    </ActivityContainer>
  );
}
