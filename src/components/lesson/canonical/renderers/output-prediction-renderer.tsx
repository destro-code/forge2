import { useState } from "react";
import type { OutputPredictionActivity } from "@/lib/curriculum/types";
import type { ActivityRendererProps } from "../types";
import { ActivityContainer } from "../primitives/activity-container";
import { ActivityHeader } from "../primitives/activity-header";
import { ActivityFeedback } from "../primitives/activity-feedback";
import { ActivityActions } from "../primitives/activity-actions";
import { CodeBlock } from "@/components/shared/code-block";
import { Input } from "@/components/ui/input";
import { Sparkles, Terminal, CheckCircle2, XCircle, ChevronRight, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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

  const hintsRemaining = (activity.feedback?.hints?.length || 0) - state.hintsRevealed;

  return (
    <ActivityContainer id={`activity-${activity.id}`} variant="standard">
      <ActivityHeader
        activity={activity}
        onRevealHint={onRevealHint}
        hintsRemaining={hintsRemaining}
      />

      <div className="p-6 md:p-10 flex flex-col gap-8">
        {/* Step Intro */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary/80 font-mono">
              Output Prediction
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-foreground leading-snug flex items-center gap-2.5">
            <Sparkles className="w-5.5 h-5.5 text-primary shrink-0" />
            <span>Trace & Predict</span>
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed max-w-3xl">{prompt}</p>
        </div>

        {/* Code to Inspect Block */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 font-mono">
            Source Code
          </span>
          <div className="rounded-2xl overflow-hidden border border-border/80 shadow-inner">
            <CodeBlock code={code} language={language} showTryIt={false} />
          </div>
        </div>

        {/* Interactive Terminal Sandbox */}
        <div className="space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 font-mono flex items-center gap-2">
            <Terminal className="w-4 h-4 text-primary" />
            <span>Predicted Output Console</span>
          </span>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 font-mono text-sm text-zinc-300 shadow-lg relative overflow-hidden">
            {/* Top Bar Circles */}
            <div className="flex gap-1.5 mb-5 select-none opacity-65">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs text-zinc-500 font-bold tracking-wide ml-3">
                zsh — prediction-evaluator
              </span>
            </div>

            {options && options.length > 0 ? (
              /* MCQ Terminal Options List */
              <div className="space-y-4">
                <div className="text-zinc-400 select-none text-xs flex items-center gap-1.5 mb-2.5">
                  <ChevronRight className="w-4 h-4 text-zinc-600" />
                  <span>Select predicted output token:</span>
                </div>

                <div
                  className="grid gap-3 sm:grid-cols-2"
                  role="radiogroup"
                  aria-label="Predicted Output"
                >
                  {options.map((opt, idx) => {
                    const isSelected = currentPrediction === opt;

                    let buttonStyles =
                      "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 hover:border-zinc-700";
                    if (isSelected) {
                      buttonStyles =
                        "border-primary bg-primary/10 text-primary font-bold shadow-sm ring-1 ring-primary/40";
                    }
                    if (isSubmitted) {
                      if (isCorrect && isSelected) {
                        buttonStyles =
                          "border-emerald-500/80 bg-emerald-950/40 text-emerald-400 font-bold shadow-md ring-1 ring-emerald-500/30";
                      } else if (isIncorrect && isSelected) {
                        buttonStyles =
                          "border-rose-500/80 bg-rose-950/40 text-rose-400 font-bold shadow-md ring-1 ring-rose-500/30";
                      }
                    }

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
                          "flex items-center gap-3.5 p-4 rounded-xl border text-left font-mono transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/60",
                          buttonStyles,
                        )}
                      >
                        <div
                          className={cn(
                            "w-5.5 h-5.5 rounded-lg border text-xs font-bold flex items-center justify-center shrink-0 select-none",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-zinc-700 bg-zinc-950 text-zinc-500",
                            isCorrect &&
                              isSelected &&
                              "border-emerald-500 bg-emerald-500 text-zinc-950",
                            isIncorrect &&
                              isSelected &&
                              "border-rose-500 bg-rose-500 text-zinc-950",
                          )}
                        >
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span className="flex-1 tracking-wide leading-relaxed break-words text-xs sm:text-sm">
                          {opt}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Inline Terminal Typing Row */
              <div className="flex flex-col gap-3 py-2">
                <div className="flex items-center gap-2 max-w-lg relative bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 focus-within:border-zinc-700 focus-within:ring-1 focus-within:ring-zinc-700 transition-all">
                  <span className="text-primary font-bold shrink-0 select-none">$</span>
                  <span className="text-zinc-500 font-bold shrink-0 select-none">node output:</span>
                  <input
                    type="text"
                    value={currentPrediction}
                    disabled={readOnly || (isSubmitted && isCorrect)}
                    placeholder="Type predicted value..."
                    onChange={(e) => onResponse(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && currentPrediction.trim() && onSubmit) {
                        e.preventDefault();
                        onSubmit();
                      }
                    }}
                    className={cn(
                      "flex-1 bg-transparent border-none outline-none font-mono text-sm text-zinc-100 p-0 focus:ring-0 focus:outline-none placeholder:text-zinc-600 font-bold font-semibold min-w-0",
                    )}
                    aria-label="Type predicted output"
                  />
                  {currentPrediction.length === 0 && !readOnly && !isSubmitted && (
                    <span className="w-2 h-4 bg-primary animate-pulse absolute left-[156px] select-none" />
                  )}
                </div>
              </div>
            )}

            {/* Diagnostic Terminal Output Block after Submission */}
            <AnimatePresence>
              {isSubmitted && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mt-6 pt-5 border-t border-zinc-900 text-xs"
                >
                  {isCorrect ? (
                    <div className="p-4 rounded-xl border border-emerald-950 bg-emerald-950/20 text-emerald-400 space-y-1">
                      <div className="flex items-center gap-2 font-bold mb-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>[PREDICTION CORRECT]</span>
                      </div>
                      <p>❯ Your prediction matches the expected standard output.</p>
                      <p className="opacity-90">
                        ❯ Your prediction: &quot;{currentPrediction}&quot; (exact match)
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-rose-950 bg-rose-950/20 text-rose-400 space-y-1">
                      <div className="flex items-center gap-2 font-bold mb-1">
                        <XCircle className="w-4 h-4 text-rose-400" />
                        <span>[PREDICTION INCORRECT]</span>
                      </div>
                      <p>
                        ❯ Your prediction does not match the expected output. Trace the control flow
                        and try again.
                      </p>
                      <p className="opacity-90">
                        ❯ Your prediction: &quot;{currentPrediction}&quot; (expected standard
                        output)
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
        canSubmit={Boolean(currentPrediction.trim())}
      />
    </ActivityContainer>
  );
}
