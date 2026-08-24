import type { Lesson as LegacyLesson, LessonSection, LessonExercise } from "../../types";
import type { MigrationDiagnostic } from "./types";

export interface NormalizedLegacyLesson {
  id: string;
  topicId: string;
  moduleId: string;
  order: number;
  title: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedMinutes: number;
  mastery: string;
  learningObjectives: string[];
  prerequisites: string[];
  sections: LessonSection[];
  exercises: LessonExercise[];
  quiz: Array<{
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
  summary: string;
  resources: Array<{ label: string; url: string }>;
  interviewQuestions: string[];
  rawSource: any;
}

/**
 * Normalizes raw legacy lesson inputs, preserving all metadata and ordering,
 * while collecting diagnostic information about missing or unsupported elements.
 */
export function normalizeLegacyLesson(raw: any): {
  normalized: NormalizedLegacyLesson | null;
  diagnostics: MigrationDiagnostic[];
} {
  const diagnostics: MigrationDiagnostic[] = [];

  if (!raw || typeof raw !== "object") {
    diagnostics.push({
      code: "INVALID_RAW_SOURCE",
      severity: "error",
      message: "Legacy lesson source must be a non-null object.",
    });
    return { normalized: null, diagnostics };
  }

  // Validate identity
  const id = typeof raw.id === "string" ? raw.id.trim() : "";
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  const description = typeof raw.description === "string" ? raw.description.trim() : "";

  if (!id) {
    diagnostics.push({
      code: "MISSING_LESSON_ID",
      severity: "error",
      message: "Legacy lesson does not contain a valid 'id'.",
    });
  }

  if (!title) {
    diagnostics.push({
      code: "MISSING_LESSON_TITLE",
      severity: "error",
      message: `Legacy lesson '${id || "unknown"}' is missing a 'title'.`,
      legacyLessonId: id || undefined,
    });
  }

  if (!description) {
    diagnostics.push({
      code: "MISSING_LESSON_DESCRIPTION",
      severity: "warning",
      message: `Legacy lesson '${id}' is missing a 'description'.`,
      legacyLessonId: id,
      suggestion: "Provide a concise summary of the learning material.",
    });
  }

  // Normalize Topic ID and Module ID
  const topicId = typeof raw.topicId === "string" ? raw.topicId.trim() : "general";
  if (!raw.topicId) {
    diagnostics.push({
      code: "MISSING_TOPIC_ID",
      severity: "warning",
      message: `Legacy lesson '${id}' is missing 'topicId'. Defaulting to 'general'.`,
      legacyLessonId: id,
    });
  }

  const moduleId = typeof raw.moduleId === "string" ? raw.moduleId.trim() : `module-${topicId}`;
  const order = typeof raw.order === "number" ? raw.order : 1;

  // Normalize Difficulty
  let difficulty: "Beginner" | "Intermediate" | "Advanced" = "Beginner";
  if (raw.difficulty === "Intermediate" || raw.difficulty === "Advanced") {
    difficulty = raw.difficulty;
  } else if (raw.difficulty && raw.difficulty !== "Beginner") {
    diagnostics.push({
      code: "INVALID_DIFFICULTY",
      severity: "warning",
      message: `Legacy lesson '${id}' has invalid difficulty '${raw.difficulty}'. Defaulting to 'Beginner'.`,
      legacyLessonId: id,
    });
  }

  // Normalize Estimated Minutes
  let estimatedMinutes = typeof raw.estimatedMinutes === "number" ? raw.estimatedMinutes : 0;
  if (estimatedMinutes <= 0) {
    estimatedMinutes = 15;
    diagnostics.push({
      code: "INVALID_ESTIMATED_MINUTES",
      severity: "info",
      message: `Legacy lesson '${id}' estimatedMinutes is missing or invalid (${raw.estimatedMinutes}). Defaulting to 15.`,
      legacyLessonId: id,
    });
  }

  // Normalize Mastery
  const mastery = typeof raw.mastery === "string" ? raw.mastery.trim() : "";
  if (!mastery) {
    diagnostics.push({
      code: "MISSING_MASTERY_STATEMENT",
      severity: "info",
      message: `Legacy lesson '${id}' is missing a 'mastery' standard statement.`,
      legacyLessonId: id,
    });
  }

  // Normalize Objectives
  let learningObjectives: string[] = [];
  if (Array.isArray(raw.learningObjectives)) {
    learningObjectives = raw.learningObjectives
      .map((o: any) => (typeof o === "string" ? o.trim() : ""))
      .filter(Boolean);
  }
  if (learningObjectives.length === 0) {
    learningObjectives = [title || "Master this lesson content."];
    diagnostics.push({
      code: "MISSING_OBJECTIVES",
      severity: "warning",
      message: `Legacy lesson '${id}' has no learning objectives defined. Fabricated one from lesson title.`,
      legacyLessonId: id,
      suggestion: "Define 2-4 explicit learning outcomes.",
    });
  }

  // Normalize Prerequisites
  let prerequisites: string[] = [];
  if (Array.isArray(raw.prerequisites)) {
    prerequisites = raw.prerequisites
      .map((p: any) => (typeof p === "string" ? p.trim() : ""))
      .filter(Boolean);
  }

  // Normalize Sections & detect unsupported types
  const sections: LessonSection[] = [];
  const rawSections = Array.isArray(raw.sections) ? raw.sections : [];
  const activityIdSet = new Set<string>();

  rawSections.forEach((sec: any, idx: number) => {
    if (!sec || typeof sec !== "object") {
      diagnostics.push({
        code: "MALFORMED_SECTION",
        severity: "error",
        message: `Legacy lesson '${id}' section at index ${idx} is not a valid JSON object.`,
        legacyLessonId: id,
      });
      return;
    }

    const type = typeof sec.type === "string" ? sec.type.trim() : "";
    if (!type) {
      diagnostics.push({
        code: "MISSING_SECTION_TYPE",
        severity: "error",
        message: `Legacy lesson '${id}' section at index ${idx} is missing a 'type'.`,
        legacyLessonId: id,
      });
      return;
    }

    // Preserve original ID or generate unique reference
    if (sec.id) {
      if (activityIdSet.has(sec.id)) {
        diagnostics.push({
          code: "DUPLICATE_SOURCE_ID",
          severity: "error",
          message: `Legacy lesson '${id}' contains duplicate element ID '${sec.id}' in sections.`,
          legacyLessonId: id,
          sourceActivityId: sec.id,
        });
      } else {
        activityIdSet.add(sec.id);
      }
    }

    // Capture unsupported structures
    if (type === "walkthrough") {
      diagnostics.push({
        code: "UNSUPPORTED_WALKTHROUGH_CONSTRUCT",
        severity: "warning",
        message: `Section index ${idx} contains walkthrough. This is unsupported in Canonical and requires manual review to flatten.`,
        legacyLessonId: id,
      });
    } else if (type === "collapsible") {
      diagnostics.push({
        code: "UNSUPPORTED_COLLAPSIBLE_CONSTRUCT",
        severity: "warning",
        message: `Section index ${idx} contains collapsible accordion content. This is review-required.`,
        legacyLessonId: id,
      });
    } else if (type === "checkpoint" && sec.assessment) {
      diagnostics.push({
        code: "COMPLEX_CHECKPOINT_CONSTRUCT",
        severity: "warning",
        message: `Section index ${idx} has a checkpoint with an inline assessment. This requires human review to map validation.`,
        legacyLessonId: id,
        sourceActivityId: sec.id,
      });
    } else if (type === "inline-quiz") {
      diagnostics.push({
        code: "UNSUPPORTED_INLINE_QUIZ",
        severity: "error",
        message: `Section index ${idx} references external inline-quiz '${sec.quizId}'. This is BLOCKED as external references are unsupported.`,
        legacyLessonId: id,
      });
    }

    sections.push(sec);
  });

  // Normalize Exercises
  const exercises: LessonExercise[] = [];
  const rawExercises = Array.isArray(raw.exercises) ? raw.exercises : [];
  rawExercises.forEach((ex: any, idx: number) => {
    if (!ex || typeof ex !== "object") return;
    const exId = typeof ex.id === "string" ? ex.id.trim() : `ex-${idx}`;

    if (activityIdSet.has(exId)) {
      diagnostics.push({
        code: "DUPLICATE_SOURCE_ID",
        severity: "error",
        message: `Legacy lesson '${id}' contains duplicate exercise ID '${exId}'.`,
        legacyLessonId: id,
        sourceActivityId: exId,
      });
    } else {
      activityIdSet.add(exId);
    }

    exercises.push(ex);
  });

  // Normalize Quiz Questions
  const quiz: Array<{
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }> = [];
  const rawQuizzes = Array.isArray(raw.quiz) ? raw.quiz : [];
  rawQuizzes.forEach((q: any, idx: number) => {
    if (!q || typeof q !== "object") return;
    const qId = typeof q.id === "string" ? q.id.trim() : `quiz-${idx}`;

    if (activityIdSet.has(qId)) {
      diagnostics.push({
        code: "DUPLICATE_SOURCE_ID",
        severity: "error",
        message: `Legacy lesson '${id}' contains duplicate quiz question ID '${qId}'.`,
        legacyLessonId: id,
        sourceActivityId: qId,
      });
    } else {
      activityIdSet.add(qId);
    }

    quiz.push({
      id: qId,
      question: typeof q.question === "string" ? q.question : "Question text missing",
      options: Array.isArray(q.options) ? q.options.map(String) : [],
      correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : 0,
      explanation: typeof q.explanation === "string" ? q.explanation : "",
    });
  });

  // Normalize Summary
  const summary = typeof raw.summary === "string" ? raw.summary.trim() : "";
  if (!summary) {
    diagnostics.push({
      code: "MISSING_SUMMARY",
      severity: "warning",
      message: `Legacy lesson '${id}' has no final summary statement.`,
      legacyLessonId: id,
      suggestion: "Write a 1-2 sentence takeaway summary.",
    });
  }

  // Normalize Resources and Interview Questions
  const resources: Array<{ label: string; url: string }> = [];
  if (Array.isArray(raw.resources)) {
    raw.resources.forEach((res: any) => {
      if (res && typeof res === "object" && res.label && res.url) {
        resources.push({
          label: String(res.label).trim(),
          url: String(res.url).trim(),
        });
      }
    });
  }

  let interviewQuestions: string[] = [];
  if (Array.isArray(raw.interviewQuestions)) {
    interviewQuestions = raw.interviewQuestions
      .map(String)
      .map((q) => q.trim())
      .filter(Boolean);
  }

  if (!id || diagnostics.some((d) => d.severity === "error")) {
    return { normalized: null, diagnostics };
  }

  const normalized: NormalizedLegacyLesson = {
    id,
    topicId,
    moduleId,
    order,
    title,
    description,
    difficulty,
    estimatedMinutes,
    mastery,
    learningObjectives,
    prerequisites,
    sections,
    exercises,
    quiz,
    summary,
    resources,
    interviewQuestions,
    rawSource: raw,
  };

  return { normalized, diagnostics };
}
