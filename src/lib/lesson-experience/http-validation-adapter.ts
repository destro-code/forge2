import { createValidationReport, type EvidenceItem, type ValidationReport } from "./contracts";
export type HttpExpectation = {
  method?: string;
  path?: string;
  status?: number;
  bodyIncludes?: string;
  errorCode?: string;
  sequenceId?: string;
  sequenceIndex?: number;
};
export function validateHttp(
  runId: string,
  revision: number,
  evidence: readonly EvidenceItem[],
  expectations: readonly HttpExpectation[],
): ValidationReport {
  const assertions = expectations.map((expectation, index) => {
    const request = evidence.find((item) => item.kind === "http-request");
    const response = evidence.find((item) => item.kind === "http-response");
    const error = evidence.find((item) => item.kind === "http-error");
    const sequence = evidence.find((item) => item.kind === "http-sequence");
    const passed =
      (!expectation.method ||
        (request?.kind === "http-request" && request.method === expectation.method)) &&
      (!expectation.path ||
        (request?.kind === "http-request" && request.url === expectation.path)) &&
      (!expectation.status ||
        (response?.kind === "http-response" && response.status === expectation.status)) &&
      (!expectation.bodyIncludes ||
        (response?.kind === "http-response" && response.body.includes(expectation.bodyIncludes))) &&
      (!expectation.errorCode ||
        (error?.kind === "http-error" && error.code === expectation.errorCode)) &&
      (!expectation.sequenceId ||
        (sequence?.kind === "http-sequence" &&
          sequence.sequenceId === expectation.sequenceId &&
          sequence.index === expectation.sequenceIndex));
    return {
      id: `http-${index + 1}`,
      status: passed ? "passed" : "failed",
      message: passed ? "HTTP expectation matched." : "HTTP expectation did not match.",
      evidenceKinds: evidence.map((item) => item.kind),
    } as const;
  });
  const status = assertions.every((assertion) => assertion.status === "passed") ? "pass" : "fail";
  return createValidationReport({
    runId,
    family: "http-api",
    revision,
    status,
    assertions,
    evidence: {
      schemaVersion: 1,
      runId,
      revision,
      family: "http-api",
      phase: "validate",
      timestamp: Date.now(),
      status: "complete",
      source: { host: "HttpRuntimeHost", artifactIds: [] },
      items: evidence,
    },
    diagnostics: [],
  });
}
