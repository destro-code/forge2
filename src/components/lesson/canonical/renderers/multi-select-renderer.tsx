import type { MultiSelectActivity } from "@/lib/curriculum/types";
import type { ActivityRendererProps } from "../types";
import { ActivityContainer } from "../primitives/activity-container";
import { ActivityHeader } from "../primitives/activity-header";
import { ActivityFeedback } from "../primitives/activity-feedback";
import { ActivityActions } from "../primitives/activity-actions";
import { CheckSquare, Square, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function MultiSelectRenderer({
  activity,
  state,
  onResponse,
  onSubmit,
  onRetry,
  onContinue,
  onRevealHint,
  readOnly,
}: ActivityRendererProps<MultiSelectActivity, string[]>) {
  const { question, options, minSelections = 1, maxSelections, explanation } = activity.content;

  const selectedOptionIds = Array.isArray(state.response) ? state.response : [];

  const isSubmitted =
    state.status === "submitted" || state.status === "correct" || state.status === "incorrect";
  const isCorrect = state.status === "correct" || state.status === "completed";
  const isIncorrect = state.status === "incorrect";

  const hintsRemaining = (activity.hints?.length || 0) - state.hintsRevealed;

  const toggleOption = (id: string) => {
    if (readOnly || (isSubmitted && isCorrect)) return;

    if (selectedOptionIds.includes(id)) {
      onResponse(selectedOptionIds.filter((item) => item !== id));
    } else {
      if (maxSelections && selectedOptionIds.length >= maxSelections) {
        return;
      }
      onResponse([...selectedOptionIds, id]);
    }
  };

  const canSubmit =
    selectedOptionIds.length >= minSelections &&
    (!maxSelections || selectedOptionIds.length <= maxSelections);

  return (
    <ActivityContainer id={`activity-${activity.id}`}>
      <ActivityHeader
        activity={activity}
        onRevealHint={onRevealHint}
        hintsRemaining={hintsRemaining}
      />

      <div className="p-6 md:p-8 flex flex-col gap-6">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-start gap-2.5">
            <CheckSquare className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <span>{question}</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            {minSelections > 1
              ? `Select at least ${minSelections} options.`
              : "Select all that apply."}
            {maxSelections ? ` (Max ${maxSelections})` : ""}
          </p>
        </div>

        {/* Multi-Select Options Grid */}
        <div className="grid gap-3" role="group" aria-label={question}>
          {options.map((option) => {
            const isSelected = selectedOptionIds.includes(option.id);

            return (
              <button
                key={option.id}
                type="button"
                role="checkbox"
                aria-checked={isSelected}
                disabled={readOnly || (isSubmitted && isCorrect)}
                onClick={() => toggleOption(option.id)}
                className={cn(
                  "flex items-start gap-3.5 p-4 rounded-xl border text-left transition-all relative overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-xs font-medium"
                    : "border-border/80 bg-card hover:bg-muted/40 hover:border-border",
                  isCorrect && isSelected && "border-emerald-500 bg-emerald-500/10",
                  isIncorrect && isSelected && "border-rose-500 bg-rose-500/10",
                )}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-md border flex items-center justify-center text-xs shrink-0 transition-colors mt-0.5",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/40 group-hover:border-muted-foreground/70",
                    isCorrect && isSelected && "border-emerald-600 bg-emerald-600 text-white",
                    isIncorrect && isSelected && "border-rose-600 bg-rose-600 text-white",
                  )}
                >
                  {isSelected ? (
                    <CheckSquare className="w-3.5 h-3.5" />
                  ) : (
                    <Square className="w-3.5 h-3.5 opacity-0" />
                  )}
                </div>

                <div className="flex-1">
                  <p className="text-sm text-foreground leading-relaxed">{option.text}</p>
                  {option.hint && isIncorrect && isSelected && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-normal">
                      Hint: {option.hint}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
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
        canSubmit={canSubmit}
      />
    </ActivityContainer>
  );
}
