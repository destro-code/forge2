import type { IntroActivity } from "@/lib/curriculum/types";
import type { ActivityRendererProps } from "../types";
import { ActivityContainer } from "../primitives/activity-container";
import { ActivityHeader } from "../primitives/activity-header";
import { ActivityActions } from "../primitives/activity-actions";
import { Target, Compass } from "lucide-react";

export function IntroRenderer({
  activity,
  state,
  onContinue,
}: ActivityRendererProps<IntroActivity>) {
  const { title, hook, context, goals } = activity.content;

  return (
    <ActivityContainer id={`activity-${activity.id}`} variant="immersive">
      <div className="overflow-hidden rounded-2xl border border-lesson-border bg-lesson-surface shadow-xs">
        <ActivityHeader activity={activity} />

        <div className="px-6 py-8 sm:px-10 sm:py-12 lg:px-14">
          <div className="max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-lesson-accent">
              <Compass className="h-4 w-4" />
              <span>Begin this lesson</span>
            </div>
            <h2 className="text-3xl font-bold leading-tight tracking-tight text-lesson-text-primary sm:text-4xl lg:text-5xl">
              {title}
            </h2>
            <p className="max-w-2xl text-base leading-7 text-lesson-text-secondary sm:text-lg sm:leading-8">
              {hook}
            </p>
          </div>

          {context && (
            <div className="mt-8 max-w-3xl rounded-xl bg-lesson-surface-subtle px-5 py-4 text-sm leading-6 text-lesson-text-secondary">
              {context}
            </div>
          )}

          {goals && goals.length > 0 && (
            <div className="mt-10 max-w-3xl">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-lesson-text-primary">
                <Target className="h-4 w-4 text-lesson-accent" />
                <span>By the end of this lesson</span>
              </div>
              <ul className="space-y-2">
                {goals.map((goal, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 rounded-lg px-3 py-3 text-sm leading-6 text-lesson-text-secondary"
                  >
                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-lesson-border text-[10px] font-semibold text-lesson-text-muted">
                      {idx + 1}
                    </span>
                    <span>{goal}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <ActivityActions
          status={state.status}
          isInteractive={false}
          onContinue={onContinue}
          continueLabel="Start learning"
        />
      </div>
    </ActivityContainer>
  );
}
