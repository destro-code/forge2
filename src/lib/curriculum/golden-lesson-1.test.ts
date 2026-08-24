import { describe, it, expect, beforeEach } from "vitest";
import { canonicalProvider } from "./canonical-provider";
import { validateCurriculumIntegrity, validateLesson } from "./schema";
import { evaluateActivityValidation } from "@/components/lesson/canonical/validation";
import { renderActivity } from "@/components/lesson/canonical/registry";
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
  checkLessonCompletion,
  completeLessonSession,
  calculateSessionProgress,
  getRequiredActivityIds,
} from "@/lib/learning-engine/session-engine";
import {
  generateLessonEvidenceTokens,
  evaluateLessonObjectivesSatisfaction,
} from "@/lib/learning-engine/evidence-engine";
import { InMemorySessionPersistenceAdapter } from "@/lib/learning-engine/persistence-port";
import type { CanonicalLesson, CanonicalActivity } from "./types";

describe("Phase 5.2 — Golden Lesson 1 (lesson-0-1-1): What Is Frontend Development?", () => {
  let lesson: CanonicalLesson;

  beforeEach(() => {
    const loaded = canonicalProvider.getLesson("lesson-0-1-1");
    if (!loaded) {
      throw new Error("Golden Lesson 1 (lesson-0-1-1) not found in canonicalProvider");
    }
    lesson = loaded;
  });

  describe("1. Lesson Metadata & Curriculum Schema Verification", () => {
    it("has valid schema and exact metadata matching specification", () => {
      expect(lesson.id).toBe("lesson-0-1-1");
      expect(lesson.topicId).toBe("what-is-frontend-development");
      expect(lesson.title).toBe("What Is Frontend Development?");
      expect(lesson.difficulty).toBe("Beginner");
      expect(lesson.lessonType).toBe("instruction");
      expect(lesson.estimatedMinutes).toBe(20);
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

    it("maps all required concepts and skills", () => {
      expect(lesson.conceptIds).toContain("concept-web-architecture");
      expect(lesson.conceptIds).toContain("concept-client-server-split");
      expect(lesson.conceptIds).toContain("concept-triad-roles");
      expect(lesson.conceptIds).toContain("concept-frontend-definition");
      expect(lesson.conceptIds).toContain("concept-web-platform-trio");

      expect(lesson.skillIds).toContain("skill-classify-stack-responsibilities");
      expect(lesson.skillIds).toContain("skill-differentiate-triad-roles");
      expect(lesson.skillIds).toContain("skill-explain-client-execution");
      expect(lesson.skillIds).toContain("skill-distinguish-web-responsibilities");
    });

    it("defines the 3 core objectives with explicit mapping", () => {
      expect(lesson.objectives).toHaveLength(3);
      const [obj1, obj2, obj3] = lesson.objectives;

      expect(obj1.id).toBe("OBJ-FE-101");
      expect(obj1.conceptIds).toContain("concept-triad-roles");
      expect(obj1.skillIds).toContain("skill-differentiate-triad-roles");

      expect(obj2.id).toBe("OBJ-FE-102");
      expect(obj2.conceptIds).toContain("concept-client-server-split");
      expect(obj2.skillIds).toContain("skill-classify-stack-responsibilities");

      expect(obj3.id).toBe("OBJ-FE-103");
      expect(obj3.conceptIds).toContain("concept-web-architecture");
      expect(obj3.skillIds).toContain("skill-explain-client-execution");
    });

    it("contains exactly 7 activities in the prescribed order", () => {
      expect(lesson.activities).toHaveLength(7);

      const [a1, a2, a3, a4, a5, a6, a7] = lesson.activities;

      expect(a1.id).toBe("act-011-intro");
      expect(a1.type).toBe("intro");
      expect(a1.intent).toBe("orientation");

      expect(a2.id).toBe("act-011-explanation");
      expect(a2.type).toBe("explanation");
      expect(a2.intent).toBe("understanding");

      expect(a3.id).toBe("act-011-visual");
      expect(a3.type).toBe("visual");
      expect(a3.intent).toBe("recognition");

      expect(a4.id).toBe("act-011-mc-roles");
      expect(a4.type).toBe("multiple-choice");
      expect(a4.intent).toBe("retrieval");

      expect(a5.id).toBe("act-011-ms-boundaries");
      expect(a5.type).toBe("multi-select");
      expect(a5.intent).toBe("recognition");

      expect(a6.id).toBe("act-011-reflect-runtime");
      expect(a6.type).toBe("reflection");
      expect(a6.intent).toBe("reflection");

      expect(a7.id).toBe("act-011-summary");
      expect(a7.type).toBe("summary");
      expect(a7.intent).toBe("reflection");
    });

    it("has complete completion rules requiring all 7 activities and evidence mapping", () => {
      expect(lesson.completion).toBeDefined();
      expect(lesson.completion?.requiredActivityIds).toEqual([
        "act-011-intro",
        "act-011-explanation",
        "act-011-visual",
        "act-011-mc-roles",
        "act-011-ms-boundaries",
        "act-011-reflect-runtime",
        "act-011-summary",
      ]);
      expect(lesson.completion?.minimumScore).toBe(100);
      expect(lesson.completion?.evidenceRequirements).toHaveLength(3);
    });
  });

  describe("2. Activity Validation Evaluation Contract", () => {
    it("validates multiple-choice (act-011-mc-roles)", () => {
      const mcActivity = lesson.activities.find(
        (a) => a.id === "act-011-mc-roles",
      ) as CanonicalActivity;
      expect(mcActivity).toBeDefined();

      // Correct choice: opt-b (CSS)
      const correctResult = evaluateActivityValidation(mcActivity, "opt-b");
      expect(correctResult.isValid).toBe(true);
      expect(correctResult.feedbackMessage).toContain("Spot on!");

      // Incorrect choices: opt-a, opt-c, opt-d
      const incorrectResultA = evaluateActivityValidation(mcActivity, "opt-a");
      expect(incorrectResultA.isValid).toBe(false);

      const incorrectResultC = evaluateActivityValidation(mcActivity, "opt-c");
      expect(incorrectResultC.isValid).toBe(false);

      const incorrectResultD = evaluateActivityValidation(mcActivity, "opt-d");
      expect(incorrectResultD.isValid).toBe(false);
    });

    it("validates multi-select (act-011-ms-boundaries)", () => {
      const msActivity = lesson.activities.find(
        (a) => a.id === "act-011-ms-boundaries",
      ) as CanonicalActivity;
      expect(msActivity).toBeDefined();

      // Correct selections: ["opt-1", "opt-2", "opt-4"] in any order
      const correct1 = evaluateActivityValidation(msActivity, ["opt-1", "opt-2", "opt-4"]);
      expect(correct1.isValid).toBe(true);

      const correct2 = evaluateActivityValidation(msActivity, ["opt-4", "opt-1", "opt-2"]);
      expect(correct2.isValid).toBe(true);

      // Incomplete selection
      const partial = evaluateActivityValidation(msActivity, ["opt-1", "opt-2"]);
      expect(partial.isValid).toBe(false);

      // Wrong selection containing server tasks (opt-3, opt-5)
      const wrong = evaluateActivityValidation(msActivity, ["opt-1", "opt-2", "opt-3", "opt-4"]);
      expect(wrong.isValid).toBe(false);
    });

    it("validates reflection (act-011-reflect-runtime)", () => {
      const reflectActivity = lesson.activities.find(
        (a) => a.id === "act-011-reflect-runtime",
      ) as CanonicalActivity;
      expect(reflectActivity).toBeDefined();

      // Satisfying minCharacters >= 30
      const validText =
        "HTML loads content, CSS provides colors and grid layout, while JavaScript handles interactions.";
      const validResult = evaluateActivityValidation(reflectActivity, validText);
      expect(validResult.isValid).toBe(true);

      // Too short (< 30 chars)
      const tooShort = "HTML and CSS work.";
      const invalidResult = evaluateActivityValidation(reflectActivity, tooShort);
      expect(invalidResult.isValid).toBe(false);
    });

    it("validates informational activities (intro, explanation, visual, summary)", () => {
      const intro = lesson.activities.find((a) => a.id === "act-011-intro")!;
      const exp = lesson.activities.find((a) => a.id === "act-011-explanation")!;
      const visual = lesson.activities.find((a) => a.id === "act-011-visual")!;
      const summary = lesson.activities.find((a) => a.id === "act-011-summary")!;

      expect(evaluateActivityValidation(intro, null).isValid).toBe(true);
      expect(evaluateActivityValidation(exp, null).isValid).toBe(true);
      expect(evaluateActivityValidation(visual, null).isValid).toBe(true);
      expect(evaluateActivityValidation(summary, null).isValid).toBe(true);
    });
  });

  describe("3. Central Activity Renderer Resolution", () => {
    it("renders all 7 activities via renderActivity without error", () => {
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
    });
  });

  describe("4. End-to-End Learning Engine Progression & Completion Lifecycle", () => {
    it("progresses linearly through all 7 activities, records evidence, and achieves lesson completion", () => {
      const persistence = new InMemorySessionPersistenceAdapter();
      const userId = "learner-user-fe101";

      // Step 1: Create & start session
      let session = createLessonSession(lesson, userId);
      session = startLessonSession(session);
      persistence.save(session);

      expect(session.status).toBe("in-progress");
      expect(session.currentActivityId).toBe("act-011-intro");
      expect(session.currentActivityIndex).toBe(0);

      // Step 2: Activity 1 (Intro) — Orientation
      session = completeSessionActivity(session, "act-011-intro");
      session = nextSessionActivity(session, lesson);
      expect(session.currentActivityId).toBe("act-011-explanation");
      expect(session.currentActivityIndex).toBe(1);

      // Step 3: Activity 2 (Explanation) — Study
      session = completeSessionActivity(session, "act-011-explanation");
      session = nextSessionActivity(session, lesson);
      expect(session.currentActivityId).toBe("act-011-visual");
      expect(session.currentActivityIndex).toBe(2);

      // Step 4: Activity 3 (Visual) — Conceptual Model
      session = completeSessionActivity(session, "act-011-visual");
      session = nextSessionActivity(session, lesson);
      expect(session.currentActivityId).toBe("act-011-mc-roles");
      expect(session.currentActivityIndex).toBe(3);

      // Step 5: Activity 4 (Multiple Choice) — Active Recall on OBJ-FE-101
      // 5a. First attempt: reveal hints
      session = revealSessionActivityHint(session, "act-011-mc-roles");
      expect(session.activities["act-011-mc-roles"].hintsRevealed).toBe(1);

      // 5b. Incorrect attempt
      session = engageSessionActivity(session, "act-011-mc-roles", "opt-a");
      session = startActivityEvaluation(session, "act-011-mc-roles");
      const mcEvaluationWrong = evaluateActivityValidation(lesson.activities[3], "opt-a");
      session = resolveActivityEvaluation(session, "act-011-mc-roles", mcEvaluationWrong);
      expect(session.activities["act-011-mc-roles"].status).toBe("failed");

      // 5c. Retry & correct attempt
      session = retrySessionActivity(session, "act-011-mc-roles");
      session = engageSessionActivity(session, "act-011-mc-roles", "opt-b");
      session = startActivityEvaluation(session, "act-011-mc-roles");
      const mcEvaluationCorrect = evaluateActivityValidation(lesson.activities[3], "opt-b");
      session = resolveActivityEvaluation(session, "act-011-mc-roles", mcEvaluationCorrect);
      expect(session.activities["act-011-mc-roles"].status).toBe("passed");
      session = completeSessionActivity(session, "act-011-mc-roles");

      session = nextSessionActivity(session, lesson);
      expect(session.currentActivityId).toBe("act-011-ms-boundaries");
      expect(session.currentActivityIndex).toBe(4);

      // Step 6: Activity 5 (Multi-Select) — Boundary Classification on OBJ-FE-102
      session = engageSessionActivity(session, "act-011-ms-boundaries", [
        "opt-1",
        "opt-2",
        "opt-4",
      ]);
      session = startActivityEvaluation(session, "act-011-ms-boundaries");
      const msEvaluation = evaluateActivityValidation(lesson.activities[4], [
        "opt-1",
        "opt-2",
        "opt-4",
      ]);
      session = resolveActivityEvaluation(session, "act-011-ms-boundaries", msEvaluation);
      expect(session.activities["act-011-ms-boundaries"].status).toBe("passed");
      session = completeSessionActivity(session, "act-011-ms-boundaries");

      session = nextSessionActivity(session, lesson);
      expect(session.currentActivityId).toBe("act-011-reflect-runtime");
      expect(session.currentActivityIndex).toBe(5);

      // Step 7: Activity 6 (Reflection) — Synthesis on OBJ-FE-103
      const reflectionText =
        "Without JavaScript, HTML content and CSS styling still render readable text and responsive layout, but dynamic menu animations, real-time comment streams, and interactive cart totals stop working.";
      session = engageSessionActivity(session, "act-011-reflect-runtime", reflectionText);
      session = startActivityEvaluation(session, "act-011-reflect-runtime");
      const reflectEvaluation = evaluateActivityValidation(lesson.activities[5], reflectionText);
      session = resolveActivityEvaluation(session, "act-011-reflect-runtime", reflectEvaluation);
      expect(session.activities["act-011-reflect-runtime"].status).toBe("passed");
      session = completeSessionActivity(session, "act-011-reflect-runtime");

      session = nextSessionActivity(session, lesson);
      expect(session.currentActivityId).toBe("act-011-summary");
      expect(session.currentActivityIndex).toBe(6);

      // Step 8: Activity 7 (Summary) — Synthesis Review
      session = completeSessionActivity(session, "act-011-summary");

      // Step 9: Verify session completion criteria
      const progress = calculateSessionProgress(session);
      expect(progress.percentage).toBe(100);
      expect(progress.completedCount).toBe(7);
      expect(progress.totalCount).toBe(7);

      const completionCheck = checkLessonCompletion(session, lesson);
      expect(completionCheck.canComplete).toBe(true);
      expect(completionCheck.isCompleted).toBe(false);

      // Step 10: Complete Lesson Session
      session = completeLessonSession(session, lesson);
      expect(session.status).toBe("completed");
      expect(session.completedAt).toBeDefined();

      // Step 11: Verify Evidence Generation for all 3 Objectives
      const evidenceTokens = generateLessonEvidenceTokens(lesson, session);
      expect(evidenceTokens.length).toBeGreaterThanOrEqual(3);

      const objectiveTokens = {
        "OBJ-FE-101": evidenceTokens.filter((t) => t.objectiveId === "OBJ-FE-101"),
        "OBJ-FE-102": evidenceTokens.filter((t) => t.objectiveId === "OBJ-FE-102"),
        "OBJ-FE-103": evidenceTokens.filter((t) => t.objectiveId === "OBJ-FE-103"),
      };

      expect(objectiveTokens["OBJ-FE-101"].length).toBeGreaterThan(0);
      expect(objectiveTokens["OBJ-FE-102"].length).toBeGreaterThan(0);
      expect(objectiveTokens["OBJ-FE-103"].length).toBeGreaterThan(0);

      const satisfaction = evaluateLessonObjectivesSatisfaction(lesson, evidenceTokens);
      expect(satisfaction.allSatisfied).toBe(true);
      expect(satisfaction.results["OBJ-FE-101"].satisfied).toBe(true);
      expect(satisfaction.results["OBJ-FE-102"].satisfied).toBe(true);
      expect(satisfaction.results["OBJ-FE-103"].satisfied).toBe(true);
    });
  });
});
