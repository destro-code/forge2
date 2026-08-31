import Babel from "@babel/standalone";
import type { EvidenceEnvelope, ExecutionMetadata, RuntimeFamilyDescriptor } from "./contracts";
import { REACT_RUNTIME_PROTOCOL_VERSION, RUNTIME_LIMITS, encodedBytes, type RuntimeMessage, type RuntimeResultMessage } from "./react-sandbox/protocol";

export interface ReactRunRequest { source: string; revision?: number; runId?: string; props?: Record<string, unknown>; timeoutMs?: number; }
export interface ReactTreeNode { name: string; props: Record<string, unknown>; children: ReactTreeNode[]; }
export interface ReactRunResult { execution: ExecutionMetadata; root: ReactTreeNode | null; dom: string; runtimeError: string | null; console: readonly string[]; renderCount: number; evidence: EvidenceEnvelope; }
export const REACT_COMPONENT_BROWSER_DESCRIPTOR: RuntimeFamilyDescriptor = { family: "component-browser", version: 1, security: "browser-sandbox", capabilities: [{ name: "execute.react", version: 1 }, { name: "render.dom", version: 1 }, { name: "inspect.dom", version: 1 }, { name: "inspect.component-tree", version: 1 }, { name: "inspect.render-trace", version: 1 }, { name: "inspect.console", version: 1 }] };
export { REACT_RUNTIME_PROTOCOL_VERSION, RUNTIME_LIMITS };
let revision = 0;
export function resetReactRevision() { revision += 1; return revision; }
export function isCurrentReactRun(runRevision: number) { return runRevision === revision; }
function boundedProps(value: Record<string, unknown>) { try { const serialized = JSON.stringify(value, (_key, item) => typeof item === "function" ? "[function]" : item); if (!serialized || encodedBytes(value) > RUNTIME_LIMITS.propsBytes) return null; return JSON.parse(serialized) as Record<string, unknown>; } catch { return null; } }
function makeEvidence(runId: string, runRevision: number, result: Pick<ReactRunResult, "dom" | "runtimeError" | "console" | "renderCount">): EvidenceEnvelope { return { schemaVersion: 1, runId, revision: runRevision, family: "component-browser", phase: "observe", timestamp: Date.now(), status: result.runtimeError ? "partial" : "complete", source: { host: "isolated-iframe", artifactIds: [] }, items: [{ kind: "dom-snapshot", html: result.dom.slice(0, RUNTIME_LIMITS.domBytes) }, { kind: "console", level: "log", message: result.console.join("\n").slice(0, RUNTIME_LIMITS.consoleBytes) }, ...(result.runtimeError ? [{ kind: "runtime-error" as const, message: result.runtimeError.slice(0, 1000) }] : []), { kind: "js-value", expression: "renderCount", value: result.renderCount }] }; }
function runtimeUrl(nonce: string, runId: string, runRevision: number) { const query = new URLSearchParams({ nonce, runId, revision: String(runRevision) }); return `/dev/react-runtime?${query.toString()}`; }

export function runReactComponent(request: ReactRunRequest): Promise<ReactRunResult | null> {
  const runRevision = request.revision ?? resetReactRevision();
  if (!isCurrentReactRun(runRevision) || encodedBytes(request.source) > RUNTIME_LIMITS.sourceBytes) return Promise.resolve(null);
  const runId = request.runId ?? `react-${runRevision}`;
  const nonce = crypto.randomUUID();
  const requestId = crypto.randomUUID();
  const props = boundedProps(request.props ?? {});
  if (!props) return Promise.resolve(null);
  let transformed: string;
  try { transformed = Babel.transform(request.source, { presets: [["react", { runtime: "classic" }], "typescript"], filename: "lesson.tsx" }).code ?? ""; } catch { return Promise.resolve(null); }
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const iframe = document.createElement("iframe");
    iframe.setAttribute("sandbox", "allow-scripts");
    iframe.title = "Isolated React lesson runtime";
    iframe.src = runtimeUrl(nonce, runId, runRevision);
    let settled = false;
    let ready = false;
    const finish = (response: RuntimeResultMessage | null, status: "succeeded" | "failed" | "timeout") => {
      if (settled) return;
      settled = true;
      const dispose = { type: "runtime:dispose", protocolVersion: REACT_RUNTIME_PROTOCOL_VERSION, runId, revision: runRevision, nonce } as const;
      iframe.contentWindow?.postMessage(dispose, "*");
      window.removeEventListener("message", onMessage);
      iframe.remove();
      const runtimeError = response?.runtimeError ?? (status === "timeout" ? "React execution timed out." : null);
      const result: ReactRunResult = { execution: { schemaVersion: 1, runId, revision: runRevision, family: "component-browser" as const, phase: "run" as const, status, startedAt, completedAt: Date.now(), artifacts: [], ...(runtimeError ? { error: runtimeError } : {}) }, root: null, dom: response?.dom ?? "", runtimeError, console: response?.console ?? [], renderCount: response?.renderCount ?? 0, evidence: {} as EvidenceEnvelope };
      result.evidence = makeEvidence(runId, runRevision, result);
      resolve(result);
    };
    const execute = { type: "runtime:execute", protocolVersion: REACT_RUNTIME_PROTOCOL_VERSION, runId, revision: runRevision, nonce, requestId, source: transformed, props } as const;
    const sendExecute = () => { if (ready && iframe.contentWindow && !settled) iframe.contentWindow.postMessage(execute, "*"); };
    function onMessage(event: MessageEvent<RuntimeMessage>) { const message = event.data; if (!message || message.protocolVersion !== REACT_RUNTIME_PROTOCOL_VERSION || message.runId !== runId || message.revision !== runRevision || message.nonce !== nonce) return; if (message.type === "runtime:ready") { ready = true; sendExecute(); } else if (message.type === "runtime:result" && message.requestId === requestId && ready) finish(message, message.runtimeError ? "failed" : "succeeded"); }
    window.addEventListener("message", onMessage);
    document.body.appendChild(iframe);
    window.setTimeout(() => finish(null, "timeout"), Math.min(request.timeoutMs ?? RUNTIME_LIMITS.timeoutMs, RUNTIME_LIMITS.timeoutMs));
  });
}
