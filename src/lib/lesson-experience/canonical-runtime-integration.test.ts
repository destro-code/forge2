import { describe, expect, it } from "vitest";
import { createCanonicalBrowserAdapter } from "./canonical-browser-adapter";
import { evidenceEnvelopeToCanonicalValidation } from "./canonical-evidence-bridge";

describe("canonical runtime integration", () => {
  it("invalidates stale browser runs after reset", () => {
    const adapter = createCanonicalBrowserAdapter();
    const first = adapter.beginRun();
    adapter.reset();
    const result = adapter.collect(first.runId, first.revision, [
      { type: "DOM_SNAPSHOT", html: "<h1>stale</h1>" },
    ]);
    expect(result.lifecycle).toBe("failed");
    expect(result.evidence.status).toBe("unavailable");
  });

  it("translates validation and preserves runtime evidence", () => {
    const adapter = createCanonicalBrowserAdapter();
    const run = adapter.beginRun();
    const evidence = adapter.collect(run.runId, run.revision, [
      { type: "CONSOLE_OUTPUT", level: "log", message: "ok" },
    ]);
    const result = evidenceEnvelopeToCanonicalValidation(evidence, {
      status: "pass",
      diagnostics: [],
      assertions: [{ id: "a", status: "passed", message: "passed", evidenceKinds: ["console"] }],
    });
    expect(result.isValid).toBe(true);
    expect(result.details).toMatchObject({
      runId: run.runId,
      revision: run.revision,
      family: "browser-document",
    });
    expect(result.isValid).toBe(true);
  });
});
