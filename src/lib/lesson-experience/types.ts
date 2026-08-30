/**
 * Content-agnostic lesson-experience contract.
 *
 * This model is intentionally decoupled from `@/lib/curriculum/types`
 * (`CanonicalActivity`) and from `lessons.json`. It exists to prove that a
 * lesson can be authored as a sequence of distinct instructional
 * *experiences* — each with its own presentation, interaction, and
 * completion semantics — without a monolithic renderer keyed off boolean
 * props. Nothing here is imported by, or changes the behavior of, the
 * production canonical learning engine.
 */

/** Stable set of instructional moments this proof supports. */
export type ExperienceKind =
  | "hook"
  | "visual"
  | "prediction"
  | "sandbox-experiment"
  | "challenge"
  | "explanation"
  | "mastery-check";

/** Explicit rule the controller uses to decide when an experience is done. */
export type ExperienceCompletionRule =
  /** Learner may advance whenever they choose (Continue is always enabled). */
  | { rule: "acknowledge" }
  /** Learner must interact with every declared target before advancing. */
  | { rule: "interact-all"; targetIds: string[] }
  /** Learner must submit a response that the controller judges correct. */
  | { rule: "correct-response" }
  /** Learner must execute the sandboxed source at least once. */
  | { rule: "run-executed" }
  /** Learner must pass the declared sandbox validation. */
  | { rule: "validation-passed" };

interface ExperienceBase {
  id: string;
  kind: ExperienceKind;
  /** The instructional purpose this moment serves — never presentational copy. */
  purpose: string;
  title: string;
  completion: ExperienceCompletionRule;
}

export interface HookExperience extends ExperienceBase {
  kind: "hook";
  content: {
    heading: string;
    body: string;
    punchline?: string;
  };
  completion: { rule: "acknowledge" };
}

export interface VisualStateFrame {
  id: string;
  label: string;
  code: string;
  memoryValue: string;
  description: string;
}

export interface VisualExperience extends ExperienceBase {
  kind: "visual";
  content: {
    heading: string;
    description: string;
    frames: VisualStateFrame[];
  };
  completion: { rule: "interact-all"; targetIds: string[] };
}

export interface PredictionExperience extends ExperienceBase {
  kind: "prediction";
  content: {
    heading: string;
    codeSnippet: string;
    question: string;
    options: Array<{ id: string; label: string }>;
    correctOptionId: string;
    explanation: string;
  };
  completion: { rule: "correct-response" };
}

export interface SandboxExperimentExperience extends ExperienceBase {
  kind: "sandbox-experiment";
  content: {
    heading: string;
    instructions: string;
    starterSource: string;
    language: "javascript";
  };
  completion: { rule: "run-executed" };
}

export interface ChallengeTestCase {
  id: string;
  description: string;
  /** JavaScript boolean expression evaluated against the executed source. */
  expression: string;
}

export interface ChallengeExperience extends ExperienceBase {
  kind: "challenge";
  content: {
    heading: string;
    instructions: string;
    starterSource: string;
    language: "javascript";
    testCases: ChallengeTestCase[];
  };
  completion: { rule: "validation-passed" };
}

export interface ExplanationExperience extends ExperienceBase {
  kind: "explanation";
  content: {
    heading: string;
    paragraphs: string[];
  };
  completion: { rule: "acknowledge" };
}

export interface MasteryCheckExperience extends ExperienceBase {
  kind: "mastery-check";
  content: {
    heading: string;
    question: string;
    options: Array<{ id: string; label: string }>;
    correctOptionId: string;
    successMessage: string;
    retryMessage: string;
  };
  completion: { rule: "correct-response" };
}

export type LearningExperience =
  | HookExperience
  | VisualExperience
  | PredictionExperience
  | SandboxExperimentExperience
  | ChallengeExperience
  | ExplanationExperience
  | MasteryCheckExperience;

export interface LessonExperienceMeta {
  id: string;
  title: string;
  description: string;
}

export interface LessonExperienceDefinition {
  lesson: LessonExperienceMeta;
  experiences: LearningExperience[];
}

/** Learner-facing response payload. Kept opaque to the controller by design. */
export type ExperienceResponse = unknown;

export type ExperienceRuntimeStatus =
  "idle" | "engaged" | "evaluating" | "passed" | "failed" | "completed";

export interface ExperienceValidationResult {
  isValid: boolean;
  message?: string;
}

export interface ExperienceRuntimeState {
  status: ExperienceRuntimeStatus;
  response: ExperienceResponse;
  attempts: number;
  interactedTargetIds: string[];
  hasRun: boolean;
  validation?: ExperienceValidationResult;
  startedAt: number;
  completedAt?: number;
}

export type LessonExperienceSessionStatus = "not-started" | "in-progress" | "completed";

export interface LessonExperienceState {
  definitionId: string;
  order: string[];
  currentIndex: number;
  visitedIds: string[];
  completedIds: string[];
  experienceState: Record<string, ExperienceRuntimeState>;
  status: LessonExperienceSessionStatus;
  startedAt: number;
  lastActiveAt: number;
  completedAt?: number;
}
