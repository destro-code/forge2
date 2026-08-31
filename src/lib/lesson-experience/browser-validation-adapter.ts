import type {
  EvidenceEnvelope,
  EvidenceItem,
  ValidationAssertionResult,
  ValidationReport,
} from "./contracts";
import { createValidationReport } from "./contracts";

export type BrowserValidationDefinition =
  | { id: string; kind: "dom-text"; target: string; expected: string; message: string }
  | { id: string; kind: "dom-exists"; target: string; expected?: boolean; message: string }
  | {
      id: string;
      kind: "computed-style";
      target: string;
      property: string;
      expected: string;
      message: string;
    }
  | {
      id: string;
      kind: "console";
      expected: string;
      level?: "log" | "info" | "warn" | "error";
      message: string;
    }
  | { id: string; kind: "no-runtime-error"; message: string };

function matching(
  items: readonly EvidenceItem[],
  definition: BrowserValidationDefinition,
): boolean {
  switch (definition.kind) {
    case "dom-text":
      return items.some(
        (item) => item.kind === "dom-snapshot" && item.html.includes(definition.expected),
      );
    case "dom-exists": {
      const exists = items.some(
        (item) => item.kind === "dom-snapshot" && item.html.includes(definition.target),
      );
      return exists === (definition.expected ?? true);
    }
    case "computed-style":
      return items.some(
        (item) =>
          item.kind === "computed-style" &&
          item.target === definition.target &&
          item.property === definition.property &&
          item.value === definition.expected,
      );
    case "console":
      return items.some(
        (item) =>
          item.kind === "console" &&
          item.message.includes(definition.expected) &&
          (!definition.level || item.level === definition.level),
      );
    case "no-runtime-error":
      return !items.some((item) => item.kind === "runtime-error");
  }
}

export function validateBrowserEvidence(
  evidence: EvidenceEnvelope,
  definitions: readonly BrowserValidationDefinition[],
): ValidationReport {
  const assertions: ValidationAssertionResult[] = definitions.map((definition) => ({
    id: definition.id,
    status: matching(evidence.items, definition) ? "passed" : "failed",
    message: matching(evidence.items, definition) ? "Requirement passed." : definition.message,
    evidenceKinds: evidence.items.map((item) => item.kind),
  }));
  const failed = assertions.filter((assertion) => assertion.status === "failed");
  return createValidationReport({
    runId: evidence.runId,
    revision: evidence.revision,
    family: "browser-document",
    status: evidence.status === "unavailable" ? "unavailable" : failed.length ? "fail" : "pass",
    assertions,
    evidence,
    diagnostics: failed.map((assertion) => assertion.message),
  });
}
