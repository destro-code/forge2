import type { MultipleChoiceActivity } from "@/lib/curriculum/types";
import type { ActivityRendererProps } from "../types";
import { ActivityContainer } from "../primitives/activity-container";
import { ActivityHeader } from "../primitives/activity-header";
import { ActivityFeedback } from "../primitives/activity-feedback";
import { ActivityActions } from "../primitives/activity-actions";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function MultipleChoiceRenderer({ activity, state, onResponse, onSubmit, onRetry, onContinue, onRevealHint, readOnly }: ActivityRendererProps<MultipleChoiceActivity, string>) {
  const { question, options, explanation } = activity.content;
  const selectedOptionId = state.response || "";
  const isSubmitted = state.status === "submitted" || state.status === "correct" || state.status === "incorrect";
  const isCorrect = state.status === "correct" || state.status === "completed";
  const isIncorrect = state.status === "incorrect";
  const hintsRemaining = (activity.feedback?.hints?.length || 0) - state.hintsRevealed;

  return (
    <ActivityContainer id={`activity-${activity.id}`} variant="standard">
      <ActivityHeader activity={activity} onRevealHint={onRevealHint} hintsRemaining={hintsRemaining} />
      <div className="mx-auto w-full max-w-3xl px-5 py-7 sm:px-8 sm:py-9">
        <div className="mb-7">
          <p className="mb-2 text-sm font-medium text-lesson-text-muted">Choose one answer</p>
          <h2 className="text-2xl font-bold leading-tight tracking-tight text-lesson-text-primary sm:text-3xl">{question}</h2>
        </div>

        <div className="space-y-2.5" role="radiogroup" aria-label={question}>
          {options.map((option, idx) => {
            const isSelected = selectedOptionId === option.id;
            const isExpected = isSubmitted && activity.validation?.type === "exact-match" && activity.validation.expected === option.id;
            const stateClass = isSubmitted && isSelected && isCorrect
              ? "border-emerald-500/70 bg-emerald-500/5"
              : isSubmitted && isSelected && isIncorrect
                ? "border-rose-500/60 bg-rose-500/5"
                : isSubmitted && !isSelected && isExpected
                  ? "border-emerald-500/50 bg-emerald-500/5"
                  : isSelected
                    ? "border-lesson-accent/70 bg-lesson-accent/5"
                    : "border-lesson-border bg-lesson-surface hover:border-lesson-text-muted hover:bg-lesson-surface-elevated";

            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={readOnly || (isSubmitted && isCorrect)}
                onClick={() => {
                  if (!readOnly && (!isSubmitted || isIncorrect)) onResponse(option.id);
                }}
                className={cn(
                  "flex min-h-14 w-full items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lesson-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-lesson-bg",
                  stateClass,
                  (readOnly || (isSubmitted && isCorrect)) && "cursor-default opacity-80",
                )}
              >
                <span className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  isSelected ? "border-lesson-accent bg-lesson-accent text-lesson-accent-foreground" : "border-lesson-border text-lesson-text-muted",
                  isSubmitted && isSelected && isCorrect && "border-emerald-600 bg-emerald-600 text-white",
                  isSubmitted && isSelected && isIncorrect && "border-rose-600 bg-rose-600 text-white",
                  isSubmitted && !isSelected && isExpected && "border-emerald-600 bg-emerald-600 text-white",
                )}>{String.fromCharCode(65 + idx)}</span>
                <span className="min-w-0 flex-1 text-sm leading-6 text-lesson-text-primary sm:text-base">{option.text}</span>
                {isSubmitted && isSelected && isCorrect && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />}
                {isSubmitted && isSelected && isIncorrect && <XCircle className="h-5 w-5 shrink-0 text-rose-600" />}
                {isSubmitted && !isSelected && isExpected && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600/70" />}
              </button>
            );
          })}
        </div>

        <ActivityFeedback status={state.status} validationResult={state.validationResult} hints={activity.feedback?.hints} hintsRevealed={state.hintsRevealed} explanation={explanation} />
      </div>
      <ActivityActions status={state.status} onSubmit={onSubmit} onRetry={onRetry} onContinue={onContinue} canSubmit={Boolean(selectedOptionId)} />
    </ActivityContainer>
  );
}
