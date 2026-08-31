import {
  createValidationReport,
  type EvidenceEnvelope,
  type EvidenceItem,
  type ValidationReport,
} from "./contracts";
export function validateReactNativeEvidence(input: {
  runId: string;
  revision: number;
  evidence: EvidenceEnvelope;
  expected?: {
    nodeId?: string;
    state?: Record<string, string | number | boolean>;
    eventType?: string;
  };
}): ValidationReport {
  const items = input.evidence.items;
  const node =
    input.expected?.nodeId &&
    items.find(
      (i): i is Extract<EvidenceItem, { kind: "native-tree" }> =>
        i.kind === "native-tree" && i.id === input.expected?.nodeId,
    );
  const states = items.filter(
    (i): i is Extract<EvidenceItem, { kind: "native-state" }> => i.kind === "native-state",
  );
  const events = items.filter(
    (i): i is Extract<EvidenceItem, { kind: "native-event" }> => i.kind === "native-event",
  );
  const checks = [
    [
      "tree",
      !input.expected?.nodeId || !!node,
      "Expected native component exists.",
      ["native-tree"],
    ],
    [
      "state",
      !input.expected?.state ||
        Object.entries(input.expected.state).every(([k, v]) =>
          states.some((s) => s.key === k && s.value === v),
        ),
      "Expected native state is present.",
      ["native-state"],
    ],
    [
      "event",
      !input.expected?.eventType || events.some((e) => e.type === input.expected?.eventType),
      "Expected native event is present.",
      ["native-event"],
    ],
  ] as const;
  const assertions = checks.map(([id, passed, message, evidenceKinds]) => ({
    id,
    status: passed ? ("passed" as const) : ("failed" as const),
    message,
    evidenceKinds,
  }));
  return createValidationReport({
    runId: input.runId,
    revision: input.revision,
    family: "mobile-native",
    status: assertions.every((a) => a.status === "passed") ? "pass" : "fail",
    assertions,
    evidence: input.evidence,
    diagnostics: [],
  });
}
