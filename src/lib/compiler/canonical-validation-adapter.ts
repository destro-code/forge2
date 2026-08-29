import type { ValidationReport } from "@/lib/types/validation";
import type { ActivityValidationResult } from "@/components/lesson/canonical/types";

/** Converts the browser-owned ValidationReport into the canonical engine contract. */
export function validationReportToActivityResult(
  report: ValidationReport | null | undefined,
): ActivityValidationResult {
  if (!report) {
    return {
      isValid: false,
      feedbackMessage: "No validation report was produced.",
      details: { reason: "missing-report" },
    };
  }

  const failed = report.results.filter((result) => result.status === "failed");
  // ValidationReport.status is the authoritative aggregate, including optional assertions.
  const isValid = report.status === "passed";

  return {
    isValid,
    score:
      report.totalRequired === 0
        ? isValid
          ? 100
          : 0
        : Math.round((report.passedCount / report.totalRequired) * 100),
    feedbackMessage: isValid
      ? "All required validation checks passed."
      : failed.map((result) => result.errorMessage || result.description).join(" ") || "Validation failed.",
    details: {
      report,
      failedAssertions: failed.map((result) => ({
        id: result.assertionId,
        message: result.errorMessage || result.description,
      })),
    },
  };
}

export function createRuntimeErrorReport(exerciseId: string, message: string): ValidationReport {
  return {
    exerciseId,
    status: "failed",
    results: [{
      assertionId: "runtime-error",
      description: "Sandbox runtime error",
      status: "failed",
      errorMessage: message,
      durationMs: 0,
    }],
    passedCount: 0,
    totalRequired: 1,
    timestamp: Date.now(),
  };
}
