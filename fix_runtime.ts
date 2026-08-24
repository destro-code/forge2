import fs from "fs";

const path = "src/components/lesson/canonical/runtime/use-activity-runtime.ts";
let content = fs.readFileSync(path, "utf-8");

content = content.replace(
  "export interface UseActivityRuntimeOptions {",
  "export interface UseActivityRuntimeOptions<T extends CanonicalActivity> {",
);
content = content.replace(
  "  /** The Canonical Activity being rendered */\n  activity: CanonicalActivity;",
  "  /** The Canonical Activity being rendered */\n  activity: T;",
);
content = content.replace(
  "  onResponseChange?: (response: unknown) => void;",
  '  onResponseChange?: (response: ActivityResponse<T["type"]>) => void;',
);
content = content.replace(
  "export function useActivityRuntime(options: UseActivityRuntimeOptions): ActivityRuntime {",
  'export function useActivityRuntime<T extends CanonicalActivity>(options: UseActivityRuntimeOptions<T>): ActivityRuntime<ActivityResponse<T["type"]>> {',
);
content = content.replace(
  "const [localState, setLocalState] = useState<ActivityInteractionState<unknown>>({",
  'const [localState, setLocalState] = useState<ActivityInteractionState<ActivityResponse<T["type"]>>>({',
);
content = content.replace(
  "response: undefined,",
  'response: undefined as unknown as ActivityResponse<T["type"]>,', // first one
);
content = content.replace(
  "response: undefined,",
  'response: undefined as unknown as ActivityResponse<T["type"]>,', // second one
);

content = content.replace(
  "const effectiveState: ActivityInteractionState<unknown> = useMemo(() => {",
  'const effectiveState: ActivityInteractionState<ActivityResponse<T["type"]>> = useMemo(() => {',
);
content = content.replace(
  "response: activityState.response,",
  'response: activityState.response as ActivityResponse<T["type"]>,',
);
content = content.replace(
  "const respond = useCallback(\n    (newResponse: unknown) => {",
  'const respond = useCallback(\n    (newResponse: ActivityResponse<T["type"]>) => {',
);

content = content.replace(
  "const valResult = evaluateActivityValidation(activity, prev.response);",
  "const valResult = evaluateActivityValidation(activity, prev.response);",
);

content = content.replace("activity.hints?.length || 0", "activity.feedback?.hints?.length || 0");

content = content.replace("activity.hints)", "activity.feedback?.hints)");

content = content.replace(
  'import { evaluateActivityValidation } from "../validation";',
  'import { evaluateActivityValidation, type ActivityResponse } from "../validation";',
);

fs.writeFileSync(path, content);
console.log("Updated use-activity-runtime.ts");
