import { describe, expect, it } from "vitest";
import {
  BrowserFamilyAdapter,
  browserMessageToEvidence,
  isCurrentBrowserRun,
} from "./browser-family";
import { validateBrowserEvidence } from "./browser-validation-adapter";
import { createBrowserEvidence } from "./browser-family";

describe("browser family adapter", () => {
  it("maps bounded runtime messages into typed evidence", () => {
    const item = browserMessageToEvidence({
      type: "CONSOLE_OUTPUT",
      level: "warn",
      message: "hello",
    });
    expect(item).toEqual({ kind: "console", level: "warn", message: "hello" });
  });

  it("rejects stale collections and invalidates them on reset", () => {
    const adapter = new BrowserFamilyAdapter("SandboxRuntimeHost");
    const first = adapter.beginRun();
    expect(isCurrentBrowserRun(adapter, first.revision)).toBe(true);
    const second = adapter.beginRun();
    expect(isCurrentBrowserRun(adapter, first.revision)).toBe(false);
    expect(adapter.collect(first.runId, first.revision, []).evidence.status).toBe("unavailable");
    expect(isCurrentBrowserRun(adapter, second.revision)).toBe(true);
    adapter.reset();
    expect(isCurrentBrowserRun(adapter, second.revision)).toBe(false);
  });

  it("validates DOM, style, console, and runtime error evidence", () => {
    const evidence = createBrowserEvidence({
      runId: "run-1",
      revision: 1,
      phase: "observe",
      timestamp: 1,
      status: "complete",
      source: { host: "SandboxRuntimeHost", artifactIds: [] },
      items: [
        { kind: "dom-snapshot", html: "<button>Profile</button>" },
        { kind: "computed-style", target: ".card", property: "width", value: "300px" },
        { kind: "console", level: "log", message: "ready" },
      ],
    });
    const report = validateBrowserEvidence(evidence, [
      { id: "button", kind: "dom-exists", target: "<button", message: "Add a button." },
      {
        id: "heading",
        kind: "dom-text",
        target: "button",
        expected: "Profile",
        message: "Use Profile.",
      },
      {
        id: "width",
        kind: "computed-style",
        target: ".card",
        property: "width",
        expected: "300px",
        message: "Set width.",
      },
      { id: "log", kind: "console", expected: "ready", message: "Log ready." },
      { id: "errors", kind: "no-runtime-error", message: "Fix runtime errors." },
    ]);
    expect(report.status).toBe("pass");
    expect(report.assertions.every((assertion) => assertion.status === "passed")).toBe(true);
  });
});
