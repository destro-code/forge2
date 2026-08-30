import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import type { ExperienceRuntimeState, PredictionExperience } from "@/lib/lesson-experience/types";

interface PredictionRendererProps {
  experience: PredictionExperience;
  runtime: ExperienceRuntimeState;
  onSelect: (optionId: string) => void;
}

export function PredictionRenderer({ experience, runtime, onSelect }: PredictionRendererProps) {
  const { heading, codeSnippet, question, options, correctOptionId, explanation } =
    experience.content;
  const selected = typeof runtime.response === "string" ? runtime.response : undefined;
  const isJudged = runtime.status === "passed" || runtime.status === "failed";
  // Only lock the radio group once the learner has landed on the correct
  // answer. A wrong answer must stay interactive — otherwise a single
  // incorrect guess permanently strands the learner on this step, since
  // "correct-response" is the only way to satisfy completion.
  const isLocked = runtime.status === "passed";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="font-serif text-2xl font-semibold text-lesson-text-primary text-balance">
          {heading}
        </h2>
      </div>

      <pre className="overflow-x-auto rounded-lg border border-lesson-border bg-lesson-surface-elevated p-4 font-mono text-sm text-lesson-text-primary">
        <code>{codeSnippet}</code>
      </pre>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium text-lesson-text-primary">{question}</legend>
        <RadioGroup
          value={selected}
          onValueChange={onSelect}
          className="gap-2"
          aria-disabled={isLocked}
        >
          {options.map((option) => {
            const isCorrectOption = option.id === correctOptionId;
            const showResult = isJudged && (option.id === selected || isCorrectOption);
            return (
              <label
                key={option.id}
                htmlFor={`prediction-${experience.id}-${option.id}`}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors",
                  "border-lesson-border bg-lesson-surface hover:bg-lesson-surface-elevated",
                  showResult &&
                    isCorrectOption &&
                    "border-lesson-success-border bg-lesson-success-bg text-lesson-success-text",
                  showResult &&
                    !isCorrectOption &&
                    option.id === selected &&
                    "border-lesson-error-border bg-lesson-error-bg text-lesson-error-text",
                  isLocked && "cursor-default",
                )}
              >
                <RadioGroupItem
                  id={`prediction-${experience.id}-${option.id}`}
                  value={option.id}
                  disabled={isLocked}
                />
                <span className="font-mono">{option.label}</span>
              </label>
            );
          })}
        </RadioGroup>
      </fieldset>

      {isJudged ? (
        <p
          className={cn(
            "rounded-lg border px-4 py-3 text-sm leading-relaxed",
            runtime.status === "passed"
              ? "border-lesson-success-border bg-lesson-success-bg text-lesson-success-text"
              : "border-lesson-error-border bg-lesson-error-bg text-lesson-error-text",
          )}
        >
          {runtime.status === "passed" ? explanation : "Not quite — try again."}
        </p>
      ) : null}
    </div>
  );
}
