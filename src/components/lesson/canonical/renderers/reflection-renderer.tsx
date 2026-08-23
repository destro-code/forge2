import { useState } from "react";
import type { ReflectionActivity } from "@/lib/curriculum/types";
import type { ActivityRendererProps } from "../types";
import { ActivityContainer } from "../primitives/activity-container";
import { ActivityHeader } from "../primitives/activity-header";
import { ActivityFeedback } from "../primitives/activity-feedback";
import { ActivityActions } from "../primitives/activity-actions";
import { Textarea } from "@/components/ui/textarea";
import { Brain, CheckCircle2, Sparkles, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReflectionRenderer({
  activity,
  state,
  onResponse,
  onSubmit,
  onRetry,
  onContinue,
  readOnly,
}: ActivityRendererProps<ReflectionActivity, string>) {
  const { prompt, minCharacters = 20, sampleResponse, guidelines } = activity.content;

  const currentText = typeof state.response === "string" ? state.response : "";
  const charCount = currentText.trim().length;
  const isSatisfied = charCount >= minCharacters;

  const isSubmitted =
    state.status === "submitted" || state.status === "correct" || state.status === "completed";

  return (
    <ActivityContainer id={`activity-${activity.id}`}>
      <ActivityHeader activity={activity} />

      <div className="p-6 md:p-8 flex flex-col gap-6">
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Brain className="w-5 h-5 text-sky-500" />
            <span>Engineering Reflection</span>
          </h2>
          <p className="text-base text-foreground/90 leading-relaxed font-medium">{prompt}</p>
        </div>

        {guidelines && guidelines.length > 0 && (
          <div className="p-4 rounded-xl bg-muted/40 border border-border/80 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Guiding Considerations</span>
            </span>
            <ul className="grid gap-1.5 text-xs text-muted-foreground">
              {guidelines.map((g, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Text Input */}
        <div className="space-y-2">
          <Textarea
            value={currentText}
            disabled={readOnly || isSubmitted}
            placeholder="Write your explanation or reflection here in your own words..."
            rows={5}
            onChange={(e) => onResponse(e.target.value)}
            className="text-sm resize-y leading-relaxed font-sans"
            aria-label="Reflection response"
          />

          <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
            <span>
              {charCount} / {minCharacters} characters minimum
            </span>
            {isSatisfied && (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ready to submit</span>
              </span>
            )}
          </div>
        </div>

        {/* Sample Response Reveal on Submit */}
        {isSubmitted && sampleResponse && (
          <div className="p-5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-950 dark:text-sky-100 text-sm space-y-2 animate-in fade-in duration-200">
            <p className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Sample Model Reflection</span>
            </p>
            <p className="leading-relaxed text-foreground/90 font-medium">{sampleResponse}</p>
          </div>
        )}
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
