import type {
  CanonicalLesson,
  CanonicalActivity,
  Objective,
  EvidenceRequirement,
} from "@/lib/curriculum/types";
import type {
  ActivitySessionState,
  LessonSessionState,
  LearningEvidenceToken,
  ObjectiveSatisfactionResult,
  LessonObjectivesSummary,
} from "./types";

/**
 * Calculates a deterministic confidence score bounded in [0, 1].
 *
 * Baseline: First successful attempt with 0 hints = 1.0
 * Penalty for attempts beyond the 1st: 15% per additional attempt
 * Penalty for hints revealed: 10% per hint revealed
 *
 * Invariant: clean first attempt > retry > retry with hints.
 */
export function calculateEvidenceConfidence(attempts: number = 1, hints: number = 0): number {
  const safeAttempts = Math.max(1, attempts || 1);
  const safeHints = Math.max(0, hints || 0);

  const base = 1.0;
  const attemptPenalty = Math.max(0, 1 - (safeAttempts - 1) * 0.15);
  const hintPenalty = Math.max(0, 1 - safeHints * 0.1);

  const rawConfidence = base * attemptPenalty * hintPenalty;
  // Bounded between 0 and 1, rounded to 4 decimals for clean deterministic floats
  return Math.max(0, Math.min(1, Math.round(rawConfidence * 10000) / 10000));
}

/**
 * Generates a deterministic, unique Evidence ID.
 */
export function generateEvidenceId(
  lessonId: string,
  activityId: string,
  objectiveId: string,
  requirementId: string = "default",
): string {
  return `ev_${lessonId}_${activityId}_${objectiveId}_${requirementId}`;
}

/**
 * Generates LearningEvidenceTokens from an individual activity session state.
 *
 * Rules:
 * - Activity must be in "passed" or "completed" state.
 * - If activity has validation, validation must have succeeded (`isValid === true`).
 * - Failed or in-progress activities produce NO evidence tokens.
 * - Informational activities (intro, explanation, etc.) produce no skill evidence
 *   unless explicitly configured with an `evidence` block or in completion requirements.
 */
export function generateEvidenceTokens(options: {
  lesson: CanonicalLesson;
  activity: CanonicalActivity;
  sessionState: ActivitySessionState;
  timestamp?: number;
}): LearningEvidenceToken[] {
  const { lesson, activity, sessionState } = options;

  if (!sessionState) {
    return [];
  }

  // 1. Gating: Activity must have reached passed or completed
  if (sessionState.status !== "passed" && sessionState.status !== "completed") {
    return [];
  }

  // 2. Validation gating: If validation was executed, it must be valid
  if (activity.validation && sessionState.lastEvaluation && !sessionState.lastEvaluation.isValid) {
    return [];
  }

  // 3. Informational activities without validation or explicit evidence config generate no skill evidence
  const hasExplicitEvidence = Boolean(
    activity.evidence &&
    (activity.evidence.skillIds?.length ||
      activity.evidence.conceptIds?.length ||
      activity.evidence.objectiveIds?.length),
  );

  const hasValidation = Boolean(activity.validation);

  // Check if lesson completion explicitly requires this activity as evidence
  const isExplicitlyRequiredEvidence = lesson.completion?.evidenceRequirements?.some((req) =>
    req.activityIds.includes(activity.id),
  );

  if (!hasValidation && !hasExplicitEvidence && !isExplicitlyRequiredEvidence) {
    return [];
  }

  const confidenceScore = calculateEvidenceConfidence(
    sessionState.attempts,
    sessionState.hintsRevealed,
  );

  const timestamp =
    options.timestamp ??
    sessionState.completedAt ??
    sessionState.evaluatedAt ??
    sessionState.lastEngagedAt ??
    Date.now();

  // Determine target objectives
  const targetObjectiveIds =
    activity.evidence?.objectiveIds && activity.evidence.objectiveIds.length > 0
      ? activity.evidence.objectiveIds
      : activity.objectiveIds && activity.objectiveIds.length > 0
        ? activity.objectiveIds
        : lesson.objectives.map((o) => o.id);

  const tokens: LearningEvidenceToken[] = [];

  for (const objId of targetObjectiveIds) {
    // Find matching objective definition for skill/concept linkage
    const objectiveDef = lesson.objectives.find((o) => o.id === objId);

    const targetSkillId =
      activity.evidence?.skillIds?.[0] || objectiveDef?.skillIds?.[0] || lesson.skillIds?.[0];

    const targetConceptId =
      activity.evidence?.conceptIds?.[0] || objectiveDef?.conceptIds?.[0] || lesson.conceptIds?.[0];

    const requirementId = `req_${activity.id}`;

    const demonstratedLevel =
      activity.evidence?.demonstratedLevel ||
      (confidenceScore >= 0.85 ? "mastered" : confidenceScore >= 0.6 ? "competent" : "emerging");

    const evidenceId = generateEvidenceId(lesson.id, activity.id, objId, requirementId);

    tokens.push({
      evidenceId,
      requirementId,
      lessonId: lesson.id,
      activityId: activity.id,
      objectiveId: objId,
      skillId: targetSkillId,
      conceptId: targetConceptId,
      timestamp,
      attemptsCount: sessionState.attempts,
      hintsUsedCount: sessionState.hintsRevealed,
      confidenceScore,
      demonstratedLevel,
      metadata: sessionState.lastEvaluation?.details,
    });
  }

  return tokens;
}

/**
 * Generates and deduplicates all LearningEvidenceTokens across an entire LessonSessionState.
 */
export function generateLessonEvidenceTokens(
  lesson: CanonicalLesson,
  session: LessonSessionState,
): LearningEvidenceToken[] {
  if (!lesson || !session || !session.activities) {
    return [];
  }

  const tokenMap: Map<string, LearningEvidenceToken> = new Map();

  for (const activity of lesson.activities) {
    const activityState = session.activities[activity.id];
    if (!activityState) continue;

    const activityTokens = generateEvidenceTokens({
      lesson,
      activity,
      sessionState: activityState,
      timestamp: session.completedAt || session.lastActiveAt,
    });

    for (const token of activityTokens) {
      const existing = tokenMap.get(token.evidenceId);
      if (!existing || token.confidenceScore > existing.confidenceScore) {
        tokenMap.set(token.evidenceId, token);
      }
    }
  }

  return Array.from(tokenMap.values());
}

/**
 * Evaluates whether an individual objective has been satisfied given an array of evidence tokens.
 */
export function evaluateObjectiveSatisfaction(
  objective: Objective,
  evidenceTokens: LearningEvidenceToken[],
  lesson?: CanonicalLesson,
): ObjectiveSatisfactionResult {
  if (!objective) {
    throw new Error("Objective definition must be provided for satisfaction evaluation.");
  }

  // 1. Determine expected requirement IDs (activities) for this objective
  let expectedActivityIds: string[] = [];

  // Check explicit lesson completion evidence requirements
  const explicitEvidenceReq = lesson?.completion?.evidenceRequirements?.find(
    (req: EvidenceRequirement) => req.objectiveId === objective.id,
  );

  if (explicitEvidenceReq && explicitEvidenceReq.activityIds.length > 0) {
    expectedActivityIds = explicitEvidenceReq.activityIds;
  } else if (lesson && Array.isArray(lesson.activities)) {
    // Find all validated or evidence-producing activities tagged with this objective
    const relevantActivities = lesson.activities.filter(
      (act) =>
        act.objectiveIds?.includes(objective.id) &&
        (Boolean(act.validation) || Boolean(act.evidence)),
    );

    if (relevantActivities.length > 0) {
      expectedActivityIds = relevantActivities.map((a) => a.id);
    } else {
      // Fallback to all activities tagged with this objective
      expectedActivityIds = lesson.activities
        .filter((act) => act.objectiveIds?.includes(objective.id))
        .map((a) => a.id);
    }
  }

  // If no activities are associated with the objective, use objective ID as nominal requirement
  if (expectedActivityIds.length === 0) {
    expectedActivityIds = [`req_obj_${objective.id}`];
  }

  // 2. Match evidence tokens
  const relevantTokens = evidenceTokens.filter((token) => token.objectiveId === objective.id);

  const satisfiedRequirementIds: string[] = [];
  const missingRequirementIds: string[] = [];

  for (const actId of expectedActivityIds) {
    const hasEvidence = relevantTokens.some(
      (t) => t.activityId === actId || t.requirementId === `req_${actId}`,
    );

    if (hasEvidence) {
      satisfiedRequirementIds.push(actId);
    } else {
      missingRequirementIds.push(actId);
    }
  }

  const satisfied = missingRequirementIds.length === 0 && satisfiedRequirementIds.length > 0;
  const progressPercentage =
    expectedActivityIds.length > 0
      ? Math.round((satisfiedRequirementIds.length / expectedActivityIds.length) * 100)
      : 0;

  return {
    objectiveId: objective.id,
    satisfied,
    satisfiedRequirementIds,
    missingRequirementIds,
    evidenceTokens: relevantTokens,
    progressPercentage,
  };
}

/**
 * Evaluates all objectives in a lesson against current evidence tokens.
 */
export function evaluateLessonObjectivesSatisfaction(
  lesson: CanonicalLesson,
  evidenceTokens: LearningEvidenceToken[],
): LessonObjectivesSummary {
  if (!lesson || !Array.isArray(lesson.objectives)) {
    throw new Error("Invalid lesson provided to evaluateLessonObjectivesSatisfaction.");
  }

  const results: Record<string, ObjectiveSatisfactionResult> = {};
  let satisfiedCount = 0;

  for (const objective of lesson.objectives) {
    const result = evaluateObjectiveSatisfaction(objective, evidenceTokens, lesson);
    results[objective.id] = result;
    if (result.satisfied) {
      satisfiedCount++;
    }
  }

  const totalObjectives = lesson.objectives.length;
  const allSatisfied = totalObjectives > 0 && satisfiedCount === totalObjectives;

  return {
    lessonId: lesson.id,
    allSatisfied,
    totalObjectives,
    satisfiedObjectivesCount: satisfiedCount,
    results,
  };
}
