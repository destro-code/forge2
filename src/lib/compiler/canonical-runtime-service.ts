import { runCompilerPipeline } from "./pipeline";
import { createCanonicalRuntimeManifest, type CanonicalRuntimeActivity } from "./canonical-code-runtime";
import { validationReportToActivityResult, createRuntimeErrorReport } from "./canonical-validation-adapter";
import type { InteractiveCodeActivity } from "@/lib/curriculum/types";
import type { ExerciseValidationSpec, ValidationReport } from "@/lib/types/validation";
import type { PlaygroundValidateRequestMessage } from "@/lib/types/validation-messages";

export const CANONICAL_IFRAME_TITLE = "Forge Canonical Activity Preview";
export const CANONICAL_RUNTIME_TIMEOUT_MS = 7000;

export function createCanonicalRuntimeActivity(
  activity: InteractiveCodeActivity,
  source: string,
): CanonicalRuntimeActivity {
  if (activity.content.language === "html") {
    return { id: activity.id, runtime: "html", source, title: activity.content.title };
  }
  if (activity.content.language === "css") {
    return {
      id: activity.id,
      runtime: "html-css",
      source,
      fixture: `<nav class="navbar"><span>Forge</span><span>Lessons</span></nav><div class="modal-backdrop"><div class="modal">Modal</div></div>`,
      title: activity.content.title,
    };
  }
  return { id: activity.id, runtime: "javascript", source, title: activity.content.title };
}

export function compileCanonicalRuntime(
  activity: InteractiveCodeActivity,
  source: string,
  workspaceRevision: number,
) {
  const runtimeActivity = createCanonicalRuntimeActivity(activity, source);
  const manifest = createCanonicalRuntimeManifest(runtimeActivity).manifest;
  return runCompilerPipeline(manifest, {
    workspaceRevision,
    isInline: true,
    title: activity.content.title,
  });
}

function toAssertion(activity: InteractiveCodeActivity, test: { id?: string; description: string; assertion?: string }, index: number) {
  const base = { id: test.id ?? `test-${index}`, description: test.description, failureMessage: test.description };
  if (activity.content.language === "html") {
    const selector = test.assertion?.match(/querySelector\(['\"]([^'\"]+)/)?.[1] ?? "body";
    return { ...base, strategy: "dom_query" as const, target: selector, expected: { exists: true } };
  }
  if (activity.content.language === "css") {
    const match = test.assertion?.match(/rules\[['\"]([^'\"]+)['\"]\]\?\.\[['\"]([^'\"]+)['\"]\]\s*===\s*['\"]([^'\"]+)/);
    return { ...base, strategy: "computed_style" as const, target: match?.[1] ?? ".navbar", expected: { property: match?.[2] ?? "display", value: match?.[3] ?? "flex" } };
  }
  const jsMatch = test.assertion?.match(/^(.*?)\s*===\s*(.+)$/s);
  let expectedValue: unknown = true;
  if (jsMatch) {
    const raw = jsMatch[2].trim();
    try { expectedValue = JSON.parse(raw); } catch { expectedValue = raw.replace(/^['\"]|['\"]$/g, ""); }
  }
  return { ...base, strategy: "js_evaluation" as const, expected: { expression: jsMatch?.[1]?.trim() ?? test.assertion ?? "false", expectedValue } };
}

export function createCanonicalValidationSpec(activity: InteractiveCodeActivity, source = activity.content.starterCode): ExerciseValidationSpec {
  const runtime = activity.content.language === "css" ? "html-css" : "vanilla-dom";
  const assertions = (activity.content.testCases ?? []).map((test, index) => toAssertion(activity, test, index));
  const hasSelectorChallenge = activity.content.language === "html" && /getElementById\(['\"](?:wrong-button-id|submit-btn)['\"]\)/.test(source) && source.includes('id="submit-btn"');
  if (hasSelectorChallenge) {
    assertions.push({ id: "runtime-status", description: "Clicking Launch App updates the status", strategy: "dom_query", target: "#status", expected: { exists: true }, failureMessage: "The button should update the status after it is clicked." });
  }
  return { exerciseId: activity.id, runtime, assertions, ...(hasSelectorChallenge ? { actions: [{ type: "click" as const, selector: "#submit-btn" }] } : {}) };
}

export function createCanonicalValidationRequest(activity: InteractiveCodeActivity, revision: number, source = activity.content.starterCode): PlaygroundValidateRequestMessage {
  return { type: "PLAYGROUND_VALIDATE_REQUEST", requestId: `canonical-${activity.id}-${revision}-${Date.now()}`, exerciseId: activity.id, validationSpec: createCanonicalValidationSpec(activity, source), workspaceRevision: revision };
}

export function mapCanonicalValidation(report: ValidationReport | null | undefined) {
  return validationReportToActivityResult(report);
}

export function canonicalRuntimeError(activityId: string, error: unknown) {
  const report = createRuntimeErrorReport(activityId, error instanceof Error ? error.message : String(error));
  return { report, result: validationReportToActivityResult(report) };
}
