import { normalizeLegacyLesson } from "./legacy-adapter";
import { transformToCanonical } from "./canonical-transformer";
import { lintLesson } from "../authoring/lint-lesson";
import type { CanonicalLesson } from "../types";
import type { MigrationDiagnostic, MigrationManifest, MigrationStatus } from "./types";

export interface MigrationValidationResult {
  sourceLessonId: string;
  canonicalLessonId: string;
  status: MigrationStatus;
  canonical: CanonicalLesson | null;
  manifest: MigrationManifest;
  diagnostics: MigrationDiagnostic[];
}

/**
 * Executes the complete Migration & Validation Pipeline for a single legacy lesson source.
 */
export function validateMigrationPipeline(
  rawLegacyLesson: any,
  version = "1.0.0",
): MigrationValidationResult {
  const diagnostics: MigrationDiagnostic[] = [];
  let status: MigrationStatus = "ready";
  let canonical: CanonicalLesson | null = null;

  // Track validation status of individual stages
  let schemaPassed: "passed" | "failed" = "passed";
  let authoringPassed: "passed" | "failed" = "passed";
  let evidencePassed: "passed" | "failed" = "passed";

  // 1. Stage: Normalization
  const { normalized, diagnostics: normDiag } = normalizeLegacyLesson(rawLegacyLesson);
  normDiag.forEach((d) => diagnostics.push(d));

  const sourceLessonId = rawLegacyLesson?.id || "unknown";
  const targetLessonId = normalized?.id || sourceLessonId;

  if (!normalized) {
    schemaPassed = "failed";
    authoringPassed = "failed";
    evidencePassed = "failed";
    status = "blocked";

    return buildPipelineResult(
      sourceLessonId,
      targetLessonId,
      status,
      null,
      diagnostics,
      schemaPassed,
      authoringPassed,
      evidencePassed,
      rawLegacyLesson,
      null,
      version,
    );
  }

  // 2. Stage: Transformation
  const { canonical: transformed, diagnostics: transDiag } = transformToCanonical(normalized);
  transDiag.forEach((d) => diagnostics.push(d));
  canonical = transformed;

  // 3. Stage: Authoring Lint, Schema Validation, and Evidence Integrity
  // Runs Zod parse and checks evidence rules inside lintLesson.
  const lintResult = lintLesson(transformed);

  // Parse Lint errors/warnings/infos
  lintResult.errors.forEach((e) => {
    // Map lint diagnostics to migration diagnostics
    const isSchemaFailure = e.message.includes("Schema validation failed");

    // Determine mapped severity for migration
    let severity: "error" | "warning" = "error";
    if (
      e.code === "CANONICAL_ACTIVITY_MISSING_VALIDATION" ||
      e.code === "INTERACTIVE_CODE_MISSING_VALIDATION" ||
      e.code === "DEBUG_MISSING_VALIDATION" ||
      e.code === "MULTIPLE_CHOICE_MISSING_VALIDATION" ||
      e.code === "OBJECTIVE_WITHOUT_EVIDENCE" ||
      e.code === "SKILL_WITHOUT_EVIDENCE"
    ) {
      severity = "warning";
    }

    if (severity === "error") {
      if (isSchemaFailure) {
        schemaPassed = "failed";
      } else if (e.code.includes("EVIDENCE") || e.code.includes("OBJECTIVE")) {
        evidencePassed = "failed";
      } else {
        authoringPassed = "failed";
      }
    }

    diagnostics.push({
      code: e.code,
      severity,
      message: `Lint error: ${e.message}`,
      targetPath: e.path,
      legacyLessonId: sourceLessonId,
      canonicalLessonId: targetLessonId,
      sourceActivityId: e.activityId,
      suggestion: e.suggestion,
    });
  });

  lintResult.warnings.forEach((w) => {
    diagnostics.push({
      code: w.code,
      severity: "warning",
      message: `Lint warning: ${w.message}`,
      targetPath: w.path,
      legacyLessonId: sourceLessonId,
      canonicalLessonId: targetLessonId,
      sourceActivityId: w.activityId,
      suggestion: w.suggestion,
    });
  });

  lintResult.infos.forEach((i) => {
    diagnostics.push({
      code: i.code,
      severity: "info",
      message: `Lint info: ${i.message}`,
      targetPath: i.path,
      legacyLessonId: sourceLessonId,
      canonicalLessonId: targetLessonId,
      sourceActivityId: i.activityId,
      suggestion: i.suggestion,
    });
  });

  // Calculate overall migration status
  const hasErrors = diagnostics.some((d) => d.severity === "error");
  const hasWarnings = diagnostics.some((d) => d.severity === "warning");

  if (hasErrors) {
    status = "blocked";
  } else if (hasWarnings) {
    status = "review-required";
  } else {
    status = "ready";
  }

  return buildPipelineResult(
    sourceLessonId,
    targetLessonId,
    status,
    canonical,
    diagnostics,
    schemaPassed,
    authoringPassed,
    evidencePassed,
    rawLegacyLesson,
    canonical,
    version,
  );
}

/**
 * Utility to calculate hashes deterministically for manifest integrity.
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Formulates the uniform validation result and traceability manifest.
 */
function buildPipelineResult(
  sourceId: string,
  targetId: string,
  status: MigrationStatus,
  canonical: CanonicalLesson | null,
  diagnostics: MigrationDiagnostic[],
  schemaPassed: "passed" | "failed",
  authoringPassed: "passed" | "failed",
  evidencePassed: "passed" | "failed",
  sourceRaw: any,
  targetRaw: any,
  version: string,
): MigrationValidationResult {
  const sourceStr = JSON.stringify(sourceRaw || {});
  const targetStr = JSON.stringify(targetRaw || {});

  const sourceHash = simpleHash(sourceStr);
  const canonicalHash = targetRaw ? simpleHash(targetStr) : "";

  const manifest: MigrationManifest = {
    sourceLessonId: sourceId,
    canonicalLessonId: targetId,
    migrationVersion: version,
    sourceHash,
    canonicalHash,
    status,
    diagnostics,
    validation: {
      schema: schemaPassed,
      authoring: authoringPassed,
      evidence: evidencePassed,
    },
    review: {
      required: status === "review-required" || status === "blocked",
      status: "pending",
    },
  };

  return {
    sourceLessonId: sourceId,
    canonicalLessonId: targetId,
    status,
    canonical,
    manifest,
    diagnostics,
  };
}
