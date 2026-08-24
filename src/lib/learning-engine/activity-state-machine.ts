import {
  ActivitySessionState,
  ActivityStateMachineEvent,
  InvalidStateTransitionError,
} from "./types";

/**
 * Creates a clean, initial ActivitySessionState in "idle" state.
 */
export function createInitialActivityState(
  activityId: string,
  now: number = Date.now(),
): ActivitySessionState {
  return {
    activityId,
    status: "idle",
    response: null,
    attempts: 0,
    hintsRevealed: 0,
    startedAt: now,
  };
}

/**
 * Pure, deterministic Activity Lifecycle State Machine.
 *
 * Implements strict transition invariants. Throws `InvalidStateTransitionError`
 * on any invalid lifecycle transition.
 */
export function transitionActivityState(
  state: ActivitySessionState,
  event: ActivityStateMachineEvent,
  now: number = Date.now(),
): ActivitySessionState {
  const currentTimestamp = event.timestamp ?? now;

  switch (state.status) {
    case "idle": {
      switch (event.type) {
        case "ENGAGE":
        case "UPDATE_RESPONSE":
          return {
            ...state,
            status: "engaged",
            response: event.response !== undefined ? event.response : state.response,
            lastEngagedAt: currentTimestamp,
          };

        case "START_EVALUATION":
          return {
            ...state,
            status: "evaluating",
            attempts: state.attempts + 1,
            evaluatedAt: currentTimestamp,
          };

        case "RESOLVE_EVALUATION":
          return {
            ...state,
            status: event.result.isValid ? "passed" : "failed",
            attempts: state.attempts + 1,
            lastEvaluation: event.result,
            evaluatedAt: currentTimestamp,
          };

        case "REVEAL_HINT":
          return {
            ...state,
            hintsRevealed: state.hintsRevealed + 1,
          };

        case "COMPLETE_ACTIVITY":
          return {
            ...state,
            status: "completed",
            completedAt: currentTimestamp,
          };

        case "RETRY":
          throw new InvalidStateTransitionError(
            state.status,
            event.type,
            "Cannot retry an activity that has not yet been attempted or evaluated.",
          );

        default: {
          const exhaustiveCheck: never = event;
          throw new InvalidStateTransitionError(
            state.status,
            (exhaustiveCheck as any)?.type,
            "Unknown event type",
          );
        }
      }
    }

    case "engaged": {
      switch (event.type) {
        case "ENGAGE":
        case "UPDATE_RESPONSE":
          return {
            ...state,
            response: event.response !== undefined ? event.response : state.response,
            lastEngagedAt: currentTimestamp,
          };

        case "START_EVALUATION":
          return {
            ...state,
            status: "evaluating",
            attempts: state.attempts + 1,
            evaluatedAt: currentTimestamp,
          };

        case "RESOLVE_EVALUATION":
          return {
            ...state,
            status: event.result.isValid ? "passed" : "failed",
            attempts: state.attempts + 1,
            lastEvaluation: event.result,
            evaluatedAt: currentTimestamp,
          };

        case "REVEAL_HINT":
          return {
            ...state,
            hintsRevealed: state.hintsRevealed + 1,
          };

        case "COMPLETE_ACTIVITY":
          return {
            ...state,
            status: "completed",
            completedAt: currentTimestamp,
          };

        case "RETRY":
          throw new InvalidStateTransitionError(
            state.status,
            event.type,
            "Cannot retry an engaged activity that has not been evaluated and failed.",
          );
      }
      break;
    }

    case "evaluating": {
      switch (event.type) {
        case "RESOLVE_EVALUATION":
          return {
            ...state,
            status: event.result.isValid ? "passed" : "failed",
            lastEvaluation: event.result,
            evaluatedAt: currentTimestamp,
          };

        case "START_EVALUATION":
          throw new InvalidStateTransitionError(
            state.status,
            event.type,
            "Activity is already currently evaluating a response.",
          );

        case "ENGAGE":
        case "UPDATE_RESPONSE":
          throw new InvalidStateTransitionError(
            state.status,
            event.type,
            "Cannot modify response while evaluation is in progress.",
          );

        case "RETRY":
        case "COMPLETE_ACTIVITY":
        case "REVEAL_HINT":
          throw new InvalidStateTransitionError(
            state.status,
            event.type,
            `Cannot ${event.type.toLowerCase()} while evaluation is in progress.`,
          );
      }
      break;
    }

    case "passed": {
      switch (event.type) {
        case "COMPLETE_ACTIVITY":
          return {
            ...state,
            status: "completed",
            completedAt: currentTimestamp,
          };

        case "REVEAL_HINT":
          return {
            ...state,
            hintsRevealed: state.hintsRevealed + 1,
          };

        case "ENGAGE":
        case "UPDATE_RESPONSE":
        case "START_EVALUATION":
        case "RESOLVE_EVALUATION":
        case "RETRY":
          throw new InvalidStateTransitionError(
            state.status,
            event.type,
            "Activity has already passed validation. Proceed to complete or next step.",
          );
      }
      break;
    }

    case "failed": {
      switch (event.type) {
        case "RETRY":
          return {
            ...state,
            status: "retrying",
            lastEngagedAt: currentTimestamp,
          };

        case "ENGAGE":
        case "UPDATE_RESPONSE":
          return {
            ...state,
            status: "engaged",
            response: event.response !== undefined ? event.response : state.response,
            lastEngagedAt: currentTimestamp,
          };

        case "START_EVALUATION":
          return {
            ...state,
            status: "evaluating",
            attempts: state.attempts + 1,
            evaluatedAt: currentTimestamp,
          };

        case "RESOLVE_EVALUATION":
          return {
            ...state,
            status: event.result.isValid ? "passed" : "failed",
            attempts: state.attempts + 1,
            lastEvaluation: event.result,
            evaluatedAt: currentTimestamp,
          };

        case "REVEAL_HINT":
          return {
            ...state,
            hintsRevealed: state.hintsRevealed + 1,
          };

        case "COMPLETE_ACTIVITY":
          throw new InvalidStateTransitionError(
            state.status,
            event.type,
            "Cannot complete an activity that failed validation.",
          );
      }
      break;
    }

    case "retrying": {
      switch (event.type) {
        case "RETRY":
          return state; // Idempotent retry

        case "ENGAGE":
        case "UPDATE_RESPONSE":
          return {
            ...state,
            status: "engaged",
            response: event.response !== undefined ? event.response : state.response,
            lastEngagedAt: currentTimestamp,
          };

        case "START_EVALUATION":
          return {
            ...state,
            status: "evaluating",
            attempts: state.attempts + 1,
            evaluatedAt: currentTimestamp,
          };

        case "RESOLVE_EVALUATION":
          return {
            ...state,
            status: event.result.isValid ? "passed" : "failed",
            attempts: state.attempts + 1,
            lastEvaluation: event.result,
            evaluatedAt: currentTimestamp,
          };

        case "REVEAL_HINT":
          return {
            ...state,
            hintsRevealed: state.hintsRevealed + 1,
          };

        case "COMPLETE_ACTIVITY":
          throw new InvalidStateTransitionError(
            state.status,
            event.type,
            "Cannot complete an activity during retry without passing validation.",
          );
      }
      break;
    }

    case "completed": {
      if (event.type === "COMPLETE_ACTIVITY") {
        return state; // Idempotent
      }

      throw new InvalidStateTransitionError(
        state.status,
        event.type,
        "Cannot transition a completed activity. Activity is in terminal completed state.",
      );
    }
  }

  return state;
}
