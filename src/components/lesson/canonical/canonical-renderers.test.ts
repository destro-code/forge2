import { describe, it, expect } from "vitest";
import {
  ActivityRendererRegistry,
  getActivityRenderer,
  FallbackActivityRenderer,
} from "./registry";
import { evaluateActivityValidation } from "./validation";
import { canonicalProvider } from "@/lib/providers/content-provider";
import type {
  CanonicalActivity,
  IntroActivity,
  ExplanationActivity,
  CodeExampleActivity,
  VisualActivity,
  MultipleChoiceActivity,
  MultiSelectActivity,
  FillBlankActivity,
  OrderingActivity,
  OutputPredictionActivity,
  InteractiveCodeActivity,
  DebugActivity,
  ReflectionActivity,
  SummaryActivity,
  CompletionActivity,
} from "@/lib/curriculum/types";

describe("Phase 2A: Native Canonical Activity Renderer System", () => {
  describe("ActivityRendererRegistry", () => {
    const requiredTypes: Array<CanonicalActivity["type"]> = [
      "intro",
      "explanation",
      "code-example",
      "visual",
      "multiple-choice",
      "multi-select",
      "fill-blank",
      "ordering",
      "output-prediction",
      "interactive-code",
      "debug",
      "reflection",
      "summary",
      "completion",
    ];

    it("registers native renderers for all 14 canonical activity types", () => {
      expect(Object.keys(ActivityRendererRegistry).sort()).toEqual([...requiredTypes].sort());

      for (const type of requiredTypes) {
        const renderer = ActivityRendererRegistry[type];
        expect(renderer).toBeDefined();
        expect(typeof renderer).toBe("function");
      }
    });

    it("returns correct renderer via getActivityRenderer", () => {
      for (const type of requiredTypes) {
        const renderer = getActivityRenderer(type);
        expect(renderer).toBe(ActivityRendererRegistry[type]);
      }
    });

    it("safely falls back to FallbackActivityRenderer for unknown activity types", () => {
      const fallback = getActivityRenderer("unknown-custom-type" as any);
      expect(fallback).toBe(FallbackActivityRenderer);
    });
  });

  describe("Declarative Validation Engine", () => {
    it("evaluates exact-match validation correctly", () => {
      const activity: MultipleChoiceActivity = {
        id: "act-mc-1",
        type: "multiple-choice",
        intent: "retrieval",
        order: 1,
        content: {
          question: "What is HTML?",
          options: [
            { id: "opt-a", text: "HyperText Markup Language" },
            { id: "opt-b", text: "High Tech Modern Language" },
          ],
        },
        validation: {
          type: "exact-match",
          expected: "opt-a",
        },
        feedback: {
          correct: "Correct acronym!",
          incorrect: "Incorrect choice.",
        },
      };

      const correctResult = evaluateActivityValidation(activity, "opt-a");
      expect(correctResult.isValid).toBe(true);
      expect(correctResult.feedbackMessage).toBe("Correct acronym!");

      const incorrectResult = evaluateActivityValidation(activity, "opt-b");
      expect(incorrectResult.isValid).toBe(false);
      expect(incorrectResult.feedbackMessage).toBe("Incorrect choice.");
    });

    it("evaluates one-of validation correctly", () => {
      const activity: CanonicalActivity = {
        id: "act-one-of",
        type: "multiple-choice",
        intent: "retrieval",
        order: 1,
        content: { question: "Pick a valid truthy value", options: [] },
        validation: {
          type: "one-of",
          validOptions: ["true", "1", "yes"],
          caseSensitive: false,
        },
      };

      expect(evaluateActivityValidation(activity, "TRUE").isValid).toBe(true);
      expect(evaluateActivityValidation(activity, "yes").isValid).toBe(true);
      expect(evaluateActivityValidation(activity, "false").isValid).toBe(false);
    });

    it("evaluates multi-match validation with ignoreOrder", () => {
      const activity: MultiSelectActivity = {
        id: "act-ms-1",
        type: "multi-select",
        intent: "recognition",
        order: 1,
        content: {
          question: "Select all semantic elements",
          options: [
            { id: "header", text: "<header>" },
            { id: "nav", text: "<nav>" },
            { id: "div", text: "<div>" },
          ],
        },
        validation: {
          type: "multi-match",
          expected: ["header", "nav"],
          ignoreOrder: true,
        },
      };

      // In-order matching
      expect(evaluateActivityValidation(activity, ["header", "nav"]).isValid).toBe(true);
      // Reversed order matching
      expect(evaluateActivityValidation(activity, ["nav", "header"]).isValid).toBe(true);
      // Incomplete
      expect(evaluateActivityValidation(activity, ["header"]).isValid).toBe(false);
      // Extra incorrect item
      expect(evaluateActivityValidation(activity, ["header", "nav", "div"]).isValid).toBe(false);
    });

    it("evaluates ordering validation correctly", () => {
      const activity: OrderingActivity = {
        id: "act-ord-1",
        type: "ordering",
        intent: "application",
        order: 1,
        content: {
          prompt: "Arrange the box model from innermost to outermost",
          items: [
            { id: "content", text: "Content", initialOrder: 3 },
            { id: "padding", text: "Padding", initialOrder: 1 },
            { id: "border", text: "Border", initialOrder: 2 },
            { id: "margin", text: "Margin", initialOrder: 0 },
          ],
        },
        validation: {
          type: "ordering",
          correctSequence: ["content", "padding", "border", "margin"],
        },
      };

      const correctSeq = ["content", "padding", "border", "margin"];
      expect(evaluateActivityValidation(activity, correctSeq).isValid).toBe(true);

      const wrongSeq = ["margin", "border", "padding", "content"];
      expect(evaluateActivityValidation(activity, wrongSeq).isValid).toBe(false);
    });

    it("evaluates code-output validation correctly", () => {
      const activity: OutputPredictionActivity = {
        id: "act-pred-1",
        type: "output-prediction",
        intent: "prediction",
        order: 1,
        content: {
          code: "console.log(typeof null);",
          prompt: "What is output?",
        },
        validation: {
          type: "code-output",
          expectedOutput: "object",
          matchType: "exact",
        },
      };

      expect(evaluateActivityValidation(activity, "object").isValid).toBe(true);
      expect(evaluateActivityValidation(activity, " null ").isValid).toBe(false);
    });

    it("passes validation automatically for activities without validation requirements", () => {
      const introAct: IntroActivity = {
        id: "act-intro-1",
        type: "intro",
        intent: "orientation",
        order: 1,
        content: {
          title: "Introduction to HTML",
          hook: "Let's build the web.",
        },
      };

      const result = evaluateActivityValidation(introAct, null);
      expect(result.isValid).toBe(true);
    });
  });

  describe("Golden Lessons Compatibility with Canonical Renderers", () => {
    const goldenLessonIds = [
      "lesson-0-1-1",
      "lesson-1-1-2",
      "lesson-1-2-7",
      "lesson-2-1-3",
      "lesson-0-2-5",
    ];

    it("resolves native renderers for every activity across all golden lessons", () => {
      for (const lessonId of goldenLessonIds) {
        const lesson = canonicalProvider.getLesson(lessonId);
        expect(lesson).toBeDefined();
        if (!lesson) continue;

        expect(lesson.activities.length).toBeGreaterThan(0);

        for (const activity of lesson.activities) {
          const renderer = getActivityRenderer(activity.type);
          expect(renderer).toBeDefined();
          expect(renderer).not.toBe(FallbackActivityRenderer);
          expect(ActivityRendererRegistry[activity.type]).toBe(renderer);
        }
      }
    });

    it("verifies interactive activities in golden lessons have proper validation configs", () => {
      for (const lessonId of goldenLessonIds) {
        const lesson = canonicalProvider.getLesson(lessonId);
        if (!lesson) continue;

        for (const activity of lesson.activities) {
          if (
            activity.type === "multiple-choice" ||
            activity.type === "multi-select" ||
            activity.type === "fill-blank" ||
            activity.type === "ordering" ||
            activity.type === "output-prediction"
          ) {
            expect(activity.validation).toBeDefined();
            // Validation evaluator must handle it without error
            const dummyResult = evaluateActivityValidation(activity, null);
            expect(dummyResult).toHaveProperty("isValid");
          }
        }
      }
    });
  });
});
