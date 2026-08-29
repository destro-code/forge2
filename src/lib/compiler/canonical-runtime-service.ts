import { runCompilerPipeline } from "./pipeline";
import { createCanonicalRuntimeManifest, type CanonicalRuntimeActivity } from "./canonical-code-runtime";
import { validationReportToActivityResult, createRuntimeErrorReport } from "./canonical-validation-adapter";
import { resolveActivityExperience, type ResolvedExperience } from "@/lib/curriculum/experience";
import type { ExerciseValidationSpec, ValidationReport } from "@/lib/types/validation";
import type { PlaygroundValidateRequestMessage } from "@/lib/types/validation-messages";

export const CANONICAL_IFRAME_TITLE = "Forge Canonical Activity Preview";
export const CANONICAL_RUNTIME_TIMEOUT_MS = 7000;

/**
 * Structural shape the functions below actually need. Both
 * `InteractiveCodeActivity` and `DebugActivity` satisfy this — the
 * Experience Controller (used by both `interactive-code` and `debug`
 * renderers) calls these with whichever activity it was given, so these
 * functions are not pinned to `InteractiveCodeActivity` specifically.
 */
export interface RuntimeSourceActivity {
  id: string;
  type: string;
  experience?: unknown;
  content: {
    title?: string;
    language?: string;
    starterCode?: string;
    buggyCode?: string;
    htmlFixture?: string;
    testCases?: Array<{ id?: string; description: string; assertion?: string }>;
  };
}

/** The activity's own source field name — `debug` activities author `buggyCode`, everything else `starterCode`. */
function sourceFieldFor(activity: RuntimeSourceActivity): "starterCode" | "buggyCode" {
  return activity.type === "debug" ? "buggyCode" : "starterCode";
}

/**
 * Turns a resolved, validated `ActivityExperience` into the
 * `CanonicalRuntimeActivity` shape `createCanonicalRuntimeManifest` (in
 * canonical-code-runtime.ts) expects. This is the runtime-manifest
 * boundary: no `language === "..."` branching lives here — that inference
 * now lives exactly once, in `resolveActivityExperience`.
 */
function buildRuntimeActivityFromExperience(
  activityId: string,
  title: string | undefined,
  { experience }: ResolvedExperience,
): CanonicalRuntimeActivity {
  switch (experience.kind) {
    case "markup":
      return { id: activityId, runtime: "html", source: experience.editor.starterSource, title };
    case "css":
      return {
        id: activityId,
        runtime: "html-css",
        source: experience.editor.starterSource,
        fixture: experience.environment.htmlFixture,
        title,
      };
    case "javascript":
    case "debug": {
      const htmlFixture = experience.environment?.htmlFixture;
      if (htmlFixture) {
        return {
          id: activityId,
          runtime: "html-javascript",
          source: experience.editor.starterSource,
          fixture: htmlFixture,
          title,
        };
      }
      return { id: activityId, runtime: "javascript", source: experience.editor.starterSource, title };
    }
  }
}

export function createCanonicalRuntimeActivity(
  activity: RuntimeSourceActivity,
  source: string,
): CanonicalRuntimeActivity {
  const resolved = resolveActivityExperience({
    id: activity.id,
    type: activity.type,
    experience: activity.experience,
    // Write the learner's current source into whichever field this
    // activity type authors its source under (`buggyCode` for `debug`,
    // `starterCode` otherwise) so the resolved experience always reflects
    // what the learner is looking at right now, not the original curriculum
    // starter/buggy code.
    content: { ...activity.content, [sourceFieldFor(activity)]: source },
  });
  return buildRuntimeActivityFromExperience(activity.id, activity.content.title, resolved);
}

export function compileCanonicalRuntime(
  activity: RuntimeSourceActivity,
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

function toAssertion(activity: RuntimeSourceActivity, test: { id?: string; description: string; assertion?: string }, index: number) {
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

export function createCanonicalValidationSpec(
  activity: RuntimeSourceActivity,
  source: string = activity.content[sourceFieldFor(activity)] ?? "",
): ExerciseValidationSpec {
  const runtime = activity.content.language === "css" ? "html-css" : "vanilla-dom";
  const assertions = (activity.content.testCases ?? []).map((test, index) => toAssertion(activity, test, index));
  const hasSelectorChallenge = activity.content.language === "html" && /getElementById\(['\"](?:wrong-button-id|submit-btn)['\"]\)/.test(source) && source.includes('id="submit-btn"');
  if (hasSelectorChallenge) {
    assertions.push({ id: "runtime-status", description: "Clicking Launch App updates the status", strategy: "dom_query", target: "#status", expected: { exists: true }, failureMessage: "The button should update the status after it is clicked." });
  }
  return { exerciseId: activity.id, runtime, assertions, ...(hasSelectorChallenge ? { actions: [{ type: "click" as const, selector: "#submit-btn" }] } : {}) };
}

export function createCanonicalValidationRequest(
  activity: RuntimeSourceActivity,
  revision: number,
  source: string = activity.content[sourceFieldFor(activity)] ?? "",
): PlaygroundValidateRequestMessage {
  return { type: "PLAYGROUND_VALIDATE_REQUEST", requestId: `canonical-${activity.id}-${revision}-${Date.now()}`, exerciseId: activity.id, validationSpec: createCanonicalValidationSpec(activity, source), workspaceRevision: revision };
}

export function mapCanonicalValidation(report: ValidationReport | null | undefined) {
  return validationReportToActivityResult(report);
}

export function canonicalRuntimeError(activityId: string, error: unknown) {
  const report = createRuntimeErrorReport(activityId, error instanceof Error ? error.message : String(error));
  return { report, result: validationReportToActivityResult(report) };
}
