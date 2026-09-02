import { beforeEach, describe, expect, it, vi } from "vitest";
import { CANONICAL_IFRAME_SANDBOX, SandboxRuntimeHost } from "./sandbox-runtime-host";
import { clearRuntimeDebugEvents, getRuntimeDebugEvents } from "@/lib/debug/runtime-debug-sink";

interface FakeWindow {
  addEventListener: (type: string, listener: (event: MessageEvent) => void) => void;
  removeEventListener: (type: string, listener: (event: MessageEvent) => void) => void;
  dispatchEvent: (event: MessageEvent) => void;
}

function createFakeWindow(): FakeWindow {
  const listeners = new Set<(event: MessageEvent) => void>();
  return {
    addEventListener: (_type, listener) => listeners.add(listener),
    removeEventListener: (_type, listener) => listeners.delete(listener),
    dispatchEvent: (event) => listeners.forEach((listener) => listener(event)),
  };
}

function createFakeIframe(contentWindow: object) {
  let sandbox = "";
  return {
    contentWindow,
    setAttribute: (_name: string, value: string) => {
      sandbox = value;
    },
    getAttribute: (_name: string) => sandbox,
  } as unknown as HTMLIFrameElement;
}

function message(
  source: object,
  workspaceRevision: number,
  type = "PLAYGROUND_CONSOLE",
): MessageEvent {
  return {
    source,
    data: { type, workspaceRevision, level: "log", message: "current" },
  } as unknown as MessageEvent;
}

describe("SandboxRuntimeHost", () => {
  beforeEach(() => clearRuntimeDebugEvents());

  it("preserves the restricted sandbox contract", () => {
    const target = createFakeWindow();
    const iframe = createFakeIframe({});
    const host = new SandboxRuntimeHost({ iframe, workspaceRevision: 2, onMessage: vi.fn() });
    host.mount(target as unknown as Window);
    expect(iframe.getAttribute("sandbox")).toBe(CANONICAL_IFRAME_SANDBOX);
    expect(iframe.getAttribute("sandbox")).not.toContain("allow-same-origin");
    host.dispose(target as unknown as Window);
  });

  it("accepts only active iframe messages and current revisions", () => {
    const target = createFakeWindow();
    const activeWindow = {};
    const unrelatedWindow = {};
    const iframe = createFakeIframe(activeWindow);
    const onMessage = vi.fn();
    const host = new SandboxRuntimeHost({ iframe, workspaceRevision: 2, onMessage });
    host.mount(target as unknown as Window);
    target.dispatchEvent(message(unrelatedWindow, 2));
    target.dispatchEvent(message(activeWindow, 1));
    target.dispatchEvent(message(activeWindow, 2));
    target.dispatchEvent(message(activeWindow, 2, "PLAYGROUND_VALIDATE_RESPONSE"));
    expect(onMessage).toHaveBeenCalledTimes(2);
    host.dispose(target as unknown as Window);
  });

  it("diagnoses unknown messages without forwarding them", () => {
    const target = createFakeWindow();
    const activeWindow = {};
    const iframe = createFakeIframe(activeWindow);
    const onMessage = vi.fn();
    const host = new SandboxRuntimeHost({ iframe, workspaceRevision: 3, onMessage });
    host.mount(target as unknown as Window);
    clearRuntimeDebugEvents();

    target.dispatchEvent({
      source: activeWindow,
      data: {
        command: "registerAsChildFrameAck",
        remoteFrameId: "9b0d9f852464bfa30f22c85630ecc056",
      },
    } as unknown as MessageEvent);

    expect(onMessage).not.toHaveBeenCalled();
    expect(getRuntimeDebugEvents()).toHaveLength(1);
    expect(getRuntimeDebugEvents()[0]?.message).toContain("unknown message");
    host.dispose(target as unknown as Window);
  });

  it("diagnoses stale revisions without forwarding them", () => {
    const target = createFakeWindow();
    const activeWindow = {};
    const iframe = createFakeIframe(activeWindow);
    const onMessage = vi.fn();
    const host = new SandboxRuntimeHost({ iframe, workspaceRevision: 3, onMessage });
    host.mount(target as unknown as Window);

    target.dispatchEvent(message(activeWindow, 2));

    expect(onMessage).not.toHaveBeenCalled();
    expect(getRuntimeDebugEvents().at(-1)?.message).toContain("data={");
    host.dispose(target as unknown as Window);
  });

  it("allows a fresh retry host after Attempt A is disposed", () => {
    const target = createFakeWindow();
    const activeWindow = {};
    const iframe = createFakeIframe(activeWindow);
    const attemptA = vi.fn();
    const attemptB = vi.fn();
    const hostA = new SandboxRuntimeHost({ iframe, workspaceRevision: 1, onMessage: attemptA });
    hostA.mount(target as unknown as Window);
    target.dispatchEvent(message(activeWindow, 1, "PLAYGROUND_READY"));
    hostA.dispose(target as unknown as Window);

    const hostB = new SandboxRuntimeHost({ iframe, workspaceRevision: 2, onMessage: attemptB });
    hostB.mount(target as unknown as Window);
    target.dispatchEvent(message(activeWindow, 1, "PLAYGROUND_READY"));
    target.dispatchEvent(message(activeWindow, 2, "PLAYGROUND_READY"));

    expect(attemptA).toHaveBeenCalledTimes(1);
    expect(attemptB).toHaveBeenCalledTimes(1);
    expect(hostB.isDisposed).toBe(false);
    hostB.dispose(target as unknown as Window);
  });

  it("removes listeners on cleanup and ignores later messages", () => {
    const target = createFakeWindow();
    const activeWindow = {};
    const iframe = createFakeIframe(activeWindow);
    const onMessage = vi.fn();
    const host = new SandboxRuntimeHost({ iframe, workspaceRevision: 4, onMessage });
    host.mount(target as unknown as Window);
    host.dispose(target as unknown as Window);
    target.dispatchEvent(message(activeWindow, 4));
    expect(onMessage).not.toHaveBeenCalled();
    expect(host.isDisposed).toBe(true);
  });
});
