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
  getRequiredActivityIds,
  isActivityRequired,
  getRemainingRequiredActivities,
} from "./session-engine";
import {
  generateEvidenceTokens,
  evaluateLessonObjectivesSatisfaction,
  calculateEvidenceConfidence,
} from "./evidence-engine";
import { canonicalProvider } from "@/lib/curriculum/canonical-provider";
import type { CanonicalLesson } from "@/lib/curriculum/types";

describe("Phase 4.1: Learning Engine Lesson State Contract & Lifecycle", () => {
  const mockLesson: CanonicalLesson = {
    id: "lesson-contract-101",
    schemaVersion: "1.0.0",
    topicId: "topic-core",
    title: "Lesson State Contract Test",
    description: "Validates the contract of the lesson-level learning engine",
    lessonType: "instruction",
    difficulty: "Beginner",
    estimatedMinutes: 15,
    conceptIds: ["concept-html", "concept-dom"],
    skillIds: ["skill-syntax", "skill-structure"],
    objectives: [
      {
        id: "obj-1",
        statement: "Understand foundational DOM principles",
        conceptIds: ["concept-html"],
        skillIds: ["skill-syntax"],
        priority: "primary",
        evidenceRequirements: {
          minEvidenceCount: 1,
          requiredActivityTypes: ["multiple-choice"],
        },
      },
      {
        id: "obj-2",
        statement: "Construct well-formed HTML elements",
        conceptIds: ["concept-dom"],
        skillIds: ["skill-structure"],
        priority: "primary",
        evidenceRequirements: {
          minEvidenceCount: 1,
        },
      },
    ],
    prerequisites: {},
    activities: [
      {
        id: "act-intro",
        type: "intro",
        intent: "orientation",
        objectiveIds: ["obj-1"],
        content: { title: "Welcome", hook: "Let's learn DOM structure." },
      },
      {
        id: "act-mcq",
        type: "multiple-choice",
        intent: "retrieval",
        objectiveIds: ["obj-1", "obj-2"],
        content: {
          question: "Which tag creates a heading?",
          options: [
            { id: "opt-1", text: "<h1>" },
            { id: "opt-2", text: "<div>" },
          ],
        },
        validation: { type: "exact-match", expected: "opt-1" },
        evidence: {
          producesEvidence: true,
          strength: 0.9,
          successConfidence: 0.95,
          failureConfidence: 0.2,
        },
      },
      {
        id: "act-optional-playground",
        type: "code-editor",
        intent: "application",
        optional: true,
        objectiveIds: ["obj-2"],
        content: {
          language: "html",
          starterCode: "<!-- optional practice -->",
        },
      },
      {
        id: "act-summary",
        type: "summary",
        intent: "synthesis",
        objectiveIds: ["obj-1", "obj-2"],
        content: { takeaways: ["DOM represents structured documents."] },
      },
    ],
    completion: {
      requiredActivityIds: ["act-intro", "act-mcq", "act-summary"],
    },
  };

  describe("1. Lesson Initialization", () => {
    it("initializes a valid lesson session state with correct first activity", () => {
      const originalLessonSnapshot = JSON.stringify(mockLesson);
      const session = createLessonSession(mockLesson, {
        sessionId: "sess-init-1",
        timestamp: 1000,
      });

      expect(session.sessionId).toBe("sess-init-1");
      expect(session.lessonId).toBe("lesson-contract-101");
      expect(session.status).toBe("not-started");
      expect(session.totalActivities).toBe(4);
      expect(session.currentActivityIndex).toBe(0);
      expect(session.currentActivityId).toBe("act-intro");
      expect(session.activityOrder).toEqual([
        "act-intro",
        "act-mcq",
        "act-optional-playground",
        "act-summary",
      ]);
      expect(session.completedActivityIds).toEqual([]);
      expect(session.startedAt).toBe(1000);
      expect(session.lastActiveAt).toBe(1000);

      // Verify lesson immutability
      expect(JSON.stringify(mockLesson)).toBe(originalLessonSnapshot);
    });

    it("starts the lesson session transitioning status from not-started to in-progress", () => {
      const session = createLessonSession(mockLesson, { timestamp: 1000 });
      const started = startLessonSession(session, 1100);

      expect(started.status).toBe("in-progress");
      expect(started.lastActiveAt).toBe(1100);
    });
  });

  describe("2. Activity Completion & Idempotency", () => {
    it("updates lesson state when completing an activity", () => {
      let session = createLessonSession(mockLesson, { timestamp: 1000 });
      session = startLessonSession(session, 1050);

      session = completeSessionActivity(session, "act-intro", 1100);
      expect(session.completedActivityIds).toEqual(["act-intro"]);
      expect(session.activities["act-intro"].status).toBe("completed");
      expect(session.activities["act-intro"].completedAt).toBe(1100);

      // Idempotent completion does not duplicate ID or corrupt state
      const completedAgain = completeSessionActivity(session, "act-intro", 1200);
      expect(completedAgain.completedActivityIds).toEqual(["act-intro"]);
      expect(completedAgain.activities["act-intro"].completedAt).toBe(1100);
    });
  });

  describe("3. Activity Progression & Optional Activities", () => {
    it("correctly identifies required vs optional activities", () => {
      expect(isActivityRequired(mockLesson, "act-intro")).toBe(true);
      expect(isActivityRequired(mockLesson, "act-mcq")).toBe(true);
      expect(isActivityRequired(mockLesson, "act-optional-playground")).toBe(false);
      expect(isActivityRequired(mockLesson, "act-summary")).toBe(true);

      const requiredIds = getRequiredActivityIds(mockLesson);
      expect(requiredIds).toEqual(["act-intro", "act-mcq", "act-summary"]);
    });

    it("tracks remaining required activities accurately during progression", () => {
      let session = createLessonSession(mockLesson, { timestamp: 1000 });
      expect(getRemainingRequiredActivities(session, mockLesson)).toEqual([
        "act-intro",
        "act-mcq",
        "act-summary",
      ]);

      session = completeSessionActivity(session, "act-intro", 1100);
      expect(getRemainingRequiredActivities(session, mockLesson)).toEqual([
        "act-mcq",
        "act-summary",
      ]);

      // Complete optional activity - required list remains unchanged
      session = completeSessionActivity(session, "act-optional-playground", 1200);
      expect(getRemainingRequiredActivities(session, mockLesson)).toEqual([
        "act-mcq",
        "act-summary",
      ]);

      session = completeSessionActivity(session, "act-mcq", 1300);
      expect(getRemainingRequiredActivities(session, mockLesson)).toEqual(["act-summary"]);

      session = completeSessionActivity(session, "act-summary", 1400);
      expect(getRemainingRequiredActivities(session, mockLesson)).toEqual([]);
    });

    it("navigates forward and backward sequentially", () => {
      let session = createLessonSession(mockLesson, { timestamp: 1000 });
      expect(session.currentActivityId).toBe("act-intro");

      session = nextSessionActivity(session, 1100);
      expect(session.currentActivityId).toBe("act-mcq");

      session = nextSessionActivity(session, 1200);
      expect(session.currentActivityId).toBe("act-optional-playground");

      session = previousSessionActivity(session, 1300);
      expect(session.currentActivityId).toBe("act-mcq");
    });
  });

  describe("4. Objective Progress & Multi-Objective Evidence", () => {
    it("generates evidence tokens mapped to multiple objectives and evaluates satisfaction", () => {
      const mcqActivity = mockLesson.activities[1];
      expect(mcqActivity.objectiveIds).toEqual(["obj-1", "obj-2"]);

      // Generate evidence from successful activity completion
      const tokens = generateEvidenceTokens({
        lesson: mockLesson,
        activity: mcqActivity,
        sessionState: {
          status: "passed",
          attempts: 1,
          hintsRevealed: 0,
          response: "opt-1",
          lastEvaluation: { isValid: true, feedbackMessage: "Correct tag!" },
          startedAt: 1000,
          evaluatedAt: 1100,
          completedAt: 1200,
        },
      });

      expect(tokens).toHaveLength(2);
      expect(tokens[0].objectiveId).toBe("obj-1");
      expect(tokens[1].objectiveId).toBe("obj-2");
      expect(tokens[0].activityId).toBe("act-mcq");
      expect(tokens[1].activityId).toBe("act-mcq");
      expect(tokens[0].confidenceScore).toBeGreaterThan(0.8);

      // Evaluate objectives with tokens
      const satisfaction = evaluateLessonObjectivesSatisfaction(mockLesson, tokens);
      expect(satisfaction.totalObjectives).toBe(2);
      expect(satisfaction.satisfiedObjectivesCount).toBe(2);
      expect(satisfaction.allSatisfied).toBe(true);
      expect(satisfaction.results["obj-1"].satisfied).toBe(true);
      expect(satisfaction.results["obj-2"].satisfied).toBe(true);
    });

    it("calculates confidence score accurately based on attempts and hints", () => {
      const confidence1 = calculateEvidenceConfidence(1, 0);
      const confidence2 = calculateEvidenceConfidence(3, 2);
      const lowConfidence = calculateEvidenceConfidence(5, 5);

      expect(confidence1).toBeGreaterThan(confidence2);
      expect(lowConfidence).toBeLessThan(0.3);
    });
  });

  describe("5. Lesson Completion Readiness & Engine Authority", () => {
    it("prevents completion if required activities remain incomplete", () => {
      let session = createLessonSession(mockLesson, { timestamp: 1000 });
      session = completeSessionActivity(session, "act-intro", 1100);

      const check = checkLessonCompletion(session, mockLesson);
      expect(check.canComplete).toBe(false);
      expect(check.missingRequiredActivityIds).toEqual(["act-mcq", "act-summary"]);
      expect(check.reasons?.length).toBeGreaterThan(0);
    });

    it("allows completion as soon as all required activities are complete (ignoring optional)", () => {
      let session = createLessonSession(mockLesson, { timestamp: 1000 });
      session = completeSessionActivity(session, "act-intro", 1100);
      session = completeSessionActivity(session, "act-mcq", 1200);
      session = completeSessionActivity(session, "act-summary", 1300);

      // Note: act-optional-playground is NOT completed
      const check = checkLessonCompletion(session, mockLesson);
      expect(check.canComplete).toBe(true);
      expect(check.missingRequiredActivityIds).toEqual([]);

      const completed = completeLessonSession(session, mockLesson, 1400);
      expect(completed.status).toBe("completed");
      expect(completed.completedAt).toBe(1400);

      const progress = calculateSessionProgress(completed);
      expect(progress.isComplete).toBe(true);
    });
  });

  describe("6. Golden Lessons Verification across all 5 Archetypes", () => {
    const goldenLessons = canonicalProvider.getGoldenLessons();

    it("verifies 5 Golden Lessons exist and conform to the canonical schema", () => {
      expect(goldenLessons.length).toBe(5);
    });

    it("simulates full lifecycle on Golden Lesson 1: Conceptual", () => {
      const lesson = goldenLessons[0];
      expect(lesson).toBeDefined();

      let session = createLessonSession(lesson, { timestamp: 1000 });
      session = startLessonSession(session, 1050);

      for (const act of lesson.activities) {
        session = completeSessionActivity(session, act.id, 1200);
      }

      const readiness = checkLessonCompletion(session, lesson);
      expect(readiness.canComplete).toBe(true);

      const completed = completeLessonSession(session, lesson, 1500);
      expect(completed.status).toBe("completed");
    });

    it("simulates full lifecycle on Golden Lesson 2: HTML/Code", () => {
      const lesson = goldenLessons[1];
      expect(lesson).toBeDefined();

      let session = createLessonSession(lesson, { timestamp: 1000 });
      session = startLessonSession(session, 1050);

      for (const act of lesson.activities) {
        session = completeSessionActivity(session, act.id, 1200);
      }

      const readiness = checkLessonCompletion(session, lesson);
      expect(readiness.canComplete).toBe(true);

      const completed = completeLessonSession(session, lesson, 1500);
      expect(completed.status).toBe("completed");
    });

    it("simulates full lifecycle on Golden Lesson 3: CSS Flexbox", () => {
      const lesson = goldenLessons[2];
      expect(lesson).toBeDefined();

      let session = createLessonSession(lesson, { timestamp: 1000 });
      session = startLessonSession(session, 1050);

      for (const act of lesson.activities) {
        session = completeSessionActivity(session, act.id, 1200);
      }

      const readiness = checkLessonCompletion(session, lesson);
      expect(readiness.canComplete).toBe(true);

      const completed = completeLessonSession(session, lesson, 1500);
      expect(completed.status).toBe("completed");
    });

    it("simulates full lifecycle on Golden Lesson 4: JS Functions", () => {
      const lesson = goldenLessons[3];
      expect(lesson).toBeDefined();

      let session = createLessonSession(lesson, { timestamp: 1000 });
      session = startLessonSession(session, 1050);

      for (const act of lesson.activities) {
        session = completeSessionActivity(session, act.id, 1200);
      }

      const readiness = checkLessonCompletion(session, lesson);
      expect(readiness.canComplete).toBe(true);

      const completed = completeLessonSession(session, lesson, 1500);
      expect(completed.status).toBe("completed");
    });

    it("simulates full lifecycle on Golden Lesson 5: Debugging", () => {
      const lesson = goldenLessons[4];
      expect(lesson).toBeDefined();

      let session = createLessonSession(lesson, { timestamp: 1000 });
      session = startLessonSession(session, 1050);

      for (const act of lesson.activities) {
        session = completeSessionActivity(session, act.id, 1200);
      }

      const readiness = checkLessonCompletion(session, lesson);
      expect(readiness.canComplete).toBe(true);

      const completed = completeLessonSession(session, lesson, 1500);
      expect(completed.status).toBe("completed");
    });
  });
});
