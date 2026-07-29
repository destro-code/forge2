import type { MultipleQuestion } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface MultipleQuestionProps {
  question: MultipleQuestion;
  selectedAnswers: number[] | undefined;
  onSelectAnswer: (indices: number[]) => void;
  isReadOnly?: boolean;
}

export function MultipleQuestionCard({
  question,
  selectedAnswers = [],
  onSelectAnswer,
  isReadOnly = false,
}: MultipleQuestionProps) {
  const toggleOption = (idx: number) => {
    if (isReadOnly) return;
    if (selectedAnswers.includes(idx)) {
      onSelectAnswer(selectedAnswers.filter((i) => i !== idx));
    } else {
      onSelectAnswer([...selectedAnswers, idx]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
            Multiple Answers
          </span>
        </div>
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
          const isChecked = selectedAnswers.includes(idx);

          return (
            <div
              key={idx}
              onClick={() => toggleOption(idx)}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3.5 text-left text-sm transition select-none cursor-pointer",
                isChecked
                  ? "border-sky-500/50 bg-sky-500/10 text-sky-200 font-medium ring-1 ring-sky-500/30"
                  : "border-border/60 bg-card/50 text-foreground hover:border-border hover:bg-card/80",
              )}
            >
              <Checkbox
                checked={isChecked}
                onCheckedChange={() => toggleOption(idx)}
                disabled={isReadOnly}
                className="data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500"
              />
              <span className="flex-1">{option}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
