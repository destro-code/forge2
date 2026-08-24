const fs = require("fs");
let code = fs.readFileSync("src/components/lesson/canonical/canonical-activity-view.tsx", "utf8");

const replacement = `import type { CanonicalActivity } from "@/lib/curriculum/types";
import type { ActivitySessionState, MisconceptionMatchResult } from "@/lib/learning-engine/types";
import type { ActivityValidationResult } from "./types";
import { renderActivity } from "./registry";
import { useActivityRuntime } from "./runtime/use-activity-runtime";

export interface CanonicalActivityViewProps {
  activity: CanonicalActivity;
  activityState?: ActivitySessionState;
  onComplete?: (result?: ActivityValidationResult) => void;
  onResponseChange?: (response: unknown) => void;
  onSubmit?: () => void;
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
        onSubmit: runtime.actions.submit,
        onRetry: runtime.actions.retry,
        onContinue: runtime.actions.continue,
        onRevealHint: runtime.actions.revealHint,
        readOnly: readOnly,
      })}
    </div>
  );
}
`;

fs.writeFileSync("src/components/lesson/canonical/canonical-activity-view.tsx", replacement);
console.log("Replaced canonical-activity-view.tsx");
