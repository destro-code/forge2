import type { PlaygroundRuntime } from "./playground";

/**
 * High-level validation strategy classification.
 */
export type ValidationStrategy =
  "dom_query" | "computed_style" | "js_evaluation" | "console_match" | "source_ast_check";

/**
 * Status of an individual validation assertion execution.
 */
export type ValidationTestStatus = "passed" | "failed" | "skipped";

/**
 * Status of an overall exercise validation report.
 */
export type ValidationReportStatus = "idle" | "running" | "passed" | "failed";

/**
 * Strategy-specific expectation schemas to avoid untyped `any`.
 */
export interface DomQueryExpectation {
  /** Assert that the matched element exists in the DOM. Defaults to true. */
  exists?: boolean;
  /** Assert minimum count of matched elements. */
  count?: number;
  /** Substring or regex pattern that the element textContent must contain. */
  textContains?: string;
  /** Exact textContent required. */
  textExact?: string;
  /** Key-value dictionary of required attribute values on the element (e.g. { type: "submit" }). */
  attributes?: Record<string, string>;
  /** Class name(s) that must be present in the element's classList. */
  hasClasses?: string[];
}

export interface ComputedStyleExpectation {
  /** The CSS property name to check (e.g. "display", "justify-content", "background-color"). */
  property: string;
  /** The expected computed CSS value (e.g. "flex", "space-between", "rgb(255, 0, 0)"). */
  value: string;
  /** Optional pseudo-element if inspecting ::before or ::after styles. */
  pseudoElement?: string;
}

export interface JsEvaluationExpectation {
  /** Expression to evaluate in the sandbox runtime context or global variable to inspect. */
  expression: string;
  /** Expected returned value or evaluation result. */
  expectedValue?: string | number | boolean | null;
  /** Expected typeof result (e.g. "function", "number", "object"). */
  typeOf?: "string" | "number" | "boolean" | "function" | "object" | "undefined";
}

export interface ConsoleMatchExpectation {
  /** Substring or regex pattern that must be captured in the sandbox console output. */
  pattern: string;
  /** The console level where the message must have been emitted. Defaults to "log". */
  level?: "log" | "info" | "warn" | "error";
  /** Minimum number of times the message must have been logged. Defaults to 1. */
  minOccurrences?: number;
}

export interface SourceAstCheckExpectation {
  /** Target file name to inspect (e.g. "index.html", "styles.css", "App.tsx"). Defaults to entry file. */
  file?: string;
  /** AST construct / method pattern required (e.g. "Array.prototype.map", "useState", "keyframes"). */
  construct: string;
  /** Whether the construct is forbidden (e.g. "Do not use for-loops"). Defaults to false (required). */
  forbidden?: boolean;
}

/**
 * Strongly typed discriminated union of validation assertions.
 */
export type ValidationAssertion =
  | {
      id: string;
      description: string;
      strategy: "dom_query";
      /** CSS selector identifying the element(s) under test. */
      target: string;
      expected: DomQueryExpectation;
      failureMessage: string;
      isOptional?: boolean;
    }
  | {
      id: string;
      description: string;
      strategy: "computed_style";
      /** CSS selector identifying the element under test. */
      target: string;
      expected: ComputedStyleExpectation;
      failureMessage: string;
      isOptional?: boolean;
    }
  | {
      id: string;
      description: string;
      strategy: "js_evaluation";
      /** Target scope, variable name, or module name (optional). */
      target?: string;
      expected: JsEvaluationExpectation;
      failureMessage: string;
      isOptional?: boolean;
    }
  | {
      id: string;
      description: string;
      strategy: "console_match";
      target?: string;
      expected: ConsoleMatchExpectation;
      failureMessage: string;
      isOptional?: boolean;
    }
  | {
      id: string;
      description: string;
      strategy: "source_ast_check";
      target?: string;
      expected: SourceAstCheckExpectation;
      failureMessage: string;
      isOptional?: boolean;
    };

/**
 * Declarative validation specification for an exercise.
 * Answers: "What must this project accomplish to be marked correct?"
 */
export interface ExerciseValidationSpec {
  exerciseId: string;
  runtime: PlaygroundRuntime;
  assertions: ValidationAssertion[];
  stopOnFirstFailure?: boolean;
}

/**
 * Result of evaluating a single validation assertion.
 */
export interface ValidationTestResult {
  assertionId: string;
  description: string;
  status: ValidationTestStatus;
  errorMessage?: string;
  durationMs: number;
}

/**
 * Complete aggregate validation report produced when validating an exercise.
 */
export interface ValidationReport {
  exerciseId: string;
  status: ValidationReportStatus;
  results: ValidationTestResult[];
  passedCount: number;
  totalRequired: number;
  timestamp: number;
}

/**
 * Canonical example of an ExerciseValidationSpec for a CSS flexbox exercise.
 * Provided for documentation and type validation reference.
 */
export const EXAMPLE_CSS_EXERCISE_VALIDATION_SPEC: ExerciseValidationSpec = {
  exerciseId: "flexbox-navbar-demo",
  runtime: "html-css",
  assertions: [
    {
      id: "nav-element-exists",
      description: "Document contains a <nav> element",
      strategy: "dom_query",
      target: "nav",
      expected: {
        exists: true,
      },
      failureMessage: "Make sure your HTML includes a <nav> container element.",
    },
    {
      id: "nav-is-flexbox",
      description: "The <nav> element has display: flex",
      strategy: "computed_style",
      target: "nav",
      expected: {
        property: "display",
        value: "flex",
      },
      failureMessage: "Set 'display: flex' on your <nav> element in styles.css.",
    },
    {
      id: "nav-justify-space-between",
      description: "The <nav> element spaces items evenly",
      strategy: "computed_style",
      target: "nav",
      expected: {
        property: "justify-content",
        value: "space-between",
      },
      failureMessage: "Use 'justify-content: space-between' to align items across the navbar.",
    },
  ],
};
