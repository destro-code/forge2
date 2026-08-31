import React, { useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { REACT_RUNTIME_PROTOCOL_VERSION, RUNTIME_LIMITS, type RuntimeExecuteMessage, type RuntimeDisposeMessage } from "./protocol";

type RuntimeWindow = Window & { __forgeDisposed?: boolean; __forgeRoot?: Root };

export function ReactSandboxRuntime() {
  useEffect(() => {
    const runtimeWindow = window as RuntimeWindow;
    const params = new URLSearchParams(window.location.search);
    const runId = params.get("runId") ?? "runtime";
    const revision = Number(params.get("revision") ?? 0);
    const nonce = params.get("nonce") ?? "";
    const rootHost = document.getElementById("root");
    let activeRequestId: string | null = null;
    let messageCount = 0;
    const post = (message: unknown) => {
      if (runtimeWindow.__forgeDisposed || ++messageCount > 100) return;
      if (JSON.stringify(message).length > RUNTIME_LIMITS.messageBytes) return;
      window.parent.postMessage(message, "*");
    };
    const blocked = () => Promise.reject(new Error("Network access is disabled in the React sandbox."));
    for (const [key, value] of [["fetch", blocked], ["XMLHttpRequest", undefined], ["WebSocket", undefined], ["EventSource", undefined]] as const) {
      try { Object.defineProperty(window, key, { configurable: false, value, writable: false }); } catch { /* browser-owned globals may already be locked */ }
    }
    try { Object.defineProperty(navigator, "sendBeacon", { configurable: false, value: () => false }); } catch { /* browser-owned APIs may already be locked */ }
    const execute = (message: RuntimeExecuteMessage) => {
      if (runtimeWindow.__forgeDisposed || activeRequestId || message.nonce !== nonce || message.runId !== runId || message.revision !== revision) return;
      if (message.source.length > RUNTIME_LIMITS.sourceBytes || JSON.stringify(message.props).length > RUNTIME_LIMITS.propsBytes) return;
      activeRequestId = message.requestId;
      const logs: string[] = [];
      const originalLog = console.log;
      const originalError = console.error;
      let renderCount = 0;
      try {
        console.log = (...args) => { if (logs.length < RUNTIME_LIMITS.consoleEntries) logs.push(args.map(String).join(" ").slice(0, 1000)); };
        console.error = (...args) => { if (logs.length < RUNTIME_LIMITS.consoleEntries) logs.push(args.map(String).join(" ").slice(0, 1000)); };
        const factory = new Function("props", message.source + "\n;return typeof App !== 'undefined' ? App : (typeof Component !== 'undefined' ? Component : null);");
        const Component = factory(message.props);
        if (typeof Component !== "function") throw new Error("React lesson must define an App or Component function.");
        if (!rootHost) throw new Error("React runtime root is unavailable.");
        runtimeWindow.__forgeRoot?.unmount();
        runtimeWindow.__forgeRoot = createRoot(rootHost);
        runtimeWindow.__forgeRoot.render(React.createElement(Component, { ...message.props, onRender: () => { renderCount += 1; } }));
        window.setTimeout(() => {
          post({ type: "runtime:result", protocolVersion: REACT_RUNTIME_PROTOCOL_VERSION, runId, revision, nonce, requestId: message.requestId, dom: rootHost.innerHTML.slice(0, RUNTIME_LIMITS.domBytes), runtimeError: null, console: logs, renderCount });
          activeRequestId = null;
        }, 0);
      } catch (error) {
        post({ type: "runtime:result", protocolVersion: REACT_RUNTIME_PROTOCOL_VERSION, runId, revision, nonce, requestId: message.requestId, dom: "", runtimeError: error instanceof Error ? error.message : String(error), console: logs, renderCount });
        activeRequestId = null;
      } finally { console.log = originalLog; console.error = originalError; }
    };
    const onMessage = (event: MessageEvent<RuntimeExecuteMessage | RuntimeDisposeMessage>) => {
      const message = event.data;
      if (!message || message.protocolVersion !== REACT_RUNTIME_PROTOCOL_VERSION || message.nonce !== nonce) return;
      if (message.type === "runtime:dispose") { runtimeWindow.__forgeDisposed = true; runtimeWindow.__forgeRoot?.unmount(); window.removeEventListener("message", onMessage); return; }
      if (message.type === "runtime:execute") execute(message);
    };
    window.addEventListener("message", onMessage);
    post({ type: "runtime:ready", protocolVersion: REACT_RUNTIME_PROTOCOL_VERSION, runId, revision, nonce });
    return () => { runtimeWindow.__forgeDisposed = true; runtimeWindow.__forgeRoot?.unmount(); window.removeEventListener("message", onMessage); };
  }, []);
  return <div id="root" />;
}
