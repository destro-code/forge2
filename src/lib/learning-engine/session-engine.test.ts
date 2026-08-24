import { describe, it, expect } from "vitest";
import {
  createLessonSession,
  startLessonSession,
  engageSessionActivity,
  startActivityEvaluation,
  resolveActivityEvaluation,
  retrySessionActivity,
  revealSessionActivityHint,
  completeSessionActivity,
  navigateToActivity,
  nextSessionActivity,
  previousSessionActivity,
  checkLessonCompletion,
  completeLessonSession,
  calculateSessionProgress,
} from "./session-engine";
import { InvalidStateTransitionError } from "./types";
import type { CanonicalLesson } from "@/lib/curriculum/types";
import { canonicalProvider } from "@/lib/providers/content-provider";

describe("Phase 2B.1: Headless Lesson Session Engine", () => {
  const mockLesson: CanonicalLesson = {
    id: "test-lesson-101",
    schemaVersion: "1.0.0",
    topicId: "topic-test",
    title: "Test Lesson",
    description: "A test canonical lesson",
    lessonType: "instruction",
    difficulty: "Beginner",
    estimatedMinutes: 10,
    conceptIds: ["concept-1"],
    skillIds: ["skill-1"],
    objectives: [
      {
        id: "obj-1",
        statement: "Understand testing",
        conceptIds: ["concept-1"],
        skillIds: ["skill-1"],
        priority: "primary",
      },
    ],
    prerequisites: {},
    activities: [
      {
        id: "act-1",
        type: "intro",
        intent: "orientation",
        objectiveIds: ["obj-1"],
        content: { title: "Welcome", hook: "Let's learn." },
      },
      {
        id: "act-2",
        type: "multiple-choice",
        intent: "retrieval",
        objectiveIds: ["obj-1"],
        content: {
          question: "Select the correct option",
          options: [
            { id: "opt-a", text: "Alpha" },
            { id: "opt-b", text: "Beta" },
          ],
        },
        validation: { type: "exact-match", expected: "opt-a" },
      },
      {
        id: "act-3",
        type: "summary",
        intent: "synthesis",
        objectiveIds: ["obj-1"],
        content: { takeaways: ["You learned well."] },
      },
    ],
    completion: {
      requiredActivityIds: ["act-1", "act-2", "act-3"],
    },
  };

  describe("Session Lifecycle & Initialization", () => {
    it("creates a valid, serialization-safe session state in not-started status", () => {
      const session = createLessonSession(mockLesson, {
        sessionId: "custom-session-id",
        timestamp: 1000,
      });

      expect(session.sessionId).toBe("custom-session-id");
      expect(session.lessonId).toBe("test-lesson-101");
      expect(session.status).toBe("not-started");
      expect(session.totalActivities).toBe(3);
      expect(session.currentActivityIndex).toBe(0);
      expect(session.currentActivityId).toBe("act-1");
      expect(session.activityOrder).toEqual(["act-1", "act-2", "act-3"]);
      expect(session.completedActivityIds).toEqual([]);
      expect(Object.keys(session.activities)).toHaveLength(3);
      expect(session.activities["act-1"].status).toBe("idle");
      expect(session.startedAt).toBe(1000);
      expect(session.lastActiveAt).toBe(1000);

      // Verify serialization safety
      const json = JSON.stringify(session);
      const parsed = JSON.parse(json);
      expect(parsed).toEqual(session);
    });

    it("throws when attempting to create a session for an empty lesson", () => {
      const invalidLesson = { ...mockLesson, activities: [] };
      expect(() => createLessonSession(invalidLesson as any)).toThrowError();
    });

    it("starts a session transitioning not-started to in-progress", () => {
      const session = createLessonSession(mockLesson, { timestamp: 1000 });
      const started = startLessonSession(session, 1100);

      expect(started.status).toBe("in-progress");
      expect(started.lastActiveAt).toBe(1100);

      // Idempotent start
      const startedAgain = startLessonSession(started, 1200);
      expect(startedAgain.status).toBe("in-progress");
    });
  });

  describe("Activity Interactions & State Transitions within Session", () => {
    it("engages activity, updates response, and automatically moves session to in-progress", () => {
      const session = createLessonSession(mockLesson, { timestamp: 1000 });
      const engaged = engageSessionActivity(session, "act-2", "opt-a", 1100);

      expect(engaged.status).toBe("in-progress");
      expect(engaged.activities["act-2"].status).toBe("engaged");
      expect(engaged.activities["act-2"].response).toBe("opt-a");
      expect(engaged.lastActiveAt).toBe(1100);
    });

    it("evaluates activity and updates evaluation results", () => {
      let session = createLessonSession(mockLesson, { timestamp: 1000 });
      session = engageSessionActivity(session, "act-2", "opt-b", 1100);

      // Start evaluation
      session = startActivityEvaluation(session, "act-2", 1200);
      expect(session.activities["act-2"].status).toBe("evaluating");
      expect(session.activities["act-2"].attempts).toBe(1);

      // Resolve evaluation (failed)
      session = resolveActivityEvaluation(
        session,
        "act-2",
        { isValid: false, feedbackMessage: "Wrong choice" },
        1300,
      );
      expect(session.activities["act-2"].status).toBe("failed");
      expect(session.activities["act-2"].lastEvaluation?.isValid).toBe(false);

      // Retry
      session = retrySessionActivity(session, "act-2", 1400);
      expect(session.activities["act-2"].status).toBe("retrying");

      // Reveal hint
      session = revealSessionActivityHint(session, "act-2", 1450);
      expect(session.activities["act-2"].hintsRevealed).toBe(1);

      // Re-engage with correct answer
      session = engageSessionActivity(session, "act-2", "opt-a", 1500);
      expect(session.activities["act-2"].status).toBe("engaged");

      // Direct resolve to passed
      session = resolveActivityEvaluation(
        session,
        "act-2",
        { isValid: true, feedbackMessage: "Correct!" },
        1600,
      );
      expect(session.activities["act-2"].status).toBe("passed");
      expect(session.activities["act-2"].attempts).toBe(2);

      // Complete activity
      session = completeSessionActivity(session, "act-2", 1700);
      expect(session.activities["act-2"].status).toBe("completed");
      expect(session.completedActivityIds).toContain("act-2");
    });
  });

  describe("Navigation within Session", () => {
    it("navigates to next, previous, and arbitrary activities safely", () => {
      let session = createLessonSession(mockLesson, { timestamp: 1000 });
      expect(session.currentActivityIndex).toBe(0);
      expect(session.currentActivityId).toBe("act-1");

      // Next activity
      session = nextSessionActivity(session, 1100);
      expect(session.currentActivityIndex).toBe(1);
      expect(session.currentActivityId).toBe("act-2");

      // Next again
      session = nextSessionActivity(session, 1200);
      expect(session.currentActivityIndex).toBe(2);
      expect(session.currentActivityId).toBe("act-3");

      // Next at boundary is a no-op
      session = nextSessionActivity(session, 1300);
      expect(session.currentActivityIndex).toBe(2);

      // Previous
      session = previousSessionActivity(session, 1400);
      expect(session.currentActivityIndex).toBe(1);
      expect(session.currentActivityId).toBe("act-2");

      // Direct jump by ID
      session = navigateToActivity(session, "act-1", 1500);
      expect(session.currentActivityIndex).toBe(0);
      expect(session.currentActivityId).toBe("act-1");

      // Jump by index
      session = navigateToActivity(session, 2, 1600);
      expect(session.currentActivityIndex).toBe(2);
      expect(session.currentActivityId).toBe("act-3");

      // Invalid jumps throw
      expect(() => navigateToActivity(session, "unknown-id")).toThrowError();
      expect(() => navigateToActivity(session, 99)).toThrowError();
      expect(() => navigateToActivity(session, -1)).toThrowError();
    });
  });

  describe("Lesson Completion Rules & Gating", () => {
    it("prevents completing lesson when required activities are incomplete", () => {
      let session = createLessonSession(mockLesson, { timestamp: 1000 });
      session = completeSessionActivity(session, "act-1", 1100);

      const check = checkLessonCompletion(session, mockLesson);
      expect(check.canComplete).toBe(false);
      expect(check.missingRequiredActivityIds).toEqual(["act-2", "act-3"]);

      expect(() => completeLessonSession(session, mockLesson, 1200)).toThrowError(
        InvalidStateTransitionError,
      );
    });

    it("successfully completes lesson session when all required activities are completed", () => {
      let session = createLessonSession(mockLesson, { timestamp: 1000 });
      session = completeSessionActivity(session, "act-1", 1100);
      session = completeSessionActivity(session, "act-2", 1200);
      session = completeSessionActivity(session, "act-3", 1300);

      const check = checkLessonCompletion(session, mockLesson);
      expect(check.canComplete).toBe(true);
      expect(check.missingRequiredActivityIds).toHaveLength(0);

      const completedSession = completeLessonSession(session, mockLesson, 1400);
      expect(completedSession.status).toBe("completed");
      expect(completedSession.completedAt).toBe(1400);

      const progress = calculateSessionProgress(completedSession);
      expect(progress.completedCount).toBe(3);
      expect(progress.totalCount).toBe(3);
      expect(progress.percentage).toBe(100);
      expect(progress.isComplete).toBe(true);
    });
  });

  describe("Golden Lessons Compatibility Simulation", () => {
    it("simulates full completion lifecycle across golden lesson 0-1-1", () => {
      const goldenLesson = canonicalProvider.getLesson("lesson-0-1-1");
      expect(goldenLesson).toBeDefined();
      if (!goldenLesson) return;

      let session = createLessonSession(goldenLesson, { timestamp: 1000 });
      session = startLessonSession(session, 1050);

      expect(session.totalActivities).toBe(goldenLesson.activities.length);

      for (let i = 0; i < goldenLesson.activities.length; i++) {
        const act = goldenLesson.activities[i];
        expect(session.currentActivityId).toBe(act.id);

        if (act.type === "multiple-choice" || act.type === "ordering") {
          session = engageSessionActivity(session, act.id, "sample-answer", 1100 + i * 100);
          session = resolveActivityEvaluation(
            session,
            act.id,
            { isValid: true, feedbackMessage: "Correct" },
            1150 + i * 100,
          );
        }

        session = completeSessionActivity(session, act.id, 1200 + i * 100);

        if (i < goldenLesson.activities.length - 1) {
          session = nextSessionActivity(session, 1250 + i * 100);
        }
      }

      const completed = completeLessonSession(session, goldenLesson, 5000);
      expect(completed.status).toBe("completed");
      expect(completed.completedActivityIds.length).toBe(goldenLesson.activities.length);

      const progress = calculateSessionProgress(completed);
      expect(progress.percentage).toBe(100);
      expect(progress.isComplete).toBe(true);
    });
  });
});
