import { describe, expect, it } from "vitest";
import { isJsonProps, isParentRuntimeMessage, REACT_RUNTIME_PROTOCOL_VERSION, RUNTIME_LIMITS } from "./react-sandbox/protocol";

describe("React runtime protocol", () => {
  it("accepts bounded JSON props and rejects executable or oversized values", () => {
    expect(isJsonProps({ label: "Hello React", count: 2 })).toBe(true);
    expect(isJsonProps({ callback: () => undefined })).toBe(false);
    expect(isJsonProps({ value: "x".repeat(RUNTIME_LIMITS.propsBytes) })).toBe(false);
  });

  it("authenticates and bounds parent messages", () => {
    const base = { protocolVersion: REACT_RUNTIME_PROTOCOL_VERSION, runId: "run-1", revision: 1, nonce: "nonce-1" } as const;
    expect(isParentRuntimeMessage({ ...base, type: "runtime:interact", requestId: "request-1", target: "submit" })).toBe(true);
    expect(isParentRuntimeMessage({ ...base, type: "runtime:interact", requestId: "request-1", target: "button[data-x]" })).toBe(false);
    expect(isParentRuntimeMessage({ ...base, type: "runtime:execute", requestId: "request-1", source: "function App() {}", props: {} })).toBe(true);
    expect(isParentRuntimeMessage({ ...base, type: "runtime:execute", requestId: "request-1", source: "function App() {}", props: { x: () => undefined } })).toBe(false);
  });
});

// Real iframe execution is intentionally covered by browser verification, not happy-dom.
