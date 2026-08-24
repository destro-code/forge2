import type {
  CanonicalLesson,
  CanonicalActivity,
  Objective,
  Skill,
  Concept,
  Misconception,
  EvidenceRequirement,
} from "@/lib/curriculum/types";

/**
 * Activity Lifecycle States in the Learning Engine State Machine.
 *
 * Transitions:
 * - idle: Activity initialized, no interaction yet.
 * - engaged: Learner entered or modified a response/workspace.
 * - evaluating: Learner submitted response; validation/execution in progress.
 * - passed: Response evaluated and met validation criteria.
 * - failed: Response evaluated and did not meet criteria.
 * - retrying: Learner acknowledged failure and reset/retried workspace.
 * - completed: Learner finalized activity and earned progress; ready to advance.
 */
export type ActivityLifecycleState =
  "idle" | "engaged" | "evaluating" | "passed" | "failed" | "retrying" | "completed";

/**
 * Pure evaluation output contract returned from validation evaluators.
 */
export interface ActivityEvaluationResult {
  isValid: boolean;
  score?: number;
  feedbackMessage?: string;
  details?: Record<string, unknown>;
}

/**
 * Serialization-safe runtime record for an individual activity within a session.
 */
export interface ActivitySessionState {
  activityId: string;
  status: ActivityLifecycleState;
  response: unknown;
  attempts: number;
  hintsRevealed: number;
  lastEvaluation?: ActivityEvaluationResult;
  startedAt: number;
  lastEngagedAt?: number;
  evaluatedAt?: number;
  completedAt?: number;
}

/**
 * Discriminated union of events that drive the Activity State Machine.
 */
export type ActivityStateMachineEvent =
  | { type: "ENGAGE"; response?: unknown; timestamp?: number }
  | { type: "UPDATE_RESPONSE"; response: unknown; timestamp?: number }
  | { type: "START_EVALUATION"; timestamp?: number }
  | { type: "RESOLVE_EVALUATION"; result: ActivityEvaluationResult; timestamp?: number }
  | { type: "RETRY"; timestamp?: number }
  | { type: "REVEAL_HINT"; timestamp?: number }
  | { type: "COMPLETE_ACTIVITY"; timestamp?: number };

/**
 * Lesson Session Lifecycle Status.
 */
export type LessonSessionStatus = "not-started" | "in-progress" | "completed";

/**
 * Serialization-safe, framework-independent state representing an entire active lesson session.
 */
export interface LessonSessionState {
  sessionId: string;
  lessonId: string;
  status: LessonSessionStatus;
  currentActivityId: string;
  currentActivityIndex: number;
  totalActivities: number;
  activityOrder: string[];
  activities: Record<string, ActivitySessionState>;
  completedActivityIds: string[];
  startedAt: number;
  lastActiveAt: number;
  completedAt?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Result returned when evaluating whether a lesson session satisfies completion conditions.
 */
export interface LessonCompletionCheckResult {
  canComplete: boolean;
  isCompleted: boolean;
  missingRequiredActivityIds: string[];
  completedCount: number;
  totalCount: number;
  reasons?: string[];
}

/**
 * Progress summary for a lesson session.
 */
export interface LessonSessionProgress {
  completedCount: number;
  totalCount: number;
  percentage: number;
  currentStep: number;
  isComplete: boolean;
}

/**
 * Typed error thrown when an invalid state transition is attempted on an activity or session.
 */
export class InvalidStateTransitionError extends Error {
  public readonly fromState: string;
  public readonly eventType: string;
  public readonly reason: string;

  constructor(fromState: string, eventType: string, reason: string) {
    super(`Invalid state transition from "${fromState}" on event "${eventType}": ${reason}`);
    this.name = "InvalidStateTransitionError";
    this.fromState = fromState;
    this.eventType = eventType;
    this.reason = reason;
  }
}

// ---------------------------------------------------------------------------
// Phase 2B.2: Learning Evidence, Objective Satisfaction & Mastery Types
// ---------------------------------------------------------------------------

/**
 * Structured unit of learning evidence generated from a validated activity interaction.
 */
export interface LearningEvidenceToken {
  evidenceId: string;
  requirementId: string;
  lessonId: string;
  activityId: string;
  objectiveId: string;
  skillId?: string;
  conceptId?: string;
  timestamp: number;
  attemptsCount: number;
  hintsUsedCount: number;
  confidenceScore: number;
  demonstratedLevel?: "emerging" | "competent" | "mastered";
  metadata?: Record<string, unknown>;
}

/**
 * Result of evaluating whether a specific lesson objective has been satisfied.
 */
export interface ObjectiveSatisfactionResult {
  objectiveId: string;
  satisfied: boolean;
  satisfiedRequirementIds: string[];
  missingRequirementIds: string[];
  evidenceTokens: LearningEvidenceToken[];
  progressPercentage: number;
}

/**
 * Summary of all objective satisfaction results across a lesson.
 */
export interface LessonObjectivesSummary {
  lessonId: string;
  allSatisfied: boolean;
  totalObjectives: number;
  satisfiedObjectivesCount: number;
  results: Record<string, ObjectiveSatisfactionResult>;
}

/**
 * Structured diagnostic result when a failed interaction matches a known misconception.
 */
export interface MisconceptionMatchResult {
  misconceptionId: string;
  misconceptionTitle: string;
  conceptId: string;
  matchedIndicator: string;
  confidence: number;
  explanation: string;
  correction: string;
}

/**
 * Skill Mastery Proficiency Levels.
 */
export type SkillMasteryLevel = "none" | "novice" | "competent" | "proficient";

/**
 * Aggregated mastery record for an individual skill derived from evidence tokens.
 */
export interface SkillMasteryRecord {
  skillId: string;
  skillTitle?: string;
  level: SkillMasteryLevel;
  evidenceCount: number;
  averageConfidence: number;
  lessonsDemonstrated: string[];
  activitiesDemonstrated: string[];
  objectivesDemonstrated: string[];
  highConfidenceEvidenceCount: number;
  lastDemonstratedAt?: number;
  summary: string;
}
