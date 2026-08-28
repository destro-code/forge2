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
  const language = activity.content.language;
  if (language === "html") {
    const selector = test.assertion?.match(/querySelector\(['\"]([^'\"]+)/)?.[1] ?? "body";
    return { id: test.id ?? `test-${index}`, description: test.description, strategy: "dom_query" as const, target: selector, expected: { exists: true }, failureMessage: test.description };
  }
  if (language === "css") {
    const match = test.assertion?.match(/rules\[['\"]([^'\"]+)['\"]\].*?\[['\"]([^'\"]+)['\"]\].*?['\"]([^'\"]+)['\"]/);
    return { id: test.id ?? `test-${index}`, description: test.description, strategy: "computed_style" as const, target: match?.[1] ?? ".navbar", expected: { property: match?.[2] ?? "display", value: match?.[3] ?? "flex" }, failureMessage: test.description };
  }
  return { id: test.id ?? `test-${index}`, description: test.description, strategy: "js_evaluation" as const, expected: { expression: test.assertion ?? "false", expectedValue: true }, failureMessage: test.description };
}

export function createCanonicalValidationSpec(activity: InteractiveCodeActivity): ExerciseValidationSpec {
  const runtime = activity.content.language === "css" ? "html-css" : "vanilla-dom";
  return { exerciseId: activity.id, runtime, assertions: (activity.content.testCases ?? []).map((test, index) => toAssertion(activity, test, index)) };
}

export function createCanonicalValidationRequest(activity: InteractiveCodeActivity, revision: number): PlaygroundValidateRequestMessage {
  return { type: "PLAYGROUND_VALIDATE_REQUEST", requestId: `canonical-${activity.id}-${revision}-${Date.now()}`, exerciseId: activity.id, validationSpec: createCanonicalValidationSpec(activity), workspaceRevision: revision };
}

export function mapCanonicalValidation(report: ValidationReport | null | undefined) {
  return validationReportToActivityResult(report);
}

export function canonicalRuntimeError(activityId: string, error: unknown) {
  const report = createRuntimeErrorReport(activityId, error instanceof Error ? error.message : String(error));
  return { report, result: validationReportToActivityResult(report) };
}
