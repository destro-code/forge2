import { useState } from "react";
import type { OutputPredictionActivity } from "@/lib/curriculum/types";
import type { ActivityRendererProps } from "../types";
import { ActivityContainer } from "../primitives/activity-container";
import { ActivityHeader } from "../primitives/activity-header";
import { ActivityFeedback } from "../primitives/activity-feedback";
import { ActivityActions } from "../primitives/activity-actions";
import { CodeBlock } from "@/components/shared/code-block";
import { Input } from "@/components/ui/input";
import { Sparkles, Terminal, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function OutputPredictionRenderer({
  activity,
  state,
  onResponse,
  onSubmit,
  onRetry,
  onContinue,
  onRevealHint,
  readOnly,
}: ActivityRendererProps<OutputPredictionActivity, string>) {
  const { code, language, prompt, options, explanation } = activity.content;

  const currentPrediction = typeof state.response === "string" ? state.response : "";

  const isSubmitted =
    state.status === "submitted" || state.status === "correct" || state.status === "incorrect";
  const isCorrect = state.status === "correct" || state.status === "completed";
  const isIncorrect = state.status === "incorrect";

  const hintsRemaining = (activity.hints?.length || 0) - state.hintsRevealed;

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
            <Sparkles className="w-5 h-5 text-primary" />
            <span>Output Prediction</span>
          </h2>
          <p className="text-sm text-muted-foreground">{prompt}</p>
        </div>

        {/* Code to Inspect */}
        <div className="rounded-lg overflow-hidden border border-border/80 shadow-inner">
          <CodeBlock code={code} language={language} showLineNumbers />
        </div>

        {/* Prediction Input / Options */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-primary" />
            <span>Your Predicted Output</span>
          </h3>

          {options && options.length > 0 ? (
            <div
              className="grid gap-2.5 sm:grid-cols-2"
              role="radiogroup"
              aria-label="Predicted Output"
            >
              {options.map((opt, idx) => {
                const isSelected = currentPrediction === opt;

                return (
                  <button
                    key={idx}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    disabled={readOnly || (isSubmitted && isCorrect)}
                    onClick={() => {
                      if (!readOnly && (!isSubmitted || isIncorrect)) {
                        onResponse(opt);
                      }
                    }}
                    className={cn(
                      "flex items-center gap-3 p-3.5 rounded-xl border text-left font-mono text-sm transition-all relative overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-xs font-semibold"
                        : "border-border/80 bg-card hover:bg-muted/40 hover:border-border",
                      isCorrect &&
                        isSelected &&
                        "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                      isIncorrect &&
                        isSelected &&
                        "border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300",
                    )}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border flex items-center justify-center text-xs shrink-0 transition-colors",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30",
                        isCorrect && isSelected && "border-emerald-600 bg-emerald-600 text-white",
                        isIncorrect && isSelected && "border-rose-600 bg-rose-600 text-white",
                      )}
                    >
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="flex-1 truncate">{opt}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="max-w-md">
              <Input
                value={currentPrediction}
                disabled={readOnly || (isSubmitted && isCorrect)}
                placeholder="Type predicted output value..."
                onChange={(e) => onResponse(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && currentPrediction.trim() && onSubmit) {
                    e.preventDefault();
                    onSubmit();
                  }
                }}
                className={cn(
                  "font-mono text-sm h-10",
                  isCorrect && "border-emerald-500 bg-emerald-500/10",
                  isIncorrect && "border-rose-500 bg-rose-500/10",
                )}
                aria-label="Type predicted output"
              />
            </div>
          )}
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
        canSubmit={Boolean(currentPrediction.trim())}
      />
    </ActivityContainer>
  );
}
