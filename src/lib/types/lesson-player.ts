import type { LessonSection, LessonExercise, CheckpointAssessmentConfig } from "../types";
import type { ExerciseValidationSpec } from "./validation";

export type LessonStepType =
  "content" | "code-example" | "interactive-exercise" | "quiz" | "checkpoint";

export interface LessonStepBase {
  /** Presentation identity for this step */
  id: string;
  /** Primary presentation classification */
  type: LessonStepType;
  /** Title or label for step display */
  title?: string;
  /** Parent lesson ID */
  lessonId: string;
}

export interface ContentLessonStep extends LessonStepBase {
  type: "content";
  /** Canonical section ID if applicable */
  sectionId?: string;
  /** Primary section if single section */
  section?: LessonSection;
  /** All constituent sections that form this content step */
  sections: LessonSection[];
}

export interface CodeExampleLessonStep extends LessonStepBase {
  type: "code-example";
  /** Canonical section ID if applicable */
  sectionId?: string;
  /** Originating code section */
  section: LessonSection & { type: "code" | "jsx" | "javascript" };
  code: string;
  language: string;
  codeTitle?: string;
}

export interface InteractiveExerciseLessonStep extends LessonStepBase {
  type: "interactive-exercise";
  /** Canonical exercise ID */
  exerciseId: string;
  /** Section ID if originating from an interactive-sandbox section */
  sectionId?: string;
  /** Originating section if from sections[] */
  section?: LessonSection & { type: "interactive-sandbox" };
  /** Originating exercise if from lesson.exercises[] */
  exercise?: LessonExercise;
  /** Initial code for sandbox/playground */
  initialCode?: string;
  /** Instructions or brief */
  instructions?: string;
  /** Code language */
  language?: string;
  /** Whether a behavioral validation spec is attached */
  hasValidation: boolean;
  /** Validation spec if attached */
  validation?: ExerciseValidationSpec;
}

export interface QuizQuestionItem {
  id: string;
  type?: string;
  question: string;
  options: string[];
  correctIndex?: number;
  explanation?: string;
}

export interface QuizLessonStep extends LessonStepBase {
  type: "quiz";
  /** Canonical quiz identifier */
  quizId: string;
  /** Section ID if originating from an inline-quiz section */
  sectionId?: string;
  /** Originating section if inline-quiz */
  section?: LessonSection & { type: "inline-quiz" };
  /** Quiz questions array */
  questions: QuizQuestionItem[];
}

export interface CheckpointLessonStep extends LessonStepBase {
  type: "checkpoint";
  /** Canonical checkpoint ID */
  checkpointId: string;
  /** Section ID */
  sectionId: string;
  /** Originating section */
  section: LessonSection & { type: "checkpoint" };
  label: string;
  hint?: string;
  assessment?: CheckpointAssessmentConfig;
}

export type LessonStep =
  | ContentLessonStep
  | CodeExampleLessonStep
  | InteractiveExerciseLessonStep
  | QuizLessonStep
  | CheckpointLessonStep;
