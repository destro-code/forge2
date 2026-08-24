import type { CanonicalLesson } from "@/lib/curriculum/types";
import {
  LessonSessionState,
  LessonSessionProgress,
  LessonCompletionCheckResult,
  ActivityEvaluationResult,
  InvalidStateTransitionError,
} from "./types";
import { createInitialActivityState, transitionActivityState } from "./activity-state-machine";

/**
 * Generates a unique, deterministic-friendly session identifier.
 */
export function generateSessionId(lessonId: string, timestamp: number = Date.now()): string {
  const randomSuffix = Math.random().toString(36).substring(2, 9);
  return `session_${lessonId}_${timestamp}_${randomSuffix}`;
}

/**
 * Creates a brand new, serialization-safe `LessonSessionState` for a CanonicalLesson.
 */
export function createLessonSession(
  lesson: CanonicalLesson,
  options?: {
    sessionId?: string;
    timestamp?: number;
    metadata?: Record<string, unknown>;
  },
): LessonSessionState {
  if (!lesson || !Array.isArray(lesson.activities) || lesson.activities.length === 0) {
    throw new Error(`Cannot create session for lesson "${lesson?.id}": activities array is empty.`);
  }

  const now = options?.timestamp ?? Date.now();
  const sessionId = options?.sessionId ?? generateSessionId(lesson.id, now);
  const activityOrder = lesson.activities.map((act) => act.id);

  const activities: LessonSessionState["activities"] = {};
  for (const activity of lesson.activities) {
    activities[activity.id] = createInitialActivityState(activity.id, now);
  }

  return {
    sessionId,
    lessonId: lesson.id,
    status: "not-started",
    currentActivityId: activityOrder[0],
    currentActivityIndex: 0,
    totalActivities: activityOrder.length,
    activityOrder,
    activities,
    completedActivityIds: [],
    startedAt: now,
    lastActiveAt: now,
    metadata: options?.metadata,
  };
}

/**
 * Transitions a session from 'not-started' to 'in-progress'.
 */
export function startLessonSession(
  session: LessonSessionState,
  timestamp: number = Date.now(),
): LessonSessionState {
  if (session.status === "completed") {
    throw new InvalidStateTransitionError(
      session.status,
      "START_SESSION",
      "Cannot start a session that has already been completed.",
    );
  }

  if (session.status === "in-progress") {
    return session; // Idempotent
  }

  return {
    ...session,
    status: "in-progress",
    lastActiveAt: timestamp,
  };
}

/**
 * Helper to ensure the target activity exists in the session.
 */
function getActivityOrThrow(session: LessonSessionState, activityId: string) {
  const activity = session.activities[activityId];
  if (!activity) {
    throw new Error(
      `Activity "${activityId}" not found in session for lesson "${session.lessonId}".`,
    );
  }
  return activity;
}

/**
 * Records learner engagement or response update on a specific activity.
 */
export function engageSessionActivity(
  session: LessonSessionState,
  activityId: string,
  response: unknown,
  timestamp: number = Date.now(),
): LessonSessionState {
  const activity = getActivityOrThrow(session, activityId);
  const updatedActivity = transitionActivityState(
    activity,
    { type: "UPDATE_RESPONSE", response, timestamp },
    timestamp,
  );

  return {
    ...session,
    status: session.status === "not-started" ? "in-progress" : session.status,
    lastActiveAt: timestamp,
    activities: {
      ...session.activities,
      [activityId]: updatedActivity,
    },
  };
}

/**
 * Marks an activity as currently evaluating (e.g. executing code sandbox or running tests).
 */
export function startActivityEvaluation(
  session: LessonSessionState,
  activityId: string,
  timestamp: number = Date.now(),
): LessonSessionState {
  const activity = getActivityOrThrow(session, activityId);
  const updatedActivity = transitionActivityState(
    activity,
    { type: "START_EVALUATION", timestamp },
    timestamp,
  );

  return {
    ...session,
    status: session.status === "not-started" ? "in-progress" : session.status,
    lastActiveAt: timestamp,
    activities: {
      ...session.activities,
      [activityId]: updatedActivity,
    },
  };
}

/**
 * Resolves validation/evaluation result for an activity (transitions to 'passed' or 'failed').
 */
export function resolveActivityEvaluation(
  session: LessonSessionState,
  activityId: string,
  result: ActivityEvaluationResult,
  timestamp: number = Date.now(),
): LessonSessionState {
  const activity = getActivityOrThrow(session, activityId);
  const updatedActivity = transitionActivityState(
    activity,
    { type: "RESOLVE_EVALUATION", result, timestamp },
    timestamp,
  );

  return {
    ...session,
    lastActiveAt: timestamp,
    activities: {
      ...session.activities,
      [activityId]: updatedActivity,
    },
  };
}

/**
 * Resets a failed activity for a new attempt.
 */
export function retrySessionActivity(
  session: LessonSessionState,
  activityId: string,
  timestamp: number = Date.now(),
): LessonSessionState {
  const activity = getActivityOrThrow(session, activityId);
  const updatedActivity = transitionActivityState(
    activity,
    { type: "RETRY", timestamp },
    timestamp,
  );

  return {
    ...session,
    lastActiveAt: timestamp,
    activities: {
      ...session.activities,
      [activityId]: updatedActivity,
    },
  };
}

/**
 * Increments the revealed hint counter for an activity.
 */
export function revealSessionActivityHint(
  session: LessonSessionState,
  activityId: string,
  timestamp: number = Date.now(),
): LessonSessionState {
  const activity = getActivityOrThrow(session, activityId);
  const updatedActivity = transitionActivityState(
    activity,
    { type: "REVEAL_HINT", timestamp },
    timestamp,
  );

  return {
    ...session,
    lastActiveAt: timestamp,
    activities: {
      ...session.activities,
      [activityId]: updatedActivity,
    },
  };
}

/**
 * Completes an activity and updates the session's completedActivityIds list.
 */
export function completeSessionActivity(
  session: LessonSessionState,
  activityId: string,
  timestamp: number = Date.now(),
): LessonSessionState {
  const activity = getActivityOrThrow(session, activityId);
  const updatedActivity = transitionActivityState(
    activity,
    { type: "COMPLETE_ACTIVITY", timestamp },
    timestamp,
  );

  const completedActivityIds = session.completedActivityIds.includes(activityId)
    ? session.completedActivityIds
    : [...session.completedActivityIds, activityId];

  return {
    ...session,
    lastActiveAt: timestamp,
    completedActivityIds,
    activities: {
      ...session.activities,
      [activityId]: updatedActivity,
    },
  };
}

/**
 * Navigates to a specific activity by ID or numeric index.
 */
export function navigateToActivity(
  session: LessonSessionState,
  target: string | number,
  timestamp: number = Date.now(),
): LessonSessionState {
  let targetIndex: number;
  let targetId: string;

  if (typeof target === "number") {
    if (target < 0 || target >= session.activityOrder.length) {
      throw new Error(
        `Invalid activity index ${target}. Must be between 0 and ${session.activityOrder.length - 1}.`,
      );
    }
    targetIndex = target;
    targetId = session.activityOrder[targetIndex];
  } else {
    targetIndex = session.activityOrder.indexOf(target);
    if (targetIndex === -1) {
      throw new Error(
        `Activity ID "${target}" does not belong to session for ${session.lessonId}.`,
      );
    }
    targetId = target;
  }

  if (session.currentActivityId === targetId && session.currentActivityIndex === targetIndex) {
    return session;
  }

  return {
    ...session,
    currentActivityId: targetId,
    currentActivityIndex: targetIndex,
    lastActiveAt: timestamp,
  };
}

/**
 * Advances to the next activity if one exists.
 */
export function nextSessionActivity(
  session: LessonSessionState,
  timestamp: number = Date.now(),
): LessonSessionState {
  const nextIndex = session.currentActivityIndex + 1;
  if (nextIndex >= session.activityOrder.length) {
    return session; // Reached end of lesson activities
  }
  return navigateToActivity(session, nextIndex, timestamp);
}

/**
 * Returns to the previous activity if index > 0.
 */
export function previousSessionActivity(
  session: LessonSessionState,
  timestamp: number = Date.now(),
): LessonSessionState {
  const prevIndex = session.currentActivityIndex - 1;
  if (prevIndex < 0) {
    return session;
  }
  return navigateToActivity(session, prevIndex, timestamp);
}

/**
 * Resolves the list of required activity IDs for a CanonicalLesson.
 * If explicitly declared in completion rules, uses that list.
 * Otherwise, defaults to all non-optional activities in the lesson.
 */
export function getRequiredActivityIds(lesson: CanonicalLesson): string[] {
  const completionRule = lesson.completion || {};
  if (completionRule.requiredActivityIds && completionRule.requiredActivityIds.length > 0) {
    return completionRule.requiredActivityIds;
  }
  return lesson.activities.filter((a) => !a.optional).map((a) => a.id);
}

/**
 * Determines whether a specific activity is required for lesson completion.
 */
export function isActivityRequired(lesson: CanonicalLesson, activityId: string): boolean {
  const requiredIds = getRequiredActivityIds(lesson);
  return requiredIds.includes(activityId);
}

/**
 * Returns the list of required activity IDs that have not yet been completed in the session.
 */
export function getRemainingRequiredActivities(
  session: LessonSessionState,
  lesson: CanonicalLesson,
): string[] {
  const requiredIds = getRequiredActivityIds(lesson);
  return requiredIds.filter((id) => !session.completedActivityIds.includes(id));
}

/**
 * Helper to extract a human-readable title or description for an activity.
 */
function getActivityDescriptor(activity: CanonicalLesson["activities"][number]): string {
  if (activity.content && typeof activity.content === "object" && "title" in activity.content) {
    const title = (activity.content as { title?: string }).title;
    if (title && typeof title === "string" && title.trim()) {
      return `"${title.trim()}" (${activity.id})`;
    }
  }
  return `${activity.type} (${activity.id})`;
}

/**
 * Checks whether the session fulfills the CanonicalLesson's completion requirements.
 */
export function checkLessonCompletion(
  session: LessonSessionState,
  lesson: CanonicalLesson,
): LessonCompletionCheckResult {
  if (session.status === "completed") {
    return {
      canComplete: true,
      isCompleted: true,
      missingRequiredActivityIds: [],
      completedCount: session.completedActivityIds.length,
      totalCount: session.totalActivities,
      reasons: undefined,
    };
  }

  const missingRequired = getRemainingRequiredActivities(session, lesson);
  const completedCount = session.completedActivityIds.length;
  const totalCount = session.totalActivities;
  const reasons: string[] = [];

  // 1. Evaluate missing required activities
  if (missingRequired.length > 0) {
    for (const missingId of missingRequired) {
      const act = lesson.activities.find((a) => a.id === missingId);
      const desc = act ? getActivityDescriptor(act) : missingId;
      reasons.push(`Complete required activity: ${desc}`);
    }
  }

  // 2. Evaluate evidence requirements if declared
  if (
    lesson.completion?.evidenceRequirements &&
    lesson.completion.evidenceRequirements.length > 0
  ) {
    for (const req of lesson.completion.evidenceRequirements) {
      const isSatisfied = req.activityIds.some((actId) => {
        const actState = session.activities[actId];
        if (!actState || !session.completedActivityIds.includes(actId)) return false;
        if (req.requirement === "complete") return true;
        if (req.requirement === "success") {
          return actState.lastEvaluation ? actState.lastEvaluation.isValid : true;
        }
        if (req.requirement === "minimum-score") {
          const score =
            actState.lastEvaluation?.score ?? (actState.lastEvaluation?.isValid ? 1 : 0);
          return score >= (req.threshold ?? 1);
        }
        return true;
      });

      if (!isSatisfied) {
        reasons.push(
          `Evidence requirement for objective "${req.objectiveId}" is not satisfied (requirement: ${req.requirement})`,
        );
      }
    }
  }

  // 3. Evaluate minimum score requirement if declared
  if (typeof lesson.completion?.minimumScore === "number" && lesson.completion.minimumScore > 0) {
    let totalScore = 0;
    let scoredCount = 0;
    for (const completedId of session.completedActivityIds) {
      const actState = session.activities[completedId];
      if (actState?.lastEvaluation?.score !== undefined) {
        totalScore += actState.lastEvaluation.score;
        scoredCount++;
      }
    }
    if (scoredCount > 0) {
      const averageScore = Math.round(totalScore / scoredCount);
      if (averageScore < lesson.completion.minimumScore) {
        reasons.push(
          `Minimum score of ${lesson.completion.minimumScore}% not met (current average: ${averageScore}%)`,
        );
      }
    }
  }

  const canComplete = reasons.length === 0;

  return {
    canComplete,
    isCompleted: false,
    missingRequiredActivityIds: missingRequired,
    completedCount,
    totalCount,
    reasons: reasons.length > 0 ? reasons : undefined,
  };
}

/**
 * Marks the entire lesson session as completed if completion rules are satisfied.
 */
export function completeLessonSession(
  session: LessonSessionState,
  lesson: CanonicalLesson,
  timestamp: number = Date.now(),
): LessonSessionState {
  if (session.status === "completed") {
    return session; // Idempotent
  }

  const check = checkLessonCompletion(session, lesson);
  if (!check.canComplete) {
    throw new InvalidStateTransitionError(
      session.status,
      "COMPLETE_LESSON_SESSION",
      `Cannot complete lesson session. ${check.reasons?.join("; ") || "Requirements unmet."}`,
    );
  }

  return {
    ...session,
    status: "completed",
    completedAt: timestamp,
    lastActiveAt: timestamp,
  };
}

/**
 * Calculates high-level progress statistics for the session.
 */
export function calculateSessionProgress(session: LessonSessionState): LessonSessionProgress {
  const completedCount = session.completedActivityIds.length;
  const totalCount = session.totalActivities;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return {
    completedCount,
    totalCount,
    percentage: Math.min(100, Math.max(0, percentage)),
    currentStep: session.currentActivityIndex + 1,
    isComplete: session.status === "completed",
  };
}
