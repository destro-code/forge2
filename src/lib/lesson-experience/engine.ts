import { assertValidLessonExperienceDefinition } from "./definition-validator";
import type {
  ExperienceResponse,
  ExperienceRuntimeState,
  ExperienceValidationResult,
  LearningExperience,
  LessonExperienceDefinition,
  LessonExperienceState,
} from "./types";

/**
 * Pure controller for the content-agnostic lesson-experience model.
 *
 * Every function here is a pure transform: (state, ...args) => state. No
 * DOM, no timers except `Date.now()` for bookkeeping, no fetches. This
 * mirrors the separation already enforced in
 * `src/lib/learning-engine/session-engine.ts` for the production canonical
 * engine, but the two are intentionally independent — this module does not
 * import from, or get imported by, the production learning engine.
 */

function createEmptyRuntimeState(now: number): ExperienceRuntimeState {
  return {
    status: "idle",
    response: undefined,
    attempts: 0,
    interactedTargetIds: [],
    hasRun: false,
    startedAt: now,
  };
}

export function createLessonExperienceState(
  definition: LessonExperienceDefinition,
  now: number = Date.now(),
): LessonExperienceState {
  assertValidLessonExperienceDefinition(definition);
  const order = definition.experiences.map((experience) => experience.id);
  const experienceState: Record<string, ExperienceRuntimeState> = {};
  for (const experience of definition.experiences) {
    experienceState[experience.id] = createEmptyRuntimeState(now);
  }
  const firstId = order[0];
  if (firstId) {
    experienceState[firstId] = { ...experienceState[firstId], status: "engaged" };
  }
  return {
    definitionId: definition.lesson.id,
    order,
    currentIndex: 0,
    visitedIds: firstId ? [firstId] : [],
    completedIds: [],
    experienceState,
    status: "in-progress",
    startedAt: now,
    lastActiveAt: now,
  };
}

export function getCurrentExperience(
  definition: LessonExperienceDefinition,
  state: LessonExperienceState,
): LearningExperience | undefined {
  const id = state.order[state.currentIndex];
  return definition.experiences.find((experience) => experience.id === id);
}

export function getRuntimeState(
  state: LessonExperienceState,
  experienceId: string,
): ExperienceRuntimeState {
  return state.experienceState[experienceId] ?? createEmptyRuntimeState(Date.now());
}

/** Records a learner response for the current experience without judging correctness. */
export function respondToExperience(
  state: LessonExperienceState,
  experienceId: string,
  response: ExperienceResponse,
  now: number = Date.now(),
): LessonExperienceState {
  const previous = getRuntimeState(state, experienceId);
  return {
    ...state,
    lastActiveAt: now,
    experienceState: {
      ...state.experienceState,
      [experienceId]: {
        ...previous,
        response,
        status: previous.status === "idle" ? "engaged" : previous.status,
      },
    },
  };
}

/** Marks a target (e.g. a visual frame id) as having been interacted with. */
export function recordInteraction(
  state: LessonExperienceState,
  experienceId: string,
  targetId: string,
  now: number = Date.now(),
): LessonExperienceState {
  const previous = getRuntimeState(state, experienceId);
  if (previous.interactedTargetIds.includes(targetId)) return state;
  return {
    ...state,
    lastActiveAt: now,
    experienceState: {
      ...state.experienceState,
      [experienceId]: {
        ...previous,
        status: "engaged",
        interactedTargetIds: [...previous.interactedTargetIds, targetId],
      },
    },
  };
}

/** Marks that the learner has executed sandboxed source at least once. */
export function recordRunExecuted(
  state: LessonExperienceState,
  experienceId: string,
  now: number = Date.now(),
): LessonExperienceState {
  const previous = getRuntimeState(state, experienceId);
  return {
    ...state,
    lastActiveAt: now,
    experienceState: {
      ...state.experienceState,
      [experienceId]: {
        ...previous,
        status: "engaged",
        hasRun: true,
        attempts: previous.attempts + 1,
      },
    },
  };
}

/** Applies a judged validation/correctness result to the current attempt. */
export function applyValidationResult(
  state: LessonExperienceState,
  experienceId: string,
  result: ExperienceValidationResult,
  now: number = Date.now(),
): LessonExperienceState {
  const previous = getRuntimeState(state, experienceId);
  return {
    ...state,
    lastActiveAt: now,
    experienceState: {
      ...state.experienceState,
      [experienceId]: {
        ...previous,
        status: result.isValid ? "passed" : "failed",
        attempts: previous.attempts + 1,
        validation: result,
      },
    },
  };
}

/** Resets attempt state so the learner can retry a failed experience. */
export function retryExperience(
  state: LessonExperienceState,
  experienceId: string,
  now: number = Date.now(),
): LessonExperienceState {
  const previous = getRuntimeState(state, experienceId);
  return {
    ...state,
    lastActiveAt: now,
    experienceState: {
      ...state.experienceState,
      [experienceId]: {
        ...previous,
        status: "engaged",
        validation: undefined,
      },
    },
  };
}

/** Evaluates the declared completion rule against the current runtime state. */
export function isExperienceComplete(
  experience: LearningExperience,
  runtime: ExperienceRuntimeState,
): boolean {
  switch (experience.completion.rule) {
    case "acknowledge":
      return true;
    case "interact-all":
      return experience.completion.targetIds.every((id) =>
        runtime.interactedTargetIds.includes(id),
      );
    case "correct-response":
      return runtime.validation?.isValid === true;
    case "run-executed":
      return runtime.hasRun;
    case "validation-passed":
      return runtime.validation?.isValid === true;
    default:
      return false;
  }
}

/** Marks the current experience completed and returns the updated state (idempotent). */
export function completeCurrentExperience(
  definition: LessonExperienceDefinition,
  state: LessonExperienceState,
  now: number = Date.now(),
): LessonExperienceState {
  const experience = getCurrentExperience(definition, state);
  if (!experience) return state;
  const runtime = getRuntimeState(state, experience.id);
  if (!isExperienceComplete(experience, runtime)) return state;

  const alreadyCompleted = state.completedIds.includes(experience.id);
  const completedIds = alreadyCompleted
    ? state.completedIds
    : [...state.completedIds, experience.id];
  const isFinalExperience = state.currentIndex === state.order.length - 1;

  return {
    ...state,
    lastActiveAt: now,
    completedIds,
    status: isFinalExperience ? "completed" : state.status,
    completedAt: isFinalExperience ? now : state.completedAt,
    experienceState: {
      ...state.experienceState,
      [experience.id]: {
        ...runtime,
        status: "completed",
        completedAt: runtime.completedAt ?? now,
      },
    },
  };
}

/** Advances to the next experience if the current one is complete. Otherwise a no-op. */
export function goToNextExperience(
  definition: LessonExperienceDefinition,
  state: LessonExperienceState,
  now: number = Date.now(),
): LessonExperienceState {
  const experience = getCurrentExperience(definition, state);
  if (!experience) return state;
  const runtime = getRuntimeState(state, experience.id);
  if (!isExperienceComplete(experience, runtime)) return state;

  const completedState = completeCurrentExperience(definition, state, now);
  const nextIndex = Math.min(completedState.currentIndex + 1, completedState.order.length - 1);
  if (nextIndex === completedState.currentIndex) return completedState;

  const nextId = completedState.order[nextIndex];
  const nextRuntime = getRuntimeState(completedState, nextId);
  return {
    ...completedState,
    currentIndex: nextIndex,
    lastActiveAt: now,
    visitedIds: completedState.visitedIds.includes(nextId)
      ? completedState.visitedIds
      : [...completedState.visitedIds, nextId],
    experienceState: {
      ...completedState.experienceState,
      [nextId]: {
        ...nextRuntime,
        status: nextRuntime.status === "idle" ? "engaged" : nextRuntime.status,
      },
    },
  };
}

/** Moves back to the previous experience. Always allowed — review never regresses progress. */
export function goToPreviousExperience(
  state: LessonExperienceState,
  now: number = Date.now(),
): LessonExperienceState {
  const previousIndex = Math.max(state.currentIndex - 1, 0);
  if (previousIndex === state.currentIndex) return state;
  return { ...state, currentIndex: previousIndex, lastActiveAt: now };
}

/** Jumps directly to any previously visited experience (e.g. via a progress rail). */
export function goToExperience(
  state: LessonExperienceState,
  experienceId: string,
  now: number = Date.now(),
): LessonExperienceState {
  const index = state.order.indexOf(experienceId);
  if (index === -1 || !state.visitedIds.includes(experienceId)) return state;
  return { ...state, currentIndex: index, lastActiveAt: now };
}

export function isLessonComplete(state: LessonExperienceState): boolean {
  return state.status === "completed";
}

export function getProgress(state: LessonExperienceState): { completed: number; total: number } {
  return { completed: state.completedIds.length, total: state.order.length };
}
