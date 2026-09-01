import { describe, expect, it } from "vitest";
import { canonicalRuntimeError } from "./canonical-runtime-service";

describe("canonical runtime error handling", () => {
  it("converts an iframe runtime error into a terminal failed validation result", () => {
    const { report, result } = canonicalRuntimeError(
      "act-runtime",
      "ReferenceError: missingFn is not defined",
    );

    expect(report.status).toBe("failed");
    expect(report.results[0]?.errorMessage).toContain("missingFn is not defined");
    expect(result.isValid).toBe(false);
    expect(result.feedbackMessage).toContain("missingFn is not defined");
    expect(result.details).toMatchObject({
      failedAssertions: [{ id: "runtime-error" }],
    });
  });
});
