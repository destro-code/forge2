import { describe, it, expect } from "vitest";
import {
  calculateEvidenceConfidence,
  generateEvidenceId,
  generateEvidenceTokens,
  generateLessonEvidenceTokens,
  evaluateObjectiveSatisfaction,
  evaluateLessonObjectivesSatisfaction,
} from "./evidence-engine";
import type { CanonicalLesson, CanonicalActivity, Objective } from "@/lib/curriculum/types";
import type { ActivitySessionState, LessonSessionState } from "./types";

import lessonWhatIsFrontend from "@/data/canonical/lessons/lesson-what-is-frontend-development.json";
import lessonElementsTags from "@/data/canonical/lessons/lesson-elements-tags-attributes.json";
import lessonCssFlexbox from "@/data/canonical/lessons/lesson-css-flexbox.json";

describe("Evidence Engine — Golden Tests", () => {
  describe("Test 1: Confidence Scoring Formula", () => {
    it("computes exact 1.0 confidence for 1st attempt with 0 hints", () => {
      const score = calculateEvidenceConfidence(1, 0);
      expect(score).toBe(1.0);
    });

    it("applies 15% attempt penalty on 2nd attempt with 0 hints", () => {
      const score = calculateEvidenceConfidence(2, 0);
      expect(score).toBe(0.85);
    });

    it("applies compounding penalties on 2nd attempt with 1 hint", () => {
      // base (1.0) * (1 - 0.15) * (1 - 0.10) = 0.85 * 0.90 = 0.765
      const score = calculateEvidenceConfidence(2, 1);
      expect(score).toBe(0.765);
    });

    it("applies penalties for 3 attempts and 2 hints", () => {
      // base (1.0) * (1 - 0.30) * (1 - 0.20) = 0.70 * 0.80 = 0.56
      const score = calculateEvidenceConfidence(3, 2);
      expect(score).toBe(0.56);
    });

    it("strictly bounds confidence score to [0, 1] even under extreme penalties", () => {
      expect(calculateEvidenceConfidence(20, 10)).toBe(0);
      expect(calculateEvidenceConfidence(0, -2)).toBe(1);
    });

    it("preserves strict ordering invariant: 1 clean attempt > retry > retry with hints", () => {
      const clean = calculateEvidenceConfidence(1, 0);
      const retryNoHints = calculateEvidenceConfidence(2, 0);
      const retryWithHints = calculateEvidenceConfidence(2, 2);

      expect(clean).toBeGreaterThan(retryNoHints);
      expect(retryNoHints).toBeGreaterThan(retryWithHints);
    });
  });

  describe("Test 2: Gating — Failed and In-Progress Activities", () => {
    const mockLesson = lessonWhatIsFrontend as unknown as CanonicalLesson;
    const quizActivity = mockLesson.activities.find(
      (a) => a.id === "act-011-quiz-boundary",
    ) as CanonicalActivity;

    it("generates NO evidence tokens when activity is in failed state", () => {
      const sessionState: ActivitySessionState = {
        activityId: quizActivity.id,
        status: "failed",
        response: "opt-a",
        attempts: 1,
        hintsRevealed: 0,
        lastEvaluation: { isValid: false, score: 0 },
        startedAt: 1000,
      };

      const tokens = generateEvidenceTokens({
        lesson: mockLesson,
        activity: quizActivity,
        sessionState,
      });

      expect(tokens).toEqual([]);
    });

    it("generates NO evidence tokens when activity is in engaging or evaluating state", () => {
      const engagingState: ActivitySessionState = {
        activityId: quizActivity.id,
        status: "engaged",
        response: "opt-b",
        attempts: 1,
        hintsRevealed: 0,
        startedAt: 1000,
      };

      expect(
        generateEvidenceTokens({
          lesson: mockLesson,
          activity: quizActivity,
          sessionState: engagingState,
        }),
      ).toEqual([]);
    });
  });

  describe("Test 3: Gating — Informational Activities", () => {
    const mockLesson = lessonWhatIsFrontend as unknown as CanonicalLesson;
    const introActivity = mockLesson.activities.find(
      (a) => a.id === "act-011-intro",
    ) as CanonicalActivity;

    it("generates NO skill evidence for unvalidated informational activities upon completion", () => {
      const sessionState: ActivitySessionState = {
        activityId: introActivity.id,
        status: "completed",
        response: null,
        attempts: 1,
        hintsRevealed: 0,
        startedAt: 1000,
        completedAt: 2000,
      };

      const tokens = generateEvidenceTokens({
        lesson: mockLesson,
        activity: introActivity,
        sessionState,
      });

      expect(tokens).toEqual([]);
    });
  });

  describe("Test 4: Evidence Generation for Golden Lesson 0-1-1", () => {
    const mockLesson = lessonWhatIsFrontend as unknown as CanonicalLesson;
    const quizActivity = mockLesson.activities.find(
      (a) => a.id === "act-011-quiz-boundary",
    ) as CanonicalActivity;

    it("generates high-confidence evidence token on successful quiz completion", () => {
      const sessionState: ActivitySessionState = {
        activityId: quizActivity.id,
        status: "completed",
        response: "opt-b",
        attempts: 1,
        hintsRevealed: 0,
        lastEvaluation: { isValid: true, score: 100 },
        startedAt: 1000,
        completedAt: 2000,
      };

      const tokens = generateEvidenceTokens({
        lesson: mockLesson,
        activity: quizActivity,
        sessionState,
      });

      expect(tokens.length).toBe(1);
      const token = tokens[0];
      expect(token.lessonId).toBe("lesson-0-1-1");
      expect(token.activityId).toBe("act-011-quiz-boundary");
      expect(token.objectiveId).toBe("obj-frontend-def");
      expect(token.skillId).toBe("skill-distinguish-web-responsibilities");
      expect(token.confidenceScore).toBe(1.0);
      expect(token.demonstratedLevel).toBe("mastered");
    });
  });

  describe("Test 5: Evidence Generation for Golden Lesson 1-1-2", () => {
    const mockLesson = lessonElementsTags as unknown as CanonicalLesson;
    const fillBlankActivity = mockLesson.activities.find(
      (a) => a.id === "act-112-fill-blank",
    ) as CanonicalActivity;

    it("generates valid token with attempt penalty on 2nd attempt with 1 hint", () => {
      const sessionState: ActivitySessionState = {
        activityId: fillBlankActivity.id,
        status: "passed",
        response: { "blank-attr": "href", "blank-tag": "a" },
        attempts: 2,
        hintsRevealed: 1,
        lastEvaluation: { isValid: true },
        startedAt: 1000,
        evaluatedAt: 3000,
      };

      const tokens = generateEvidenceTokens({
        lesson: mockLesson,
        activity: fillBlankActivity,
        sessionState,
      });

      expect(tokens.length).toBe(1);
      const token = tokens[0];
      expect(token.lessonId).toBe("lesson-1-1-2");
      expect(token.activityId).toBe("act-112-fill-blank");
      expect(token.confidenceScore).toBe(0.765);
      expect(token.demonstratedLevel).toBe("competent");
    });
  });

  describe("Test 6: Full Lesson Session Evidence Aggregation", () => {
    const mockLesson = lessonCssFlexbox as unknown as CanonicalLesson;

    it("aggregates all valid activity evidence tokens from a completed session", () => {
      const session: LessonSessionState = {
        sessionId: "sess-123",
        lessonId: mockLesson.id,
        status: "completed",
        currentActivityId: "act-127-ordering",
        currentActivityIndex: 3,
        totalActivities: mockLesson.activities.length,
        activityOrder: mockLesson.activities.map((a) => a.id),
        activities: {
          "act-127-intro": {
            activityId: "act-127-intro",
            status: "completed",
            response: null,
            attempts: 1,
            hintsRevealed: 0,
            startedAt: 1000,
            completedAt: 1500,
          },
          "act-127-interactive-code": {
            activityId: "act-127-interactive-code",
            status: "completed",
            response: "display: flex;",
            attempts: 1,
            hintsRevealed: 0,
            lastEvaluation: { isValid: true },
            startedAt: 2000,
            completedAt: 3000,
          },
          "act-127-ordering": {
            activityId: "act-127-ordering",
            status: "passed",
            response: ["step-1", "step-2", "step-3", "step-4", "step-5"],
            attempts: 2,
            hintsRevealed: 0,
            lastEvaluation: { isValid: true },
            startedAt: 3500,
            evaluatedAt: 4000,
          },
        },
        completedActivityIds: ["act-127-intro", "act-127-interactive-code"],
        startedAt: 1000,
        lastActiveAt: 4000,
      };

      const tokens = generateLessonEvidenceTokens(mockLesson, session);

      expect(tokens.length).toBe(2);
      expect(tokens.map((t) => t.activityId)).toEqual(
        expect.arrayContaining(["act-127-interactive-code", "act-127-ordering"]),
      );
    });
  });

  describe("Test 7: Objective Satisfaction Evaluation", () => {
    const mockLesson = lessonWhatIsFrontend as unknown as CanonicalLesson;
    const objective: Objective = mockLesson.objectives[0]; // obj-frontend-def

    it("evaluates objective as unsatisfied when missing required evidence", () => {
      const result = evaluateObjectiveSatisfaction(objective, [], mockLesson);
      expect(result.satisfied).toBe(false);
      expect(result.progressPercentage).toBe(0);
      expect(result.missingRequirementIds.length).toBeGreaterThan(0);
    });

    it("evaluates objective as satisfied when all required evidence is present", () => {
      const token = {
        evidenceId: "ev_1",
        requirementId: "req_act-011-quiz-boundary",
        lessonId: mockLesson.id,
        activityId: "act-011-quiz-boundary",
        objectiveId: objective.id,
        timestamp: 1000,
        attemptsCount: 1,
        hintsUsedCount: 0,
        confidenceScore: 1.0,
      };

      const result = evaluateObjectiveSatisfaction(objective, [token], mockLesson);
      expect(result.satisfied).toBe(true);
      expect(result.progressPercentage).toBe(100);
      expect(result.missingRequirementIds).toEqual([]);
    });

    it("evaluates summary of all lesson objectives", () => {
      const token = {
        evidenceId: "ev_1",
        requirementId: "req_act-011-quiz-boundary",
        lessonId: mockLesson.id,
        activityId: "act-011-quiz-boundary",
        objectiveId: "obj-frontend-def",
        timestamp: 1000,
        attemptsCount: 1,
        hintsUsedCount: 0,
        confidenceScore: 1.0,
      };

      const summary = evaluateLessonObjectivesSatisfaction(mockLesson, [token]);
      expect(summary.lessonId).toBe(mockLesson.id);
      expect(summary.totalObjectives).toBe(2);
      expect(summary.satisfiedObjectivesCount).toBe(1);
      expect(summary.allSatisfied).toBe(false);
    });
  });
});
