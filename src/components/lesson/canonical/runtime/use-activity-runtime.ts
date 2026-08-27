import { useState, useCallback, useEffect, useMemo } from "react";
import type { CanonicalActivity } from "@/lib/curriculum/types";
import type { ActivitySessionState, MisconceptionMatchResult } from "@/lib/learning-engine/types";
import type {
  ActivityInteractionState,
  ActivityValidationResult,
  ActivityInteractionStatus,
  ActivityCompletionEvent,
} from "../types";
import { evaluateActivityValidation, type ActivityResponse } from "../validation";

/**
 * Activity Runtime Actions contract.
 * Defines the strict boundary of how a native activity renderer communicates
 * lifecycle events back to the runtime system.
 */
export interface ActivityRuntimeActions<TResponse = unknown> {
  /** Emitted when the learner interacts with the activity. */
  respond: (response: TResponse) => void;
  /** Emitted when the learner submits their response for evaluation. */
  submit: () => void;
  /** Emitted when the learner acknowledges failure and chooses to try again. */
  retry: () => void;
  /** Emitted when the learner has finished the activity and wishes to advance. */
  continue: () => void;
  /** Emitted when the learner requests progressive help. */
  revealHint: () => void;
}

export interface UseActivityRuntimeOptions<T extends CanonicalActivity> {
  /** The Canonical Activity being rendered */
  activity: T;
  /** Optional external state from a formal Learning Engine */
  activityState?: ActivitySessionState;
  /** Optional matched misconception from the Evidence Engine */
  matchedMisconception?: MisconceptionMatchResult | null;

  // External Callbacks
  onComplete?: (event: ActivityCompletionEvent<ActivityResponse<T["type"]>>) => void;
  onResponseChange?: (response: ActivityResponse<T["type"]>) => void;
  onSubmit?: () => void;
  onRetry?: () => void;
  onContinue?: () => void;
  onRevealHint?: () => void;
}

export interface ActivityRuntime<TResponse = unknown> {
  state: ActivityInteractionState<TResponse>;
  actions: ActivityRuntimeActions<TResponse>;
}

/**
 * Maps a Learning Engine session status onto the runtime interaction contract.
 */
export function mapSessionStatus(
  sessionStatus: ActivitySessionState["status"],
): ActivityInteractionStatus {
  switch (sessionStatus) {
    case "idle":
      return "idle";
    case "engaged":
      return "active";
    case "evaluating":
      return "submitted";
    case "passed":
      return "correct";
    case "failed":
      return "incorrect";
    case "retrying":
      return "active";
    case "completed":
      return "completed";
    default:
      return "idle";
  }
}

/**
 * Derives the effective interaction state from Learning Engine session state,
 * including misconception-enhanced diagnostic feedback.
 *
 * Exported so the lesson shell can render feedback from exactly the same
 * derivation the renderers see, with no risk of the two drifting apart.
 */
export function deriveActivityInteractionState<TResponse = unknown>(
  activityState: ActivitySessionState,
  matchedMisconception?: MisconceptionMatchResult | null,
): ActivityInteractionState<TResponse> {
  const status = mapSessionStatus(activityState.status);

  let validationResult = activityState.lastEvaluation
    ? ({ ...activityState.lastEvaluation } as ActivityValidationResult)
    : undefined;

  if (matchedMisconception && validationResult && !validationResult.isValid) {
    const enhancedFeedback = `${validationResult.feedbackMessage || ""}\n\n[Diagnostic Insight]: ${matchedMisconception.explanation}\n[Correction]: ${matchedMisconception.correction}`;
    validationResult = {
      ...validationResult,
      feedbackMessage: enhancedFeedback,
      details: {
        ...validationResult.details,
        misconception: matchedMisconception,
      },
    };
  }

  return {
    status,
    response: activityState.response as TResponse,
    validationResult,
    attempts: activityState.attempts,
    hintsRevealed: activityState.hintsRevealed,
    startedAt: activityState.startedAt,
    submittedAt: activityState.evaluatedAt,
  };
}

/**
 * Core Activity Runtime hook.
 *
 * Establishes the safe runtime lifecycle boundary between content,
 * state, and presentation. Operates as a local state engine if no
 * external Learning Engine state is provided, ensuring safe fallback behavior.
 */
export function useActivityRuntime<T extends CanonicalActivity>(
  options: UseActivityRuntimeOptions<T>,
): ActivityRuntime<ActivityResponse<T["type"]>> {
  const {
    activity,
    activityState,
    onComplete,
    onResponseChange,
    onSubmit,
    onRetry,
    onContinue,
    onRevealHint,
    matchedMisconception,
  } = options;

  // Local fallback state when no external engine state is provided
  const [localState, setLocalState] = useState<
    ActivityInteractionState<ActivityResponse<T["type"]>>
  >({
    status: "idle",
    response: undefined as unknown as ActivityResponse<T["type"]>,
    validationResult: undefined,
    attempts: 0,
    hintsRevealed: 0,
    startedAt: Date.now(),
  });

  // Safe reset when the underlying canonical activity changes
  useEffect(() => {
    if (!activityState) {
      setLocalState({
        status: "idle",
        response: undefined as unknown as ActivityResponse<T["type"]>,
        validationResult: undefined,
        attempts: 0,
        hintsRevealed: 0,
        startedAt: Date.now(),
      });
    }
  }, [activity.id, activityState]);

  // Derived effective interaction state mapping Engine State -> Runtime Contract
  const effectiveState: ActivityInteractionState<ActivityResponse<T["type"]>> = useMemo(() => {
    if (activityState) {
      return deriveActivityInteractionState<ActivityResponse<T["type"]>>(
        activityState,
        matchedMisconception,
      );
    }
    return localState;
  }, [activityState, matchedMisconception, localState]);

  const respond = useCallback(
    (newResponse: ActivityResponse<T["type"]>) => {
      if (activityState) {
        onResponseChange?.(newResponse);
      } else {
        setLocalState((prev) => {
          // Prevent changes if already submitted/correct/completed
          if (
            prev.status === "submitted" ||
            prev.status === "correct" ||
            prev.status === "completed"
          ) {
            return prev;
          }
          return {
            ...prev,
            response: newResponse,
            status: prev.status === "idle" ? "active" : prev.status,
          };
        });
        onResponseChange?.(newResponse);
      }
    },
    [activityState, onResponseChange],
  );

  const submit = useCallback(() => {
    if (activityState) {
      onSubmit?.();
    } else {
      setLocalState((prev) => {
        if (
          prev.status === "submitted" ||
          prev.status === "correct" ||
          prev.status === "completed"
        ) {
          return prev; // Prevent duplicate submissions in local mode
        }

        const valResult = evaluateActivityValidation(activity, prev.response);
        const isCorrect = valResult.isValid;
        return {
          ...prev,
          status: isCorrect ? "correct" : "incorrect",
          validationResult: valResult,
          attempts: prev.attempts + 1,
          submittedAt: Date.now(),
        };
      });
    }
  }, [activityState, onSubmit, activity]);

  const retry = useCallback(() => {
    if (activityState) {
      onRetry?.();
    } else {
      setLocalState((prev) => {
        if (prev.status !== "incorrect") return prev;
        return {
          ...prev,
          status: "active",
          validationResult: undefined,
        };
      });
    }
  }, [activityState, onRetry]);

  const continueActivity = useCallback(() => {
    const finalStatus =
      activity.validation && effectiveState.validationResult
        ? effectiveState.validationResult.isValid
          ? "passed"
          : "failed"
        : "completed";

    const completionEvent: ActivityCompletionEvent<ActivityResponse<T["type"]>> = {
      activityId: activity.id,
      activityType: activity.type,
      status: finalStatus,
      finalResponse: effectiveState.response,
      validationResult: effectiveState.validationResult,
      metrics: {
        attempts: effectiveState.attempts,
        hintsRevealed: effectiveState.hintsRevealed,
        durationMs: Date.now() - effectiveState.startedAt,
      },
      evidenceConfig: activity.evidence,
    };

    if (activityState) {
      if (onContinue) {
        onContinue();
      } else {
        onComplete?.(completionEvent);
      }
    } else {
      setLocalState((prev) => {
        if (prev.status === "completed") return prev;
        return {
          ...prev,
          status: "completed",
        };
      });
      onComplete?.(completionEvent);
    }
  }, [activity, activityState, effectiveState, onContinue, onComplete]);

  const revealHint = useCallback(() => {
    if (activityState) {
      onRevealHint?.();
    } else {
      const maxHints = activity.feedback?.hints?.length || 0;
      setLocalState((prev) => ({
        ...prev,
        hintsRevealed: Math.min(prev.hintsRevealed + 1, maxHints),
      }));
    }
  }, [activityState, onRevealHint, activity.feedback?.hints?.length]);

  return {
    state: effectiveState,
    actions: {
      respond,
      submit,
      retry,
      continue: continueActivity,
      revealHint,
    },
  };
}
