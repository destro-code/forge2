/**
 * Curriculum Linter Diagnostic Builders & Result Formatting
 */

import type { CurriculumDiagnostic, CurriculumLintResult, DiagnosticSeverity } from "./types";

export function createDiagnostic(
  code: string,
  severity: DiagnosticSeverity,
  message: string,
  path: string,
  opts?: {
    lessonId?: string;
    activityId?: string;
    suggestion?: string;
  },
): CurriculumDiagnostic {
  return {
    code,
    severity,
    message,
    path,
    ...(opts?.lessonId ? { lessonId: opts.lessonId } : {}),
    ...(opts?.activityId ? { activityId: opts.activityId } : {}),
    ...(opts?.suggestion ? { suggestion: opts.suggestion } : {}),
  };
}

export function buildLintResult(diagnostics: CurriculumDiagnostic[]): CurriculumLintResult {
  const errors = diagnostics.filter((d) => d.severity === "error");
  const warnings = diagnostics.filter((d) => d.severity === "warning");
  const infos = diagnostics.filter((d) => d.severity === "info");

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    infos,
  };
}

export function mergeLintResults(results: CurriculumLintResult[]): CurriculumLintResult {
  const errors: CurriculumDiagnostic[] = [];
  const warnings: CurriculumDiagnostic[] = [];
  const infos: CurriculumDiagnostic[] = [];

  for (const r of results) {
    errors.push(...r.errors);
    warnings.push(...r.warnings);
    infos.push(...r.infos);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    infos,
  };
}
