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
      <div className="bg-lesson-surface border border-lesson-border rounded-xl shadow-xs overflow-hidden">
        <ActivityHeader activity={activity} />

        <div className="p-6 md:p-10 flex flex-col gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lesson-accent/10 text-lesson-accent text-xs font-semibold">
              <Compass className="w-3.5 h-3.5 animate-pulse" />
              <span>Orientation</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-lesson-text-primary leading-tight">
              {title}
            </h2>
            <p className="text-base sm:text-lg text-lesson-text-secondary leading-relaxed font-medium">
              {hook}
            </p>
          </div>

          {context && (
            <div className="p-5 rounded-xl bg-lesson-surface-subtle border border-lesson-border text-sm text-lesson-text-secondary leading-relaxed max-w-3xl">
              {context}
            </div>
          )}

          {goals && goals.length > 0 && (
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-lesson-text-muted flex items-center gap-2">
                <Target className="w-4 h-4 text-lesson-accent" />
                <span>What You Will Learn</span>
              </h3>
              <ul className="grid sm:grid-cols-2 gap-3.5 max-w-4xl">
                {goals.map((goal, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3.5 p-4 rounded-xl bg-lesson-surface-subtle border border-lesson-border text-sm text-lesson-text-secondary hover:border-lesson-accent/20 hover:bg-lesson-surface-elevated transition-all duration-150"
                  >
                    <div className="w-6 h-6 rounded-full bg-lesson-accent/10 text-lesson-accent flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <span className="leading-relaxed">{goal}</span>
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
          continueLabel="Start Learning"
        />
      </div>
    </ActivityContainer>
  );
}
