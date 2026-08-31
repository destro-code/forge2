(() => {
  const protocolVersion = 1;
  const limits = { sourceBytes: 100000, propsBytes: 32000, messageBytes: 150000, domBytes: 12000, consoleEntries: 50 };
  const params = new URLSearchParams(location.search);
  const runId = params.get("runId") || "runtime";
  const revision = Number(params.get("revision") || 0);
  const nonce = params.get("nonce") || "";
  const rootHost = document.getElementById("root");
  let disposed = false;
  let activeRequestId = null;
  let messageCount = 0;
  const post = (message) => {
    if (disposed || ++messageCount > 100 || JSON.stringify(message).length > limits.messageBytes) return;
    parent.postMessage(message, "*");
  };
  const blocked = () => Promise.reject(new Error("Network access is disabled in the React sandbox."));
  for (const [key, value] of [["fetch", blocked], ["XMLHttpRequest", undefined], ["WebSocket", undefined], ["EventSource", undefined]]) {
    try { Object.defineProperty(window, key, { configurable: false, writable: false, value }); } catch {}
  }
  try { Object.defineProperty(navigator, "sendBeacon", { configurable: false, value: () => false }); } catch {}
  const execute = (message) => {
    if (disposed || activeRequestId || message.nonce !== nonce || message.runId !== runId || message.revision !== revision) return;
    if (new TextEncoder().encode(message.source).byteLength > limits.sourceBytes || JSON.stringify(message.props).length > limits.propsBytes) return;
    activeRequestId = message.requestId;
    const logs = [];
    const originalLog = console.log;
    const originalError = console.error;
    let renderCount = 0;
    try {
      console.log = (...args) => { if (logs.length < limits.consoleEntries) logs.push(args.map(String).join(" ").slice(0, 1000)); };
      console.error = (...args) => { if (logs.length < limits.consoleEntries) logs.push(args.map(String).join(" ").slice(0, 1000)); };
      const factory = new Function("props", message.source + "\n;return typeof App !== 'undefined' ? App : (typeof Component !== 'undefined' ? Component : null);");
      const Component = factory(message.props);
      if (typeof Component !== "function") throw new Error("React lesson must define an App or Component function.");
      if (!rootHost) throw new Error("React runtime root is unavailable.");
      window.__forgeRoot?.unmount();
      window.__forgeRoot = ReactDOM.createRoot(rootHost);
      window.__forgeRoot.render(React.createElement(Component, { ...message.props, onRender: () => { renderCount += 1; } }));
      setTimeout(() => {
        post({ type: "runtime:result", protocolVersion, runId, revision, nonce, requestId: message.requestId, dom: rootHost.innerHTML.slice(0, limits.domBytes), runtimeError: null, console: logs, renderCount });
        activeRequestId = null;
      }, 0);
    } catch (error) {
      post({ type: "runtime:result", protocolVersion, runId, revision, nonce, requestId: message.requestId, dom: "", runtimeError: error instanceof Error ? error.message : String(error), console: logs, renderCount });
      activeRequestId = null;
    } finally { console.log = originalLog; console.error = originalError; }
  };
  const onMessage = (event) => {
    const message = event.data;
    if (!message || message.protocolVersion !== protocolVersion || message.nonce !== nonce) return;
    if (message.type === "runtime:dispose") { disposed = true; window.__forgeRoot?.unmount(); removeEventListener("message", onMessage); return; }
    if (message.type === "runtime:execute") execute(message);
  };
  addEventListener("message", onMessage);
  post({ type: "runtime:ready", protocolVersion, runId, revision, nonce });
})();
