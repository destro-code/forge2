// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";
import { canonicalProvider } from "./canonical-provider";
import { validateCurriculumIntegrity } from "./schema";
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
  nextSessionActivity,
  checkLessonCompletion,
  completeLessonSession,
  calculateSessionProgress,
} from "@/lib/learning-engine/session-engine";
import {
  generateLessonEvidenceTokens,
  evaluateLessonObjectivesSatisfaction,
} from "@/lib/learning-engine/evidence-engine";
import { InMemorySessionPersistenceAdapter } from "@/lib/learning-engine/persistence-port";
import type { CanonicalLesson, CanonicalActivity } from "./types";

describe("Phase 5.3 — Golden Lesson 2 (lesson-1-1-2): Elements, Tags, and Attributes", () => {
  let lesson: CanonicalLesson;

  beforeEach(() => {
    const loaded = canonicalProvider.getLesson("lesson-1-1-2");
    if (!loaded) {
      throw new Error("Golden Lesson 2 (lesson-1-1-2) not found in canonicalProvider");
    }
    lesson = loaded;
  });

  describe("1. Lesson Metadata & Curriculum Schema Verification", () => {
    it("has valid schema and exact metadata matching specification", () => {
      expect(lesson.id).toBe("lesson-1-1-2");
      expect(lesson.topicId).toBe("elements-tags-attributes");
      expect(lesson.title).toBe("Elements, Tags, and Attributes");
      expect(lesson.difficulty).toBe("Beginner");
      expect(lesson.lessonType).toBe("instruction");
      expect(lesson.estimatedMinutes).toBe(25);
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

    it("maps all 5 required concepts and 4 required skills", () => {
      expect(lesson.conceptIds).toContain("concept-html-element-anatomy");
      expect(lesson.conceptIds).toContain("concept-opening-closing-tags");
      expect(lesson.conceptIds).toContain("concept-attributes-key-value");
      expect(lesson.conceptIds).toContain("concept-nesting-hierarchy");
      expect(lesson.conceptIds).toContain("concept-html-elements");

      expect(lesson.skillIds).toContain("skill-parse-element-syntax");
      expect(lesson.skillIds).toContain("skill-construct-element-attributes");
      expect(lesson.skillIds).toContain("skill-nest-elements-validly");
      expect(lesson.skillIds).toContain("skill-write-valid-html-markup");
    });

    it("defines the 3 core objectives with explicit mapping", () => {
      expect(lesson.objectives).toHaveLength(3);
      const [obj1, obj2, obj3] = lesson.objectives;

      expect(obj1.id).toBe("OBJ-HTML-201");
      expect(obj1.conceptIds).toContain("concept-html-element-anatomy");
      expect(obj1.conceptIds).toContain("concept-opening-closing-tags");
      expect(obj1.skillIds).toContain("skill-parse-element-syntax");

      expect(obj2.id).toBe("OBJ-HTML-202");
      expect(obj2.conceptIds).toContain("concept-attributes-key-value");
      expect(obj2.conceptIds).toContain("concept-html-element-anatomy");
      expect(obj2.skillIds).toContain("skill-construct-element-attributes");
      expect(obj2.skillIds).toContain("skill-write-valid-html-markup");

      expect(obj3.id).toBe("OBJ-HTML-203");
      expect(obj3.conceptIds).toContain("concept-nesting-hierarchy");
      expect(obj3.conceptIds).toContain("concept-opening-closing-tags");
      expect(obj3.skillIds).toContain("skill-nest-elements-validly");
    });

    it("contains exactly 7 activities in the prescribed order", () => {
      expect(lesson.activities).toHaveLength(7);

      const [a1, a2, a3, a4, a5, a6, a7] = lesson.activities;

      expect(a1.id).toBe("act-112-intro");
      expect(a1.type).toBe("intro");
      expect(a1.intent).toBe("orientation");

      expect(a2.id).toBe("act-112-explanation");
      expect(a2.type).toBe("explanation");
      expect(a2.intent).toBe("understanding");

      expect(a3.id).toBe("act-112-code-example");
      expect(a3.type).toBe("code-example");
      expect(a3.intent).toBe("understanding");

      expect(a4.id).toBe("act-112-ordering");
      expect(a4.type).toBe("ordering");
      expect(a4.intent).toBe("retrieval");

      expect(a5.id).toBe("act-112-mc-nesting");
      expect(a5.type).toBe("multiple-choice");
      expect(a5.intent).toBe("retrieval");

      expect(a6.id).toBe("act-112-code-interactive");
      expect(a6.type).toBe("interactive-code");
      expect(a6.intent).toBe("application");

      expect(a7.id).toBe("act-112-summary");
      expect(a7.type).toBe("summary");
      expect(a7.intent).toBe("reflection");
    });

    it("has complete completion rules requiring all 7 activities and evidence mapping", () => {
      expect(lesson.completion).toBeDefined();
      expect(lesson.completion?.requiredActivityIds).toEqual([
        "act-112-intro",
        "act-112-explanation",
        "act-112-code-example",
        "act-112-ordering",
        "act-112-mc-nesting",
        "act-112-code-interactive",
        "act-112-summary",
      ]);
      expect(lesson.completion?.minimumScore).toBe(100);
      expect(lesson.completion?.evidenceRequirements).toHaveLength(3);
    });
  });

  describe("2. Activity Validation Evaluation Contract", () => {
    it("validates ordering activity (act-112-ordering) with exact token sequence", () => {
      const orderingActivity = lesson.activities.find(
        (a) => a.id === "act-112-ordering",
      ) as CanonicalActivity;
      expect(orderingActivity).toBeDefined();

      // Correct sequence: ["tok-1", "tok-2", "tok-3", "tok-4", "tok-5"]
      const correctResult = evaluateActivityValidation(orderingActivity, [
        "tok-1",
        "tok-2",
        "tok-3",
        "tok-4",
        "tok-5",
      ]);
      expect(correctResult.isValid).toBe(true);
      expect(correctResult.feedbackMessage).toContain("Spot on!");

      // Incorrect permutations
      const incorrect1 = evaluateActivityValidation(orderingActivity, [
        "tok-2",
        "tok-1",
        "tok-3",
        "tok-4",
        "tok-5",
      ]);
      expect(incorrect1.isValid).toBe(false);

      const incorrect2 = evaluateActivityValidation(orderingActivity, [
        "tok-1",
        "tok-2",
        "tok-4",
        "tok-3",
        "tok-5",
      ]);
      expect(incorrect2.isValid).toBe(false);

      // Incomplete sequence
      const incomplete = evaluateActivityValidation(orderingActivity, ["tok-1", "tok-2"]);
      expect(incomplete.isValid).toBe(false);
    });

    it("validates multiple-choice nesting activity (act-112-mc-nesting)", () => {
      const mcActivity = lesson.activities.find(
        (a) => a.id === "act-112-mc-nesting",
      ) as CanonicalActivity;
      expect(mcActivity).toBeDefined();

      // Correct choice: opt-a (<p>Learn <strong>frontend</strong> development.</p>)
      const correctResult = evaluateActivityValidation(mcActivity, "opt-a");
      expect(correctResult.isValid).toBe(true);
      expect(correctResult.feedbackMessage).toContain("Exactly right!");

      // Incorrect choices: opt-b, opt-c, opt-d
      const incorrectB = evaluateActivityValidation(mcActivity, "opt-b");
      expect(incorrectB.isValid).toBe(false);

      const incorrectC = evaluateActivityValidation(mcActivity, "opt-c");
      expect(incorrectC.isValid).toBe(false);

      const incorrectD = evaluateActivityValidation(mcActivity, "opt-d");
      expect(incorrectD.isValid).toBe(false);
    });

    it("validates interactive-code activity (act-112-code-interactive) with HTML tests", () => {
      const interactiveActivity = lesson.activities.find(
        (a) => a.id === "act-112-code-interactive",
      ) as CanonicalActivity;
      expect(interactiveActivity).toBeDefined();

      // Correct Solution Code:
      const correctCode = `<div class="card" id="profile-card">
  <h2>Alex Morgan</h2>
  <p>Role: <span class="badge">Developer</span></p>
</div>`;
      const correctResult = evaluateActivityValidation(interactiveActivity, correctCode);
      expect(correctResult.isValid).toBe(true);

      // Missing id="profile-card"
      const missingId = `<div class="card">
  <h2>Alex Morgan</h2>
  <p>Role: <span class="badge">Developer</span></p>
</div>`;
      const missingIdResult = evaluateActivityValidation(interactiveActivity, missingId);
      expect(missingIdResult.isValid).toBe(false);

      // Missing span.badge wrapper around Developer
      const missingBadge = `<div class="card" id="profile-card">
  <h2>Alex Morgan</h2>
  <p>Role: Developer</p>
</div>`;
      const missingBadgeResult = evaluateActivityValidation(interactiveActivity, missingBadge);
      expect(missingBadgeResult.isValid).toBe(false);

      // Invalid nesting: Developer span not inside paragraph or broken markup
      const invalidNesting = `<div class="card" id="profile-card">
  <h2>Alex Morgan</h2>
</div>
<span class="badge">Developer</span>`;
      const invalidNestingResult = evaluateActivityValidation(interactiveActivity, invalidNesting);
      expect(invalidNestingResult.isValid).toBe(false);
    });

    it("validates informational activities (intro, explanation, code-example, summary)", () => {
      const intro = lesson.activities.find((a) => a.id === "act-112-intro")!;
      const exp = lesson.activities.find((a) => a.id === "act-112-explanation")!;
      const codeExample = lesson.activities.find((a) => a.id === "act-112-code-example")!;
      const summary = lesson.activities.find((a) => a.id === "act-112-summary")!;

      expect(evaluateActivityValidation(intro, undefined as any).isValid).toBe(true);
      expect(evaluateActivityValidation(exp, undefined as any).isValid).toBe(true);
      expect(evaluateActivityValidation(codeExample, undefined as any).isValid).toBe(true);
      expect(evaluateActivityValidation(summary, undefined as any).isValid).toBe(true);
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
      const userId = "learner-user-html201";

      // Step 1: Create & start session
      let session = createLessonSession(lesson, userId);
      session = startLessonSession(session);
      persistence.save(session);

      expect(session.status).toBe("in-progress");
      expect(session.currentActivityId).toBe("act-112-intro");
      expect(session.currentActivityIndex).toBe(0);

      // Step 2: Activity 1 (Intro) — Orientation
      session = completeSessionActivity(session, "act-112-intro");
      session = nextSessionActivity(session, lesson);
      expect(session.currentActivityId).toBe("act-112-explanation");
      expect(session.currentActivityIndex).toBe(1);

      // Step 3: Activity 2 (Explanation) — Study
      session = completeSessionActivity(session, "act-112-explanation");
      session = nextSessionActivity(session, lesson);
      expect(session.currentActivityId).toBe("act-112-code-example");
      expect(session.currentActivityIndex).toBe(2);

      // Step 4: Activity 3 (Code Example) — Code Reading
      session = completeSessionActivity(session, "act-112-code-example");
      session = nextSessionActivity(session, lesson);
      expect(session.currentActivityId).toBe("act-112-ordering");
      expect(session.currentActivityIndex).toBe(3);

      // Step 5: Activity 4 (Ordering) — Token Assembly on OBJ-HTML-202
      // 5a. Reveal hint
      session = revealSessionActivityHint(session, "act-112-ordering");
      expect(session.activities["act-112-ordering"].hintsRevealed).toBe(1);

      // 5b. Incorrect attempt
      session = engageSessionActivity(session, "act-112-ordering", [
        "tok-2",
        "tok-1",
        "tok-3",
        "tok-4",
        "tok-5",
      ]);
      session = startActivityEvaluation(session, "act-112-ordering");
      const orderingEvaluationWrong = evaluateActivityValidation(lesson.activities[3], [
        "tok-2",
        "tok-1",
        "tok-3",
        "tok-4",
        "tok-5",
      ]);
      session = resolveActivityEvaluation(session, "act-112-ordering", orderingEvaluationWrong);
      expect(session.activities["act-112-ordering"].status).toBe("failed");

      // 5c. Retry & correct attempt
      session = retrySessionActivity(session, "act-112-ordering");
      session = engageSessionActivity(session, "act-112-ordering", [
        "tok-1",
        "tok-2",
        "tok-3",
        "tok-4",
        "tok-5",
      ]);
      session = startActivityEvaluation(session, "act-112-ordering");
      const orderingEvaluationCorrect = evaluateActivityValidation(lesson.activities[3], [
        "tok-1",
        "tok-2",
        "tok-3",
        "tok-4",
        "tok-5",
      ]);
      session = resolveActivityEvaluation(session, "act-112-ordering", orderingEvaluationCorrect);
      expect(session.activities["act-112-ordering"].status).toBe("passed");
      session = completeSessionActivity(session, "act-112-ordering");

      session = nextSessionActivity(session, lesson);
      expect(session.currentActivityId).toBe("act-112-mc-nesting");
      expect(session.currentActivityIndex).toBe(4);

      // Step 6: Activity 5 (Multiple Choice) — Nesting Hierarchy on OBJ-HTML-203
      session = engageSessionActivity(session, "act-112-mc-nesting", "opt-a");
      session = startActivityEvaluation(session, "act-112-mc-nesting");
      const mcEvaluation = evaluateActivityValidation(lesson.activities[4], "opt-a");
      session = resolveActivityEvaluation(session, "act-112-mc-nesting", mcEvaluation);
      expect(session.activities["act-112-mc-nesting"].status).toBe("passed");
      session = completeSessionActivity(session, "act-112-mc-nesting");

      session = nextSessionActivity(session, lesson);
      expect(session.currentActivityId).toBe("act-112-code-interactive");
      expect(session.currentActivityIndex).toBe(5);

      // Step 7: Activity 6 (Interactive Code) — Construct Attributes & Nesting on OBJ-HTML-201, OBJ-HTML-202, OBJ-HTML-203
      const solvedHtml = `<div class="card" id="profile-card">
  <h2>Alex Morgan</h2>
  <p>Role: <span class="badge">Developer</span></p>
</div>`;
      session = engageSessionActivity(session, "act-112-code-interactive", solvedHtml);
      session = startActivityEvaluation(session, "act-112-code-interactive");
      const interactiveEvaluation = evaluateActivityValidation(lesson.activities[5], solvedHtml);
      session = resolveActivityEvaluation(
        session,
        "act-112-code-interactive",
        interactiveEvaluation,
      );
      expect(session.activities["act-112-code-interactive"].status).toBe("passed");
      session = completeSessionActivity(session, "act-112-code-interactive");

      session = nextSessionActivity(session, lesson);
      expect(session.currentActivityId).toBe("act-112-summary");
      expect(session.currentActivityIndex).toBe(6);

      // Step 8: Activity 7 (Summary) — Synthesis Review
      session = completeSessionActivity(session, "act-112-summary");

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
        "OBJ-HTML-201": evidenceTokens.filter((t) => t.objectiveId === "OBJ-HTML-201"),
        "OBJ-HTML-202": evidenceTokens.filter((t) => t.objectiveId === "OBJ-HTML-202"),
        "OBJ-HTML-203": evidenceTokens.filter((t) => t.objectiveId === "OBJ-HTML-203"),
      };

      expect(objectiveTokens["OBJ-HTML-201"].length).toBeGreaterThan(0);
      expect(objectiveTokens["OBJ-HTML-202"].length).toBeGreaterThan(0);
      expect(objectiveTokens["OBJ-HTML-203"].length).toBeGreaterThan(0);

      const satisfaction = evaluateLessonObjectivesSatisfaction(lesson, evidenceTokens);
      expect(satisfaction.allSatisfied).toBe(true);
      expect(satisfaction.results["OBJ-HTML-201"].satisfied).toBe(true);
      expect(satisfaction.results["OBJ-HTML-202"].satisfied).toBe(true);
      expect(satisfaction.results["OBJ-HTML-203"].satisfied).toBe(true);
    });
  });
});
