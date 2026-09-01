import { createEvidenceEnvelope, type EvidenceEnvelope, type EvidenceItem } from "./contracts";

export type NextRenderMode = "server-rendered" | "client-rendered" | "static" | "dynamic";
export type NextMiddlewareAction = "continue" | "rewrite" | "redirect" | "reject";
export type NextRouteKind = "static" | "dynamic";
export type NextBoundary = "server" | "client";

export type NextScenario = {
  id: string;
  version: 1;
  pathname: string;
  routeId: string;
  kind: NextRouteKind;
  renderMode: NextRenderMode;
  boundary: NextBoundary;
  middleware?: readonly { id: string; action: NextMiddlewareAction; target?: string }[];
  response: { status: number; headers?: Record<string, string>; body: string };
  params?: Record<string, string>;
  cache?: "hit" | "miss" | "revalidate";
};
export type NextRequest = { path: string; method?: string; headers?: Record<string, string> };
export type NextRunResult = {
  ok: boolean;
  runId: string;
  revision: number;
  status: "succeeded" | "failed";
  response?: NextScenario["response"];
  error?: { code: string; message: string };
  evidence: EvidenceEnvelope;
};
const cap = (value: string, n = 2000) => value.slice(0, n);
const cleanHeaders = (headers: Record<string, string> = {}) =>
  Object.fromEntries(
    Object.entries(headers)
      .slice(0, 16)
      .map(([k, v]) => [k.toLowerCase(), cap(String(v), 256)]),
  );
function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function match(path: string, scenario: NextScenario) {
  if (scenario.kind === "static") return path === scenario.pathname;
  const parts = scenario.pathname.split(/\[([^\]]+)\]/g);
  const keys = parts.filter((_, index) => index % 2 === 1);
  const pattern = new RegExp(
    `^${parts.map((part, index) => (index % 2 === 1 ? "([^/]+)" : escapeRegExp(part))).join("")}$`,
  );
  const found = path.match(pattern);
  if (!found) return false;
  try {
    return Object.fromEntries(keys.map((key, i) => [key, decodeURIComponent(found[i + 1])]));
  } catch {
    return false;
  }
}
export const NEXT_DESCRIPTOR = {
  family: "framework-server" as const,
  version: 1 as const,
  security: "compiler-isolation" as const,
  capabilities: [
    { name: "execute.server" as const, version: 1 as const },
    { name: "inspect.route" as const, version: 1 as const },
    { name: "inspect.render" as const, version: 1 as const },
    { name: "inspect.middleware-trace" as const, version: 1 as const },
    { name: "inspect.http-response" as const, version: 1 as const },
    { name: "inspect.http-request" as const, version: 1 as const },
    { name: "inspect.server-log" as const, version: 1 as const },
    { name: "inspect.cache" as const, version: 1 as const },
    { name: "inspect.server-client-boundary" as const, version: 1 as const },
  ] as const,
};
export class NextRuntimeHost {
  private revision = 0;
  private disposed = false;
  private completed = new Set<string>();
  constructor(private readonly scenarios: readonly NextScenario[]) {}
  run(request: NextRequest): NextRunResult {
    const revision = ++this.revision;
    const runId = `next-${revision}`;
    const method = (request.method ?? "GET").toUpperCase();
    const evidence: EvidenceItem[] = [{ kind: "next-request", method, path: cap(request.path) }];
    const unavailable = (code: string, message: string): NextRunResult => ({
      ok: false,
      runId,
      revision,
      status: "failed",
      error: { code, message },
      evidence: createEvidenceEnvelope({
        runId,
        revision,
        family: "framework-server",
        phase: "observe",
        timestamp: Date.now(),
        status: "complete",
        source: { host: "NextRuntimeHost", artifactIds: [] },
        items: [...evidence, { kind: "next-error", code, message }],
      }),
    });
    if (this.disposed) return unavailable("DISPOSED", "Runtime has been disposed.");
    const key = `${method}:${request.path}`;
    if (this.completed.has(key))
      return unavailable("DUPLICATE_COMPLETION", "This request has already completed.");
    this.completed.add(key);
    const candidate = this.scenarios.find((scenario) => match(request.path, scenario));
    if (!candidate) {
      evidence.push({
        kind: "next-route",
        routeId: "unmatched",
        path: request.path,
        matched: false,
        routeKind: "unmatched",
      });
      return unavailable("ROUTE_NOT_FOUND", "No declared Next.js route matched this request.");
    }
    const resolved = match(request.path, candidate);
    const params = typeof resolved === "object" ? resolved : (candidate.params ?? {});
    evidence.push({
      kind: "next-route",
      routeId: candidate.routeId,
      path: request.path,
      matched: true,
      routeKind: candidate.kind,
      params,
    });
    for (const [index, middleware] of (candidate.middleware ?? []).entries())
      evidence.push({
        kind: "next-middleware",
        middlewareId: middleware.id,
        order: index,
        action: middleware.action,
        routeId: candidate.routeId,
      });
    evidence.push({
      kind: "next-boundary",
      boundary: candidate.boundary,
      serverAvailable: candidate.boundary === "server",
      clientAvailable: candidate.boundary === "client",
    });
    evidence.push({ kind: "next-render", mode: candidate.renderMode, routeId: candidate.routeId });
    if (candidate.cache)
      evidence.push({ kind: "next-cache", state: candidate.cache, logicalRevision: revision });
    const blocked = (candidate.middleware ?? []).find(
      (m) => m.action === "reject" || m.action === "redirect",
    );
    const response =
      blocked?.action === "redirect"
        ? {
            ...candidate.response,
            status: 307,
            headers: { ...candidate.response.headers, location: blocked.target ?? "/login" },
          }
        : blocked?.action === "reject"
          ? { ...candidate.response, status: 403 }
          : { ...candidate.response, headers: cleanHeaders(candidate.response.headers) };
    evidence.push({
      kind: "http-response",
      status: response.status,
      headers: cleanHeaders(response.headers),
      body: cap(response.body),
    });
    return {
      ok: response.status < 400,
      runId,
      revision,
      status: response.status < 400 ? "succeeded" : "failed",
      response,
      evidence: createEvidenceEnvelope({
        runId,
        revision,
        family: "framework-server",
        phase: "observe",
        timestamp: Date.now(),
        status: "complete",
        source: { host: "NextRuntimeHost", artifactIds: [] },
        items: evidence,
      }),
    };
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
export type NextEvidenceItem = Extract<EvidenceItem, { kind: `next-${string}` }>;
