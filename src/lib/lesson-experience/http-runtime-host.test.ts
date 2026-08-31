import { describe, expect, it } from "vitest";
import { HTTP_SCENARIOS } from "./http-scenarios";
import { HttpRuntimeHost, normalizeHttpRequest } from "./http-runtime-host";
import { validateHttp } from "./http-validation-adapter";

describe("HttpRuntimeHost", () => {
  it("matches deterministic fixtures and validates evidence", () => {
    const host = new HttpRuntimeHost(HTTP_SCENARIOS);
    const result = host.run({
      method: "get",
      path: "/api/profile",
      headers: { Authorization: "secret" },
    });
    expect(result.ok).toBe(true);
    expect(result.response?.status).toBe(200);
    expect(result.evidence.items).toContainEqual({
      kind: "http-response",
      status: 200,
      headers: { "content-type": "application/json" },
      body: '{"name":"Ada","plan":"pro"}',
    });
    expect(
      validateHttp(result.runId, result.revision, result.evidence.items, [
        { method: "GET", path: "/api/profile", status: 200 },
      ]).status,
    ).toBe("pass");
  });
  it("keeps controlled failures distinct from mismatches", () => {
    const host = new HttpRuntimeHost(HTTP_SCENARIOS);
    expect(host.run({ method: "GET", path: "/api/unknown" }).error?.code).toBe("SCENARIO_MISMATCH");
    expect(host.run({ method: "GET", path: "/api/failure" }).response?.status).toBe(500);
  });
  it("enforces bounds and disposal", () => {
    expect(() =>
      normalizeHttpRequest({ method: "GET", path: "/", body: "x".repeat(16_385) }),
    ).toThrow("BODY_TOO_LARGE");
    const host = new HttpRuntimeHost([]);
    host.dispose();
    expect(host.run({ method: "GET", path: "/" }).error?.code).toBe("DISPOSED");
  });
});
