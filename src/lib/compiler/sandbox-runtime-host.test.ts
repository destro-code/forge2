import { describe, expect, it, vi } from "vitest";
import { CANONICAL_IFRAME_SANDBOX, SandboxRuntimeHost } from "./sandbox-runtime-host";

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

function message(source: object, workspaceRevision: number): MessageEvent {
  return { source, data: { workspaceRevision } } as unknown as MessageEvent;
}

describe("SandboxRuntimeHost", () => {
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
    expect(onMessage).toHaveBeenCalledTimes(1);
    host.dispose(target as unknown as Window);
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
