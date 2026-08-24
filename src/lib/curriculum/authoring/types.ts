/**
 * Canonical Curriculum Authoring Specification & Diagnostic Types
 */

import type {
  Academy,
  CanonicalLevel,
  CanonicalModule,
  CanonicalTopic,
  Concept,
  Skill,
  Misconception,
  CanonicalLesson,
} from "../types";

export type DiagnosticSeverity = "error" | "warning" | "info";

export interface CurriculumDiagnostic {
  code: string;
  severity: DiagnosticSeverity;
  message: string;
  path: string;
  lessonId?: string;
  activityId?: string;
  suggestion?: string;
}

export interface CurriculumLintResult {
  valid: boolean;
  errors: CurriculumDiagnostic[];
  warnings: CurriculumDiagnostic[];
  infos: CurriculumDiagnostic[];
}

export interface CurriculumContext {
  academy?: Academy;
  levels?: CanonicalLevel[];
  modules?: CanonicalModule[];
  topics?: CanonicalTopic[];
  concepts?: Concept[];
  skills?: Skill[];
  misconceptions?: Misconception[];
  lessons?: CanonicalLesson[];
}

export interface CurriculumLintSummary {
  totalLessons: number;
  validLessons: number;
  totalErrors: number;
  totalWarnings: number;
  totalInfos: number;
  result: CurriculumLintResult;
}

/**
 * Diagnostic Codes for Authoring & Linting
 */
export const DIAGNOSTIC_CODES = {
  // Structural & ID Errors
  DUPLICATE_LESSON_ID: "DUPLICATE_LESSON_ID",
  DUPLICATE_ACTIVITY_ID: "DUPLICATE_ACTIVITY_ID",
  DUPLICATE_OBJECTIVE_ID: "DUPLICATE_OBJECTIVE_ID",
  DUPLICATE_OPTION_ID: "DUPLICATE_OPTION_ID",
  DUPLICATE_BLANK_ID: "DUPLICATE_BLANK_ID",
  DUPLICATE_ITEM_ID: "DUPLICATE_ITEM_ID",
  UNKNOWN_ACTIVITY_TYPE: "UNKNOWN_ACTIVITY_TYPE",
  INVALID_ACTIVITY_FIELD: "INVALID_ACTIVITY_FIELD",

  // Reference Resolution
  BROKEN_TOPIC_REFERENCE: "BROKEN_TOPIC_REFERENCE",
  BROKEN_OBJECTIVE_REFERENCE: "BROKEN_OBJECTIVE_REFERENCE",
  BROKEN_SKILL_REFERENCE: "BROKEN_SKILL_REFERENCE",
  BROKEN_CONCEPT_REFERENCE: "BROKEN_CONCEPT_REFERENCE",
  BROKEN_MISCONCEPTION_REFERENCE: "BROKEN_MISCONCEPTION_REFERENCE",
  BROKEN_LESSON_REFERENCE: "BROKEN_LESSON_REFERENCE",

  // Activity Validation Configuration
  CANONICAL_ACTIVITY_MISSING_VALIDATION: "CANONICAL_ACTIVITY_MISSING_VALIDATION",
  INTERACTIVE_CODE_MISSING_VALIDATION: "INTERACTIVE_CODE_MISSING_VALIDATION",
  DEBUG_MISSING_VALIDATION: "DEBUG_MISSING_VALIDATION",
  MULTIPLE_CHOICE_MISSING_VALIDATION: "MULTIPLE_CHOICE_MISSING_VALIDATION",
  INVALID_ACTIVITY_VALIDATION: "INVALID_ACTIVITY_VALIDATION",
  MULTIPLE_CHOICE_ONE_OPTION: "MULTIPLE_CHOICE_ONE_OPTION",

  // Evidence & Objective Integrity
  EVIDENCE_REQUIREMENT_NONEXISTENT_ACTIVITY: "EVIDENCE_REQUIREMENT_NONEXISTENT_ACTIVITY",
  EVIDENCE_REQUIREMENT_IMPOSSIBLE_ACTIVITY: "EVIDENCE_REQUIREMENT_IMPOSSIBLE_ACTIVITY",
  OBJECTIVE_WITHOUT_EVIDENCE: "OBJECTIVE_WITHOUT_EVIDENCE",
  SKILL_WITHOUT_EVIDENCE: "SKILL_WITHOUT_EVIDENCE",

  // Completion Rules
  INVALID_COMPLETION_RULE: "INVALID_COMPLETION_RULE",
  COMPLETION_RULE_UNREACHABLE: "COMPLETION_RULE_UNREACHABLE",

  // Pedagogical Sequence Quality (Warnings)
  PEDAGOGICAL_SEQUENCE_WARNING: "PEDAGOGICAL_SEQUENCE_WARNING",
  PASSIVE_LESSON_WARNING: "PASSIVE_LESSON_WARNING",
  MISSING_RETRIEVAL_WARNING: "MISSING_RETRIEVAL_WARNING",
  MISSING_SYNTHESIS_WARNING: "MISSING_SYNTHESIS_WARNING",

  // Quality & Heuristics
  MALFORMED_HINTS: "MALFORMED_HINTS",
  DUPLICATE_PROMPT_WARNING: "DUPLICATE_PROMPT_WARNING",
  CONTENT_QUALITY_WARNING: "CONTENT_QUALITY_WARNING",

  // Curriculum Graph & Integrity
  ORPHAN_CONCEPT: "ORPHAN_CONCEPT",
  ORPHAN_SKILL: "ORPHAN_SKILL",
  PREREQUISITE_CYCLE: "PREREQUISITE_CYCLE",
} as const;

export type DiagnosticCode = (typeof DIAGNOSTIC_CODES)[keyof typeof DIAGNOSTIC_CODES];
