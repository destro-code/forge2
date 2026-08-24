import { describe, it, expect, beforeEach } from "vitest";
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
  generateLessonEvidenceTokens,
  evaluateLessonObjectivesSatisfaction,
  calculateEvidenceConfidence,
} from "./evidence-engine";
import { InMemorySessionPersistenceAdapter } from "./persistence-port";
import { LocalStorageSessionPersistenceAdapter } from "./local-storage-persistence";
import { canonicalProvider } from "@/lib/curriculum/canonical-provider";
import { evaluateActivityValidation } from "@/components/lesson/canonical/validation";
import { InvalidStateTransitionError } from "./types";
import type { CanonicalLesson, CanonicalActivity } from "@/lib/curriculum/types";

describe("Phase 4.2: Authoritative Lesson Progression & Completion Engine", () => {
  const sampleLesson: CanonicalLesson = {
    id: "lesson-progression-402",
    schemaVersion: "1.0.0",
    topicId: "topic-web-arch",
    title: "Lesson Progression & Completion Architecture",
    description: "Hardening test fixture for full progression, evidence, and completion lifecycles",
    lessonType: "instruction",
    difficulty: "Intermediate",
    estimatedMinutes: 20,
    conceptIds: ["concept-http", "concept-dom"],
    skillIds: ["skill-http-verbs", "skill-dom-manipulation"],
    objectives: [
      {
        id: "obj-http",
        statement: "Understand HTTP request/response semantics",
        conceptIds: ["concept-http"],
        skillIds: ["skill-http-verbs"],
        priority: "primary",
        evidenceRequirements: {
          minEvidenceCount: 1,
        },
      },
      {
        id: "obj-dom",
        statement: "Manipulate DOM nodes correctly",
        conceptIds: ["concept-dom"],
        skillIds: ["skill-dom-manipulation"],
        priority: "primary",
        evidenceRequirements: {
          minEvidenceCount: 1,
        },
      },
    ],
    prerequisites: {},
    activities: [
      {
        id: "act-1-intro",
        type: "intro",
        intent: "orientation",
        objectiveIds: ["obj-http"],
        content: { title: "Introduction to HTTP", hook: "Explore HTTP fundamentals." },
      },
      {
        id: "act-2-mcq",
        type: "multiple-choice",
        intent: "retrieval",
        objectiveIds: ["obj-http"],
        content: {
          question: "Which HTTP method is idempotent?",
          options: [
            { id: "opt-get", text: "GET" },
            { id: "opt-post", text: "POST" },
          ],
        },
        validation: { type: "exact-match", expected: "opt-get" },
        evidence: {
          producesEvidence: true,
          strength: 0.9,
          successConfidence: 0.95,
          failureConfidence: 0.2,
        },
      },
      {
        id: "act-3-optional-deep-dive",
        type: "explanation",
        intent: "conceptual",
        optional: true,
        objectiveIds: ["obj-http"],
        content: {
          title: "Deep Dive into HTTP/2 and HTTP/3",
          text: "HTTP/2 introduces multiplexing...",
        },
      },
      {
        id: "act-4-code-challenge",
        type: "interactive-code",
        intent: "application",
        objectiveIds: ["obj-dom"],
        content: {
          instruction: "Select the element by ID",
          starterCode: "document.querySelector('')",
          solutionCode: "document.querySelector('#app')",
          language: "javascript",
        },
        validation: {
          type: "exact-match",
          expected: "document.querySelector('#app')",
        },
        evidence: {
          producesEvidence: true,
          strength: 0.95,
          successConfidence: 1.0,
          failureConfidence: 0.1,
        },
      },
      {
        id: "act-5-summary",
        type: "summary",
        intent: "synthesis",
        objectiveIds: ["obj-http", "obj-dom"],
        content: {
          title: "Lesson Recap",
          takeaways: ["HTTP is the protocol of the web.", "DOM enables dynamic web pages."],
        },
      },
    ],
    completion: {
      requiredActivityIds: ["act-1-intro", "act-2-mcq", "act-4-code-challenge", "act-5-summary"],
      minimumScore: 80,
    },
  };

  // -------------------------------------------------------------------------
  // 1. Authoritative Progression & Active Activity Synchronization
  // -------------------------------------------------------------------------
  describe("1. Authoritative Progression & State Synchronization", () => {
    it("maintains synchronized currentActivityId and currentActivityIndex after all transitions", () => {
      let session = createLessonSession(sampleLesson, { timestamp: 1000 });
      session = startLessonSession(session, 1050);

      expect(session.currentActivityIndex).toBe(0);
      expect(session.currentActivityId).toBe("act-1-intro");

      // Navigate forward
      session = nextSessionActivity(session, 1100);
      expect(session.currentActivityIndex).toBe(1);
      expect(session.currentActivityId).toBe("act-2-mcq");

      // Jump to activity by index
      session = navigateToActivity(session, 3, 1200);
      expect(session.currentActivityIndex).toBe(3);
      expect(session.currentActivityId).toBe("act-4-code-challenge");

      // Jump to activity by ID
      session = navigateToActivity(session, "act-5-summary", 1300);
      expect(session.currentActivityIndex).toBe(4);
      expect(session.currentActivityId).toBe("act-5-summary");

      // Navigate backward
      session = previousSessionActivity(session, 1400);
      expect(session.currentActivityIndex).toBe(3);
      expect(session.currentActivityId).toBe("act-4-code-challenge");
    });

    it("guards navigation boundaries without throwing errors", () => {
      let session = createLessonSession(sampleLesson, { timestamp: 1000 });

      // Previous at start -> returns identical session
      const prevAtStart = previousSessionActivity(session, 1050);
      expect(prevAtStart.currentActivityIndex).toBe(0);
      expect(prevAtStart.currentActivityId).toBe("act-1-intro");

      // Navigate to end
      session = navigateToActivity(session, 4, 1100);
      expect(session.currentActivityIndex).toBe(4);

      // Next at end -> returns identical session
      const nextAtEnd = nextSessionActivity(session, 1150);
      expect(nextAtEnd.currentActivityIndex).toBe(4);
      expect(nextAtEnd.currentActivityId).toBe("act-5-summary");
    });

    it("throws clear errors when navigating to non-existent activity IDs or invalid indices", () => {
      const session = createLessonSession(sampleLesson);

      expect(() => navigateToActivity(session, -1)).toThrow(/Invalid activity index/);
      expect(() => navigateToActivity(session, 99)).toThrow(/Invalid activity index/);
      expect(() => navigateToActivity(session, "act-non-existent")).toThrow(
        /does not belong to session/,
      );
    });

    it("verifies navigation alone does not complete activities or generate false evidence", () => {
      let session = createLessonSession(sampleLesson, { timestamp: 1000 });
      session = startLessonSession(session, 1050);

      // Navigate all the way to the end without completing activities
      for (let i = 0; i < sampleLesson.activities.length - 1; i++) {
        session = nextSessionActivity(session);
      }

      expect(session.completedActivityIds).toHaveLength(0);
      const readiness = checkLessonCompletion(session, sampleLesson);
      expect(readiness.canComplete).toBe(false);
      expect(readiness.missingRequiredActivityIds).toHaveLength(4);

      const evidence = generateLessonEvidenceTokens(sampleLesson, session);
      expect(evidence).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Activity Lifecycle & Validation Transitions
  // -------------------------------------------------------------------------
  describe("2. Activity Lifecycle & Transition Invariants", () => {
    it("transitions an assessed activity through idle -> engaged -> evaluating -> failed -> retrying -> evaluating -> passed -> completed", () => {
      let session = createLessonSession(sampleLesson, { timestamp: 1000 });
      session = startLessonSession(session, 1050);

      const actId = "act-2-mcq";

      // 1. Idle -> Engaged
      session = engageSessionActivity(session, actId, "opt-post", 1100);
      expect(session.activities[actId].status).toBe("engaged");
      expect(session.activities[actId].response).toBe("opt-post");

      // 2. Engaged -> Evaluating
      session = startActivityEvaluation(session, actId, 1200);
      expect(session.activities[actId].status).toBe("evaluating");
      expect(session.activities[actId].attempts).toBe(1);

      // 3. Evaluating -> Failed (incorrect answer)
      session = resolveActivityEvaluation(
        session,
        actId,
        { isValid: false, feedbackMessage: "POST is not idempotent." },
        1250,
      );
      expect(session.activities[actId].status).toBe("failed");
      expect(session.activities[actId].lastEvaluation?.isValid).toBe(false);
      expect(session.completedActivityIds).not.toContain(actId);

      // 4. Failed cannot be directly marked complete
      expect(() => completeSessionActivity(session, actId, 1300)).toThrow(
        InvalidStateTransitionError,
      );

      // 5. Failed -> Retrying
      session = retrySessionActivity(session, actId, 1350);
      expect(session.activities[actId].status).toBe("retrying");

      // 6. Retrying -> Engaged (updated correct response)
      session = engageSessionActivity(session, actId, "opt-get", 1400);
      expect(session.activities[actId].status).toBe("engaged");
      expect(session.activities[actId].response).toBe("opt-get");

      // 7. Engaged -> Evaluating -> Passed
      session = startActivityEvaluation(session, actId, 1450);
      expect(session.activities[actId].attempts).toBe(2);

      session = resolveActivityEvaluation(
        session,
        actId,
        { isValid: true, feedbackMessage: "Correct! GET is idempotent." },
        1500,
      );
      expect(session.activities[actId].status).toBe("passed");
      expect(session.activities[actId].lastEvaluation?.isValid).toBe(true);

      // 8. Passed -> Completed
      session = completeSessionActivity(session, actId, 1550);
      expect(session.activities[actId].status).toBe("completed");
      expect(session.completedActivityIds).toContain(actId);
    });

    it("allows informational activities to complete directly without assessment", () => {
      let session = createLessonSession(sampleLesson, { timestamp: 1000 });
      session = startLessonSession(session, 1050);

      const introId = "act-1-intro";
      expect(session.activities[introId].status).toBe("idle");

      // Informational activity completes upon learner engagement / continue
      session = completeSessionActivity(session, introId, 1100);
      expect(session.activities[introId].status).toBe("completed");
      expect(session.completedActivityIds).toContain(introId);
    });
  });

  // -------------------------------------------------------------------------
  // 3. Required vs Optional Activities & Completion Eligibility
  // -------------------------------------------------------------------------
  describe("3. Required vs Optional Activities & Completion Check", () => {
    it("blocks lesson completion when required activities remain incomplete", () => {
      let session = createLessonSession(sampleLesson, { timestamp: 1000 });
      session = startLessonSession(session, 1050);

      // Complete only intro
      session = completeSessionActivity(session, "act-1-intro", 1100);

      const check = checkLessonCompletion(session, sampleLesson);
      expect(check.canComplete).toBe(false);
      expect(check.isCompleted).toBe(false);
      expect(check.missingRequiredActivityIds).toEqual([
        "act-2-mcq",
        "act-4-code-challenge",
        "act-5-summary",
      ]);
      expect(check.reasons).toBeDefined();
      expect(check.reasons!.length).toBe(3);
      expect(check.reasons![0]).toContain("act-2-mcq");

      // Attempting to complete throws error
      expect(() => completeLessonSession(session, sampleLesson)).toThrow(
        InvalidStateTransitionError,
      );
    });

    it("allows lesson completion when all required activities are complete even if optional activity is skipped", () => {
      let session = createLessonSession(sampleLesson, { timestamp: 1000 });
      session = startLessonSession(session, 1050);

      // Complete required activity 1
      session = completeSessionActivity(session, "act-1-intro", 1100);

      // Complete required activity 2
      session = resolveActivityEvaluation(
        session,
        "act-2-mcq",
        { isValid: true, score: 100 },
        1200,
      );
      session = completeSessionActivity(session, "act-2-mcq", 1250);

      // Skip optional activity 3 ("act-3-optional-deep-dive")

      // Complete required activity 4
      session = resolveActivityEvaluation(
        session,
        "act-4-code-challenge",
        { isValid: true, score: 100 },
        1300,
      );
      session = completeSessionActivity(session, "act-4-code-challenge", 1350);

      // Complete required activity 5
      session = completeSessionActivity(session, "act-5-summary", 1400);

      // Verify completion eligibility
      const check = checkLessonCompletion(session, sampleLesson);
      expect(check.canComplete).toBe(true);
      expect(check.missingRequiredActivityIds).toHaveLength(0);
      expect(check.reasons).toBeUndefined();

      // Complete the lesson session
      const completedSession = completeLessonSession(session, sampleLesson, 1500);
      expect(completedSession.status).toBe("completed");
      expect(completedSession.completedAt).toBe(1500);

      // Idempotent completion check
      const reCheck = checkLessonCompletion(completedSession, sampleLesson);
      expect(reCheck.isCompleted).toBe(true);
      expect(reCheck.canComplete).toBe(true);

      const reCompleted = completeLessonSession(completedSession, sampleLesson, 1600);
      expect(reCompleted.status).toBe("completed");
      expect(reCompleted.completedAt).toBe(1500); // Preserved original timestamp
    });

    it("evaluates minimum score constraints in completion check", () => {
      let session = createLessonSession(sampleLesson, { timestamp: 1000 });
      session = startLessonSession(session, 1050);

      session = completeSessionActivity(session, "act-1-intro", 1100);

      // Pass act-2 with low score (40%)
      session = resolveActivityEvaluation(session, "act-2-mcq", { isValid: true, score: 40 }, 1200);
      session = completeSessionActivity(session, "act-2-mcq", 1250);

      // Pass act-4 with low score (50%)
      session = resolveActivityEvaluation(
        session,
        "act-4-code-challenge",
        { isValid: true, score: 50 },
        1300,
      );
      session = completeSessionActivity(session, "act-4-code-challenge", 1350);

      session = completeSessionActivity(session, "act-5-summary", 1400);

      // Lesson requires minimumScore: 80
      const check = checkLessonCompletion(session, sampleLesson);
      expect(check.canComplete).toBe(false);
      expect(check.reasons?.some((r) => r.includes("Minimum score of 80% not met"))).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 4. Evidence Generation Integrity
  // -------------------------------------------------------------------------
  describe("4. Evidence Generation Integrity", () => {
    it("generates evidence tokens only for passed/completed activities and never for failed activities", () => {
      let session = createLessonSession(sampleLesson, { timestamp: 1000 });
      session = startLessonSession(session, 1050);

      // Failed activity
      session = resolveActivityEvaluation(
        session,
        "act-2-mcq",
        { isValid: false, feedbackMessage: "Incorrect" },
        1100,
      );

      const failedTokens = generateEvidenceTokens({
        lesson: sampleLesson,
        activity: sampleLesson.activities[1],
        sessionState: session.activities["act-2-mcq"],
      });
      expect(failedTokens).toHaveLength(0);

      // Passed activity
      session = retrySessionActivity(session, "act-2-mcq", 1150);
      session = resolveActivityEvaluation(
        session,
        "act-2-mcq",
        { isValid: true, feedbackMessage: "Correct" },
        1200,
      );
      session = completeSessionActivity(session, "act-2-mcq", 1250);

      const passedTokens = generateEvidenceTokens({
        lesson: sampleLesson,
        activity: sampleLesson.activities[1],
        sessionState: session.activities["act-2-mcq"],
      });
      expect(passedTokens.length).toBeGreaterThan(0);
      expect(passedTokens[0].objectiveId).toBe("obj-http");
      expect(passedTokens[0].activityId).toBe("act-2-mcq");
      expect(passedTokens[0].lessonId).toBe(sampleLesson.id);
      expect(passedTokens[0].confidenceScore).toBeGreaterThan(0.7);
    });

    it("calculates confidence score penalties for multiple attempts and hints", () => {
      const cleanConfidence = calculateEvidenceConfidence(1, 0);
      const retryConfidence = calculateEvidenceConfidence(2, 0);
      const hintConfidence = calculateEvidenceConfidence(1, 2);
      const retryAndHintConfidence = calculateEvidenceConfidence(3, 2);

      expect(cleanConfidence).toBe(1.0);
      expect(cleanConfidence).toBeGreaterThan(retryConfidence);
      expect(retryConfidence).toBeGreaterThan(retryAndHintConfidence);
      expect(hintConfidence).toBeGreaterThan(retryAndHintConfidence);
    });

    it("evaluates objective satisfaction percentages accurately", () => {
      let session = createLessonSession(sampleLesson, { timestamp: 1000 });
      session = startLessonSession(session, 1050);

      // Complete act-2-mcq (mapped to obj-http)
      session = resolveActivityEvaluation(
        session,
        "act-2-mcq",
        { isValid: true, feedbackMessage: "Correct" },
        1100,
      );
      session = completeSessionActivity(session, "act-2-mcq", 1150);

      const partialTokens = generateLessonEvidenceTokens(sampleLesson, session);
      const partialSatisfaction = evaluateLessonObjectivesSatisfaction(sampleLesson, partialTokens);

      expect(partialSatisfaction.totalObjectives).toBe(2);
      expect(partialSatisfaction.satisfiedObjectivesCount).toBe(1);
      expect(partialSatisfaction.allSatisfied).toBe(false);
      expect(partialSatisfaction.results["obj-http"].satisfied).toBe(true);
      expect(partialSatisfaction.results["obj-dom"].satisfied).toBe(false);

      // Complete act-4-code-challenge (mapped to obj-dom)
      session = resolveActivityEvaluation(
        session,
        "act-4-code-challenge",
        { isValid: true, feedbackMessage: "Correct" },
        1200,
      );
      session = completeSessionActivity(session, "act-4-code-challenge", 1250);

      const fullTokens = generateLessonEvidenceTokens(sampleLesson, session);
      const fullSatisfaction = evaluateLessonObjectivesSatisfaction(sampleLesson, fullTokens);

      expect(fullSatisfaction.satisfiedObjectivesCount).toBe(2);
      expect(fullSatisfaction.allSatisfied).toBe(true);
      expect(fullSatisfaction.results["obj-dom"].satisfied).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 5. Persistence & Session Resumption
  // -------------------------------------------------------------------------
  describe("5. Persistence & Session Resumption", () => {
    it("saves, restores, and resumes a partially completed session via InMemorySessionPersistenceAdapter", () => {
      const adapter = new InMemorySessionPersistenceAdapter();
      let session = createLessonSession(sampleLesson, { timestamp: 1000 });
      session = startLessonSession(session, 1050);

      // Complete act-1
      session = completeSessionActivity(session, "act-1-intro", 1100);
      // Advance to act-2
      session = nextSessionActivity(session, 1150);
      // Record answer on act-2
      session = engageSessionActivity(session, "act-2-mcq", "opt-get", 1200);

      // Save to persistence
      adapter.save(session);

      // Restore from persistence
      const restored = adapter.loadByLessonId(sampleLesson.id);
      expect(restored).not.toBeNull();
      expect(restored!.lessonId).toBe(sampleLesson.id);
      expect(restored!.currentActivityId).toBe("act-2-mcq");
      expect(restored!.currentActivityIndex).toBe(1);
      expect(restored!.completedActivityIds).toEqual(["act-1-intro"]);
      expect(restored!.activities["act-2-mcq"].status).toBe("engaged");
      expect(restored!.activities["act-2-mcq"].response).toBe("opt-get");

      // Resume progression on restored session
      let resumed = resolveActivityEvaluation(
        restored!,
        "act-2-mcq",
        { isValid: true, score: 100 },
        1300,
      );
      resumed = completeSessionActivity(resumed, "act-2-mcq", 1350);

      expect(resumed.completedActivityIds).toEqual(["act-1-intro", "act-2-mcq"]);
    });

    it("preserves completed lesson state and prevents corruption after restore", () => {
      const adapter = new InMemorySessionPersistenceAdapter();
      let session = createLessonSession(sampleLesson, { timestamp: 1000 });
      session = startLessonSession(session, 1050);

      session = completeSessionActivity(session, "act-1-intro", 1100);
      session = resolveActivityEvaluation(
        session,
        "act-2-mcq",
        { isValid: true, score: 100 },
        1200,
      );
      session = completeSessionActivity(session, "act-2-mcq", 1250);
      session = resolveActivityEvaluation(
        session,
        "act-4-code-challenge",
        { isValid: true, score: 100 },
        1300,
      );
      session = completeSessionActivity(session, "act-4-code-challenge", 1350);
      session = completeSessionActivity(session, "act-5-summary", 1400);

      const completed = completeLessonSession(session, sampleLesson, 1500);
      adapter.save(completed);

      const restoredCompleted = adapter.load(completed.sessionId);
      expect(restoredCompleted).not.toBeNull();
      expect(restoredCompleted!.status).toBe("completed");
      expect(restoredCompleted!.completedAt).toBe(1500);

      const check = checkLessonCompletion(restoredCompleted!, sampleLesson);
      expect(check.isCompleted).toBe(true);
      expect(check.canComplete).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 6. Golden Lessons End-to-End Execution
  // -------------------------------------------------------------------------
  describe("6. Golden Lessons End-to-End Progression & Completion", () => {
    const goldenLessons = canonicalProvider.getLessons();

    it("verifies all 5 canonical Golden Lessons exist", () => {
      expect(goldenLessons.length).toBeGreaterThanOrEqual(5);
    });

    function getValidResponseForActivity(act: CanonicalActivity): unknown {
      if (act.type === "reflection") {
        return "This is a detailed thoughtful reflection that is long enough to satisfy all minimum character requirements.";
      }
      if (!act.validation) return null;
      if (
        act.validation.type === "exact-match" ||
        act.validation.type === "subset-superset" ||
        act.validation.type === "multi-match"
      ) {
        return act.validation.expected;
      }
      if (act.validation.type === "ordering") {
        return (act.validation as any).correctSequence || (act.validation as any).correctOrder;
      }
      if (act.validation.type === "one-of") {
        return act.validation.validOptions[0];
      }
      if (act.validation.type === "code-output") {
        return act.validation.expectedOutput;
      }
      return "test-response";
    }

    it("executes Golden Lesson 1 (Conceptual) end-to-end through real transitions", () => {
      const lesson = goldenLessons[0];
      expect(lesson).toBeDefined();

      let session = createLessonSession(lesson, { timestamp: 1000 });
      session = startLessonSession(session, 1050);

      // Step through all activities
      for (let i = 0; i < lesson.activities.length; i++) {
        const act = lesson.activities[i];
        expect(session.currentActivityIndex).toBe(i);
        expect(session.currentActivityId).toBe(act.id);

        if (act.validation || act.type === "reflection") {
          // Perform valid evaluation for assessed activity
          const validResponse = getValidResponseForActivity(act);
          session = engageSessionActivity(session, act.id, validResponse, 1100 + i * 100);
          session = startActivityEvaluation(session, act.id, 1120 + i * 100);
          const valResult = evaluateActivityValidation(act, validResponse as any);
          session = resolveActivityEvaluation(session, act.id, valResult, 1140 + i * 100);
          session = completeSessionActivity(session, act.id, 1160 + i * 100);
        } else {
          // Informational activity
          session = completeSessionActivity(session, act.id, 1150 + i * 100);
        }

        if (i < lesson.activities.length - 1) {
          session = nextSessionActivity(session, 1180 + i * 100);
        }
      }

      // Check completion eligibility
      const check = checkLessonCompletion(session, lesson);
      expect(check.canComplete).toBe(true);
      expect(check.missingRequiredActivityIds).toHaveLength(0);

      // Complete session
      const completed = completeLessonSession(session, lesson, 2000);
      expect(completed.status).toBe("completed");
      expect(completed.completedAt).toBe(2000);

      // Verify evidence generated
      const evidence = generateLessonEvidenceTokens(lesson, completed);
      expect(evidence.length).toBeGreaterThan(0);
    });

    it("executes Golden Lesson 2 (HTML / Syntax) end-to-end through real transitions", () => {
      const lesson = goldenLessons[1];
      expect(lesson).toBeDefined();

      let session = createLessonSession(lesson, { timestamp: 1000 });
      session = startLessonSession(session, 1050);

      for (let i = 0; i < lesson.activities.length; i++) {
        const act = lesson.activities[i];
        if (act.validation) {
          let validResponse: unknown = "test-response";
          if (act.validation.type === "exact-match") {
            validResponse = act.validation.expected;
          } else if (act.validation.type === "ordering") {
            validResponse = act.validation.correctOrder;
          }
          session = engageSessionActivity(session, act.id, validResponse, 1100 + i * 100);
          session = startActivityEvaluation(session, act.id, 1120 + i * 100);
          const valResult = evaluateActivityValidation(act, validResponse);
          session = resolveActivityEvaluation(session, act.id, valResult, 1140 + i * 100);
          session = completeSessionActivity(session, act.id, 1160 + i * 100);
        } else {
          session = completeSessionActivity(session, act.id, 1150 + i * 100);
        }

        if (i < lesson.activities.length - 1) {
          session = nextSessionActivity(session, 1180 + i * 100);
        }
      }

      const check = checkLessonCompletion(session, lesson);
      expect(check.canComplete).toBe(true);

      const completed = completeLessonSession(session, lesson, 2000);
      expect(completed.status).toBe("completed");
    });

    it("executes Golden Lesson 3 (CSS Flexbox) end-to-end through real transitions", () => {
      const lesson = goldenLessons[2];
      expect(lesson).toBeDefined();

      let session = createLessonSession(lesson, { timestamp: 1000 });
      session = startLessonSession(session, 1050);

      for (let i = 0; i < lesson.activities.length; i++) {
        const act = lesson.activities[i];
        if (act.validation) {
          let validResponse: unknown = "test-response";
          if (act.validation.type === "exact-match") {
            validResponse = act.validation.expected;
          }
          session = engageSessionActivity(session, act.id, validResponse, 1100 + i * 100);
          session = startActivityEvaluation(session, act.id, 1120 + i * 100);
          const valResult = evaluateActivityValidation(act, validResponse);
          session = resolveActivityEvaluation(session, act.id, valResult, 1140 + i * 100);
          session = completeSessionActivity(session, act.id, 1160 + i * 100);
        } else {
          session = completeSessionActivity(session, act.id, 1150 + i * 100);
        }

        if (i < lesson.activities.length - 1) {
          session = nextSessionActivity(session, 1180 + i * 100);
        }
      }

      const check = checkLessonCompletion(session, lesson);
      expect(check.canComplete).toBe(true);

      const completed = completeLessonSession(session, lesson, 2000);
      expect(completed.status).toBe("completed");
    });

    it("executes Golden Lesson 4 (JS Functions) end-to-end through real transitions", () => {
      const lesson = goldenLessons[3];
      expect(lesson).toBeDefined();

      let session = createLessonSession(lesson, { timestamp: 1000 });
      session = startLessonSession(session, 1050);

      for (let i = 0; i < lesson.activities.length; i++) {
        const act = lesson.activities[i];
        if (act.validation) {
          let validResponse: unknown = "test-response";
          if (act.validation.type === "exact-match") {
            validResponse = act.validation.expected;
          }
          session = engageSessionActivity(session, act.id, validResponse, 1100 + i * 100);
          session = startActivityEvaluation(session, act.id, 1120 + i * 100);
          const valResult = evaluateActivityValidation(act, validResponse);
          session = resolveActivityEvaluation(session, act.id, valResult, 1140 + i * 100);
          session = completeSessionActivity(session, act.id, 1160 + i * 100);
        } else {
          session = completeSessionActivity(session, act.id, 1150 + i * 100);
        }

        if (i < lesson.activities.length - 1) {
          session = nextSessionActivity(session, 1180 + i * 100);
        }
      }

      const check = checkLessonCompletion(session, lesson);
      expect(check.canComplete).toBe(true);

      const completed = completeLessonSession(session, lesson, 2000);
      expect(completed.status).toBe("completed");
    });

    it("executes Golden Lesson 5 (Debugging) end-to-end through real transitions", () => {
      const lesson = goldenLessons[4];
      expect(lesson).toBeDefined();

      let session = createLessonSession(lesson, { timestamp: 1000 });
      session = startLessonSession(session, 1050);

      for (let i = 0; i < lesson.activities.length; i++) {
        const act = lesson.activities[i];
        if (act.validation) {
          let validResponse: unknown = "test-response";
          if (act.validation.type === "exact-match") {
            validResponse = act.validation.expected;
          }
          session = engageSessionActivity(session, act.id, validResponse, 1100 + i * 100);
          session = startActivityEvaluation(session, act.id, 1120 + i * 100);
          const valResult = evaluateActivityValidation(act, validResponse);
          session = resolveActivityEvaluation(session, act.id, valResult, 1140 + i * 100);
          session = completeSessionActivity(session, act.id, 1160 + i * 100);
        } else {
          session = completeSessionActivity(session, act.id, 1150 + i * 100);
        }

        if (i < lesson.activities.length - 1) {
          session = nextSessionActivity(session, 1180 + i * 100);
        }
      }

      const check = checkLessonCompletion(session, lesson);
      expect(check.canComplete).toBe(true);

      const completed = completeLessonSession(session, lesson, 2000);
      expect(completed.status).toBe("completed");
    });
  });
});
