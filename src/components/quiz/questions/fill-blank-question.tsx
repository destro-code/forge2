import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import type { FillInBlankQuestion } from "@/lib/types";

interface FillInBlankQuestionProps {
  question: FillInBlankQuestion;
  userAnswer: string | undefined;
  onAnswerChange: (text: string) => void;
  isReadOnly?: boolean;
}

export function FillInBlankQuestionCard({
  question,
  userAnswer = "",
  onAnswerChange,
  isReadOnly = false,
}: FillInBlankQuestionProps) {
  const [inputVal, setInputVal] = useState(userAnswer);

  useEffect(() => {
    setInputVal(userAnswer || "");
  }, [userAnswer]);

  const handleChange = (val: string) => {
    setInputVal(val);
    onAnswerChange(val);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
            Fill in the Blank
          </span>
        </div>
        <h3 className="text-base font-semibold text-foreground leading-snug">
          {question.question}
        </h3>
      </div>

      {/* Code Template Box */}
      <div className="rounded-lg border border-border/60 bg-muted/30 p-4 font-mono text-sm leading-relaxed text-foreground">
        <div className="flex flex-wrap items-center gap-2">
          <span>{question.template.split("_____")[0]}</span>
          <Input
            value={inputVal}
            disabled={isReadOnly}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="type blank here..."
            className="inline-block w-48 h-8 font-mono text-sm border-primary/60 bg-background text-primary focus:ring-primary font-bold px-2"
          />
          <span>{question.template.split("_____")[1]}</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Type the exact method or token keyword into the blank input above.
      </p>
    </div>
  );
}
