import { describe, it, expect } from "vitest";
import { matchMisconception } from "./misconception-matcher";
import type { CanonicalActivity, Misconception } from "@/lib/curriculum/types";
import type { ActivityEvaluationResult } from "./types";
import canonicalMisconceptions from "@/data/canonical/misconceptions.json";

describe("Misconception Matcher — Golden Tests", () => {
  const misconceptions = canonicalMisconceptions as Misconception[];

  describe("Test 8: Void Element Closing Tags Misconception", () => {
    const mockActivity: CanonicalActivity = {
      id: "act-test-void",
      type: "debug",
      intent: "debugging",
      objectiveIds: ["obj-void-elements"],
      content: {
        title: "Fix HTML",
        prompt: "Fix the void element markup",
        language: "html",
        buggyCode: "<img src='cat.jpg'></img>",
        bugDescription: "Extra closing tag",
      },
    };

    it("matches misc-all-tags-need-closing-tags when learner writes </img> or </input>", () => {
      const evaluation: ActivityEvaluationResult = {
        isValid: false,
        feedbackMessage: "Invalid HTML syntax",
      };

      const result = matchMisconception(
        mockActivity,
        "<img src='cat.jpg'></img>",
        evaluation,
        misconceptions,
      );

      expect(result).not.toBeNull();
      expect(result?.misconceptionId).toBe("misc-all-tags-need-closing-tags");
      expect(result?.correction).toContain("void elements");
      expect(result?.confidence).toBeGreaterThanOrEqual(0.9);
    });
  });

  describe("Test 9: Return vs Console.log Misconception", () => {
    const mockActivity: CanonicalActivity = {
      id: "act-test-fn",
      type: "interactive-code",
      intent: "application",
      objectiveIds: ["obj-func-declaration"],
      content: {
        title: "Write function",
        prompt: "Write a function that returns double the input",
        language: "javascript",
        starterCode: "function double(n) { }",
        solutionCode: "function double(n) { return n * 2; }",
      },
    };

    it("matches misc-return-vs-console-log when learner uses console.log instead of return", () => {
      const evaluation: ActivityEvaluationResult = {
        isValid: false,
        feedbackMessage: "Expected function to return 10, but got undefined",
      };

      const result = matchMisconception(
        mockActivity,
        "function double(n) { console.log(n * 2); }",
        evaluation,
        misconceptions,
      );

      expect(result).not.toBeNull();
      expect(result?.misconceptionId).toBe("misc-return-vs-console-log");
      expect(result?.correction).toContain("return");
      expect(result?.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it("matches misc-return-vs-console-log when learner selects undefined in output prediction", () => {
      const predActivity: CanonicalActivity = {
        id: "act-test-pred",
        type: "output-prediction",
        intent: "prediction",
        objectiveIds: ["obj-func-scope"],
        content: {
          language: "javascript",
          code: "function test() { return 42; }",
          prompt: "What is returned?",
          options: ["42", "undefined"],
          explanation: "42 is returned",
        },
      };

      const evaluation: ActivityEvaluationResult = {
        isValid: false,
        feedbackMessage: "Incorrect output selected",
      };

      const result = matchMisconception(predActivity, "undefined", evaluation, misconceptions);

      expect(result).not.toBeNull();
      expect(result?.misconceptionId).toBe("misc-return-vs-console-log");
    });
  });

  describe("Test 10: Safety and False-Positive Protection", () => {
    const mockActivity: CanonicalActivity = {
      id: "act-test-safe",
      type: "multiple-choice",
      intent: "assessment",
      objectiveIds: ["obj-frontend-def"],
      content: {
        question: "What does frontend build?",
        options: [
          { id: "opt-a", text: "Client UI" },
          { id: "opt-b", text: "Database tables" },
        ],
        explanation: "Client UI",
      },
    };

    it("returns null when validation is valid (correct response)", () => {
      const evaluation: ActivityEvaluationResult = {
        isValid: true,
        score: 100,
      };

      const result = matchMisconception(mockActivity, "opt-a", evaluation, misconceptions);

      expect(result).toBeNull();
    });

    it("returns null when response is empty or undefined", () => {
      const evaluation: ActivityEvaluationResult = {
        isValid: false,
        score: 0,
      };

      expect(matchMisconception(mockActivity, "", evaluation, misconceptions)).toBeNull();
      expect(matchMisconception(mockActivity, null, evaluation, misconceptions)).toBeNull();
    });

    it("returns null when incorrect response does not match any known misconception pattern", () => {
      const evaluation: ActivityEvaluationResult = {
        isValid: false,
        score: 0,
      };

      const result = matchMisconception(
        mockActivity,
        "random-unrelated-typo-xyz",
        evaluation,
        misconceptions,
      );

      expect(result).toBeNull();
    });
  });

  describe("Additional Misconceptions: Shotgun Debugging & Frontend Definition", () => {
    const mockDebugActivity: CanonicalActivity = {
      id: "act-shotgun",
      type: "debug",
      intent: "debugging",
      objectiveIds: ["obj-diagnose-bugs"],
      content: {
        title: "Debug Bug",
        prompt: "Fix defect",
        language: "javascript",
        buggyCode: "const x = null; x.foo();",
        bugDescription: "Null pointer",
      },
    };

    it("matches misc-random-code-tweaking on 4 or more failed attempts", () => {
      const evaluation: ActivityEvaluationResult = {
        isValid: false,
        feedbackMessage: "Still failing",
      };

      const result = matchMisconception(mockDebugActivity, "x.bar()", evaluation, misconceptions, {
        attempts: 4,
      });

      expect(result).not.toBeNull();
      expect(result?.misconceptionId).toBe("misc-random-code-tweaking");
      expect(result?.correction).toContain("debugging");
    });
  });
});
