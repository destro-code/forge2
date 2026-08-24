import type { CurriculumDiagnostic } from "../authoring/types";

/**
 * Diagnostic record produced by the migration pipeline.
 */
export interface MigrationDiagnostic {
  code: string;
  severity: "error" | "warning" | "info";
  message: string;
  sourcePath?: string;
  targetPath?: string;
  legacyLessonId?: string;
  canonicalLessonId?: string;
  sourceActivityId?: string;
  suggestion?: string;
}

/**
 * Migration readiness status for a lesson.
 */
export type MigrationStatus = "ready" | "review-required" | "blocked" | "approved";

/**
 * Traceability manifest for a migrated lesson, mapping it back to its original source.
 */
export interface MigrationManifest {
  sourceLessonId: string;
  canonicalLessonId: string;
  migrationVersion: string;
  sourceHash: string;
  canonicalHash: string;
  status: MigrationStatus;
  diagnostics: MigrationDiagnostic[];
  validation: {
    schema: "passed" | "failed";
    authoring: "passed" | "failed";
    evidence: "passed" | "failed";
  };
  review: {
    required: boolean;
    status: "pending" | "completed";
  };
}

/**
 * Aggregated quality report of the entire migration pipeline run.
 */
export interface MigrationReport {
  summary: {
    totalLessons: number;
    ready: number;
    reviewRequired: number;
    blocked: number;
    errors: number;
    warnings: number;
    infos: number;
    activityConversionCounts: Record<string, number>;
    unsupportedConstructs: number;
    evidenceProblems: number;
    objectiveProblems: number;
    skillProblems: number;
    completionRuleProblems: number;
  };
  details: Array<{
    sourceLessonId: string;
    canonicalLessonId: string;
    sourceActivityCount: number;
    canonicalActivityCount: number;
    status: MigrationStatus;
    diagnostics: MigrationDiagnostic[];
    validation: {
      schema: "passed" | "failed";
      authoring: "passed" | "failed";
      evidence: "passed" | "failed";
    };
  }>;
}
