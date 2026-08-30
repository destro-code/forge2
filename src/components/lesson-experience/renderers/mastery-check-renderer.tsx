import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ExperienceRuntimeState, MasteryCheckExperience } from "@/lib/lesson-experience/types";

interface MasteryCheckRendererProps {
  experience: MasteryCheckExperience;
  runtime: ExperienceRuntimeState;
  onSelect: (optionId: string) => void;
  onSubmit: () => void;
  onRetry: () => void;
}

export function MasteryCheckRenderer({
  experience,
  runtime,
  onSelect,
  onSubmit,
  onRetry,
}: MasteryCheckRendererProps) {
  const { heading, question, options, correctOptionId, successMessage, retryMessage } =
    experience.content;
  const selected = typeof runtime.response === "string" ? runtime.response : undefined;
  const isJudged = runtime.status === "passed" || runtime.status === "failed";

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-serif text-2xl font-semibold text-lesson-text-primary text-balance">
        {heading}
      </h2>

      <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-lesson-border bg-lesson-surface-elevated p-4 font-mono text-sm text-lesson-text-primary">
        {question}
      </pre>

      <RadioGroup value={selected} onValueChange={onSelect} className="gap-2">
        {options.map((option) => {
          const isCorrectOption = option.id === correctOptionId;
          const showResult = isJudged && (option.id === selected || isCorrectOption);
          return (
            <label
              key={option.id}
              htmlFor={`mastery-${experience.id}-${option.id}`}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 text-sm transition-colors",
                "border-lesson-border bg-lesson-surface hover:bg-lesson-surface-elevated",
                showResult &&
                  isCorrectOption &&
                  "border-lesson-success-border bg-lesson-success-bg text-lesson-success-text",
                showResult &&
                  !isCorrectOption &&
                  option.id === selected &&
                  "border-lesson-error-border bg-lesson-error-bg text-lesson-error-text",
                isJudged && "cursor-default",
              )}
            >
              <RadioGroupItem
                id={`mastery-${experience.id}-${option.id}`}
                value={option.id}
                disabled={isJudged}
                className="mt-0.5"
              />
              <span className="leading-relaxed">{option.label}</span>
            </label>
          );
        })}
      </RadioGroup>

      {!isJudged ? (
        <Button
          type="button"
          onClick={onSubmit}
          disabled={!selected}
          size="sm"
          className="self-start"
        >
          Submit answer
        </Button>
      ) : (
        <div className="flex flex-col gap-3">
          <p
            className={cn(
              "rounded-lg border px-4 py-3 text-sm leading-relaxed",
              runtime.status === "passed"
                ? "border-lesson-success-border bg-lesson-success-bg text-lesson-success-text"
                : "border-lesson-error-border bg-lesson-error-bg text-lesson-error-text",
            )}
          >
            {runtime.status === "passed" ? successMessage : retryMessage}
          </p>
          {runtime.status === "failed" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="self-start"
            >
              Try again
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
