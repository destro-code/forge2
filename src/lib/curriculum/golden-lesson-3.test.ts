// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";
import { canonicalProvider } from "./canonical-provider";
import { validateCurriculumIntegrity } from "./schema";
import {
  evaluateActivityValidation,
  parseCssRules,
} from "@/components/lesson/canonical/validation";
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

describe("Phase 5.4 — Golden Lesson 3 (lesson-1-2-7): Build a Layout with Flexbox", () => {
  let lesson: CanonicalLesson;

  beforeEach(() => {
    const loaded = canonicalProvider.getLesson("lesson-1-2-7");
    if (!loaded) {
      throw new Error("Golden Lesson 3 (lesson-1-2-7) not found in canonicalProvider");
    }
    lesson = loaded;
  });

  describe("1. Lesson Metadata & Curriculum Schema Verification", () => {
    it("has valid schema and exact metadata matching specification", () => {
      expect(lesson.id).toBe("lesson-1-2-7");
      expect(lesson.topicId).toBe("flexbox-layout");
      expect(lesson.title).toBe("Build a Layout with Flexbox");
      expect(lesson.difficulty).toBe("Beginner");
      expect(lesson.lessonType).toBe("practice");
      expect(lesson.estimatedMinutes).toBe(30);
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
      expect(lesson.conceptIds).toContain("concept-flexbox-container-items");
      expect(lesson.conceptIds).toContain("concept-flex-axes");
      expect(lesson.conceptIds).toContain("concept-flex-alignment");
      expect(lesson.conceptIds).toContain("concept-flex-direction");
      expect(lesson.conceptIds).toContain("concept-flex-wrap");

      expect(lesson.skillIds).toContain("skill-configure-flex-container");
      expect(lesson.skillIds).toContain("skill-align-flex-items");
      expect(lesson.skillIds).toContain("skill-manipulate-flex-axes");
      expect(lesson.skillIds).toContain("skill-build-responsive-nav");
    });

    it("defines the 3 core objectives with explicit mapping", () => {
      expect(lesson.objectives).toHaveLength(3);
      const [obj1, obj2, obj3] = lesson.objectives;

      expect(obj1.id).toBe("OBJ-CSS-301");
      expect(obj1.conceptIds).toContain("concept-flexbox-container-items");
      expect(obj1.conceptIds).toContain("concept-flex-axes");
      expect(obj1.conceptIds).toContain("concept-flex-direction");
      expect(obj1.skillIds).toContain("skill-configure-flex-container");
      expect(obj1.skillIds).toContain("skill-manipulate-flex-axes");

      expect(obj2.id).toBe("OBJ-CSS-302");
      expect(obj2.conceptIds).toContain("concept-flex-alignment");
      expect(obj2.conceptIds).toContain("concept-flex-axes");
      expect(obj2.skillIds).toContain("skill-align-flex-items");

      expect(obj3.id).toBe("OBJ-CSS-303");
      expect(obj3.conceptIds).toContain("concept-flexbox-container-items");
      expect(obj3.conceptIds).toContain("concept-flex-alignment");
      expect(obj3.skillIds).toContain("skill-build-responsive-nav");
      expect(obj3.skillIds).toContain("skill-align-flex-items");
    });

    it("contains exactly 6 activities in the prescribed order", () => {
      expect(lesson.activities).toHaveLength(6);

      const [a1, a2, a3, a4, a5, a6] = lesson.activities;

      expect(a1.id).toBe("act-127-intro");
      expect(a1.type).toBe("intro");
      expect(a1.intent).toBe("orientation");

      expect(a2.id).toBe("act-127-explanation");
      expect(a2.type).toBe("explanation");
      expect(a2.intent).toBe("understanding");

      expect(a3.id).toBe("act-127-visual");
      expect(a3.type).toBe("visual");
      expect(a3.intent).toBe("understanding");

      expect(a4.id).toBe("act-127-output-prediction");
      expect(a4.type).toBe("output-prediction");
      expect(a4.intent).toBe("retrieval");

      expect(a5.id).toBe("act-127-interactive-code");
      expect(a5.type).toBe("interactive-code");
      expect(a5.intent).toBe("application");

      expect(a6.id).toBe("act-127-summary");
      expect(a6.type).toBe("summary");
      expect(a6.intent).toBe("reflection");
    });

    it("has complete completion rules requiring all 6 activities and evidence mapping", () => {
      expect(lesson.completion).toBeDefined();
      expect(lesson.completion?.requiredActivityIds).toEqual([
        "act-127-intro",
        "act-127-explanation",
        "act-127-visual",
        "act-127-output-prediction",
        "act-127-interactive-code",
        "act-127-summary",
      ]);
      expect(lesson.completion?.minimumScore).toBe(100);
      expect(lesson.completion?.evidenceRequirements).toHaveLength(3);
    });
  });

  describe("2. Activity Validation Evaluation Contract", () => {
    it("parses CSS rules accurately via parseCssRules utility", () => {
      const sampleCss = `
        /* Comments should be ignored */
        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-backdrop {
          display: flex;
          justify-content: center;
          align-items: center;
        }
      `;
      const rules = parseCssRules(sampleCss);
      expect(rules[".navbar"]).toBeDefined();
      expect(rules[".navbar"]["display"]).toBe("flex");
      expect(rules[".navbar"]["justify-content"]).toBe("space-between");
      expect(rules[".navbar"]["align-items"]).toBe("center");

      expect(rules[".modal-backdrop"]).toBeDefined();
      expect(rules[".modal-backdrop"]["display"]).toBe("flex");
      expect(rules[".modal-backdrop"]["justify-content"]).toBe("center");
      expect(rules[".modal-backdrop"]["align-items"]).toBe("center");
    });

    it("validates output-prediction activity (act-127-output-prediction) for justify-content: space-between / align-items: center", () => {
      const predictActivity = lesson.activities.find(
        (a) => a.id === "act-127-output-prediction",
      ) as CanonicalActivity;
      expect(predictActivity).toBeDefined();

      const expectedAnswer =
        "Items are distributed evenly across the horizontal main axis with the first and last items flush against the edges, and vertically centered along the cross axis";

      const correctResult = evaluateActivityValidation(predictActivity, expectedAnswer);
      expect(correctResult.isValid).toBe(true);
      expect(correctResult.feedbackMessage).toContain("Spot on!");

      // Distractors
      const wrong1 = evaluateActivityValidation(
        predictActivity,
        "Items are tightly grouped in the horizontal center with no spacing between them, and aligned to the top edge",
      );
      expect(wrong1.isValid).toBe(false);

      const wrong2 = evaluateActivityValidation(
        predictActivity,
        "Items are stacked vertically from top to bottom with equal space between them, and centered horizontally",
      );
      expect(wrong2.isValid).toBe(false);

      const wrong3 = evaluateActivityValidation(
        predictActivity,
        "Items are pushed completely to the right edge horizontally, and stretched to fill the full height of 64px",
      );
      expect(wrong3.isValid).toBe(false);
    });

    it("validates interactive-code activity (act-127-interactive-code) with all 6 required CSS assertions", () => {
      const interactiveActivity = lesson.activities.find(
        (a) => a.id === "act-127-interactive-code",
      ) as CanonicalActivity;
      expect(interactiveActivity).toBeDefined();

      // Complete Correct Solution
      const correctCss = `
        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 64px;
          padding: 0 24px;
          background-color: #1e293b;
          color: #ffffff;
        }

        .modal-backdrop {
          display: flex;
          justify-content: center;
          align-items: center;
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: rgba(0, 0, 0, 0.5);
        }
      `;
      const correctResult = evaluateActivityValidation(interactiveActivity, correctCss);
      expect(correctResult.isValid).toBe(true);
      expect(correctResult.feedbackMessage).toContain("Outstanding!");

      // Missing .navbar display: flex
      const missingNavbarFlex = `
        .navbar {
          justify-content: space-between;
          align-items: center;
        }
        .modal-backdrop {
          display: flex;
          justify-content: center;
          align-items: center;
        }
      `;
      expect(evaluateActivityValidation(interactiveActivity, missingNavbarFlex).isValid).toBe(
        false,
      );

      // Wrong .navbar justify-content
      const wrongNavbarJustify = `
        .navbar {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .modal-backdrop {
          display: flex;
          justify-content: center;
          align-items: center;
        }
      `;
      expect(evaluateActivityValidation(interactiveActivity, wrongNavbarJustify).isValid).toBe(
        false,
      );

      // Missing .modal-backdrop align-items
      const missingModalAlign = `
        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-backdrop {
          display: flex;
          justify-content: center;
        }
      `;
      expect(evaluateActivityValidation(interactiveActivity, missingModalAlign).isValid).toBe(
        false,
      );
    });

    it("validates informational activities (intro, explanation, visual, summary)", () => {
      const intro = lesson.activities.find((a) => a.id === "act-127-intro")!;
      const exp = lesson.activities.find((a) => a.id === "act-127-explanation")!;
      const visual = lesson.activities.find((a) => a.id === "act-127-visual")!;
      const summary = lesson.activities.find((a) => a.id === "act-127-summary")!;

      expect(evaluateActivityValidation(intro, undefined as any).isValid).toBe(true);
      expect(evaluateActivityValidation(exp, undefined as any).isValid).toBe(true);
      expect(evaluateActivityValidation(visual, undefined as any).isValid).toBe(true);
      expect(evaluateActivityValidation(summary, undefined as any).isValid).toBe(true);
    });
  });

  describe("3. Central Activity Renderer Resolution", () => {
    it("renders all 6 activities via renderActivity without error", () => {
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
    it("progresses linearly through all 6 activities, records evidence, and achieves lesson completion", () => {
      const persistence = new InMemorySessionPersistenceAdapter();
      const userId = "learner-user-flexbox301";

      // Step 1: Create & start session
      let session = createLessonSession(lesson, userId);
      session = startLessonSession(session);
      persistence.save(session);

      expect(session.status).toBe("in-progress");
      expect(session.currentActivityId).toBe("act-127-intro");
      expect(session.currentActivityIndex).toBe(0);

      // Step 2: Activity 1 (Intro) — Orientation
      session = completeSessionActivity(session, "act-127-intro");
      session = nextSessionActivity(session, lesson);
      expect(session.currentActivityId).toBe("act-127-explanation");
      expect(session.currentActivityIndex).toBe(1);

      // Step 3: Activity 2 (Explanation) — Study
      session = completeSessionActivity(session, "act-127-explanation");
      session = nextSessionActivity(session, lesson);
      expect(session.currentActivityId).toBe("act-127-visual");
      expect(session.currentActivityIndex).toBe(2);

      // Step 4: Activity 3 (Visual) — Diagram Inspection
      session = completeSessionActivity(session, "act-127-visual");
      session = nextSessionActivity(session, lesson);
      expect(session.currentActivityId).toBe("act-127-output-prediction");
      expect(session.currentActivityIndex).toBe(3);

      // Step 5: Activity 4 (Output Prediction) — Predict justify-content & align-items
      // 5a. Reveal hint
      session = revealSessionActivityHint(session, "act-127-output-prediction");
      expect(session.activities["act-127-output-prediction"].hintsRevealed).toBe(1);

      // 5b. Incorrect attempt
      session = engageSessionActivity(
        session,
        "act-127-output-prediction",
        "Items are tightly grouped in the horizontal center with no spacing between them, and aligned to the top edge",
      );
      session = startActivityEvaluation(session, "act-127-output-prediction");
      const predictEvaluationWrong = evaluateActivityValidation(
        lesson.activities[3],
        "Items are tightly grouped in the horizontal center with no spacing between them, and aligned to the top edge",
      );
      session = resolveActivityEvaluation(
        session,
        "act-127-output-prediction",
        predictEvaluationWrong,
      );
      expect(session.activities["act-127-output-prediction"].status).toBe("failed");

      // 5c. Retry & correct attempt
      const expectedOutput =
        "Items are distributed evenly across the horizontal main axis with the first and last items flush against the edges, and vertically centered along the cross axis";
      session = retrySessionActivity(session, "act-127-output-prediction");
      session = engageSessionActivity(session, "act-127-output-prediction", expectedOutput);
      session = startActivityEvaluation(session, "act-127-output-prediction");
      const predictEvaluationCorrect = evaluateActivityValidation(
        lesson.activities[3],
        expectedOutput,
      );
      session = resolveActivityEvaluation(
        session,
        "act-127-output-prediction",
        predictEvaluationCorrect,
      );
      expect(session.activities["act-127-output-prediction"].status).toBe("passed");
      session = completeSessionActivity(session, "act-127-output-prediction");

      session = nextSessionActivity(session, lesson);
      expect(session.currentActivityId).toBe("act-127-interactive-code");
      expect(session.currentActivityIndex).toBe(4);

      // Step 6: Activity 5 (Interactive Code) — Build Navbar & Modal Backdrop
      // 6a. Reveal hint
      session = revealSessionActivityHint(session, "act-127-interactive-code");
      expect(session.activities["act-127-interactive-code"].hintsRevealed).toBe(1);

      // 6b. Correct CSS code
      const solvedCss = `
        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 64px;
          padding: 0 24px;
          background-color: #1e293b;
          color: #ffffff;
        }

        .modal-backdrop {
          display: flex;
          justify-content: center;
          align-items: center;
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: rgba(0, 0, 0, 0.5);
        }
      `;
      session = engageSessionActivity(session, "act-127-interactive-code", solvedCss);
      session = startActivityEvaluation(session, "act-127-interactive-code");
      const interactiveEvaluation = evaluateActivityValidation(lesson.activities[4], solvedCss);
      session = resolveActivityEvaluation(
        session,
        "act-127-interactive-code",
        interactiveEvaluation,
      );
      expect(session.activities["act-127-interactive-code"].status).toBe("passed");
      session = completeSessionActivity(session, "act-127-interactive-code");

      session = nextSessionActivity(session, lesson);
      expect(session.currentActivityId).toBe("act-127-summary");
      expect(session.currentActivityIndex).toBe(5);

      // Step 7: Activity 6 (Summary) — Synthesis Review
      session = completeSessionActivity(session, "act-127-summary");

      // Step 8: Verify session completion criteria
      const progress = calculateSessionProgress(session);
      expect(progress.percentage).toBe(100);
      expect(progress.completedCount).toBe(6);
      expect(progress.totalCount).toBe(6);

      const completionCheck = checkLessonCompletion(session, lesson);
      expect(completionCheck.canComplete).toBe(true);
      expect(completionCheck.isCompleted).toBe(false);

      // Step 9: Complete Lesson Session
      session = completeLessonSession(session, lesson);
      expect(session.status).toBe("completed");
      expect(session.completedAt).toBeDefined();

      // Step 10: Verify Evidence Generation for all 3 Objectives
      const evidenceTokens = generateLessonEvidenceTokens(lesson, session);
      expect(evidenceTokens.length).toBeGreaterThanOrEqual(3);

      const objectiveTokens = {
        "OBJ-CSS-301": evidenceTokens.filter((t) => t.objectiveId === "OBJ-CSS-301"),
        "OBJ-CSS-302": evidenceTokens.filter((t) => t.objectiveId === "OBJ-CSS-302"),
        "OBJ-CSS-303": evidenceTokens.filter((t) => t.objectiveId === "OBJ-CSS-303"),
      };

      expect(objectiveTokens["OBJ-CSS-301"].length).toBeGreaterThan(0);
      expect(objectiveTokens["OBJ-CSS-302"].length).toBeGreaterThan(0);
      expect(objectiveTokens["OBJ-CSS-303"].length).toBeGreaterThan(0);

      const satisfaction = evaluateLessonObjectivesSatisfaction(lesson, evidenceTokens);
      expect(satisfaction.allSatisfied).toBe(true);
      expect(satisfaction.results["OBJ-CSS-301"].satisfied).toBe(true);
      expect(satisfaction.results["OBJ-CSS-302"].satisfied).toBe(true);
      expect(satisfaction.results["OBJ-CSS-303"].satisfied).toBe(true);
    });
  });
});
