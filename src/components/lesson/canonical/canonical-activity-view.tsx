import type { CanonicalActivity } from "@/lib/curriculum/types";
import type { ActivitySessionState, MisconceptionMatchResult } from "@/lib/learning-engine/types";
import type { ActivityValidationResult, ActivityCompletionEvent } from "./types";
import { renderActivity } from "./registry";
import { useActivityRuntime } from "./runtime/use-activity-runtime";

export interface CanonicalActivityViewProps {
  activity: CanonicalActivity;
  activityState?: ActivitySessionState;
  onComplete?: (event: ActivityCompletionEvent<unknown>) => void;
  onResponseChange?: (response: unknown) => void;
  onSubmit?: () => void;
  onRuntimeValidation?: (result: ActivityValidationResult) => void;
  onRetry?: () => void;
  onContinue?: () => void;
  onRevealHint?: () => void;
  matchedMisconception?: MisconceptionMatchResult | null;
  readOnly?: boolean;
  className?: string;
}

export function CanonicalActivityView(props: CanonicalActivityViewProps) {
  const { activity, readOnly, className } = props;
  const runtime = useActivityRuntime(props);
  return (
    <div className={className}>
      {renderActivity(activity, {
        state: runtime.state,
        onResponse: runtime.actions.respond,
        onSubmit: props.onSubmit ?? runtime.actions.submit,
        onRuntimeValidation: props.onRuntimeValidation,
        onRetry: runtime.actions.retry,
        onContinue: runtime.actions.continue,
        onRevealHint: runtime.actions.revealHint,
        readOnly: readOnly,
      })}
    </div>
  );
}
