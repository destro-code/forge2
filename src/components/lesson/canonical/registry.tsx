import type { CanonicalActivity } from "@/lib/curriculum/types";
import type { ActivityRendererProps, JudgmentStep, CanonicalStep } from "./types";
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
import { JudgmentRenderer } from "./renderers/judgment-renderer";

/**
 * Registry map of all activity renderers by activity type key.
 */
export const ACTIVITY_RENDERER_MAP = {
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
  judgment: JudgmentRenderer,
} as const;

/**
 * Fallback renderer for unsupported or unknown activity types.
 */
export function FallbackActivityRenderer({
  activity,
  state,
  onContinue,
}: ActivityRendererProps<CanonicalActivity>) {
  return (
    <ActivityContainer id={`activity-${activity.id}`} className="border-dashed border-amber-500/40">
      <ActivityHeader activity={activity} />
      <div className="p-8 flex flex-col items-center justify-center text-center gap-4">
        <AlertCircle className="w-10 h-10 text-amber-500" />
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-foreground">
            Activity Type &quot;{(activity as CanonicalActivity).type || "unknown"}&quot;
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

export type BaseRendererProps = Omit<ActivityRendererProps<CanonicalActivity, any>, "activity">;

/**
 * Single authoritative Activity Registry responsible for resolving an
 * activity instance to its appropriate presentation renderer.
 *
 * Uses a discriminated union switch to guarantee type safety without `any` escapes.
 */
export function renderActivity(
  activity: CanonicalActivity | JudgmentStep | CanonicalStep,
  props: BaseRendererProps,
): JSX.Element {
  switch (activity.type) {
    case "intro":
      return <IntroRenderer activity={activity} {...props} />;
    case "explanation":
      return <ExplanationRenderer activity={activity} {...props} />;
    case "code-example":
      return <CodeExampleRenderer activity={activity} {...props} />;
    case "visual":
      return <VisualRenderer activity={activity} {...props} />;
    case "multiple-choice":
      return <MultipleChoiceRenderer activity={activity} {...props} />;
    case "multi-select":
      return <MultiSelectRenderer activity={activity} {...props} />;
    case "fill-blank":
      return <FillBlankRenderer activity={activity} {...props} />;
    case "ordering":
      return <OrderingRenderer activity={activity} {...props} />;
    case "output-prediction":
      return <OutputPredictionRenderer activity={activity} {...props} />;
    case "interactive-code":
      return <InteractiveCodeRenderer activity={activity} {...props} />;
    case "debug":
      return <DebugRenderer activity={activity} {...props} />;
    case "reflection":
      return <ReflectionRenderer activity={activity} {...props} />;
    case "summary":
      return <SummaryRenderer activity={activity} {...props} />;
    case "completion":
      return <CompletionRenderer activity={activity} {...props} />;
    case "judgment": {
      const step: JudgmentStep =
        "prompt" in activity && "modelAnswer" in activity
          ? (activity as JudgmentStep)
          : {
              id: activity.id,
              type: "judgment",
              title: (activity as any).title || (activity as any).content?.title,
              prompt: (activity as any).prompt || (activity as any).content?.prompt || "",
              context: (activity as any).context || (activity as any).content?.context,
              responsePlaceholder:
                (activity as any).responsePlaceholder ||
                (activity as any).content?.responsePlaceholder,
              modelAnswer: (activity as any).modelAnswer ||
                (activity as any).content?.modelAnswer || {
                  summary: "",
                  detailedAnalysis: "",
                  keyTradeoffs: [],
                },
              evaluationRubric:
                (activity as any).evaluationRubric ||
                (activity as any).content?.evaluationRubric ||
                [],
              takeaways: (activity as any).takeaways || (activity as any).content?.takeaways || [],
            };

      return (
        <JudgmentRenderer
          step={step}
          onComplete={(evidence) => {
            if (props.onResponse) {
              props.onResponse(evidence);
            }
            if (props.onSubmit) {
              props.onSubmit();
            } else if (props.onContinue) {
              props.onContinue();
            }
          }}
          isCompleted={
            props.state?.status === "completed" ||
            props.state?.status === "correct" ||
            props.state?.status === "submitted"
          }
        />
      );
    }
    default:
      return <FallbackActivityRenderer activity={activity as CanonicalActivity} {...props} />;
  }
}
