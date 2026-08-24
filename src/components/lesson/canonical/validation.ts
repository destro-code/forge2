import type { CanonicalActivity, ActivityValidationConfig } from "@/lib/curriculum/types";
import type { ActivityValidationResult } from "./types";

export type ActivityResponse<T extends CanonicalActivity["type"]> = T extends "multiple-choice"
  ? string
  : T extends "multi-select"
    ? string[]
    : T extends "fill-blank"
      ? string[]
      : T extends "ordering"
        ? string[]
        : T extends "output-prediction"
          ? string
          : T extends "interactive-code"
            ? string | boolean[] | { passed: boolean }
            : T extends "debug"
              ? string | boolean[] | { passed: boolean }
              : T extends "reflection"
                ? string
                : undefined;

export function evaluateActivityValidation<T extends CanonicalActivity>(
  activity: T,
  response: ActivityResponse<T["type"]>,
): ActivityValidationResult {
  const config = activity.validation;
  const feedback = activity.feedback;

  // Activities without validation (intro, explanation, summary, completion, etc.) auto-pass
  if (!config) {
    return {
      isValid: true,
      feedbackMessage: feedback?.correct || "Activity completed successfully.",
    };
  }

  switch (config.type) {
    case "exact-match": {
      const expected = config.expected;
      let isMatch = false;

      if (typeof expected === "string" && typeof response === "string") {
        if (config.caseSensitive === false) {
          isMatch = expected.trim().toLowerCase() === response.trim().toLowerCase();
        } else {
          isMatch = expected.trim() === response.trim();
        }
      } else {
        isMatch = expected === (response as unknown);
      }

      return {
        isValid: isMatch,
        feedbackMessage: isMatch
          ? feedback?.correct || "Correct! Excellent work."
          : feedback?.incorrect || "That is not quite right. Review the explanation and try again.",
      };
    }
    case "one-of": {
      const validOptions = config.validOptions;
      let isMatch = false;

      if (typeof response === "string") {
        const checkStr =
          config.caseSensitive === false ? response.trim().toLowerCase() : response.trim();

        isMatch = validOptions.some((opt) => {
          if (typeof opt === "string") {
            const optStr = config.caseSensitive === false ? opt.trim().toLowerCase() : opt.trim();
            return optStr === checkStr;
          }
          return opt === (response as unknown);
        });
      } else {
        isMatch = validOptions.includes(
          response as Extract<(typeof validOptions)[number], string | number>,
        );
      }

      return {
        isValid: isMatch,
        feedbackMessage: isMatch
          ? feedback?.correct || "Correct answer selected."
          : feedback?.incorrect || "The selected option is incorrect. Try another selection.",
      };
    }
    case "multi-match": {
      const expected = config.expected;
      const actual = Array.isArray(response) ? (response as string[]) : [];

      if (expected.length !== actual.length) {
        return {
          isValid: false,
          feedbackMessage:
            feedback?.incorrect ||
            `Please select all ${expected.length} matching options. You have selected ${actual.length}.`,
        };
      }

      let isMatch = false;
      if (config.ignoreOrder !== false) {
        const sortedExpected = [...expected].sort();
        const sortedActual = [...actual].sort();
        isMatch = sortedExpected.every((val, idx) => val === sortedActual[idx]);
      } else {
        isMatch = expected.every((val, idx) => val === actual[idx]);
      }

      return {
        isValid: isMatch,
        feedbackMessage: isMatch
          ? feedback?.correct || "All matching items correctly identified!"
          : feedback?.incorrect || "The combination of selected items is not quite correct.",
      };
    }
    case "ordering": {
      const correctSequence = config.correctSequence;
      const actualSequence = Array.isArray(response) ? (response as string[]) : [];

      if (correctSequence.length !== actualSequence.length) {
        return {
          isValid: false,
          feedbackMessage: "Please arrange all items before submitting.",
        };
      }

      const isMatch = correctSequence.every((id, idx) => id === actualSequence[idx]);
      return {
        isValid: isMatch,
        feedbackMessage: isMatch
          ? feedback?.correct || "Sequence correctly ordered!"
          : feedback?.incorrect ||
            "The sequence is not in the correct order yet. Rearrange and try again.",
      };
    }
    case "code-output": {
      const expectedOutput = config.expectedOutput.trim();
      const actualOutput =
        typeof response === "string" ? response.trim() : String(response || "").trim();

      let isMatch = false;
      const matchType = config.matchType || "exact";

      if (matchType === "exact") {
        isMatch = actualOutput === expectedOutput;
      } else if (matchType === "contains") {
        isMatch = actualOutput.includes(expectedOutput);
      } else if (matchType === "regex") {
        try {
          const regex = new RegExp(expectedOutput);
          isMatch = regex.test(actualOutput);
        } catch {
          isMatch = actualOutput === expectedOutput;
        }
      }

      return {
        isValid: isMatch,
        feedbackMessage: isMatch
          ? feedback?.correct || "Output matches the expected result!"
          : feedback?.incorrect ||
            `Expected output "${expectedOutput}", but received "${actualOutput}".`,
        details: { expected: expectedOutput, actual: actualOutput },
      };
    }
    case "tests": {
      // In client-side test validation, response can be an array of test result booleans or a test report object
      if (Array.isArray(response)) {
        const allPassed = response.every((r) => r === true);
        return {
          isValid: allPassed,
          feedbackMessage: allPassed
            ? feedback?.correct || "All test cases passed successfully!"
            : feedback?.incorrect || "Some test cases failed. Inspect your code logic.",
        };
      }
      if (response && typeof response === "object" && "passed" in response) {
        const passed = Boolean((response as any).passed);
        return {
          isValid: passed,
          feedbackMessage: passed
            ? feedback?.correct || "All test cases passed!"
            : feedback?.incorrect || "Test assertion failed.",
        };
      }
      return {
        isValid: true,
        feedbackMessage: "Test validation executed.",
      };
    }
    default:
      return {
        isValid: true,
        feedbackMessage: feedback?.correct || "Completed.",
      };
  }
}
