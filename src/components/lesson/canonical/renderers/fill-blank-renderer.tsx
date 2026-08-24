import { useState } from "react";
import type { FillBlankActivity } from "@/lib/curriculum/types";
import type { ActivityRendererProps } from "../types";
import { ActivityContainer } from "../primitives/activity-container";
import { ActivityHeader } from "../primitives/activity-header";
import { ActivityFeedback } from "../primitives/activity-feedback";
import { ActivityActions } from "../primitives/activity-actions";
import { FormInput, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

export function FillBlankRenderer({
  activity,
  state,
  onResponse,
  onSubmit,
  onRetry,
  onContinue,
  onRevealHint,
  readOnly,
}: ActivityRendererProps<FillBlankActivity, string[]>) {
  const { prompt, template, blanks, explanation } = activity.content;

  // Blanks state array
  const rawValues = Array.isArray(state.response) ? state.response : [];
  const blankValues = blanks.map((_, idx) => rawValues[idx] || "");

  const isSubmitted =
    state.status === "submitted" || state.status === "correct" || state.status === "incorrect";
  const isCorrect = state.status === "correct" || state.status === "completed";
  const isIncorrect = state.status === "incorrect";

  const hintsRemaining = (activity.feedback?.hints?.length || 0) - state.hintsRevealed;

  const handleBlankChange = (index: number, val: string) => {
    if (readOnly || (isSubmitted && isCorrect)) return;
    const next = [...blankValues];
    next[index] = val;
    onResponse(next);
  };

  const allFilled = blankValues.every((val) => val.trim().length > 0);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && allFilled && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  };

  // Determine presentation mode (Code vs Conceptual)
  const isCodeBlank = Boolean(
    activity.content.language ||
    template.includes("const ") ||
    template.includes("let ") ||
    template.includes("<") ||
    template.includes("{") ||
    template.includes(";"),
  );

  const parts = template.split(/_{2,}/);
  const canRenderInline = parts.length - 1 === blanks.length;

  return (
    <ActivityContainer id={`activity-${activity.id}`} variant="standard">
      <ActivityHeader
        activity={activity}
        onRevealHint={onRevealHint}
        hintsRemaining={hintsRemaining}
      />

      <div className="p-6 md:p-10 flex flex-col gap-8">
        {/* Header Instructions */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-primary/80 font-mono">
            Fill in the Blanks
          </span>
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-foreground leading-snug">
            {prompt}
          </h2>
        </div>

        {/* Dynamic Spatial Layout */}
        {canRenderInline ? (
          <div
            className={cn(
              "p-6 md:p-8 rounded-2xl border transition-all duration-300 shadow-xs",
              isCodeBlank
                ? "bg-zinc-950 text-zinc-100 font-mono border-zinc-800"
                : "bg-muted/10 text-foreground border-lesson-border leading-relaxed",
            )}
          >
            <div className="whitespace-pre-wrap leading-loose text-base md:text-lg flex flex-wrap items-center gap-y-4 gap-x-1">
              {parts.map((part, idx) => {
                const hasInput = idx < blanks.length;
                const blank = hasInput ? blanks[idx] : null;

                return (
                  <span key={idx} className="inline flex items-center flex-wrap">
                    <span>{part}</span>
                    {hasInput && blank && (
                      <span className="inline-block mx-1.5 relative group">
                        <input
                          type="text"
                          value={blankValues[idx] || ""}
                          disabled={readOnly || (isSubmitted && isCorrect)}
                          placeholder={blank.placeholder || "..."}
                          style={{
                            width: `${Math.max((blankValues[idx] || "").length || (blank.placeholder || "").length || 4, 6) * 10 + 28}px`,
                          }}
                          onChange={(e) => handleBlankChange(idx, e.target.value)}
                          onKeyDown={handleKeyDown}
                          className={cn(
                            "h-10 px-3 rounded-lg border text-center text-base font-semibold focus:outline-none focus:ring-2 transition-all shadow-xs min-w-[70px] max-w-full",
                            isCodeBlank
                              ? "bg-zinc-900 border-zinc-700 text-amber-400 focus:ring-primary focus:border-primary"
                              : "bg-background border-lesson-border text-foreground focus:ring-primary focus:border-primary",
                            isSubmitted &&
                              isCorrect &&
                              "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold focus:ring-emerald-500",
                            isSubmitted &&
                              isIncorrect &&
                              "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold focus:ring-rose-500",
                          )}
                          aria-label={`Blank ${idx + 1}: ${blank.placeholder || blank.id}`}
                        />
                        {blank.hint && isIncorrect && (
                          <span className="absolute left-1/2 -translate-x-1/2 -top-9 bg-amber-600 dark:bg-amber-500 text-white text-[11px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-10">
                            Hint: {blank.hint}
                          </span>
                        )}
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        ) : (
          /* Fallback view if parser counts do not perfectly align */
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-zinc-950 text-zinc-100 font-mono border border-zinc-800 text-sm leading-relaxed overflow-x-auto">
              <pre className="whitespace-pre-wrap">{template}</pre>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {blanks.map((blank, idx) => (
                <div
                  key={blank.id}
                  className="flex flex-col gap-2 p-4 rounded-xl border border-lesson-border bg-muted/5 shadow-xs"
                >
                  <label
                    htmlFor={`fallback-input-${idx}`}
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono"
                  >
                    Blank #{idx + 1} {blank.placeholder ? `(${blank.placeholder})` : ""}
                  </label>
                  <input
                    id={`fallback-input-${idx}`}
                    value={blankValues[idx] || ""}
                    disabled={readOnly || (isSubmitted && isCorrect)}
                    placeholder={blank.placeholder || "Enter answer..."}
                    onChange={(e) => handleBlankChange(idx, e.target.value)}
                    onKeyDown={handleKeyDown}
                    className={cn(
                      "font-mono text-base h-11 px-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all w-full",
                      isCorrect &&
                        "border-emerald-500 bg-emerald-500/5 text-emerald-800 dark:text-emerald-300",
                      isIncorrect &&
                        "border-rose-500 bg-rose-500/5 text-rose-800 dark:text-rose-300",
                    )}
                    aria-label={`Blank ${idx + 1}: ${blank.placeholder || blank.id}`}
                  />
                  {blank.hint && isIncorrect && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 animate-in fade-in flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      <span>Hint: {blank.hint}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Static Hint helper listing if mistakes are made */}
        {isIncorrect && blanks.some((b) => b.hint) && (
          <div className="p-4 rounded-xl border border-amber-500/10 bg-amber-500/5 text-xs text-foreground/90 space-y-2 animate-in fade-in">
            <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400 font-mono uppercase tracking-wider">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>Diagnostic Hints</span>
            </div>
            <ul className="list-disc list-inside space-y-1">
              {blanks.map((b, idx) =>
                b.hint ? (
                  <li key={b.id} className="leading-relaxed">
                    <strong>
                      Blank #{idx + 1} ({b.placeholder || b.id}):
                    </strong>{" "}
                    {b.hint}
                  </li>
                ) : null,
              )}
            </ul>
          </div>
        )}

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
        canSubmit={allFilled}
      />
    </ActivityContainer>
  );
}
