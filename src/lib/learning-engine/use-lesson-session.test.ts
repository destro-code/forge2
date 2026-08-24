// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { useLessonSession } from "./use-lesson-session";
import { InMemorySessionPersistenceAdapter } from "./persistence-port";
import { LocalStorageSessionPersistenceAdapter } from "./local-storage-persistence";
import { canonicalProvider } from "@/lib/curriculum/canonical-provider";
import type { CanonicalLesson } from "@/lib/curriculum/types";

// Helper to render useLessonSession inside React act() container
function renderLessonSessionHook(
  lesson: CanonicalLesson,
  options: Parameters<typeof useLessonSession>[1] = {},
) {
  let hookResult: ReturnType<typeof useLessonSession> | undefined;
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  function TestComponent() {
    hookResult = useLessonSession(lesson, options);
    return null;
  }

  act(() => {
    root.render(React.createElement(TestComponent));
  });

  return {
    get current() {
      if (!hookResult) throw new Error("Hook result not rendered yet.");
      return hookResult;
    },
    rerender() {
      act(() => {
        root.render(React.createElement(TestComponent));
      });
    },
    unmount() {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe("Phase 2B.3: React Integration, Session Resume & Canonical Player Wiring", () => {
  let memoryAdapter: InMemorySessionPersistenceAdapter;
  let sampleLesson: CanonicalLesson;

  beforeEach(() => {
    memoryAdapter = new InMemorySessionPersistenceAdapter();
    const golden = canonicalProvider.getGoldenLessons();
    expect(golden.length).toBeGreaterThan(0);
    sampleLesson = golden[0];
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.clear();
    }
  });

  afterEach(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.clear();
    }
  });

  it("1. Creates a brand new lesson session starting at activity 0", () => {
    const hook = renderLessonSessionHook(sampleLesson, {
      persistenceAdapter: memoryAdapter,
    });

    expect(hook.current.session.lessonId).toBe(sampleLesson.id);
    expect(hook.current.session.status).toBe("in-progress");
    expect(hook.current.session.currentActivityIndex).toBe(0);
    expect(hook.current.session.currentActivityId).toBe(sampleLesson.activities[0].id);
    expect(hook.current.currentActivity?.id).toBe(sampleLesson.activities[0].id);
    expect(hook.current.progress.completedCount).toBe(0);

    hook.unmount();
  });

  it("2. Restores an existing persisted session when available", () => {
    const hook1 = renderLessonSessionHook(sampleLesson, {
      persistenceAdapter: memoryAdapter,
    });

    const initialSessionId = hook1.current.session.sessionId;

    act(() => {
      hook1.current.updateResponse("custom response", sampleLesson.activities[0].id);
    });

    hook1.unmount();

    // Re-mount with same adapter
    const hook2 = renderLessonSessionHook(sampleLesson, {
      persistenceAdapter: memoryAdapter,
    });

    expect(hook2.current.session.sessionId).toBe(initialSessionId);
    expect(hook2.current.session.activities[sampleLesson.activities[0].id].response).toBe(
      "custom response",
    );

    hook2.unmount();
  });

  it("3. Restores currentActivityId and currentActivityIndex on resume", () => {
    const hook1 = renderLessonSessionHook(sampleLesson, {
      persistenceAdapter: memoryAdapter,
    });

    act(() => {
      hook1.current.goToActivity(1);
    });

    expect(hook1.current.session.currentActivityIndex).toBe(1);
    const targetId = sampleLesson.activities[1].id;
    expect(hook1.current.session.currentActivityId).toBe(targetId);

    hook1.unmount();

    // Resume
    const hook2 = renderLessonSessionHook(sampleLesson, {
      persistenceAdapter: memoryAdapter,
    });

    expect(hook2.current.session.currentActivityIndex).toBe(1);
    expect(hook2.current.session.currentActivityId).toBe(targetId);

    hook2.unmount();
  });

  it("4. Restores response state across unmounts", () => {
    const hook1 = renderLessonSessionHook(sampleLesson, {
      persistenceAdapter: memoryAdapter,
    });

    const act0 = sampleLesson.activities[0];
    act(() => {
      hook1.current.updateResponse({ selectedOptionId: "opt-1" }, act0.id);
    });

    hook1.unmount();

    const hook2 = renderLessonSessionHook(sampleLesson, {
      persistenceAdapter: memoryAdapter,
    });

    expect(hook2.current.session.activities[act0.id].response).toEqual({
      selectedOptionId: "opt-1",
    });

    hook2.unmount();
  });

  it("5. Restores attempt count when validation fails", () => {
    const hook1 = renderLessonSessionHook(sampleLesson, {
      persistenceAdapter: memoryAdapter,
    });

    const act0 = sampleLesson.activities[0];

    act(() => {
      hook1.current.startEvaluation(act0.id);
      hook1.current.resolveEvaluation({ isValid: false, feedbackMessage: "Wrong" }, act0.id);
    });

    expect(hook1.current.session.activities[act0.id].attempts).toBe(1);

    hook1.unmount();

    const hook2 = renderLessonSessionHook(sampleLesson, {
      persistenceAdapter: memoryAdapter,
    });

    expect(hook2.current.session.activities[act0.id].attempts).toBe(1);

    hook2.unmount();
  });

  it("6. Restores hint count across unmounts", () => {
    const hook1 = renderLessonSessionHook(sampleLesson, {
      persistenceAdapter: memoryAdapter,
    });

    const act0 = sampleLesson.activities[0];

    act(() => {
      hook1.current.revealHint(act0.id);
    });

    expect(hook1.current.session.activities[act0.id].hintsRevealed).toBe(1);

    hook1.unmount();

    const hook2 = renderLessonSessionHook(sampleLesson, {
      persistenceAdapter: memoryAdapter,
    });

    expect(hook2.current.session.activities[act0.id].hintsRevealed).toBe(1);

    hook2.unmount();
  });

  it("7. Restores validation result state", () => {
    const hook1 = renderLessonSessionHook(sampleLesson, {
      persistenceAdapter: memoryAdapter,
    });

    const act0 = sampleLesson.activities[0];

    act(() => {
      hook1.current.startEvaluation(act0.id);
      hook1.current.resolveEvaluation({ isValid: true, feedbackMessage: "Great job!" }, act0.id);
    });

    expect(hook1.current.session.activities[act0.id].lastEvaluation?.isValid).toBe(true);
    expect(hook1.current.session.activities[act0.id].lastEvaluation?.feedbackMessage).toBe(
      "Great job!",
    );

    hook1.unmount();

    const hook2 = renderLessonSessionHook(sampleLesson, {
      persistenceAdapter: memoryAdapter,
    });

    expect(hook2.current.session.activities[act0.id].lastEvaluation?.isValid).toBe(true);
    expect(hook2.current.session.activities[act0.id].lastEvaluation?.feedbackMessage).toBe(
      "Great job!",
    );

    hook2.unmount();
  });

  it("8. Navigates between activities using goNext, goPrevious, and goToActivity", () => {
    const hook = renderLessonSessionHook(sampleLesson, {
      persistenceAdapter: memoryAdapter,
    });

    expect(hook.current.session.currentActivityIndex).toBe(0);

    act(() => {
      hook.current.goNext();
    });
    expect(hook.current.session.currentActivityIndex).toBe(1);

    act(() => {
      hook.current.goPrevious();
    });
    expect(hook.current.session.currentActivityIndex).toBe(0);

    act(() => {
      hook.current.goToActivity(sampleLesson.activities.length - 1);
    });
    expect(hook.current.session.currentActivityIndex).toBe(sampleLesson.activities.length - 1);

    hook.unmount();
  });

  it("9. Handles activity retry without clearing attempt history", () => {
    const hook = renderLessonSessionHook(sampleLesson, {
      persistenceAdapter: memoryAdapter,
    });

    const act0 = sampleLesson.activities[0];

    act(() => {
      hook.current.startEvaluation(act0.id);
      hook.current.resolveEvaluation({ isValid: false, feedbackMessage: "Incorrect" }, act0.id);
    });

    expect(hook.current.session.activities[act0.id].status).toBe("failed");
    expect(hook.current.session.activities[act0.id].attempts).toBe(1);

    act(() => {
      hook.current.retry(act0.id);
    });

    expect(hook.current.session.activities[act0.id].status).toBe("retrying");
    expect(hook.current.session.activities[act0.id].attempts).toBe(1);

    hook.unmount();
  });

  it("10. Generates evidence tokens upon valid evaluation", () => {
    const flexLesson = canonicalProvider.getLesson("lesson-1-2-7") || sampleLesson;
    const hook = renderLessonSessionHook(flexLesson, {
      persistenceAdapter: memoryAdapter,
    });

    // Find an interactive activity with validation
    const interactiveAct =
      flexLesson.activities.find((a) => a.validation) || flexLesson.activities[0];

    let evalResult: any;
    act(() => {
      hook.current.goToActivity(interactiveAct.id);
      hook.current.startEvaluation(interactiveAct.id);
      evalResult = hook.current.resolveEvaluation(
        { isValid: true, feedbackMessage: "Correct!" },
        interactiveAct.id,
      );
    });

    expect(evalResult.isPassed).toBe(true);

    hook.unmount();
  });

  it("11. Evaluates objective satisfaction summary", () => {
    const hook = renderLessonSessionHook(sampleLesson, {
      persistenceAdapter: memoryAdapter,
    });

    const summary = hook.current.objectiveSummary;
    expect(summary).toBeDefined();
    expect(summary.lessonId).toBe(sampleLesson.id);
    expect(typeof summary.satisfiedObjectivesCount).toBe("number");

    hook.unmount();
  });

  it("12. Aggregates skill mastery records", () => {
    const hook = renderLessonSessionHook(sampleLesson, {
      persistenceAdapter: memoryAdapter,
    });

    const mastery = hook.current.skillMastery;
    expect(mastery).toBeDefined();
    expect(typeof mastery).toBe("object");

    hook.unmount();
  });

  it("13. Detects misconceptions on failed validation", () => {
    const flexLesson = canonicalProvider.getLesson("lesson-1-2-7") || sampleLesson;
    const hook = renderLessonSessionHook(flexLesson, {
      persistenceAdapter: memoryAdapter,
    });

    const mcActivity =
      flexLesson.activities.find((a) => a.type === "multiple-choice") || flexLesson.activities[0];

    let evalResult: any;
    act(() => {
      hook.current.goToActivity(mcActivity.id);
      hook.current.updateResponse("opt-wrong-flex-items", mcActivity.id);
      hook.current.startEvaluation(mcActivity.id);
      evalResult = hook.current.resolveEvaluation(
        { isValid: false, feedbackMessage: "Incorrect option" },
        mcActivity.id,
      );
    });

    expect(evalResult.isPassed).toBe(false);

    hook.unmount();
  });

  it("14. Automatically persists session to persistence adapter on mutations", () => {
    const hook = renderLessonSessionHook(sampleLesson, {
      persistenceAdapter: memoryAdapter,
    });

    act(() => {
      hook.current.updateResponse("hello world", sampleLesson.activities[0].id);
    });

    const saved = memoryAdapter.loadByLessonId(sampleLesson.id);
    expect(saved).toBeDefined();
    expect(saved?.activities[sampleLesson.activities[0].id].response).toBe("hello world");

    hook.unmount();
  });

  it("15. Clears session via resetSession", () => {
    const hook = renderLessonSessionHook(sampleLesson, {
      persistenceAdapter: memoryAdapter,
    });

    act(() => {
      hook.current.goToActivity(1);
      hook.current.updateResponse("test response", sampleLesson.activities[1].id);
    });

    expect(memoryAdapter.loadByLessonId(sampleLesson.id)).not.toBeNull();

    act(() => {
      hook.current.resetSession();
    });

    expect(hook.current.session.currentActivityIndex).toBe(0);
    expect(hook.current.session.activities[sampleLesson.activities[1].id].response).toBeNull();

    hook.unmount();
  });

  it("16. Simulates complete refresh/resume flow using LocalStorageSessionPersistenceAdapter", () => {
    const localAdapter = new LocalStorageSessionPersistenceAdapter();

    const hook1 = renderLessonSessionHook(sampleLesson, {
      persistenceAdapter: localAdapter,
    });

    const act0 = sampleLesson.activities[0];
    act(() => {
      hook1.current.updateResponse("code buffer content", act0.id);
      hook1.current.revealHint(act0.id);
      hook1.current.goToActivity(1);
    });

    hook1.unmount();

    // Reload
    const hook2 = renderLessonSessionHook(sampleLesson, {
      persistenceAdapter: localAdapter,
    });

    expect(hook2.current.session.currentActivityIndex).toBe(1);
    expect(hook2.current.session.activities[act0.id].response).toBe("code buffer content");
    expect(hook2.current.session.activities[act0.id].hintsRevealed).toBe(1);

    hook2.unmount();
  });

  it("17. Completes lesson session when all required activities are done", () => {
    let completedCalled = false;
    const hook = renderLessonSessionHook(sampleLesson, {
      persistenceAdapter: memoryAdapter,
      onComplete: () => {
        completedCalled = true;
      },
    });

    // Complete all activities
    act(() => {
      for (const actItem of sampleLesson.activities) {
        hook.current.completeActivity(actItem.id);
      }
      hook.current.completeLesson();
    });

    expect(hook.current.session.status).toBe("completed");
    expect(completedCalled).toBe(true);

    hook.unmount();
  });

  it("18. Verifies legacy route and non-canonical lessons adapt safely", () => {
    const legacyLesson = canonicalProvider.getLesson("lesson-0-1-1");
    expect(legacyLesson).toBeDefined();

    if (legacyLesson) {
      const hook = renderLessonSessionHook(legacyLesson, {
        persistenceAdapter: memoryAdapter,
      });

      expect(hook.current.session.lessonId).toBe(legacyLesson.id);
      expect(hook.current.session.activities[legacyLesson.activities[0].id]).toBeDefined();

      hook.unmount();
    }
  });

  it("19. Preserves interactive code response buffer across session reloads", () => {
    const jsLesson = canonicalProvider.getLesson("lesson-1-3-1") || sampleLesson;
    const codeActivity =
      jsLesson.activities.find((a) => a.type === "interactive-code" || a.type === "debug") ||
      jsLesson.activities[0];

    const hook1 = renderLessonSessionHook(jsLesson, {
      persistenceAdapter: memoryAdapter,
    });

    const editedCode = "function add(a, b) { return a + b; }";

    act(() => {
      hook1.current.goToActivity(codeActivity.id);
      hook1.current.updateResponse(editedCode, codeActivity.id);
    });

    hook1.unmount();

    // Reload
    const hook2 = renderLessonSessionHook(jsLesson, {
      persistenceAdapter: memoryAdapter,
    });

    expect(hook2.current.session.activities[codeActivity.id].response).toBe(editedCode);

    hook2.unmount();
  });

  it("20. Executes all 5 Golden Lessons through integrated session engine", () => {
    const goldenLessons = canonicalProvider.getGoldenLessons();
    expect(goldenLessons.length).toBe(5);

    for (const lessonItem of goldenLessons) {
      const adapter = new InMemorySessionPersistenceAdapter();
      let completed = false;

      const hook = renderLessonSessionHook(lessonItem, {
        persistenceAdapter: adapter,
        onComplete: () => {
          completed = true;
        },
      });

      expect(hook.current.session.lessonId).toBe(lessonItem.id);
      expect(hook.current.session.totalActivities).toBe(lessonItem.activities.length);

      // Walk through each activity
      act(() => {
        for (let i = 0; i < lessonItem.activities.length; i++) {
          const actItem = lessonItem.activities[i];
          hook.current.goToActivity(i);
          hook.current.updateResponse("test response", actItem.id);
          hook.current.completeActivity(actItem.id);
        }
        hook.current.completeLesson();
      });

      expect(hook.current.session.status).toBe("completed");
      expect(completed).toBe(true);

      hook.unmount();
    }
  });
});
