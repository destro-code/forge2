import { describe, expect, it } from "vitest";
import {
  REACT_NATIVE_DESCRIPTOR,
  RUNTIME_FAMILY_DESCRIPTORS,
  resolveCapabilities,
  type EvidenceItem,
} from "./contracts";
import {
  ReactNativeRuntimeHost,
  REACT_NATIVE_HOST_ID,
  type NativeScenario,
} from "./react-native-runtime-host";
import { validateReactNativeEvidence } from "./react-native-validation-adapter";

function scenario(): NativeScenario {
  return {
    id: "counter",
    version: 1,
    screen: { width: 390, height: 844, scale: 3 },
    initialState: { count: 0 },
    transitions: [{ action: { type: "press", targetId: "increment" }, state: { count: 1 } }],
    root: {
      id: "root",
      type: "View",
      props: { testID: "counter-screen" },
      layout: { x: 0, y: 0, width: 390, height: 844 },
      children: [
        {
          id: "title",
          type: "Text",
          props: { text: "Native counter" },
          layout: { x: 24, y: 32, width: 220, height: 40 },
          accessibility: { role: "header", label: "Native counter", focusable: false },
        },
        {
          id: "increment",
          type: "Pressable",
          props: { accessibilityRole: "button" },
          layout: { x: 24, y: 120, width: 160, height: 48 },
          accessibility: { role: "button", label: "Increment count", focusable: true },
        },
      ],
    },
  };
}

function kinds(items: readonly EvidenceItem[], kind: EvidenceItem["kind"]) {
  return items.filter((item) => item.kind === kind);
}

describe("react-native capability resolution", () => {
  it("resolves the native descriptor for its own capabilities", () => {
    const resolution = resolveCapabilities(REACT_NATIVE_DESCRIPTOR.capabilities);
    expect(resolution.ok).toBe(true);
    if (resolution.ok) {
      expect(resolution.family.family).toBe("mobile-native");
      expect(resolution.family.security).toBe("compiler-isolation");
    }
  });

  it("is registered in the shared descriptor registry", () => {
    expect(RUNTIME_FAMILY_DESCRIPTORS).toContain(REACT_NATIVE_DESCRIPTOR);
  });

  it("rejects cross-family combinations that mix native and browser capabilities", () => {
    const resolution = resolveCapabilities([
      { name: "render.native", version: 1 },
      { name: "render.dom", version: 1 },
    ]);
    expect(resolution.ok).toBe(false);
    if (!resolution.ok) {
      expect(resolution.code).toBe("UNSUPPORTED_CAPABILITY_COMBINATION");
      expect(resolution.eligibleFamilies).toContain("mobile-native");
      expect(resolution.eligibleFamilies).toContain("browser-document");
    }
  });

  it("rejects browser-only capabilities against the native descriptor alone", () => {
    const resolution = resolveCapabilities(
      [{ name: "render.dom", version: 1 }],
      [REACT_NATIVE_DESCRIPTOR],
    );
    expect(resolution.ok).toBe(false);
    if (!resolution.ok) {
      expect(resolution.missing.map((c) => c.name)).toContain("render.dom");
      expect(resolution.message).toContain("render.dom");
    }
  });
});

describe("react-native runtime host mount", () => {
  it("emits bounded platform, tree, layout, accessibility, and state evidence", () => {
    const host = new ReactNativeRuntimeHost(scenario());
    const run = host.run();

    expect(run.status).toBe("succeeded");
    expect(run.revision).toBe(1);
    expect(run.evidence.family).toBe("mobile-native");
    expect(run.evidence.source.host).toBe(REACT_NATIVE_HOST_ID);

    const items = run.evidence.items;
    expect(kinds(items, "native-platform")).toHaveLength(1);
    expect(kinds(items, "native-tree")).toHaveLength(3);
    expect(kinds(items, "native-layout")).toHaveLength(3);
    expect(kinds(items, "native-accessibility")).toHaveLength(2);
    expect(kinds(items, "native-state")).toHaveLength(1);
  });

  it("normalizes optional accessibility flags deterministically", () => {
    const host = new ReactNativeRuntimeHost(scenario());
    const accessibility = kinds(host.run().evidence.items, "native-accessibility") as Extract<
      EvidenceItem,
      { kind: "native-accessibility" }
    >[];
    const increment = accessibility.find((item) => item.id === "increment");
    expect(increment).toMatchObject({ enabled: true, focusable: true, role: "button" });
  });
});

describe("react-native runtime host actions", () => {
  it("applies a declared transition and emits an event with previous state", () => {
    const host = new ReactNativeRuntimeHost(scenario());
    host.run();
    const acted = host.act({ type: "press", targetId: "increment" });

    expect(acted.status).toBe("succeeded");
    expect(acted.revision).toBe(2);
    const events = kinds(acted.evidence.items, "native-event") as Extract<
      EvidenceItem,
      { kind: "native-event" }
    >[];
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ type: "press", targetId: "increment", order: 0 });
    const states = kinds(acted.evidence.items, "native-state") as Extract<
      EvidenceItem,
      { kind: "native-state" }
    >[];
    expect(states).toEqual([{ kind: "native-state", key: "count", value: 1, previous: 0 }]);
  });

  it("reports unavailable for actions with no declared transition", () => {
    const host = new ReactNativeRuntimeHost(scenario());
    host.run();
    const acted = host.act({ type: "press", targetId: "unknown" });

    expect(acted.status).toBe("unavailable");
    const unavailable = kinds(acted.evidence.items, "native-unavailable") as Extract<
      EvidenceItem,
      { kind: "native-unavailable" }
    >[];
    expect(unavailable[0]).toMatchObject({ code: "UNSUPPORTED_ACTION" });
  });
});

describe("react-native runtime host lifecycle", () => {
  it("increments revisions monotonically across run and act", () => {
    const host = new ReactNativeRuntimeHost(scenario());
    expect(host.run().revision).toBe(1);
    expect(host.act({ type: "press", targetId: "increment" }).revision).toBe(2);
    expect(host.run().revision).toBe(3);
  });

  it("restores initial state on reset", () => {
    const host = new ReactNativeRuntimeHost(scenario());
    host.run();
    host.act({ type: "press", targetId: "increment" });
    const reset = host.run();
    const stateAfterAct = kinds(reset.evidence.items, "native-state") as Extract<
      EvidenceItem,
      { kind: "native-state" }
    >[];
    // After an explicit reset the count should return to its initial value.
    host.reset();
    const afterReset = host.run();
    const resetState = kinds(afterReset.evidence.items, "native-state") as Extract<
      EvidenceItem,
      { kind: "native-state" }
    >[];
    expect(stateAfterAct.find((s) => s.key === "count")?.value).toBe(1);
    expect(resetState.find((s) => s.key === "count")?.value).toBe(0);
  });

  it("invalidates the host after disposal", () => {
    const host = new ReactNativeRuntimeHost(scenario());
    host.dispose();
    const run = host.run();
    expect(run.status).toBe("disposed");
    const unavailable = kinds(run.evidence.items, "native-unavailable") as Extract<
      EvidenceItem,
      { kind: "native-unavailable" }
    >[];
    expect(unavailable[0]).toMatchObject({ code: "DISPOSED" });
    expect(host.act({ type: "press", targetId: "increment" }).status).toBe("disposed");
  });
});

describe("react-native runtime host security and determinism", () => {
  it("produces identical semantic evidence for identical inputs across hosts", () => {
    const first = new ReactNativeRuntimeHost(scenario()).run();
    const second = new ReactNativeRuntimeHost(scenario()).run();
    expect(first.evidence.items).toEqual(second.evidence.items);
  });

  it("does not leak run identifiers or revisions into semantic observations", () => {
    const run = new ReactNativeRuntimeHost(scenario()).run();
    const serialized = JSON.stringify(run.evidence.items);
    expect(serialized).not.toContain(run.runId);
    expect(serialized).not.toContain("revision");
  });
});

describe("react-native validation adapter", () => {
  it("passes when expected component, state, and event are present", () => {
    const host = new ReactNativeRuntimeHost(scenario());
    host.run();
    const acted = host.act({ type: "press", targetId: "increment" });
    const report = validateReactNativeEvidence({
      runId: acted.runId,
      revision: acted.revision,
      evidence: acted.evidence,
      expected: { state: { count: 1 }, eventType: "press" },
    });
    expect(report.status).toBe("pass");
    expect(report.family).toBe("mobile-native");
    expect(report.assertions.every((a) => a.status === "passed")).toBe(true);
  });

  it("fails when an expected component is absent from the evidence", () => {
    const acted = (() => {
      const host = new ReactNativeRuntimeHost(scenario());
      host.run();
      return host.act({ type: "press", targetId: "increment" });
    })();
    const report = validateReactNativeEvidence({
      runId: acted.runId,
      revision: acted.revision,
      evidence: acted.evidence,
      expected: { nodeId: "missing-node" },
    });
    expect(report.status).toBe("fail");
    expect(report.assertions.find((a) => a.id === "tree")?.status).toBe("failed");
  });

  it("fails against unavailable evidence when an observation is expected", () => {
    const host = new ReactNativeRuntimeHost(scenario());
    host.run();
    const unsupported = host.act({ type: "press", targetId: "unknown" });
    const report = validateReactNativeEvidence({
      runId: unsupported.runId,
      revision: unsupported.revision,
      evidence: unsupported.evidence,
      expected: { nodeId: "increment", eventType: "press" },
    });
    expect(report.status).toBe("fail");
  });
});
