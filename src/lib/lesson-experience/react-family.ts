import * as React from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import Babel from "@babel/standalone";
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
  family: "react-component-browser",
  security: "sandboxed-browser",
  capabilities: [
    "render.dom",
    "inspect.dom",
    "inspect.component-tree",
    "inspect.props",
    "inspect.state",
    "inspect.render-commit",
    "observe.runtime-error",
    "observe.console",
  ],
  incompatibleWith: ["server-only", "native-device"],
};

let revision = 0;
export function resetReactRevision() {
  revision += 1;
  return revision;
}
export function isCurrentReactRun(runRevision: number) {
  return runRevision === revision;
}

function safeProps(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== "children")
      .map(([key, item]) => [key, typeof item === "function" ? "[function]" : item]),
  );
}
function treeFromDom(element: Element): ReactTreeNode {
  return {
    name: element.getAttribute("data-component") || element.tagName.toLowerCase(),
    props: safeProps({
      ...Object.fromEntries([...element.attributes].map((a) => [a.name, a.value])),
    }),
    children: [...element.children].map(treeFromDom),
  };
}
function evidence(
  runId: string,
  runRevision: number,
  result: Pick<ReactRunResult, "dom" | "runtimeError" | "console" | "renderCount">,
): EvidenceEnvelope {
  return {
    schemaVersion: 1,
    runId,
    revision: runRevision,
    family: "react-component-browser",
    phase: "observe",
    timestamp: Date.now(),
    status: result.runtimeError ? "failed" : "succeeded",
    source: { host: "ReactDOM.createRoot", artifactIds: [] },
    items: [
      { kind: "dom-snapshot", code: "root", message: result.dom.slice(0, 12000) },
      { kind: "console", code: "console", message: result.console.join("\n").slice(0, 4000) },
      ...(result.runtimeError
        ? [{ kind: "runtime-error" as const, code: "render", message: result.runtimeError }]
        : []),
      { kind: "render-commit", code: "render-count", message: String(result.renderCount) },
    ],
  };
}

export function runReactComponent(request: ReactRunRequest): ReactRunResult | null {
  const runRevision = request.revision ?? resetReactRevision();
  if (!isCurrentReactRun(runRevision)) return null;
  const runId = request.runId ?? `react-${runRevision}`;
  const startedAt = Date.now();
  const execution: ExecutionMetadata = {
    schemaVersion: 1,
    runId,
    revision: runRevision,
    family: "react-component-browser",
    phase: "run",
    status: "running",
    startedAt,
    artifacts: [],
  };
  const host = document.createElement("div");
  const logs: string[] = [];
  let runtimeError: string | null = null;
  let renderCount = 0;
  const originalLog = console.log;
  const originalError = console.error;
  console.log = (...args) => {
    logs.push(args.map(String).join(" ").slice(0, 1000));
  };
  console.error = (...args) => {
    logs.push(args.map(String).join(" ").slice(0, 1000));
  };
  try {
    const transformed = Babel.transform(request.source, {
      presets: [["react", { runtime: "classic" }], "typescript"],
      filename: "lesson.tsx",
    }).code;
    const factory = new Function(
      "React",
      "props",
      "onRender",
      `${transformed}\n;return typeof App !== "undefined" ? App : (typeof Component !== "undefined" ? Component : null);`,
    );
    const Component = factory(React, request.props ?? {}, () => {
      renderCount += 1;
    });
    if (typeof Component !== "function")
      throw new Error("React lesson must define an App or Component function.");
    const root: Root = createRoot(host);
    act(() => {
      root.render(
        React.createElement(Component, {
          ...(request.props ?? {}),
          onRender: () => {
            renderCount += 1;
          },
        }),
      );
    });
    const dom = host.innerHTML.slice(0, 12000);
    const tree = host.firstElementChild ? treeFromDom(host.firstElementChild) : null;
    root.unmount();
    const result = {
      execution: { ...execution, status: "succeeded" as const, completedAt: Date.now() },
      root: tree,
      dom,
      runtimeError: null,
      console: logs.slice(0, 50),
      renderCount,
      evidence: {} as EvidenceEnvelope,
    };
    result.evidence = evidence(runId, runRevision, result);
    return result;
  } catch (error) {
    runtimeError = error instanceof Error ? error.message : String(error);
    const result = {
      execution: {
        ...execution,
        status: "failed" as const,
        completedAt: Date.now(),
        error: runtimeError,
      },
      root: null,
      dom: host.innerHTML,
      runtimeError,
      console: logs.slice(0, 50),
      renderCount,
      evidence: {} as EvidenceEnvelope,
    };
    result.evidence = evidence(runId, runRevision, result);
    return result;
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }
}
