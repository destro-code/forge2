import type { ActivityValidationResult } from "@/components/lesson/canonical/types";
import type { EvidenceEnvelope, ValidationReport } from "./contracts";

export interface CanonicalEvidenceDetails {
  runId: string;
  revision: number;
  family: EvidenceEnvelope["family"];
  executionStatus: EvidenceEnvelope["status"];
  evidence: EvidenceEnvelope;
  diagnostics: readonly string[];
}

export function evidenceEnvelopeToCanonicalValidation(
  evidence: EvidenceEnvelope,
  report?: Pick<ValidationReport, "status" | "assertions" | "diagnostics">,
): ActivityValidationResult {
  const assertions = report?.assertions ?? [];
  const isValid =
    report?.status === "pass" && assertions.every((assertion) => assertion.status !== "failed");
  return {
    isValid,
    score: isValid ? 100 : 0,
    feedbackMessage: isValid
      ? "Runtime evidence passed validation."
      : "Runtime evidence did not pass validation.",
    details: {
      runId: evidence.runId,
      revision: evidence.revision,
      family: evidence.family ?? "browser-document",
      executionStatus: evidence.status,
      evidence,
      assertions,
      diagnostics: report?.diagnostics ?? [],
    },
  };
}

export function canonicalEvidenceDetails(
  evidence: EvidenceEnvelope,
  diagnostics: readonly string[] = [],
): CanonicalEvidenceDetails {
  return {
    runId: evidence.runId,
    revision: evidence.revision,
    family: evidence.family,
    executionStatus: evidence.status,
    evidence,
    diagnostics,
  };
}
