import { describe, it, expect } from "vitest";
import { createInitialActivityState, transitionActivityState } from "./activity-state-machine";
import { InvalidStateTransitionError } from "./types";

describe("Phase 2B.1: Activity Lifecycle State Machine", () => {
  describe("createInitialActivityState", () => {
    it("creates an activity in idle status with 0 attempts and 0 hints", () => {
      const state = createInitialActivityState("act-1", 1000);
      expect(state.activityId).toBe("act-1");
      expect(state.status).toBe("idle");
      expect(state.attempts).toBe(0);
      expect(state.hintsRevealed).toBe(0);
      expect(state.response).toBeNull();
      expect(state.startedAt).toBe(1000);
    });
  });

  describe("Transitions from IDLE", () => {
    it("transitions to ENGAGED on ENGAGE or UPDATE_RESPONSE", () => {
      const initial = createInitialActivityState("act-1", 1000);

      const engaged1 = transitionActivityState(initial, {
        type: "ENGAGE",
        response: "hello",
        timestamp: 1100,
      });
      expect(engaged1.status).toBe("engaged");
      expect(engaged1.response).toBe("hello");
      expect(engaged1.lastEngagedAt).toBe(1100);

      const engaged2 = transitionActivityState(initial, {
        type: "UPDATE_RESPONSE",
        response: 42,
        timestamp: 1200,
      });
      expect(engaged2.status).toBe("engaged");
      expect(engaged2.response).toBe(42);
      expect(engaged2.lastEngagedAt).toBe(1200);
    });

    it("transitions to EVALUATING on START_EVALUATION and increments attempts", () => {
      const initial = createInitialActivityState("act-1", 1000);
      const evaluating = transitionActivityState(initial, {
        type: "START_EVALUATION",
        timestamp: 1100,
      });
      expect(evaluating.status).toBe("evaluating");
      expect(evaluating.attempts).toBe(1);
      expect(evaluating.evaluatedAt).toBe(1100);
    });

    it("transitions directly to PASSED or FAILED on direct RESOLVE_EVALUATION", () => {
      const initial = createInitialActivityState("act-1", 1000);

      const passed = transitionActivityState(initial, {
        type: "RESOLVE_EVALUATION",
        result: { isValid: true },
        timestamp: 1100,
      });
      expect(passed.status).toBe("passed");
      expect(passed.attempts).toBe(1);
      expect(passed.lastEvaluation?.isValid).toBe(true);

      const failed = transitionActivityState(initial, {
        type: "RESOLVE_EVALUATION",
        result: { isValid: false },
        timestamp: 1200,
      });
      expect(failed.status).toBe("failed");
      expect(failed.attempts).toBe(1);
      expect(failed.lastEvaluation?.isValid).toBe(false);
    });

    it("allows non-interactive completion directly from IDLE", () => {
      const initial = createInitialActivityState("act-intro", 1000);
      const completed = transitionActivityState(initial, {
        type: "COMPLETE_ACTIVITY",
        timestamp: 1100,
      });
      expect(completed.status).toBe("completed");
      expect(completed.completedAt).toBe(1100);
    });

    it("increments hint count on REVEAL_HINT while remaining IDLE", () => {
      const initial = createInitialActivityState("act-1", 1000);
      const hinted = transitionActivityState(initial, { type: "REVEAL_HINT" });
      expect(hinted.status).toBe("idle");
      expect(hinted.hintsRevealed).toBe(1);
    });

    it("rejects RETRY from IDLE with InvalidStateTransitionError", () => {
      const initial = createInitialActivityState("act-1", 1000);
      expect(() => transitionActivityState(initial, { type: "RETRY" })).toThrowError(
        InvalidStateTransitionError,
      );
    });
  });

  describe("Transitions from ENGAGED", () => {
    const engagedState = {
      ...createInitialActivityState("act-1", 1000),
      status: "engaged" as const,
      response: "draft",
    };

    it("updates response and stays ENGAGED", () => {
      const updated = transitionActivityState(engagedState, {
        type: "UPDATE_RESPONSE",
        response: "draft v2",
        timestamp: 1200,
      });
      expect(updated.status).toBe("engaged");
      expect(updated.response).toBe("draft v2");
      expect(updated.lastEngagedAt).toBe(1200);
    });

    it("transitions to EVALUATING and increments attempts", () => {
      const evaluating = transitionActivityState(engagedState, {
        type: "START_EVALUATION",
        timestamp: 1300,
      });
      expect(evaluating.status).toBe("evaluating");
      expect(evaluating.attempts).toBe(1);
    });

    it("transitions to PASSED or FAILED on direct RESOLVE_EVALUATION", () => {
      const passed = transitionActivityState(engagedState, {
        type: "RESOLVE_EVALUATION",
        result: { isValid: true },
        timestamp: 1400,
      });
      expect(passed.status).toBe("passed");
      expect(passed.attempts).toBe(1);

      const failed = transitionActivityState(engagedState, {
        type: "RESOLVE_EVALUATION",
        result: { isValid: false },
        timestamp: 1500,
      });
      expect(failed.status).toBe("failed");
      expect(failed.attempts).toBe(1);
    });

    it("rejects RETRY from ENGAGED with InvalidStateTransitionError", () => {
      expect(() => transitionActivityState(engagedState, { type: "RETRY" })).toThrowError(
        InvalidStateTransitionError,
      );
    });
  });

  describe("Transitions from EVALUATING", () => {
    const evaluatingState = {
      ...createInitialActivityState("act-1", 1000),
      status: "evaluating" as const,
      attempts: 1,
      response: "test code",
    };

    it("transitions to PASSED on valid RESOLVE_EVALUATION without double counting attempts", () => {
      const passed = transitionActivityState(evaluatingState, {
        type: "RESOLVE_EVALUATION",
        result: { isValid: true, feedbackMessage: "Well done" },
        timestamp: 1200,
      });
      expect(passed.status).toBe("passed");
      expect(passed.attempts).toBe(1); // Already counted on START_EVALUATION
      expect(passed.lastEvaluation?.feedbackMessage).toBe("Well done");
      expect(passed.evaluatedAt).toBe(1200);
    });

    it("transitions to FAILED on invalid RESOLVE_EVALUATION", () => {
      const failed = transitionActivityState(evaluatingState, {
        type: "RESOLVE_EVALUATION",
        result: { isValid: false, feedbackMessage: "Try again" },
        timestamp: 1200,
      });
      expect(failed.status).toBe("failed");
      expect(failed.attempts).toBe(1);
      expect(failed.lastEvaluation?.feedbackMessage).toBe("Try again");
    });

    it("strictly rejects modifying inputs while EVALUATING", () => {
      expect(() =>
        transitionActivityState(evaluatingState, { type: "ENGAGE", response: "new code" }),
      ).toThrowError(InvalidStateTransitionError);

      expect(() =>
        transitionActivityState(evaluatingState, { type: "UPDATE_RESPONSE", response: "new code" }),
      ).toThrowError(InvalidStateTransitionError);

      expect(() =>
        transitionActivityState(evaluatingState, { type: "START_EVALUATION" }),
      ).toThrowError(InvalidStateTransitionError);

      expect(() =>
        transitionActivityState(evaluatingState, { type: "COMPLETE_ACTIVITY" }),
      ).toThrowError(InvalidStateTransitionError);

      expect(() => transitionActivityState(evaluatingState, { type: "RETRY" })).toThrowError(
        InvalidStateTransitionError,
      );
    });
  });

  describe("Transitions from PASSED", () => {
    const passedState = {
      ...createInitialActivityState("act-1", 1000),
      status: "passed" as const,
      attempts: 1,
      lastEvaluation: { isValid: true },
    };

    it("transitions to COMPLETED on COMPLETE_ACTIVITY", () => {
      const completed = transitionActivityState(passedState, {
        type: "COMPLETE_ACTIVITY",
        timestamp: 1500,
      });
      expect(completed.status).toBe("completed");
      expect(completed.completedAt).toBe(1500);
    });

    it("allows revealing hints in passed state (for review)", () => {
      const hinted = transitionActivityState(passedState, { type: "REVEAL_HINT" });
      expect(hinted.hintsRevealed).toBe(1);
    });

    it("rejects modifying or re-evaluating an already passed activity", () => {
      expect(() => transitionActivityState(passedState, { type: "ENGAGE" })).toThrowError(
        InvalidStateTransitionError,
      );

      expect(() => transitionActivityState(passedState, { type: "START_EVALUATION" })).toThrowError(
        InvalidStateTransitionError,
      );

      expect(() => transitionActivityState(passedState, { type: "RETRY" })).toThrowError(
        InvalidStateTransitionError,
      );
    });
  });

  describe("Transitions from FAILED", () => {
    const failedState = {
      ...createInitialActivityState("act-1", 1000),
      status: "failed" as const,
      attempts: 1,
      lastEvaluation: { isValid: false },
    };

    it("transitions to RETRYING on RETRY", () => {
      const retrying = transitionActivityState(failedState, { type: "RETRY", timestamp: 1200 });
      expect(retrying.status).toBe("retrying");
      expect(retrying.lastEngagedAt).toBe(1200);
    });

    it("transitions back to ENGAGED on UPDATE_RESPONSE or ENGAGE", () => {
      const engaged = transitionActivityState(failedState, {
        type: "UPDATE_RESPONSE",
        response: "fixed answer",
        timestamp: 1250,
      });
      expect(engaged.status).toBe("engaged");
      expect(engaged.response).toBe("fixed answer");
    });

    it("rejects COMPLETE_ACTIVITY from FAILED", () => {
      expect(() =>
        transitionActivityState(failedState, { type: "COMPLETE_ACTIVITY" }),
      ).toThrowError(InvalidStateTransitionError);
    });
  });

  describe("Transitions from RETRYING", () => {
    const retryingState = {
      ...createInitialActivityState("act-1", 1000),
      status: "retrying" as const,
      attempts: 1,
    };

    it("transitions to ENGAGED on new input", () => {
      const engaged = transitionActivityState(retryingState, {
        type: "UPDATE_RESPONSE",
        response: "retry input",
      });
      expect(engaged.status).toBe("engaged");
      expect(engaged.response).toBe("retry input");
    });

    it("is idempotent on duplicate RETRY events", () => {
      const retried = transitionActivityState(retryingState, { type: "RETRY" });
      expect(retried.status).toBe("retrying");
    });

    it("rejects COMPLETE_ACTIVITY from RETRYING", () => {
      expect(() =>
        transitionActivityState(retryingState, { type: "COMPLETE_ACTIVITY" }),
      ).toThrowError(InvalidStateTransitionError);
    });
  });

  describe("Transitions from COMPLETED", () => {
    const completedState = {
      ...createInitialActivityState("act-1", 1000),
      status: "completed" as const,
      completedAt: 1500,
    };

    it("is idempotent on duplicate COMPLETE_ACTIVITY", () => {
      const same = transitionActivityState(completedState, { type: "COMPLETE_ACTIVITY" });
      expect(same.status).toBe("completed");
      expect(same.completedAt).toBe(1500);
    });

    it("rejects any mutating event on a completed activity", () => {
      expect(() => transitionActivityState(completedState, { type: "ENGAGE" })).toThrowError(
        InvalidStateTransitionError,
      );

      expect(() =>
        transitionActivityState(completedState, { type: "START_EVALUATION" }),
      ).toThrowError(InvalidStateTransitionError);

      expect(() => transitionActivityState(completedState, { type: "RETRY" })).toThrowError(
        InvalidStateTransitionError,
      );
    });
  });
});
