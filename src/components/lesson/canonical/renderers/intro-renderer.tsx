import type { IntroActivity } from "@/lib/curriculum/types";
import type { ActivityRendererProps } from "../types";
import { ActivityContainer } from "../primitives/activity-container";
import { ActivityHeader } from "../primitives/activity-header";
import { ActivityActions } from "../primitives/activity-actions";
import { Sparkles, Target, Compass } from "lucide-react";

export function IntroRenderer({
  activity,
  state,
  onContinue,
  readOnly,
}: ActivityRendererProps<IntroActivity>) {
  const { title, hook, context, goals } = activity.content;

  return (
    <ActivityContainer id={`activity-${activity.id}`}>
      <ActivityHeader activity={activity} />

      <div className="p-6 md:p-8 flex flex-col gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Compass className="w-3.5 h-3.5" />
            <span>Orientation</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{title}</h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">{hook}</p>
        </div>

        {context && (
          <div className="p-4 rounded-lg bg-muted/40 border border-border/60 text-sm text-foreground/90 leading-relaxed">
            {context}
          </div>
        )}

        {goals && goals.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <span>What You Will Learn</span>
            </h3>
            <ul className="grid gap-2.5">
              {goals.map((goal, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border/70 text-sm text-foreground"
                >
                  <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
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
        continueLabel="Start Learning"
      />
    </ActivityContainer>
  );
}
