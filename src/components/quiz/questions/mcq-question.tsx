import type { MCQQuestion } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MCQQuestionProps {
  question: MCQQuestion;
  selectedAnswer: number | undefined;
  onSelectAnswer: (index: number) => void;
  isReadOnly?: boolean;
}

export function MCQQuestionCard({
  question,
  selectedAnswer,
  onSelectAnswer,
  isReadOnly = false,
}: MCQQuestionProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-foreground leading-snug">
          {question.question}
        </h3>
        {question.hint && (
          <p className="text-xs text-amber-400 bg-amber-500/10 p-2 rounded border border-amber-500/20">
            💡 Hint: {question.hint}
          </p>
        )}
      </div>

      <div className="grid gap-2.5">
        {question.options.map((option, idx) => {
          const isSelected = selectedAnswer === idx;

          return (
            <button
              key={idx}
              disabled={isReadOnly}
              onClick={() => onSelectAnswer(idx)}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3.5 text-left text-sm transition select-none cursor-pointer",
                isSelected
                  ? "border-primary bg-primary/10 text-primary font-medium ring-1 ring-primary/40"
                  : "border-border/60 bg-card/50 text-foreground hover:border-border hover:bg-card/80",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground",
                )}
              >
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="flex-1">{option}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
