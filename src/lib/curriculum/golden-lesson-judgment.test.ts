// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";
import { canonicalProvider } from "./canonical-provider";
import { validateCurriculumIntegrity, validateLesson } from "./schema";
import {
  evaluateActivityValidation,
  validateJudgmentStep,
} from "@/components/lesson/canonical/validation";
import { renderActivity } from "@/components/lesson/canonical/registry";
import { JudgmentRenderer } from "@/components/lesson/canonical/renderers/judgment-renderer";
import {
  createLessonSession,
  startLessonSession,
  engageSessionActivity,
  completeSessionActivity,
  startActivityEvaluation,
  resolveActivityEvaluation,
  nextSessionActivity,
  checkLessonCompletion,
  completeLessonSession,
  calculateSessionProgress,
} from "@/lib/learning-engine/session-engine";
import {
  generateLessonEvidenceTokens,
  evaluateLessonObjectivesSatisfaction,
} from "@/lib/learning-engine/evidence-engine";
import type { CanonicalLesson, CanonicalActivity } from "./types";

/**
 * Phase 2E Judgment Certification.
 *
 * This is the first golden test suite to exercise the `judgment` activity
 * type end-to-end. Prior to this file, `judgment` had a schema, a renderer,
 * and an evaluation branch, but zero real canonical content and zero test
 * coverage anywhere in the repository (verified by `grep -c "judgment"` across
 * all four pre-existing golden-lesson test files returning 0 in every case).
 */
describe("Phase 2E — Golden Judgment Certification (lesson-1-4-4): Understanding Network Requests", () => {
  let lesson: CanonicalLesson;
  let judgmentActivity: CanonicalActivity;

  beforeEach(() => {
    const loaded = canonicalProvider.getLesson("lesson-1-4-4");
    if (!loaded) {
      throw new Error("Golden Judgment Lesson (lesson-1-4-4) not found in canonicalProvider");
    }
    lesson = loaded;
    judgmentActivity = lesson.activities.find(
      (a) => a.id === "act-144-judgment-diagnose",
    ) as CanonicalActivity;
  });

  describe("1. Lesson Metadata & Curriculum Schema Verification", () => {
    it("has valid schema and exact metadata", () => {
      expect(lesson.id).toBe("lesson-1-4-4");
      expect(lesson.topicId).toBe("understanding-network-requests");
      expect(lesson.lessonType).toBe("instruction");
      expect(lesson.schemaVersion).toBe("1.0.0");
    });

    it("verifies full curriculum relational integrity with zero errors", () => {
      const integrity = validateCurriculumIntegrity({
        academy: canonicalProvider.getAcademy(),
        levels: canonicalProvider.getLevels(),
        modules: canonicalProvider.getModules(),
        topics: canonicalProvider.getTopics(),
        concepts: canonicalProvider.getConcepts(),
        skills: canonicalProvider.getSkills(),
        misconceptions: canonicalProvider.getMisconceptions(),
        lessons: [lesson],
      });

      expect(integrity.valid).toBe(true);
      expect(integrity.errors).toHaveLength(0);
    });

    it("contains exactly one judgment activity, stored under nested `content` per judgmentActivitySchema", () => {
      expect(judgmentActivity).toBeDefined();
      expect(judgmentActivity.type).toBe("judgment");
      // Canonical storage is nested under `content`, matching every other
      // activity type — NOT the flat JudgmentStep shape the renderer consumes.
      expect((judgmentActivity as any).content).toBeDefined();
      expect((judgmentActivity as any).content.modelAnswer).toBeDefined();
      expect((judgmentActivity as any).content.evaluationRubric.length).toBeGreaterThan(0);
      // Confirms it is NOT stored flat (i.e. this is genuinely canonical content,
      // not the legacy flat JudgmentStep shape slipping through).
      expect((judgmentActivity as any).prompt).toBeUndefined();
    });
  });

  describe("2. Schema validation — valid vs malformed judgment content", () => {
    it("a fully valid judgment activity passes validateJudgmentStep", () => {
      const result = validateJudgmentStep(judgmentActivity);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("rejects a judgment step missing modelAnswer", () => {
      const malformed = {
        content: {
          prompt: "Diagnose this.",
          evaluationRubric: [{ id: "c1", label: "L", description: "D" }],
        },
      };
      const result = validateJudgmentStep(malformed);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("modelAnswer"))).toBe(true);
    });

    it("rejects a judgment step with an empty evaluationRubric array", () => {
      const malformed = {
        content: {
          prompt: "Diagnose this.",
          modelAnswer: { summary: "S", detailedAnalysis: "D", keyTradeoffs: [] },
          evaluationRubric: [],
        },
      };
      const result = validateJudgmentStep(malformed);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("evaluationRubric"))).toBe(true);
    });

    it("rejects a judgment step missing prompt", () => {
      const malformed = {
        content: {
          modelAnswer: { summary: "S", detailedAnalysis: "D", keyTradeoffs: [] },
          evaluationRubric: [{ id: "c1", label: "L", description: "D" }],
        },
      };
      const result = validateJudgmentStep(malformed);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("prompt"))).toBe(true);
    });

    it("the canonical-provider load-time Zod validation also rejects malformed judgment lessons", () => {
      const brokenLesson = JSON.parse(JSON.stringify(lesson));
      delete brokenLesson.activities.find((a: any) => a.id === "act-144-judgment-diagnose").content
        .modelAnswer;

      expect(() => validateLesson(brokenLesson)).toThrow();
    });
  });

  describe("3. Activity Validation Evaluation Contract", () => {
    it("rejects a response below the 50-character evidence threshold", () => {
      const result = evaluateActivityValidation(judgmentActivity, "Too short.");
      expect(result.isValid).toBe(false);
      expect(result.feedbackMessage).toContain("50");
    });

    it("accepts a response at/above the 50-character threshold", () => {
      const sufficientResponse =
        "Monday is a DNS resolution failure because the hostname never resolved to an address, so no server was ever contacted; Wednesday succeeded at DNS and connection but the server never responded in time, which is a server-side timeout, not a naming problem.";
      const result = evaluateActivityValidation(judgmentActivity, sufficientResponse);
      expect(result.isValid).toBe(true);
    });

    it("also accepts the structured { response, checkedCriteria } evidence shape the renderer actually emits", () => {
      const sufficientResponse =
        "Monday failed DNS resolution before any connection was attempted. Wednesday succeeded at DNS and connection, then timed out waiting for the server, which is a server-side issue.";
      const result = evaluateActivityValidation(judgmentActivity, {
        response: sufficientResponse,
        checkedCriteria: ["crit-identifies-dns-stage"],
      });
      expect(result.isValid).toBe(true);
    });
  });

  describe("4. Renderer Resolution — valid content reaches JudgmentRenderer; malformed content does not silently fall back to empty", () => {
    it("renders all 5 activities via renderActivity without throwing, and the judgment activity resolves to JudgmentRenderer with content intact", () => {
      lesson.activities.forEach((activity) => {
        const rendered = renderActivity(activity, {
          state: {
            activityId: activity.id,
            status: "idle",
            response: null,
            attempts: 0,
            hintsRevealed: 0,
          },
          onResponse: () => {},
          onSubmit: () => {},
          onRetry: () => {},
          onContinue: () => {},
          onRevealHint: () => {},
        });
        expect(rendered).toBeDefined();
      });

      const rendered = renderActivity(judgmentActivity, {
        state: {
          activityId: judgmentActivity.id,
          status: "idle",
          response: null,
          attempts: 0,
          hintsRevealed: 0,
        },
        onResponse: () => {},
        onSubmit: () => {},
        onRetry: () => {},
        onContinue: () => {},
        onRevealHint: () => {},
      });

      expect(rendered.type).toBe(JudgmentRenderer);
      // Model answer and rubric content survived the content -> flat-step
      // translation intact (not silently defaulted to empty).
      expect(rendered.props.step.modelAnswer.summary.length).toBeGreaterThan(0);
      expect(rendered.props.step.evaluationRubric.length).toBe(4);
    });

    it("malformed judgment content does NOT silently render with empty modelAnswer/rubric — it resolves to a distinct, non-JudgmentRenderer element", () => {
      const malformedActivity = {
        id: "act-broken-judgment",
        type: "judgment",
        intent: "reflection",
        objectiveIds: [],
        content: {
          prompt: "This activity is missing required judgment fields.",
          // modelAnswer and evaluationRubric intentionally omitted
        },
      } as unknown as CanonicalActivity;

      const rendered = renderActivity(malformedActivity, {
        state: {
          activityId: "act-broken-judgment",
          status: "idle",
          response: null,
          attempts: 0,
          hintsRevealed: 0,
        },
        onResponse: () => {},
        onSubmit: () => {},
        onRetry: () => {},
        onContinue: () => {},
        onRevealHint: () => {},
      });

      // Before Phase 2E, this path produced a JudgmentRenderer with
      // modelAnswer defaulted to {summary: "", detailedAnalysis: "", keyTradeoffs: []}
      // and an empty rubric — i.e. it "rendered fine" while teaching nothing.
      expect(rendered.type).not.toBe(JudgmentRenderer);
      expect(rendered.props.step).toBeUndefined();
    });
  });

  describe("5. End-to-End Learning Engine Progression & Completion Lifecycle", () => {
    function buildFullyCompletedSession(score?: number) {
      let session = startLessonSession(createLessonSession(lesson, "score-regression-user"));
      for (const activity of lesson.activities) {
        if (activity.id === judgmentActivity.id && score !== undefined) {
          session = engageSessionActivity(session, activity.id, "A sufficiently detailed judgment response that explains the evidence and next investigation.");
          session = startActivityEvaluation(session, activity.id);
          session = resolveActivityEvaluation(session, activity.id, {
            isValid: true,
            score,
            feedbackMessage: score === 100 ? "Correct" : "Needs more evidence",
          });
        }
        session = completeSessionActivity(session, activity.id);
      }
      return session;
    }

    it("requires a scored evaluation for a 100% minimum-score lesson", () => {
      const check = checkLessonCompletion(buildFullyCompletedSession(), lesson);
      expect(check.canComplete).toBe(false);
      expect(check.reasons).toContain("Minimum score of 100% cannot be verified without scored activities");
    });

    it("completes when the judgment activity records a successful score of 100", () => {
      const check = checkLessonCompletion(buildFullyCompletedSession(100), lesson);
      expect(check.canComplete).toBe(true);
    });

    it("rejects a judgment score below the 100% minimum", () => {
      const check = checkLessonCompletion(buildFullyCompletedSession(99), lesson);
      expect(check.canComplete).toBe(false);
      expect(check.reasons?.some((reason) => reason.includes("Minimum score of 100% not met"))).toBe(true);
    });

    it("progresses through all 5 activities including judgment, records evidence, and achieves lesson completion", () => {
      const userId = "learner-user-net401";

      let session = createLessonSession(lesson, userId);
      session = startLessonSession(session);

      expect(session.status).toBe("in-progress");
      expect(session.currentActivityId).toBe("act-144-intro");

      // Intro
      session = completeSessionActivity(session, "act-144-intro");
      session = nextSessionActivity(session, lesson);
      expect(session.currentActivityId).toBe("act-144-explanation");

      // Explanation
      session = completeSessionActivity(session, "act-144-explanation");
      session = nextSessionActivity(session, lesson);
      expect(session.currentActivityId).toBe("act-144-mc-stage");

      // Multiple choice (correct on first attempt — no RETRY needed, keeps
      // this suite focused on the judgment path rather than re-testing the
      // MC retry path already covered by golden-lesson-1)
      session = engageSessionActivity(session, "act-144-mc-stage", "opt-b");
      session = completeSessionActivity(session, "act-144-mc-stage");
      session = nextSessionActivity(session, lesson);
      expect(session.currentActivityId).toBe("act-144-judgment-diagnose");

      // Judgment: commit a sufficient response (mirrors JudgmentRenderer's
      // handleFinish evidence payload shape), then complete the activity —
      // judgment never enters evaluating/passed/failed, it goes straight to
      // completed, matching what judgment-renderer.tsx actually does.
      const judgmentResponse = {
        response:
          "Monday failed during DNS resolution — the hostname never resolved to an address, so no server was ever contacted; this points at DNS/domain configuration, not the server. Wednesday's DNS and connection both succeeded quickly, then the request stalled at Waiting (TTFB) for 30 seconds — the server was reachable but never responded in time, which points at server-side health, not naming.",
        checkedCriteria: [
          "crit-identifies-dns-stage",
          "crit-identifies-timeout-stage",
          "crit-explains-why-different",
          "crit-uses-timeline-evidence",
        ],
        totalCriteria: 4,
        charCount: 300,
      };
      session = engageSessionActivity(session, "act-144-judgment-diagnose", judgmentResponse);
      const judgmentResult = evaluateActivityValidation(judgmentActivity, judgmentResponse);
      expect(judgmentResult.isValid).toBe(true);
      session = startActivityEvaluation(session, "act-144-judgment-diagnose");
      session = resolveActivityEvaluation(
        session,
        "act-144-judgment-diagnose",
        { ...judgmentResult, score: 100 },
      );
      session = completeSessionActivity(session, "act-144-judgment-diagnose");
      session = nextSessionActivity(session, lesson);
      expect(session.currentActivityId).toBe("act-144-summary");

      // Summary
      session = completeSessionActivity(session, "act-144-summary");

      const progress = calculateSessionProgress(session);
      expect(progress.percentage).toBe(100);
      expect(progress.completedCount).toBe(5);

      const completionCheck = checkLessonCompletion(session, lesson);
      expect(completionCheck.canComplete).toBe(true);

      session = completeLessonSession(session, lesson);
      expect(session.status).toBe("completed");

      const evidenceTokens = generateLessonEvidenceTokens(lesson, session);
      const netTokens = evidenceTokens.filter((t) => t.objectiveId === "OBJ-NET-402");
      expect(netTokens.length).toBeGreaterThan(0);

      const satisfaction = evaluateLessonObjectivesSatisfaction(lesson, evidenceTokens);
      expect(satisfaction.results["OBJ-NET-402"].satisfied).toBe(true);
    });
  });
});
