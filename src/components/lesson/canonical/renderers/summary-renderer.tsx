import type { SummaryActivity } from "@/lib/curriculum/types";
import type { ActivityRendererProps } from "../types";
import { ActivityContainer } from "../primitives/activity-container";
import { ActivityHeader } from "../primitives/activity-header";
import { ActivityActions } from "../primitives/activity-actions";
import { Award, CheckCircle2, ArrowRight, HelpCircle } from "lucide-react";

export function SummaryRenderer({
  activity,
  state,
  onContinue,
}: ActivityRendererProps<SummaryActivity>) {
  const { title, keyTakeaways, nextSteps, reviewQuestions } = activity.content;

  return (
    <ActivityContainer id={`activity-${activity.id}`}>
      <ActivityHeader activity={activity} />

      <div className="p-6 md:p-8 flex flex-col gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-500 text-xs font-semibold">
            <Award className="w-3.5 h-3.5" />
            <span>Synthesis</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{title}</h2>
        </div>

        {/* Key Takeaways */}
        {keyTakeaways && keyTakeaways.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Core Takeaways
            </h3>
            <div className="grid gap-2.5">
              {keyTakeaways.map((takeaway, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-card border border-border/80 text-sm"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-foreground/90 font-medium leading-relaxed">{takeaway}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review Questions */}
        {reviewQuestions && reviewQuestions.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <HelpCircle className="w-3.5 h-3.5 text-primary" />
              <span>Self-Check Questions</span>
            </h3>
            <ul className="grid gap-2 text-sm text-muted-foreground">
              {reviewQuestions.map((q, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/30 border border-border/60"
                >
                  <span className="font-mono text-xs text-primary font-bold">Q{idx + 1}:</span>
                  <span className="text-foreground/90">{q}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Next Steps */}
        {nextSteps && nextSteps.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <ArrowRight className="w-3.5 h-3.5 text-primary" />
              <span>Recommended Next Steps</span>
            </h3>
            <div className="grid gap-2">
              {nextSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/70 text-xs font-medium text-foreground"
                >
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold font-mono">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ActivityActions
        status={state.status}
        isInteractive={false}
        onContinue={onContinue}
        continueLabel="Proceed to Completion"
      />
    </ActivityContainer>
  );
}
