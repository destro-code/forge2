import type { MultiSelectActivity } from "@/lib/curriculum/types";
import type { ActivityRendererProps } from "../types";
import { ActivityContainer } from "../primitives/activity-container";
import { ActivityHeader } from "../primitives/activity-header";
import { ActivityFeedback } from "../primitives/activity-feedback";
import { ActivityActions } from "../primitives/activity-actions";
import { Check, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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

  const hintsRemaining = (activity.feedback?.hints?.length || 0) - state.hintsRevealed;

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

  // Generate dynamic instructions based on counts
  let instructionText = "Select all that apply.";
  if (minSelections > 1 && maxSelections && minSelections === maxSelections) {
    instructionText = `Select exactly ${minSelections} answers.`;
  } else if (minSelections > 1 && maxSelections) {
    instructionText = `Select between ${minSelections} and ${maxSelections} answers.`;
  } else if (minSelections > 1) {
    instructionText = `Select at least ${minSelections} answers.`;
  } else if (maxSelections) {
    instructionText = `Select up to ${maxSelections} answers.`;
  }

  return (
    <ActivityContainer id={`activity-${activity.id}`} variant="standard">
      <ActivityHeader
        activity={activity}
        onRevealHint={onRevealHint}
        hintsRemaining={hintsRemaining}
      />

      <div className="p-6 md:p-10 flex flex-col gap-8">
        {/* Instruction Eyebrow and Question */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary/80 font-mono">
              Multiple Selection
            </span>
            <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
              {instructionText}
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-foreground leading-snug">
            {question}
          </h2>
        </div>

        {/* Multi-Select Options Grid */}
        <div className="grid gap-3.5" role="group" aria-label={question}>
          {options.map((option) => {
            const isSelected = selectedOptionIds.includes(option.id);

            // Default style state
            let containerStyle =
              "border-lesson-border bg-muted/10 hover:bg-muted/20 text-foreground";
            let checkboxStyle = "border-muted-foreground/30 text-transparent bg-muted/5";

            // Selected (before or after submission)
            if (isSelected) {
              containerStyle = "border-primary bg-primary/5 text-foreground ring-1 ring-primary";
              checkboxStyle = "border-primary bg-primary text-primary-foreground";
            }

            // Verification styling after submission
            if (isSubmitted) {
              if (isSelected) {
                if (isCorrect) {
                  containerStyle =
                    "border-emerald-500 bg-emerald-500/5 text-foreground ring-1 ring-emerald-500/50";
                  checkboxStyle = "border-emerald-600 bg-emerald-600 text-white";
                } else if (isIncorrect) {
                  containerStyle =
                    "border-rose-500 bg-rose-500/5 text-foreground ring-1 ring-rose-500/50";
                  checkboxStyle = "border-rose-600 bg-rose-600 text-white";
                }
              }
            }

            return (
              <motion.button
                key={option.id}
                type="button"
                role="checkbox"
                aria-checked={isSelected}
                disabled={readOnly || (isSubmitted && isCorrect)}
                whileTap={readOnly || (isSubmitted && isCorrect) ? {} : { scale: 0.985 }}
                onClick={() => toggleOption(option.id)}
                className={cn(
                  "flex items-center justify-between gap-4 p-4 md:p-5 rounded-2xl border text-left transition-all relative overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[56px] cursor-pointer shadow-xs",
                  containerStyle,
                  (readOnly || (isSubmitted && isCorrect)) && "cursor-default opacity-85",
                )}
              >
                <div className="flex items-center gap-4 flex-1">
                  {/* Styled Checkbox box */}
                  <div
                    className={cn(
                      "w-6 h-6 rounded-md border flex items-center justify-center transition-all shrink-0",
                      checkboxStyle,
                    )}
                  >
                    <Check
                      className={cn(
                        "w-4 h-4 stroke-[3px] transition-transform duration-200",
                        isSelected ? "scale-100" : "scale-0",
                      )}
                    />
                  </div>

                  <div className="flex-1">
                    <p className="text-base font-semibold text-foreground/90 leading-relaxed">
                      {option.text}
                    </p>
                    {option.hint && isIncorrect && isSelected && (
                      <p className="text-xs text-rose-600 dark:text-rose-400 mt-1.5 font-normal flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                        <span>Hint: {option.hint}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Validation Badge */}
                {isSubmitted &&
                  isSelected &&
                  (isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                  ))}
              </motion.button>
            );
          })}
        </div>

        {/* Feedback Section */}
        <ActivityFeedback
          status={state.status}
          validationResult={state.validationResult}
          hints={activity.feedback?.hints}
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
