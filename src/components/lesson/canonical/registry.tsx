import type { CanonicalActivity } from "@/lib/curriculum/types";
import type { ActivityComponent } from "./types";
import { ActivityContainer } from "./primitives/activity-container";
import { ActivityHeader } from "./primitives/activity-header";
import { ActivityActions } from "./primitives/activity-actions";
import { AlertCircle } from "lucide-react";

// Native Renderers
import { IntroRenderer } from "./renderers/intro-renderer";
import { ExplanationRenderer } from "./renderers/explanation-renderer";
import { CodeExampleRenderer } from "./renderers/code-example-renderer";
import { VisualRenderer } from "./renderers/visual-renderer";
import { MultipleChoiceRenderer } from "./renderers/multiple-choice-renderer";
import { MultiSelectRenderer } from "./renderers/multi-select-renderer";
import { FillBlankRenderer } from "./renderers/fill-blank-renderer";
import { OrderingRenderer } from "./renderers/ordering-renderer";
import { OutputPredictionRenderer } from "./renderers/output-prediction-renderer";
import { InteractiveCodeRenderer } from "./renderers/interactive-code-renderer";
import { DebugRenderer } from "./renderers/debug-renderer";
import { ReflectionRenderer } from "./renderers/reflection-renderer";
import { SummaryRenderer } from "./renderers/summary-renderer";
import { CompletionRenderer } from "./renderers/completion-renderer";

/**
 * Fallback renderer for unsupported or unknown activity types.
 */
export function FallbackActivityRenderer({
  activity,
  state,
  onContinue,
}: Parameters<ActivityComponent<CanonicalActivity>>[0]) {
  return (
    <ActivityContainer id={`activity-${activity.id}`} className="border-dashed border-amber-500/40">
      <ActivityHeader activity={activity} />
      <div className="p-8 flex flex-col items-center justify-center text-center gap-4">
        <AlertCircle className="w-10 h-10 text-amber-500" />
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-foreground">
            Activity Type &quot;{activity.type}&quot;
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            This activity is rendered with standard presentation fallback.
          </p>
        </div>
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

/**
 * Activity Renderer Registry mapping all 14 canonical activity types to their native components.
 */
export const ActivityRendererRegistry: Record<CanonicalActivity["type"], ActivityComponent<any>> = {
  intro: IntroRenderer,
  explanation: ExplanationRenderer,
  "code-example": CodeExampleRenderer,
  visual: VisualRenderer,
  "multiple-choice": MultipleChoiceRenderer,
  "multi-select": MultiSelectRenderer,
  "fill-blank": FillBlankRenderer,
  ordering: OrderingRenderer,
  "output-prediction": OutputPredictionRenderer,
  "interactive-code": InteractiveCodeRenderer,
  debug: DebugRenderer,
  reflection: ReflectionRenderer,
  summary: SummaryRenderer,
  completion: CompletionRenderer,
};

/**
 * Resolves the appropriate renderer component for a given activity type.
 */
export function getActivityRenderer(type: string): ActivityComponent<CanonicalActivity> {
  const renderer = (ActivityRendererRegistry as Record<string, ActivityComponent<any>>)[type];
  return renderer || FallbackActivityRenderer;
}
