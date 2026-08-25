import type { ExplanationActivity } from "@/lib/curriculum/types";
import type { ActivityRendererProps } from "../types";
import { ActivityContainer } from "../primitives/activity-container";
import { ActivityHeader } from "../primitives/activity-header";
import { ActivityActions } from "../primitives/activity-actions";
import { Callout } from "@/components/shared/callout";
import { Sparkles } from "lucide-react";

export function ExplanationRenderer({
  activity,
  state,
  onContinue,
}: ActivityRendererProps<ExplanationActivity>) {
  const { title, text, callout, keyTakeaway } = activity.content;

  return (
    <ActivityContainer id={`activity-${activity.id}`} variant="reading">
      <div className="mx-auto w-full max-w-[72ch]">
        <ActivityHeader activity={activity} />

        <article className="px-1 py-8 sm:py-10">
          {title && (
            <h2 className="mb-7 text-2xl font-bold tracking-tight text-lesson-text-primary sm:text-3xl">
              {title}
            </h2>
          )}

          <div className="space-y-5 text-base leading-8 text-lesson-text-secondary sm:text-[17px]">
            {text.split("\n\n").map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}
          </div>

          {callout && (
            <div className="mt-8">
              <Callout variant={callout.variant} text={callout.text} />
            </div>
          )}

          {keyTakeaway && (
            <div className="mt-8 flex items-start gap-3 rounded-xl bg-lesson-surface-subtle px-4 py-4">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-lesson-accent" />
              <div>
                <p className="text-xs font-semibold text-lesson-text-muted">Key takeaway</p>
                <p className="mt-1 text-sm font-medium leading-6 text-lesson-text-primary">
                  {keyTakeaway}
                </p>
              </div>
            </div>
          )}
        </article>

        <ActivityActions
          status={state.status}
          isInteractive={false}
          onContinue={onContinue}
          continueLabel="Continue"
        />
      </div>
    </ActivityContainer>
  );
}
