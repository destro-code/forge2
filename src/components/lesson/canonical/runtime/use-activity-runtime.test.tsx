// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import React, { useImperativeHandle, forwardRef } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react"; // React 19 / 18.3 act

import {
  useActivityRuntime,
  UseActivityRuntimeOptions,
  ActivityRuntime,
} from "./use-activity-runtime";
import type { MultipleChoiceActivity } from "@/lib/curriculum/types";
import type { ActivitySessionState } from "@/lib/learning-engine/types";

// Provide a mock act function that just runs synchronously for testing
// if standard act is missing or warning. Actually react's `act` should be fine.

const mockActivity: MultipleChoiceActivity = {
  id: "act-test-1",
  type: "multiple-choice",
  intent: "retrieval",
  order: 1,
  content: {
    question: "Test question",
    options: [
      { id: "opt-1", text: "Option 1" },
      { id: "opt-2", text: "Option 2" },
    ],
  },
  validation: {
    type: "exact-match",
    expected: "opt-1",
  },
};

const TestComponent = forwardRef((props: UseActivityRuntimeOptions, ref) => {
  const runtime = useActivityRuntime(props);
  useImperativeHandle(ref, () => runtime);
  return null;
});

function renderRuntimeHook(options: UseActivityRuntimeOptions) {
  let runtimeRef: ActivityRuntime | null = null;
  const rootElement = document.createElement("div");
  const root = createRoot(rootElement);

  act(() => {
    root.render(
      <TestComponent
        {...options}
        ref={(val) => {
          runtimeRef = val;
        }}
      />,
    );
  });

  return {
    get current() {
      return runtimeRef!;
    },
    unmount: () => {
      act(() => {
        root.unmount();
      });
    },
  };
}

describe("Phase 3.2: Activity Runtime Contract", () => {
  describe("Local State Mode (No Engine Provided)", () => {
    it("initializes to idle state", () => {
      const result = renderRuntimeHook({ activity: mockActivity });
      expect(result.current.state.status).toBe("idle");
      expect(result.current.state.response).toBeUndefined();
      expect(result.current.state.attempts).toBe(0);
      result.unmount();
    });

    it("transitions to active on learner response", () => {
      const onResponseChange = vi.fn();
      const result = renderRuntimeHook({ activity: mockActivity, onResponseChange });

      act(() => {
        result.current.actions.respond("opt-1");
      });

      expect(result.current.state.status).toBe("active");
      expect(result.current.state.response).toBe("opt-1");
      expect(onResponseChange).toHaveBeenCalledWith("opt-1");
      result.unmount();
    });

    it("evaluates and transitions to correct on valid submission", () => {
      const onSubmit = vi.fn();
      const result = renderRuntimeHook({ activity: mockActivity, onSubmit });

      act(() => {
        result.current.actions.respond("opt-1");
      });
      act(() => {
        result.current.actions.submit();
      });

      expect(result.current.state.status).toBe("correct");
      expect(result.current.state.validationResult?.isValid).toBe(true);
      expect(result.current.state.attempts).toBe(1);
      result.unmount();
    });

    it("evaluates and transitions to incorrect on invalid submission", () => {
      const result = renderRuntimeHook({ activity: mockActivity });

      act(() => {
        result.current.actions.respond("opt-2");
      });
      act(() => {
        result.current.actions.submit();
      });

      expect(result.current.state.status).toBe("incorrect");
      expect(result.current.state.validationResult?.isValid).toBe(false);
      expect(result.current.state.attempts).toBe(1);
      result.unmount();
    });

    it("allows retry after incorrect submission", () => {
      const result = renderRuntimeHook({ activity: mockActivity });

      act(() => {
        result.current.actions.respond("opt-2");
      });
      act(() => {
        result.current.actions.submit();
      });

      expect(result.current.state.status).toBe("incorrect");

      act(() => {
        result.current.actions.retry();
      });

      expect(result.current.state.status).toBe("active");
      expect(result.current.state.validationResult).toBeUndefined();
      expect(result.current.state.response).toBe("opt-2");
      result.unmount();
    });

    it("ignores duplicate submissions", () => {
      const result = renderRuntimeHook({ activity: mockActivity });

      act(() => {
        result.current.actions.respond("opt-1");
      });
      act(() => {
        result.current.actions.submit();
      });

      expect(result.current.state.status).toBe("correct");
      expect(result.current.state.attempts).toBe(1);

      act(() => {
        result.current.actions.submit();
      });

      expect(result.current.state.status).toBe("correct");
      expect(result.current.state.attempts).toBe(1);
      result.unmount();
    });
  });

  describe("Engine Managed Mode (ActivitySessionState Provided)", () => {
    it("maps idle session state correctly", () => {
      const sessionState: ActivitySessionState = {
        activityId: "act-test-1",
        status: "idle",
        response: undefined,
        attempts: 0,
        hintsRevealed: 0,
        startedAt: 1000,
      };

      const result = renderRuntimeHook({ activity: mockActivity, activityState: sessionState });
      expect(result.current.state.status).toBe("idle");
      expect(result.current.state.response).toBeUndefined();
      result.unmount();
    });

    it("delegates actions to external callbacks", () => {
      const sessionState: ActivitySessionState = {
        activityId: "act-test-1",
        status: "idle",
        response: undefined,
        attempts: 0,
        hintsRevealed: 0,
        startedAt: 1000,
      };

      const onResponseChange = vi.fn();
      const onSubmit = vi.fn();
      const onRetry = vi.fn();
      const onContinue = vi.fn();
      const onRevealHint = vi.fn();

      const result = renderRuntimeHook({
        activity: mockActivity,
        activityState: sessionState,
        onResponseChange,
        onSubmit,
        onRetry,
        onContinue,
        onRevealHint,
      });

      act(() => {
        result.current.actions.respond("opt-1");
      });
      expect(onResponseChange).toHaveBeenCalledWith("opt-1");

      act(() => {
        result.current.actions.submit();
      });
      expect(onSubmit).toHaveBeenCalled();

      act(() => {
        result.current.actions.retry();
      });
      expect(onRetry).toHaveBeenCalled();

      act(() => {
        result.current.actions.continue();
      });
      expect(onContinue).toHaveBeenCalled();

      act(() => {
        result.current.actions.revealHint();
      });
      expect(onRevealHint).toHaveBeenCalled();

      result.unmount();
    });
  });
});
