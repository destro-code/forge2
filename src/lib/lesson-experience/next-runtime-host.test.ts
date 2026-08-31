import { describe, expect, it } from "vitest";
import { NextRuntimeHost, type NextScenario } from "./next-runtime-host";
import { validateNextEvidence } from "./next-validation-adapter";
const scenarios: NextScenario[] = [
  {
    id: "user",
    version: 1,
    pathname: "/users/[id]",
    routeId: "user",
    kind: "dynamic",
    renderMode: "dynamic",
    boundary: "server",
    middleware: [{ id: "auth", action: "continue" }],
    response: { status: 200, body: "profile" },
    cache: "miss",
  },
];
describe("NextRuntimeHost", () => {
  it("resolves dynamic routes and typed framework evidence", () => {
    const result = new NextRuntimeHost(scenarios).run({ path: "/users/42" });
    expect(result.ok).toBe(true);
    expect(result.evidence.items).toEqual(
      expect.arrayContaining([
        {
          kind: "next-route",
          routeId: "user",
          path: "/users/42",
          matched: true,
          routeKind: "dynamic",
          params: { id: "42" },
        },
      ]),
    );
  });
  it("returns deterministic unmatched errors", () => {
    const a = new NextRuntimeHost(scenarios).run({ path: "/missing" });
    const b = new NextRuntimeHost(scenarios).run({ path: "/missing" });
    expect(a.error).toEqual(b.error);
    expect(a.evidence.items).toEqual(b.evidence.items);
  });
  it("rejects duplicate completion, reset, and disposal", () => {
    const host = new NextRuntimeHost(scenarios);
    host.run({ path: "/users/1" });
    expect(host.run({ path: "/users/1" }).error?.code).toBe("DUPLICATE_COMPLETION");
    host.reset();
    expect(host.run({ path: "/users/1" }).ok).toBe(true);
    host.dispose();
    expect(host.run({ path: "/users/1" }).error?.code).toBe("DISPOSED");
  });
  it("validates route, rendering, boundary, middleware, HTTP, and cache", () => {
    const result = new NextRuntimeHost(scenarios).run({ path: "/users/42" });
    const report = validateNextEvidence({
      runId: result.runId,
      revision: result.revision,
      evidence: result.evidence,
      expected: {
        routeId: "user",
        matched: true,
        param: { name: "id", value: "42" },
        renderMode: "dynamic",
        boundary: "server",
        middleware: { ids: ["auth"], action: "continue" },
        response: { status: 200, bodyIncludes: "profile" },
        cache: "miss",
      },
    });
    expect(report.status).toBe("pass");
  });
});
