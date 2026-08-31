import Babel from "@babel/standalone";
import reactBundle from "../compiler/vendor/react.development.js?raw";
import reactDomBundle from "../compiler/vendor/react-dom.development.js?raw";
import type { EvidenceEnvelope, ExecutionMetadata, RuntimeFamilyDescriptor } from "./contracts";
export interface ReactRunRequest {
  source: string;
  revision?: number;
  runId?: string;
  props?: Record<string, unknown>;
  timeoutMs?: number;
}
export interface ReactTreeNode {
  name: string;
  props: Record<string, unknown>;
  children: ReactTreeNode[];
}
export interface ReactRunResult {
  execution: ExecutionMetadata;
  root: ReactTreeNode | null;
  dom: string;
  runtimeError: string | null;
  console: readonly string[];
  renderCount: number;
  evidence: EvidenceEnvelope;
}
export const REACT_COMPONENT_BROWSER_DESCRIPTOR: RuntimeFamilyDescriptor = {
  family: "component-browser",
  version: 1,
  security: "browser-sandbox",
  capabilities: [
    { name: "execute.react", version: 1 },
    { name: "render.dom", version: 1 },
    { name: "inspect.dom", version: 1 },
    { name: "inspect.component-tree", version: 1 },
    { name: "inspect.render-trace", version: 1 },
    { name: "inspect.console", version: 1 },
  ],
};
export const REACT_RUNTIME_PROTOCOL_VERSION = 1 as const;
export const REACT_RUNTIME_LIMITS = {
  sourceBytes: 100_000,
  propsBytes: 32_000,
  domBytes: 12_000,
  consoleBytes: 4_000,
  consoleEntries: 50,
  timeoutMs: 3_000,
} as const;
let revision = 0;
export function resetReactRevision() {
  revision += 1;
  return revision;
}
export function isCurrentReactRun(runRevision: number) {
  return runRevision === revision;
}
function boundedProps(value: Record<string, unknown>) {
  try {
    const serialized = JSON.stringify(value, (_key, item) =>
      typeof item === "function" ? "[function]" : item,
    );
    if (
      !serialized ||
      new TextEncoder().encode(serialized).byteLength > REACT_RUNTIME_LIMITS.propsBytes
    )
      return null;
    return JSON.parse(serialized) as Record<string, unknown>;
  } catch {
    return null;
  }
}
function makeEvidence(
  runId: string,
  runRevision: number,
  result: Pick<ReactRunResult, "dom" | "runtimeError" | "console" | "renderCount">,
): EvidenceEnvelope {
  return {
    schemaVersion: 1,
    runId,
    revision: runRevision,
    family: "component-browser",
    phase: "observe",
    timestamp: Date.now(),
    status: result.runtimeError ? "partial" : "complete",
    source: { host: "isolated-iframe", artifactIds: [] },
    items: [
      { kind: "dom-snapshot", html: result.dom.slice(0, REACT_RUNTIME_LIMITS.domBytes) },
      {
        kind: "console",
        level: "log",
        message: result.console.join("\n").slice(0, REACT_RUNTIME_LIMITS.consoleBytes),
      },
      ...(result.runtimeError
        ? [{ kind: "runtime-error" as const, message: result.runtimeError.slice(0, 1000) }]
        : []),
      { kind: "js-value", expression: "renderCount", value: result.renderCount },
    ],
  };
}
interface RuntimeResponse {
  type: "runtime:result";
  protocolVersion: 1;
  runId: string;
  revision: number;
  dom: string;
  runtimeError: string | null;
  console: string[];
  renderCount: number;
}
function iframeDocument() {
  const react = reactBundle.replace(/<\/script/gi, "<\\/script");
  const dom = reactDomBundle.replace(/<\/script/gi, "<\\/script");
  return `<!doctype html><html><body><div id="root"></div><script>${react}</script><script>${dom}</script><script>window.fetch=undefined;window.XMLHttpRequest=undefined;window.WebSocket=undefined;window.EventSource=undefined;window.sendBeacon=undefined;window.addEventListener("message",async(event)=>{const m=event.data;if(!m||m.protocolVersion!==1||m.type!=="runtime:execute"||typeof m.source!=="string")return;const logs=[];const oldLog=console.log,oldError=console.error;console.log=(...a)=>{if(logs.length<50)logs.push(a.map(String).join(" ").slice(0,1000))};console.error=(...a)=>{if(logs.length<50)logs.push(a.map(String).join(" ").slice(0,1000))};let dom="",runtimeError=null,renderCount=0;try{const factory=new Function("props","onRender",m.source+"\\n;return typeof App!=="undefined"?App:(typeof Component!=="undefined"?Component:null);");const C=factory(m.props||{},()=>renderCount++);if(typeof C!=="function")throw new Error("React lesson must define an App or Component function.");const host=document.getElementById("root");host.replaceChildren();window.ReactDOM.createRoot(host).render(window.React.createElement(C,Object.assign({},m.props||{},{onRender:()=>renderCount++})));await new Promise(r=>setTimeout(r,0));dom=host.innerHTML.slice(0,12000)}catch(error){runtimeError=error instanceof Error?error.message:String(error)}finally{console.log=oldLog;console.error=oldError}parent.postMessage({type:"runtime:result",protocolVersion:1,runId:m.runId,revision:m.revision,dom,runtimeError,console:logs,renderCount},"*")});</script></body></html>`;
}
export function runReactComponent(request: ReactRunRequest): Promise<ReactRunResult | null> {
  const runRevision = request.revision ?? resetReactRevision();
  if (!isCurrentReactRun(runRevision)) return Promise.resolve(null);
  const runId = request.runId ?? `react-${runRevision}`;
  const props = boundedProps(request.props ?? {});
  if (
    new TextEncoder().encode(request.source).byteLength > REACT_RUNTIME_LIMITS.sourceBytes ||
    !props
  )
    return Promise.resolve(null);
  const timeout = Math.min(
    request.timeoutMs ?? REACT_RUNTIME_LIMITS.timeoutMs,
    REACT_RUNTIME_LIMITS.timeoutMs,
  );
  let transformed: string;
  try {
    transformed = Babel.transform(request.source, {
      presets: [["react", { runtime: "classic" }], "typescript"],
      filename: "lesson.tsx",
    }).code;
  } catch {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const iframe = document.createElement("iframe");
    iframe.setAttribute("sandbox", "allow-scripts");
    iframe.srcdoc = iframeDocument();
    let settled = false;
    const finish = (
      response: RuntimeResponse | null,
      status: "succeeded" | "failed" | "timeout",
    ) => {
      if (settled) return;
      settled = true;
      window.removeEventListener("message", onMessage);
      iframe.remove();
      const runtimeError =
        response?.runtimeError ?? (status === "timeout" ? "React execution timed out." : null);
      const result = {
        execution: {
          schemaVersion: 1,
          runId,
          revision: runRevision,
          family: "component-browser" as const,
          phase: "run" as const,
          status,
          startedAt,
          completedAt: Date.now(),
          artifacts: [],
          ...(runtimeError ? { error: runtimeError } : {}),
        },
        root: null,
        dom: response?.dom ?? "",
        runtimeError,
        console: response?.console ?? [],
        renderCount: response?.renderCount ?? 0,
        evidence: {} as EvidenceEnvelope,
      };
      result.evidence = makeEvidence(runId, runRevision, result);
      resolve(result);
    };
    const onMessage = (event: MessageEvent<RuntimeResponse>) => {
      const m = event.data;
      if (
        event.source !== iframe.contentWindow ||
        m?.type !== "runtime:result" ||
        m.protocolVersion !== 1 ||
        m.runId !== runId ||
        m.revision !== runRevision
      )
        return;
      finish(m, m.runtimeError ? "failed" : "succeeded");
    };
    window.addEventListener("message", onMessage);
    iframe.addEventListener("load", () =>
      iframe.contentWindow?.postMessage(
        {
          type: "runtime:execute",
          protocolVersion: 1,
          runId,
          revision: runRevision,
          source: transformed,
          props,
        },
        "*",
      ),
    );
    document.body.appendChild(iframe);
    window.setTimeout(() => finish(null, "timeout"), timeout);
  });
}
