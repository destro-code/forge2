import { describe, it, expect } from "vitest";
import {
  validateLesson,
  validateActivity,
  validateConcept,
  validateSkill,
  validateMisconception,
  validateTopic,
  validateModule,
  validateLevel,
  validateAcademy,
  validateCurriculumIntegrity,
  canonicalLessonSchema,
  activitySchema,
} from "./schema";
import type { CanonicalActivity, CanonicalLesson } from "./types";

import lessonWhatIsFrontend from "../../data/canonical/lessons/lesson-what-is-frontend-development.json";
import lessonElementsTags from "../../data/canonical/lessons/lesson-elements-tags-attributes.json";
import lessonCssFlexbox from "../../data/canonical/lessons/lesson-css-flexbox.json";
import lessonJsFunctions from "../../data/canonical/lessons/lesson-javascript-functions.json";
import lessonFixBrokenPage from "../../data/canonical/lessons/lesson-fix-the-broken-page.json";

import academyData from "../../data/canonical/academy.json";
import levelsData from "../../data/canonical/levels.json";
import conceptsData from "../../data/canonical/concepts.json";
import skillsData from "../../data/canonical/skills.json";
import misconceptionsData from "../../data/canonical/misconceptions.json";
import topicsData from "../../data/canonical/topics.json";
import { canonicalProvider } from "./canonical-provider";

describe("Canonical Curriculum Schema & Validation", () => {
  describe("Golden Lesson Fixtures Validation", () => {
    it("validates Golden Lesson 1 (What Is Frontend Development)", () => {
      const lesson = validateLesson(lessonWhatIsFrontend);
      expect(lesson.id).toBe("lesson-0-1-1");
      expect(lesson.lessonType).toBe("instruction");
      expect(lesson.activities.length).toBeGreaterThanOrEqual(6);
      expect(lesson.objectives.length).toBeGreaterThanOrEqual(1);
    });

    it("validates Golden Lesson 2 (Elements, Tags & Attributes)", () => {
      const lesson = validateLesson(lessonElementsTags);
      expect(lesson.id).toBe("lesson-1-1-2");
      expect(lesson.lessonType).toBe("instruction");
      expect(lesson.activities.some((a) => a.type === "fill-blank")).toBe(true);
      expect(lesson.activities.some((a) => a.type === "multi-select")).toBe(true);
    });

    it("validates Golden Lesson 3 (CSS Flexbox)", () => {
      const lesson = validateLesson(lessonCssFlexbox);
      expect(lesson.id).toBe("lesson-1-2-7");
      expect(lesson.lessonType).toBe("practice");
      expect(lesson.activities.some((a) => a.type === "interactive-code")).toBe(true);
      expect(lesson.activities.some((a) => a.type === "ordering")).toBe(true);
      expect(lesson.activities.some((a) => a.type === "output-prediction")).toBe(true);
    });

    it("validates Golden Lesson 4 (JavaScript Functions)", () => {
      const lesson = validateLesson(lessonJsFunctions);
      expect(lesson.id).toBe("lesson-2-1-3");
      expect(lesson.lessonType).toBe("instruction");
      expect(lesson.activities.some((a) => a.type === "code-example")).toBe(true);
      expect(lesson.activities.some((a) => a.type === "output-prediction")).toBe(true);
      expect(lesson.activities.some((a) => a.type === "interactive-code")).toBe(true);
    });

    it("validates Golden Lesson 5 (Fix Broken Page Challenge)", () => {
      const lesson = validateLesson(lessonFixBrokenPage);
      expect(lesson.id).toBe("lesson-0-2-5");
      expect(lesson.lessonType).toBe("challenge");
      expect(lesson.activities.some((a) => a.type === "debug")).toBe(true);
      expect(lesson.activities.some((a) => a.type === "completion")).toBe(true);
    });
  });

  describe("Activity Discriminated Union & Validation Specifications", () => {
    it("validates intro activity", () => {
      const act = validateActivity({
        id: "act-intro-1",
        type: "intro",
        intent: "orientation",
        objectiveIds: ["obj-1"],
        content: {
          title: "Introduction",
          hook: "Let us begin.",
          goals: ["Goal A", "Goal B"],
        },
      });
      expect(act.type).toBe("intro");
    });

    it("validates explanation activity with callouts", () => {
      const act = validateActivity({
        id: "act-exp-1",
        type: "explanation",
        intent: "understanding",
        objectiveIds: ["obj-1"],
        content: {
          title: "Core Mechanics",
          text: "Detailed explanation text here.",
          callout: {
            variant: "tip",
            text: "Here is a helpful tip.",
          },
          keyTakeaway: "Remember this point.",
        },
      });
      expect(act.type).toBe("explanation");
    });

    it("validates code-example activity with annotations", () => {
      const act = validateActivity({
        id: "act-code-1",
        type: "code-example",
        intent: "understanding",
        objectiveIds: ["obj-1"],
        content: {
          title: "Example",
          code: "const x = 10;",
          language: "javascript",
          highlightedLines: [1],
          annotations: [{ line: 1, comment: "Declaration" }],
        },
      });
      expect(act.type).toBe("code-example");
    });

    it("validates visual activity", () => {
      const act = validateActivity({
        id: "act-vis-1",
        type: "visual",
        intent: "recognition",
        objectiveIds: ["obj-1"],
        content: {
          title: "Flow Diagram",
          visualType: "flowchart",
          description: "Step 1 -> Step 2",
        },
      });
      expect(act.type).toBe("visual");
    });

    it("validates multiple-choice activity with exact-match validation", () => {
      const act = validateActivity({
        id: "act-mc-1",
        type: "multiple-choice",
        intent: "assessment",
        objectiveIds: ["obj-1"],
        content: {
          question: "What is HTML?",
          options: [
            { id: "opt-1", text: "HyperText Markup Language" },
            { id: "opt-2", text: "Cascading Style Sheets" },
          ],
        },
        validation: {
          type: "exact-match",
          expected: "opt-1",
        },
        feedback: {
          correct: "Correct!",
          incorrect: "Try again.",
        },
      });
      expect(act.type).toBe("multiple-choice");
    });

    it("validates multi-select activity with multi-match validation", () => {
      const act = validateActivity({
        id: "act-ms-1",
        type: "multi-select",
        intent: "assessment",
        objectiveIds: ["obj-1"],
        content: {
          question: "Select all layout properties:",
          options: [
            { id: "opt-1", text: "display" },
            { id: "opt-2", text: "flex-direction" },
            { id: "opt-3", text: "color" },
          ],
          minSelections: 2,
        },
        validation: {
          type: "multi-match",
          expected: ["opt-1", "opt-2"],
        },
      });
      expect(act.type).toBe("multi-select");
    });

    it("validates fill-blank activity", () => {
      const act = validateActivity({
        id: "act-fb-1",
        type: "fill-blank",
        intent: "retrieval",
        objectiveIds: ["obj-1"],
        content: {
          prompt: "Fill in the blank:",
          template: "const ___ = 42;",
          blanks: [{ id: "b1", placeholder: "var name" }],
        },
        validation: {
          type: "multi-match",
          expected: ["answer"],
        },
      });
      expect(act.type).toBe("fill-blank");
    });

    it("validates ordering activity with ordering validation", () => {
      const act = validateActivity({
        id: "act-ord-1",
        type: "ordering",
        intent: "retrieval",
        objectiveIds: ["obj-1"],
        content: {
          prompt: "Order the steps:",
          items: [
            { id: "s1", text: "First" },
            { id: "s2", text: "Second" },
          ],
        },
        validation: {
          type: "ordering",
          correctSequence: ["s1", "s2"],
        },
      });
      expect(act.type).toBe("ordering");
    });

    it("validates output-prediction activity", () => {
      const act = validateActivity({
        id: "act-op-1",
        type: "output-prediction",
        intent: "prediction",
        objectiveIds: ["obj-1"],
        content: {
          code: "console.log(2 + 2);",
          language: "javascript",
          prompt: "What will print?",
          options: ["4", "22", "undefined"],
        },
        validation: {
          type: "exact-match",
          expected: "4",
        },
      });
      expect(act.type).toBe("output-prediction");
    });

    it("validates interactive-code activity with tests validation", () => {
      const act = validateActivity({
        id: "act-ic-1",
        type: "interactive-code",
        intent: "application",
        objectiveIds: ["obj-1"],
        content: {
          title: "Write a function",
          prompt: "Implement add(a, b)",
          language: "javascript",
          starterCode: "function add(a, b) {}",
          solutionCode: "function add(a, b) { return a + b; }",
        },
        validation: {
          type: "tests",
          testCases: [
            { id: "tc-1", description: "adds 1 and 2 to make 3", assertion: "add(1, 2) === 3" },
          ],
        },
      });
      expect(act.type).toBe("interactive-code");
    });

    it("validates debug activity with hints", () => {
      const act = validateActivity({
        id: "act-dbg-1",
        type: "debug",
        intent: "debugging",
        objectiveIds: ["obj-1"],
        content: {
          title: "Fix the loop",
          prompt: "Fix infinite loop",
          buggyCode: "while (true) {}",
          language: "javascript",
          bugDescription: "Loop condition never terminates",
          hints: ["Add a break condition"],
        },
      });
      expect(act.type).toBe("debug");
    });

    it("validates reflection, summary, and completion activities", () => {
      const refAct = validateActivity({
        id: "act-ref-1",
        type: "reflection",
        intent: "reflection",
        objectiveIds: ["obj-1"],
        content: {
          prompt: "Reflect on this module.",
          minCharacters: 20,
        },
      });
      expect(refAct.type).toBe("reflection");

      const sumAct = validateActivity({
        id: "act-sum-1",
        type: "summary",
        intent: "reflection",
        objectiveIds: ["obj-1"],
        content: {
          title: "Summary",
          takeaways: ["Learned X", "Learned Y"],
        },
      });
      expect(sumAct.type).toBe("summary");

      const compAct = validateActivity({
        id: "act-comp-1",
        type: "completion",
        intent: "assessment",
        objectiveIds: ["obj-1"],
        content: {
          title: "Congratulations!",
          message: "You did it!",
          badgeId: "badge-winner",
        },
      });
      expect(compAct.type).toBe("completion");
    });
  });

  describe("Invalid Lesson & Activity Rejection", () => {
    it("rejects lesson missing required fields", () => {
      expect(() => {
        validateLesson({
          id: "incomplete-lesson",
          title: "No topic or activities",
        });
      }).toThrow();
    });

    it("rejects lesson with invalid activity type", () => {
      expect(() => {
        validateLesson({
          ...lessonWhatIsFrontend,
          activities: [
            {
              id: "act-invalid",
              type: "unknown-activity-type",
              intent: "orientation",
              objectiveIds: ["obj-1"],
              content: {},
            },
          ],
        });
      }).toThrow();
    });

    it("rejects multiple choice with less than 2 options", () => {
      expect(() => {
        validateActivity({
          id: "act-bad-mc",
          type: "multiple-choice",
          intent: "assessment",
          objectiveIds: ["obj-1"],
          content: {
            question: "Question with only 1 option?",
            options: [{ id: "opt-1", text: "Single option" }],
          },
        });
      }).toThrow();
    });
  });

  describe("Canonical Entity Schemas & Cross-Entity Integrity", () => {
    it("validates Academy schema", () => {
      const academy = validateAcademy(academyData);
      expect(academy.id).toBe("forge-academy");
      expect(academy.levels.length).toBe(6);
    });

    it("validates Concepts, Skills, and Misconceptions", () => {
      conceptsData.forEach((c) => {
        const validated = validateConcept(c);
        expect(validated.id).toBeDefined();
      });

      skillsData.forEach((s) => {
        const validated = validateSkill(s);
        expect(validated.id).toBeDefined();
      });

      misconceptionsData.forEach((m) => {
        const validated = validateMisconception(m);
        expect(validated.id).toBeDefined();
      });
    });

    it("verifies relational integrity across all canonical entities", () => {
      const academy = validateAcademy(academyData);
      const levels = canonicalProvider.getLevels();
      const topics = canonicalProvider.getTopics();
      const concepts = (conceptsData as any[]).map((c) => validateConcept(c));
      const skills = (skillsData as any[]).map((s) => validateSkill(s));
      const misconceptions = (misconceptionsData as any[]).map((m) => validateMisconception(m));
      const lessons = [
        validateLesson(lessonWhatIsFrontend),
        validateLesson(lessonElementsTags),
        validateLesson(lessonCssFlexbox),
        validateLesson(lessonJsFunctions),
        validateLesson(lessonFixBrokenPage),
      ];

      const modules = canonicalProvider.getModules();

      const report = validateCurriculumIntegrity({
        academy,
        levels,
        modules,
        topics,
        concepts,
        skills,
        misconceptions,
        lessons,
      });

      expect(report.valid).toBe(true);
      expect(report.errors).toEqual([]);
    });

    it("detects cross-entity relational integrity violations", () => {
      const academy = validateAcademy(academyData);
      const levels = canonicalProvider.getLevels();
      const topics = canonicalProvider.getTopics();
      const concepts = (conceptsData as any[]).map((c) => validateConcept(c));
      const skills = (skillsData as any[]).map((s) => validateSkill(s));
      const misconceptions = (misconceptionsData as any[]).map((m) => validateMisconception(m));
      const lessons = [validateLesson(lessonWhatIsFrontend)];
      const modules = canonicalProvider.getModules();

      // Introduce a breaking reference in levels referencing a missing module
      const brokenLevels = levels.map((lvl) =>
        lvl.id === "level-0" ? { ...lvl, moduleIds: ["missing-module-abc"] } : lvl,
      );

      const report = validateCurriculumIntegrity({
        academy,
        levels: brokenLevels,
        modules,
        topics,
        concepts,
        skills,
        misconceptions,
        lessons,
      });

      expect(report.valid).toBe(false);
      expect(report.errors.some((err) => err.includes("references missing module"))).toBe(true);
    });

    it("proves Concept supports description, CanonicalLevel supports stage enum, and Misconception supports conceptIds list", () => {
      // 1. Concept V2 support
      const concept = validateConcept({
        id: "concept-v2-test",
        title: "Test V2 Concept",
        definition: "definition string",
        description: "This is a detailed description of the concept.",
        topicId: "what-is-frontend-development",
        prerequisiteConceptIds: [],
        relatedConceptIds: [],
        misconceptionIds: [],
      });
      expect(concept.description).toBe("This is a detailed description of the concept.");

      // 2. CanonicalLevel V2 stage support
      const level = validateLevel({
        id: "level-v2-test",
        stage: "intermediate",
        title: "Level 2: Intermediate Frontend Engineering",
        description: "Some intermediate description",
        order: 3,
        moduleIds: [],
      });
      expect(level.stage).toBe("intermediate");

      // 3. Misconception V2 plural conceptIds support
      const misconception = validateMisconception({
        id: "misc-v2-test",
        title: "Multiple Concepts Misconception",
        description: "Incorrect mental model spanning two concepts",
        conceptIds: ["concept-a", "concept-b"],
        indicators: ["indicator-a"],
        correction: "Correction path",
      });
      expect(misconception.conceptIds).toEqual(["concept-a", "concept-b"]);
    });

    it("rejects unsupported lesson types, difficulty, or activity intents", () => {
      // Lesson types check
      expect(() => {
        validateLesson({
          ...lessonWhatIsFrontend,
          lessonType: "unsupported-lesson-type-123",
        });
      }).toThrow();

      // Difficulty check
      expect(() => {
        validateLesson({
          ...lessonWhatIsFrontend,
          difficulty: "SuperAdvanced",
        });
      }).toThrow();

      // Activity Intent check
      expect(() => {
        validateActivity({
          id: "act-intent-fail",
          type: "intro",
          intent: "not-a-valid-intent",
          objectiveIds: ["obj-1"],
          content: {
            title: "Intro Title",
            hook: "Let's hook them",
          },
        });
      }).toThrow();
    });

    it("rejects malformed validation definitions", () => {
      expect(() => {
        validateActivity({
          id: "act-val-fail",
          type: "multiple-choice",
          intent: "assessment",
          objectiveIds: ["obj-1"],
          content: {
            question: "Question text",
            options: [
              { id: "o1", text: "Opt 1" },
              { id: "o2", text: "Opt 2" },
            ],
          },
          validation: {
            type: "exact-match",
            expected: { obj: "unsupported object pattern" }, // exact-match expected must be primitive
          },
        });
      }).toThrow();
    });
  });
});
