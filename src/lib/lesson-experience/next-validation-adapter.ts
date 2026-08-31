import {
  createValidationReport,
  type EvidenceEnvelope,
  type EvidenceItem,
  type ValidationReport,
} from "./contracts";
import type { NextRenderMode } from "./next-runtime-host";

export type NextValidationExpectation = {
  routeId?: string;
  matched?: boolean;
  param?: { name: string; value: string };
  renderMode?: NextRenderMode;
  boundary?: "server" | "client";
  middleware?: { ids?: string[]; action?: "continue" | "rewrite" | "redirect" | "reject" };
  response?: { status?: number; headers?: Record<string, string>; bodyIncludes?: string };
  cache?: "hit" | "miss" | "revalidate";
};
export function validateNextEvidence(input: {
  runId: string;
  revision: number;
  evidence: EvidenceEnvelope;
  expected: NextValidationExpectation;
}): ValidationReport {
  const items = input.evidence.items;
  const route = items.find(
    (item): item is Extract<EvidenceItem, { kind: "next-route" }> => item.kind === "next-route",
  );
  const render = items.find(
    (item): item is Extract<EvidenceItem, { kind: "next-render" }> => item.kind === "next-render",
  );
  const boundary = items.find(
    (item): item is Extract<EvidenceItem, { kind: "next-boundary" }> =>
      item.kind === "next-boundary",
  );
  const response = items.find(
    (item): item is Extract<EvidenceItem, { kind: "http-response" }> =>
      item.kind === "http-response",
  );
  const middleware = items.filter(
    (item): item is Extract<EvidenceItem, { kind: "next-middleware" }> =>
      item.kind === "next-middleware",
  );
  const cache = items.find(
    (item): item is Extract<EvidenceItem, { kind: "next-cache" }> => item.kind === "next-cache",
  );
  const checks = [
    [
      "route",
      !input.expected.routeId || route?.routeId === input.expected.routeId,
      `Expected route ${input.expected.routeId ?? "(any)"}.`,
      ["next-route"],
    ],
    [
      "match",
      input.expected.matched === undefined || route?.matched === input.expected.matched,
      "Route match expectation.",
      ["next-route"],
    ],
    [
      "parameter",
      !input.expected.param ||
        route?.params?.[input.expected.param.name] === input.expected.param.value,
      "Dynamic parameter expectation.",
      ["next-route"],
    ],
    [
      "render",
      !input.expected.renderMode || render?.mode === input.expected.renderMode,
      "Rendering mode expectation.",
      ["next-render"],
    ],
    [
      "boundary",
      !input.expected.boundary || boundary?.boundary === input.expected.boundary,
      "Server/client boundary expectation.",
      ["next-boundary"],
    ],
    [
      "middleware",
      !input.expected.middleware ||
        ((input.expected.middleware.ids ?? middleware.map((item) => item.middlewareId)).every(
          (id, i) => middleware[i]?.middlewareId === id,
        ) &&
          (!input.expected.middleware.action ||
            middleware.some((item) => item.action === input.expected.middleware?.action))),
      "Middleware trace expectation.",
      ["next-middleware"],
    ],
    [
      "response",
      !input.expected.response ||
        (!!response &&
          (input.expected.response.status === undefined ||
            response.status === input.expected.response.status) &&
          (!input.expected.response.bodyIncludes ||
            response.body.includes(input.expected.response.bodyIncludes))),
      "HTTP response expectation.",
      ["http-response"],
    ],
    [
      "cache",
      !input.expected.cache || cache?.state === input.expected.cache,
      "Cache state expectation.",
      ["next-cache"],
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
    family: "framework-server",
    status: assertions.every((a) => a.status === "passed") ? "pass" : "fail",
    assertions,
    evidence: input.evidence,
    diagnostics: [],
  });
}
