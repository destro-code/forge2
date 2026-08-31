import { createEvidenceEnvelope, type EvidenceEnvelope, type EvidenceItem } from "./contracts";

export type HttpRequestInput = {
  method: string;
  path: string;
  query?: Record<string, string>;
  headers?: Record<string, string>;
  body?: string;
  sequenceId?: string;
  sequenceIndex?: number;
};
export type HttpScenario = {
  id: string;
  method: string;
  path: string;
  response: { status: number; headers?: Record<string, string>; body?: string };
  query?: Record<string, string>;
  bodyIncludes?: string;
  sequenceId?: string;
  sequenceIndex?: number;
  error?: { code: string; message: string };
};
export type HttpRunResult = {
  ok: boolean;
  runId: string;
  revision: number;
  status: "succeeded" | "failed" | "unavailable";
  response?: { status: number; headers: Record<string, string>; body: string };
  error?: { code: string; message: string };
  evidence: EvidenceEnvelope;
};

const MAX_BODY = 16_384;
const MAX_HEADERS = 32;
const MAX_QUERY = 16;
const sensitive = /authorization|cookie|token|secret|password|api[-_]?key/i;
const internal = /localhost|127\.0\.0\.1|0\.0\.0\.0|::1|stack|\/vercel|\/home/i;
function clean(value: string, limit = 4000) {
  return internal.test(value) ? "[redacted]" : value.slice(0, limit);
}
function safeHeaders(headers: Record<string, string> = {}) {
  return Object.fromEntries(
    Object.entries(headers)
      .slice(0, MAX_HEADERS)
      .map(([key, value]) => [
        key.toLowerCase(),
        sensitive.test(key) ? "[redacted]" : clean(String(value), 512),
      ]),
  );
}
function normalize(input: HttpRequestInput): HttpRequestInput {
  const method = input.method.trim().toUpperCase();
  const path = input.path.trim();
  if (!/^[A-Z]+$/.test(method) || !path.startsWith("/") || path.length > 512)
    throw new Error("INVALID_REQUEST");
  if (input.body && input.body.length > MAX_BODY) throw new Error("BODY_TOO_LARGE");
  if (
    Object.keys(input.headers ?? {}).length > MAX_HEADERS ||
    Object.keys(input.query ?? {}).length > MAX_QUERY
  )
    throw new Error("REQUEST_LIMIT");
  return {
    method,
    path,
    query: Object.fromEntries(Object.entries(input.query ?? {}).sort()),
    headers: safeHeaders(input.headers),
    body: input.body ?? "",
    sequenceId: input.sequenceId,
    sequenceIndex: input.sequenceIndex,
  };
}
export class HttpRuntimeHost {
  private revision = 0;
  private disposed = false;
  private completed = new Set<string>();
  constructor(private readonly scenarios: readonly HttpScenario[]) {}
  run(input: HttpRequestInput): HttpRunResult {
    const runId = `http-${++this.revision}`;
    const started = Date.now();
    const item = (kind: EvidenceItem["kind"], value: EvidenceItem) => value;
    try {
      if (this.disposed) throw new Error("DISPOSED");
      const request = normalize(input);
      const key = JSON.stringify(request);
      if (this.completed.has(key)) throw new Error("DUPLICATE_COMPLETION");
      this.completed.add(key);
      const scenario = this.scenarios.find(
        (candidate) =>
          candidate.method === request.method &&
          candidate.path === request.path &&
          JSON.stringify(candidate.query ?? {}) === JSON.stringify(request.query ?? {}) &&
          (!candidate.bodyIncludes || request.body?.includes(candidate.bodyIncludes)) &&
          candidate.sequenceId === request.sequenceId &&
          candidate.sequenceIndex === request.sequenceIndex,
      );
      const evidence: EvidenceItem[] = [
        item("http-request", { kind: "http-request", method: request.method, url: request.path }),
      ];
      if (!scenario)
        throw Object.assign(new Error("SCENARIO_MISMATCH"), { code: "SCENARIO_MISMATCH" });
      if (scenario.error)
        throw Object.assign(new Error(scenario.error.message), { code: scenario.error.code });
      const response = {
        status: scenario.response.status,
        headers: safeHeaders(scenario.response.headers),
        body: clean(scenario.response.body ?? ""),
      };
      evidence.push(item("http-response", { kind: "http-response", ...response }));
      if (scenario.sequenceId)
        evidence.push({
          kind: "http-sequence",
          sequenceId: scenario.sequenceId,
          index: scenario.sequenceIndex ?? 0,
          status: "matched",
        });
      evidence.push({ kind: "http-timing", durationMs: Date.now() - started });
      return {
        ok: response.status < 400,
        runId,
        revision: this.revision,
        status: response.status < 400 ? "succeeded" : "failed",
        response,
        evidence: createEvidenceEnvelope({
          runId,
          revision: this.revision,
          family: "http-api",
          phase: "observe",
          timestamp: Date.now(),
          status: "complete",
          source: { host: "HttpRuntimeHost", artifactIds: [] },
          items: evidence,
        }),
      };
    } catch (error) {
      const code =
        error instanceof Error && "code" in error
          ? String((error as Error & { code: string }).code)
          : error instanceof Error
            ? error.message
            : "RUNTIME_ERROR";
      const message = code === "DISPOSED" ? "Runtime has been disposed." : code;
      return {
        ok: false,
        runId,
        revision: this.revision,
        status: "failed",
        error: { code, message },
        evidence: createEvidenceEnvelope({
          runId,
          revision: this.revision,
          family: "http-api",
          phase: "observe",
          timestamp: Date.now(),
          status: "complete",
          source: { host: "HttpRuntimeHost", artifactIds: [] },
          items: [{ kind: "http-error", code, message }],
        }),
      };
    }
  }
  reset() {
    if (!this.disposed) {
      this.revision++;
      this.completed.clear();
    }
  }
  dispose() {
    this.disposed = true;
    this.revision++;
    this.completed.clear();
  }
}
export { normalize as normalizeHttpRequest };
