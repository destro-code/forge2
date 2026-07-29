import type { CodeQuestion } from "@/lib/types";
import { CodeBlock } from "@/components/shared/code-block";
import { cn } from "@/lib/utils";

interface CodeQuestionProps {
  question: CodeQuestion;
  selectedAnswer: number | undefined;
  onSelectAnswer: (index: number) => void;
  isReadOnly?: boolean;
}

export function CodeQuestionCard({
  question,
  selectedAnswer,
  onSelectAnswer,
  isReadOnly = false,
}: CodeQuestionProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            Code Analysis
          </span>
        </div>
        <h3 className="text-base font-semibold text-foreground leading-snug">
          {question.question}
        </h3>
      </div>

      {/* Code Snippet Block */}
      {question.codeSnippet && (
        <CodeBlock
          code={question.codeSnippet}
          language="typescript"
          className="text-xs font-mono"
        />
      )}

      {/* Options Grid */}
      <div className="grid gap-2.5">
        {question.options.map((option, idx) => {
          const isSelected = selectedAnswer === idx;

          return (
            <button
              key={idx}
              disabled={isReadOnly}
              onClick={() => onSelectAnswer(idx)}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3.5 text-left text-xs font-mono transition select-none cursor-pointer",
                isSelected
                  ? "border-amber-500 bg-amber-500/10 text-amber-200 font-semibold ring-1 ring-amber-500/40"
                  : "border-border/60 bg-card/50 text-foreground hover:border-border hover:bg-card/80",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold font-sans mt-0.5",
                  isSelected
                    ? "border-amber-500 bg-amber-500 text-black"
                    : "border-border text-muted-foreground",
                )}
              >
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="flex-1 leading-relaxed whitespace-pre-wrap">{option}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
