import { useState } from "react";
import type { ReflectionActivity } from "@/lib/curriculum/types";
import type { ActivityRendererProps } from "../types";
import { ActivityContainer } from "../primitives/activity-container";
import { ActivityHeader } from "../primitives/activity-header";
import { ActivityActions } from "../primitives/activity-actions";
import { Textarea } from "@/components/ui/textarea";
import { Brain, CheckCircle2, Sparkles, AlertCircle, Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function ReflectionRenderer({
  activity,
  state,
  onResponse,
  onSubmit,
  onContinue,
  readOnly,
}: ActivityRendererProps<ReflectionActivity, string>) {
  const { prompt, minCharacters = 20, sampleResponse, guidelines = [] } = activity.content;

  const currentText = typeof state.response === "string" ? state.response : "";
  const charCount = currentText.trim().length;
  const isSatisfied = charCount >= minCharacters;

  const isSubmitted =
    state.status === "submitted" || state.status === "correct" || state.status === "completed";

  // Calculate percentage of completion towards character limit
  const progressPercent = Math.min(100, (charCount / minCharacters) * 100);

  return (
    <ActivityContainer id={`activity-${activity.id}`} variant="standard">
      <ActivityHeader activity={activity} />

      <div className="p-6 md:p-10 flex flex-col gap-8">
        {/* Prompt Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-500 font-mono flex items-center gap-1">
              <Brain className="w-3.5 h-3.5 animate-pulse" />
              <span>Conceptual Synthesizer</span>
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-foreground leading-snug">
            {prompt}
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Main Writing Workspace (Left 7 Columns) */}
          <div className={cn("space-y-4 lg:col-span-8", isSubmitted && "lg:col-span-6")}>
            <div className="space-y-3">
              <label
                htmlFor={`reflect-textarea-${activity.id}`}
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 font-mono"
              >
                Your Explanation
              </label>
              <div className="relative group">
                <Textarea
                  id={`reflect-textarea-${activity.id}`}
                  value={currentText}
                  disabled={readOnly || isSubmitted}
                  placeholder="Articulate your thought process here in your own engineering vocabulary..."
                  rows={6}
                  onChange={(e) => onResponse(e.target.value)}
                  className="text-base md:text-lg resize-y leading-relaxed font-sans p-5 rounded-2xl border-lesson-border bg-card shadow-xs focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-200"
                  aria-label="Reflection response content"
                />
              </div>

              {/* Interactive Character Progress Widget */}
              <div className="flex flex-col gap-2.5 pt-1.5 font-mono text-xs select-none">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="flex items-center gap-1">
                    {isSatisfied ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-500/80" />
                    )}
                    <span>
                      {charCount} / {minCharacters} character goal
                    </span>
                  </span>
                  {isSatisfied && (
                    <span className="text-emerald-500 font-bold animate-pulse">
                      Requirement Satisfied
                    </span>
                  )}
                </div>
                {/* Slim visual tracking progress bar */}
                <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "h-full rounded-full transition-colors",
                      isSatisfied ? "bg-emerald-500" : "bg-primary",
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Guiding Prompts Sidebar OR Comparative Reveal once Submitted (Right columns) */}
          <div className={cn("lg:col-span-4 space-y-4", isSubmitted && "lg:col-span-6")}>
            <AnimatePresence mode="wait">
              {!isSubmitted ? (
                /* Dynamic Guiding Considerations Sidebar */
                guidelines && guidelines.length > 0 ? (
                  <motion.div
                    key="guidelines"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="p-5 rounded-2xl border border-border/80 bg-muted/20 space-y-3.5 shadow-xs"
                  >
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 font-mono">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span>Thinking Prompts</span>
                    </span>
                    <ul className="grid gap-3 text-sm text-foreground/80">
                      {guidelines.map((g, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 leading-relaxed font-medium"
                        >
                          <span className="text-primary shrink-0 text-base select-none mt-[-2px]">
                            •
                          </span>
                          <span>{g}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ) : null
              ) : /* Polished Side-by-Side Model Reference Reveal */
              sampleResponse ? (
                <motion.div
                  key="sampleResponse"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="p-6 rounded-2xl border border-sky-500/20 bg-sky-500/5 text-sm space-y-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 flex items-center gap-2 font-mono">
                      <Sparkles className="w-4 h-4" />
                      <span>Reference Guide</span>
                    </span>
                    <Quote className="w-6 h-6 text-sky-500/20 rotate-180" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-bold text-foreground leading-snug">Conceptual Benchmark:</p>
                    <p className="leading-relaxed text-foreground/90 font-medium font-sans italic text-sm border-l-2 border-sky-500/30 pl-3">
                      &quot;{sampleResponse}&quot;
                    </p>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <ActivityActions
        status={state.status}
        onSubmit={onSubmit}
        onContinue={onContinue}
        canSubmit={isSatisfied}
        submitLabel="Submit Reflection"
      />
    </ActivityContainer>
  );
}
