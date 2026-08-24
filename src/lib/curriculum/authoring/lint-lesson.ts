/**
 * Single Lesson Authoring Linter Entrypoint
 */

import type { CanonicalLesson } from "../types";
import { canonicalLessonSchema } from "../schema";
import type { CurriculumContext, CurriculumLintResult, CurriculumDiagnostic } from "./types";
import { DIAGNOSTIC_CODES } from "./types";
import { buildLintResult, createDiagnostic } from "./diagnostics";
import {
  checkLessonStructureAndIDs,
  checkActivityValidationRules,
  checkEvidenceIntegrity,
  checkObjectiveIntegrity,
  checkSkillIntegrity,
  checkActivitySequenceQuality,
  checkHintQuality,
  checkCompletionRuleIntegrity,
  checkContentQuality,
} from "./rules";

export function lintLesson(rawLesson: unknown, context?: CurriculumContext): CurriculumLintResult {
  const diagnostics: CurriculumDiagnostic[] = [];

  if (!rawLesson || typeof rawLesson !== "object") {
    diagnostics.push(
      createDiagnostic(
        DIAGNOSTIC_CODES.INVALID_ACTIVITY_FIELD,
        "error",
        "Lesson must be a non-null JSON object.",
        "$",
      ),
    );
    return buildLintResult(diagnostics);
  }

  // Schema Validation check via Zod
  const parseResult = canonicalLessonSchema.safeParse(rawLesson);
  if (!parseResult.success) {
    for (const issue of parseResult.error.issues) {
      const pathStr = issue.path.join(".") || "$";

      // Map specific Zod issue codes to diagnostic codes
      let code = DIAGNOSTIC_CODES.INVALID_ACTIVITY_FIELD;
      if (pathStr.includes("activities") && pathStr.includes("type")) {
        code = DIAGNOSTIC_CODES.UNKNOWN_ACTIVITY_TYPE;
      } else if (pathStr.includes("validation")) {
        code = DIAGNOSTIC_CODES.CANONICAL_ACTIVITY_MISSING_VALIDATION;
      }

      diagnostics.push(
        createDiagnostic(
          code,
          "error",
          `Schema validation failed at ${pathStr}: ${issue.message}`,
          pathStr,
          { lessonId: (rawLesson as any).id },
        ),
      );
    }
  }

  // Cast for deep semantic inspection
  const lesson = rawLesson as CanonicalLesson;

  // Run all deterministic rule modules
  diagnostics.push(...checkLessonStructureAndIDs(lesson, context));
  diagnostics.push(...checkActivityValidationRules(lesson));
  diagnostics.push(...checkEvidenceIntegrity(lesson));
  diagnostics.push(...checkObjectiveIntegrity(lesson));
  diagnostics.push(...checkSkillIntegrity(lesson));
  diagnostics.push(...checkActivitySequenceQuality(lesson));
  diagnostics.push(...checkHintQuality(lesson));
  diagnostics.push(...checkCompletionRuleIntegrity(lesson));
  diagnostics.push(...checkContentQuality(lesson));

  return buildLintResult(diagnostics);
}
