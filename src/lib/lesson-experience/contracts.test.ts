import { describe, expect, it } from "vitest";
import {
  BROWSER_DOCUMENT_DESCRIPTOR,
  createBrowserCompatibilityContract,
  createEvidenceEnvelope,
  createValidationReport,
  resolveCapabilities,
  type CapabilityRequirement,
} from "./contracts";

describe("Phase A lesson experience contracts", () => {
  it("resolves supported browser combinations", () => {
    const required: CapabilityRequirement[] = [
      { name: "render.dom", version: 1 },
      { name: "inspect.console", version: 1 },
    ];
    const result = resolveCapabilities(required);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.family.family).toBe("browser-document");
  });

  it("rejects unsupported combinations clearly", () => {
    const result = resolveCapabilities([
      { name: "execute.react", version: 1 },
      { name: "inspect.component-tree", version: 1 },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("inspect.component-tree");
  });

  it("allows different definitions to share the same contract", () => {
    const first = createBrowserCompatibilityContract([{ name: "render.dom", version: 1 }]);
    const second = createBrowserCompatibilityContract([{ name: "inspect.geometry", version: 1 }]);
    expect(first.kind).toBe(second.kind);
    expect(first.runtime.family).toBe("browser-document");
  });

  it("exposes a versioned evidence envelope without any", () => {
    const evidence = createEvidenceEnvelope({
      runId: "run-1",
      revision: 2,
      family: "browser-document",
      phase: "observe",
      timestamp: 1,
      status: "complete",
      source: { host: "sandbox", artifactIds: [] },
      items: [
        { kind: "console", level: "log", message: "hello" },
        { kind: "dom-snapshot", html: "<main />" },
        { kind: "geometry", target: "main", x: 0, y: 0, width: 10, height: 10 },
      ],
    });
    expect(evidence.schemaVersion).toBe(1);
    expect(evidence.items).toHaveLength(3);
  });

  it("creates typed validation reports and keeps completion declarative", () => {
    const evidence = createEvidenceEnvelope({
      runId: "run-2",
      revision: 1,
      family: "browser-document",
      phase: "validate",
      timestamp: 2,
      status: "complete",
      source: { host: "sandbox", artifactIds: [] },
      items: [],
    });
    const report = createValidationReport({
      runId: "run-2",
      revision: 1,
      family: "browser-document",
      status: "pass",
      assertions: [
        { id: "valid", status: "passed", message: "ok", evidenceKinds: ["dom-snapshot"] },
      ],
      evidence,
      diagnostics: [],
    });
    const contract = createBrowserCompatibilityContract();
    expect(report.schemaVersion).toBe(1);
    expect(contract.completionRequirements[0]?.requires).toBe("validation.pass");
    expect(BROWSER_DOCUMENT_DESCRIPTOR.security).toBe("browser-sandbox");
  });
});
