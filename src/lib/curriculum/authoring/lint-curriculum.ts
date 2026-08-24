/**
 * Full Curriculum Linter Entrypoint
 */

import type { CurriculumContext, CurriculumDiagnostic, CurriculumLintSummary } from "./types";
import { DIAGNOSTIC_CODES } from "./types";
import { buildLintResult, createDiagnostic, mergeLintResults } from "./diagnostics";
import { lintLesson } from "./lint-lesson";

export function lintCurriculum(context: CurriculumContext): CurriculumLintSummary {
  const diagnostics: CurriculumDiagnostic[] = [];
  const lessons = context.lessons || [];

  const lessonIdSet = new Set<string>();
  const lessonResults = [];

  // 1. Lint each lesson individually
  for (const lesson of lessons) {
    if (lesson.id) {
      if (lessonIdSet.has(lesson.id)) {
        diagnostics.push(
          createDiagnostic(
            DIAGNOSTIC_CODES.DUPLICATE_LESSON_ID,
            "error",
            `Duplicate lesson ID '${lesson.id}' found in curriculum dataset.`,
            `lessons[id=${lesson.id}]`,
            {
              lessonId: lesson.id,
              suggestion: "Ensure all lesson IDs across the curriculum are unique.",
            },
          ),
        );
      } else {
        lessonIdSet.add(lesson.id);
      }
    }

    const lessonResult = lintLesson(lesson, context);
    lessonResults.push(lessonResult);
  }

  // 2. Cross-lesson Prerequisite and Dependency Integrity
  for (const lesson of lessons) {
    const prereqLessonIds = lesson.prerequisites?.lessonIds || [];
    prereqLessonIds.forEach((pId, idx) => {
      if (!lessonIdSet.has(pId)) {
        diagnostics.push(
          createDiagnostic(
            DIAGNOSTIC_CODES.BROKEN_LESSON_REFERENCE,
            "error",
            `Lesson '${lesson.id}' references non-existent prerequisite lesson ID '${pId}'.`,
            `prerequisites.lessonIds[${idx}]`,
            { lessonId: lesson.id },
          ),
        );
      }
    });
  }

  // Prerequisite cycle detection
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function detectCycle(lessonId: string, path: string[]): boolean {
    visited.add(lessonId);
    inStack.add(lessonId);

    const currentLesson = lessons.find((l) => l.id === lessonId);
    const prereqs = currentLesson?.prerequisites?.lessonIds || [];

    for (const pId of prereqs) {
      if (!visited.has(pId)) {
        if (detectCycle(pId, [...path, pId])) return true;
      } else if (inStack.has(pId)) {
        diagnostics.push(
          createDiagnostic(
            DIAGNOSTIC_CODES.PREREQUISITE_CYCLE,
            "error",
            `Circular prerequisite dependency detected: ${[...path, pId].join(" -> ")}`,
            "prerequisites.lessonIds",
            { lessonId },
          ),
        );
        return true;
      }
    }

    inStack.delete(lessonId);
    return false;
  }

  for (const lesson of lessons) {
    if (lesson.id && !visited.has(lesson.id)) {
      detectCycle(lesson.id, [lesson.id]);
    }
  }

  // 3. Orphan Concepts and Skills Detection
  if (context.concepts) {
    const referencedConceptIds = new Set<string>();
    context.topics?.forEach((t) => t.conceptIds?.forEach((c) => referencedConceptIds.add(c)));
    lessons.forEach((l) => l.conceptIds?.forEach((c) => referencedConceptIds.add(c)));

    context.concepts.forEach((c) => {
      if (!referencedConceptIds.has(c.id)) {
        diagnostics.push(
          createDiagnostic(
            DIAGNOSTIC_CODES.ORPHAN_CONCEPT,
            "info",
            `Concept '${c.id}' (${c.title}) is not referenced by any topic or lesson.`,
            `concepts[id=${c.id}]`,
          ),
        );
      }
    });
  }

  if (context.skills) {
    const referencedSkillIds = new Set<string>();
    context.topics?.forEach((t) => t.skillIds?.forEach((s) => referencedSkillIds.add(s)));
    lessons.forEach((l) => l.skillIds?.forEach((s) => referencedSkillIds.add(s)));

    context.skills.forEach((s) => {
      if (!referencedSkillIds.has(s.id)) {
        diagnostics.push(
          createDiagnostic(
            DIAGNOSTIC_CODES.ORPHAN_SKILL,
            "info",
            `Skill '${s.id}' (${s.title}) is not referenced by any topic or lesson.`,
            `skills[id=${s.id}]`,
          ),
        );
      }
    });
  }

  const curriculumLevelResult = buildLintResult(diagnostics);
  const combinedResult = mergeLintResults([...lessonResults, curriculumLevelResult]);

  const validLessonsCount = lessonResults.filter((r) => r.valid).length;

  return {
    totalLessons: lessons.length,
    validLessons: validLessonsCount,
    totalErrors: combinedResult.errors.length,
    totalWarnings: combinedResult.warnings.length,
    totalInfos: combinedResult.infos.length,
    result: combinedResult,
  };
}
