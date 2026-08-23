import type { CompletionActivity } from "@/lib/curriculum/types";
import type { ActivityRendererProps } from "../types";
import { ActivityContainer } from "../primitives/activity-container";
import { ActivityHeader } from "../primitives/activity-header";
import { ActivityActions } from "../primitives/activity-actions";
import { Award, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function CompletionRenderer({
  activity,
  state,
  onContinue,
}: ActivityRendererProps<CompletionActivity>) {
  const { title, message, badge, nextLessonRecommendation } = activity.content;

  return (
    <ActivityContainer id={`activity-${activity.id}`} className="border-primary/40 shadow-md">
      <ActivityHeader activity={activity} />

      <div className="p-8 sm:p-12 flex flex-col items-center text-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-inner animate-in zoom-in-50 duration-300">
          <Award className="w-8 h-8" />
        </div>

        <div className="space-y-2 max-w-lg">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{title}</h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">{message}</p>
        </div>

        {badge && (
          <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <div className="text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Badge Unlocked
              </span>
              <p className="font-semibold text-sm text-foreground">{badge}</p>
            </div>
          </div>
        )}

        {nextLessonRecommendation && (
          <div className="p-4 rounded-xl bg-muted/40 border border-border/70 text-xs text-muted-foreground">
            <span>Recommended Next: </span>
            <span className="font-semibold text-foreground">{nextLessonRecommendation}</span>
          </div>
        )}
      </div>

      <ActivityActions
        status={state.status}
        isInteractive={false}
        onContinue={onContinue}
        continueLabel="Complete Lesson"
      />
    </ActivityContainer>
  );
}
