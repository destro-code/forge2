import type { EvidenceItem, ValidationAssertionResult, ValidationReport } from "./contracts";
import type { TypeScriptRunResult } from "./typescript-family";

export type TypeScriptAssertion =
  | { id: string; kind: "diagnostic-count"; expected: number }
  | { id: string; kind: "has-error"; expected: boolean }
  | { id: string; kind: "inferred-type"; expression: string; expected: string }
  | { id: string; kind: "compiled"; expected: boolean };

function assertion(
  item: TypeScriptAssertion,
  passed: boolean,
  message: string,
  evidenceKinds: EvidenceItem["kind"][],
): ValidationAssertionResult {
  return { id: item.id, status: passed ? "passed" : "failed", message, evidenceKinds };
}

export function validateTypeScriptRun(
  result: TypeScriptRunResult,
  assertions: readonly TypeScriptAssertion[],
): ValidationReport {
  const hasError = result.diagnostics.some((diagnostic) => diagnostic.severity === "error");
  const results = assertions.map((item) => {
    if (item.kind === "diagnostic-count") {
      return assertion(
        item,
        result.diagnostics.length === item.expected,
        `Expected ${item.expected} diagnostics; found ${result.diagnostics.length}.`,
        ["type-diagnostic"],
      );
    }
    if (item.kind === "has-error") {
      return assertion(
        item,
        hasError === item.expected,
        `Expected errors=${item.expected}; found ${hasError}.`,
        ["type-diagnostic"],
      );
    }
    if (item.kind === "compiled") {
      return assertion(
        item,
        (result.execution.status === "succeeded") === item.expected,
        `Expected compilation success=${item.expected}.`,
        ["type-diagnostic"],
      );
    }
    const actual =
      result.typeQueries.find((query) => query.variable === item.expression)?.type ??
      result.inferredTypes[item.expression];
    return assertion(
      item,
      actual === item.expected,
      `Expected ${item.expression} to be ${item.expected}; found ${actual ?? "unknown"}.`,
      ["inferred-type"],
    );
  });
  return {
    schemaVersion: 1,
    runId: result.execution.runId,
    family: "type-compiler",
    revision: result.execution.revision,
    status: results.every(({ status }) => status === "passed") ? "pass" : "fail",
    assertions: results,
    evidence: result.evidence,
    diagnostics: result.diagnostics.map(({ code, message }) => `${code}: ${message}`),
  };
}
