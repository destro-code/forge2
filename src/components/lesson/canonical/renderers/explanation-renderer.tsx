import type { ExplanationActivity } from "@/lib/curriculum/types";
import type { ActivityRendererProps } from "../types";
import { ActivityContainer } from "../primitives/activity-container";
import { ActivityHeader } from "../primitives/activity-header";
import { ActivityActions } from "../primitives/activity-actions";
import { Callout } from "@/components/shared/callout";
import { CheckCircle2, Sparkles } from "lucide-react";

export function ExplanationRenderer({
  activity,
  state,
  onContinue,
}: ActivityRendererProps<ExplanationActivity>) {
  const { title, text, callout, keyTakeaway } = activity.content;

  return (
    <ActivityContainer id={`activity-${activity.id}`}>
      <ActivityHeader activity={activity} />

      <div className="p-6 md:p-8 flex flex-col gap-6">
        {title && (
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{title}</h2>
        )}

        <div className="prose prose-neutral dark:prose-invert max-w-none text-base text-foreground/90 leading-relaxed space-y-4">
          {text.split("\n\n").map((para, idx) => (
            <p key={idx}>{para}</p>
          ))}
        </div>

        {callout && <Callout variant={callout.variant} text={callout.text} />}

        {keyTakeaway && (
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary mb-0.5">
                Key Takeaway
              </p>
              <p className="text-sm text-foreground/90 font-medium">{keyTakeaway}</p>
            </div>
          </div>
        )}
      </div>

      <ActivityActions
        status={state.status}
        isInteractive={false}
        onContinue={onContinue}
        continueLabel="Continue"
      />
    </ActivityContainer>
  );
}
