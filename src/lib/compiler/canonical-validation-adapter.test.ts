import { describe, expect, it } from "vitest";
import { createRuntimeErrorReport, validationReportToActivityResult } from "./canonical-validation-adapter";

describe("canonical validation adapter", () => {
  it("maps a passing report to valid canonical evidence", () => {
    const result = validationReportToActivityResult({
      exerciseId: "act-112-code-interactive",
      status: "passed",
      results: [{ assertionId: "required", description: "required", status: "passed", durationMs: 1 }],
      passedCount: 1,
      totalRequired: 1,
      timestamp: 1,
    });
    expect(result.isValid).toBe(true);
    expect(result.details).toMatchObject({ report: { status: "passed" } });
  });

  it("maps failed and runtime reports to invalid results", () => {
    const failed = validationReportToActivityResult({
      exerciseId: "x",
      status: "failed",
      results: [{ assertionId: "required", description: "missing", status: "failed", errorMessage: "Missing", durationMs: 1 }],
      passedCount: 0,
      totalRequired: 1,
      timestamp: 1,
    });
    expect(failed.isValid).toBe(false);
    expect(failed.feedbackMessage).toContain("Missing");
    expect(validationReportToActivityResult(createRuntimeErrorReport("x", "boom")).isValid).toBe(false);
  });
});
