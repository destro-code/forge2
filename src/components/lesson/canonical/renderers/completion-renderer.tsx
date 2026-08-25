import type { CompletionActivity } from "@/lib/curriculum/types";
import type { ActivityRendererProps } from "../types";
import { ActivityContainer } from "../primitives/activity-container";
import { ActivityHeader } from "../primitives/activity-header";
import { ActivityActions } from "../primitives/activity-actions";
import { Award, Sparkles, CheckCircle2 } from "lucide-react";

export function CompletionRenderer({
  activity,
  state,
  onContinue,
}: ActivityRendererProps<CompletionActivity>) {
  const { title, message, badgeId, congratulations } = activity.content;

  return (
    <ActivityContainer id={`activity-${activity.id}`} variant="immersive">
      <ActivityHeader activity={activity} />
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-5 py-12 text-center sm:py-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <div className="mt-7 max-w-2xl">
          <p className="text-sm font-semibold text-lesson-accent">Lesson complete</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-lesson-text-primary sm:text-4xl">
            {title || "Lesson completed"}
          </h2>
          {message && (
            <p className="mt-4 text-base leading-7 text-lesson-text-secondary sm:text-lg">
              {message}
            </p>
          )}
          {congratulations && (
            <p className="mt-4 text-sm font-medium leading-6 text-lesson-text-secondary">
              {congratulations}
            </p>
          )}
        </div>

        {badgeId && (
          <div className="mt-9 flex w-full max-w-md items-center gap-4 rounded-xl bg-lesson-surface-subtle px-5 py-4 text-left">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-lesson-accent/10 text-lesson-accent">
              <Award className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-lesson-text-muted">Milestone</p>
              <p className="mt-0.5 truncate text-sm font-semibold text-lesson-text-primary">
                {badgeId}
              </p>
            </div>
            <Sparkles className="h-4 w-4 shrink-0 text-lesson-accent" />
          </div>
        )}
      </div>

      <ActivityActions
        status={state.status}
        isInteractive={false}
        onContinue={onContinue}
        continueLabel="Continue learning"
      />
    </ActivityContainer>
  );
}
