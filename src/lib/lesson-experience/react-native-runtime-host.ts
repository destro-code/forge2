import {
  createEvidenceEnvelope,
  type EvidenceEnvelope,
  type EvidenceItem,
  type RuntimeFamily,
} from "./contracts";

export type NativePlatform = "ios" | "android";
export type NativeAction = {
  type: "press" | "text-change" | "focus" | "blur" | "scroll";
  targetId: string;
  value?: string;
};
export type NativeNode = {
  id: string;
  type: string;
  props: Record<string, string | number | boolean>;
  children?: NativeNode[];
  layout: { x: number; y: number; width: number; height: number };
  accessibility?: { role: string; label: string; enabled?: boolean; focusable?: boolean };
};
export type NativeScenario = {
  id: string;
  version: 1;
  screen: { width: number; height: number; scale: number };
  root: NativeNode;
  initialState: Record<string, string | number | boolean>;
  transitions: Array<{ action: NativeAction; state: Record<string, string | number | boolean> }>;
};
export const REACT_NATIVE_HOST_ID = "react-native-declarative-simulator";
export type NativeRun = {
  runId: string;
  revision: number;
  status: "succeeded" | "unavailable" | "disposed";
  evidence: EvidenceEnvelope;
};

function flatten(node: NativeNode, parentId?: string): Array<NativeNode & { parentId?: string }> {
  return [
    { ...node, ...(parentId ? { parentId } : {}) },
    ...(node.children ?? []).flatMap((child) => flatten(child, node.id)),
  ];
}
function idFor(scenario: string, revision: number) {
  return `${scenario}-run-${revision}`;
}
export class ReactNativeRuntimeHost {
  readonly family: RuntimeFamily = "mobile-native";
  readonly runtimeVersion = 1;
  private revision = 0;
  private disposed = false;
  private state: Record<string, string | number | boolean> = {};
  constructor(
    private readonly scenario: NativeScenario,
    private readonly platform: NativePlatform = "ios",
  ) {
    this.state = { ...scenario.initialState };
  }
  run(): NativeRun {
    if (this.disposed)
      return this.result("disposed", [
        {
          kind: "native-unavailable",
          code: "DISPOSED",
          message: "Runtime host has been disposed.",
        },
      ]);
    this.revision += 1;
    const runId = idFor(this.scenario.id, this.revision);
    const nodes = flatten(this.scenario.root);
    const items = [
      {
        kind: "native-platform" as const,
        platform: this.platform,
        profile: "deterministic-device",
        screen: this.scenario.screen,
      },
      ...nodes.flatMap((node) => [
        {
          kind: "native-tree" as const,
          id: node.id,
          type: node.type,
          props: node.props,
          children: (node.children ?? []).map((c) => c.id),
          ...(node.parentId ? { parentId: node.parentId } : {}),
        },
        { kind: "native-layout" as const, id: node.id, ...node.layout },
        ...(node.accessibility
          ? [
              {
                kind: "native-accessibility" as const,
                id: node.id,
                ...node.accessibility,
                enabled: node.accessibility.enabled ?? true,
                focusable: node.accessibility.focusable ?? false,
              },
            ]
          : []),
      ]),
      ...Object.entries(this.state).map(([key, value]) => ({
        kind: "native-state" as const,
        key,
        value,
      })),
    ];
    return {
      runId,
      revision: this.revision,
      status: "succeeded",
      evidence: this.envelope(runId, items),
    };
  }
  act(action: NativeAction): NativeRun {
    if (this.disposed)
      return this.result("disposed", [
        {
          kind: "native-unavailable",
          code: "DISPOSED",
          message: "Runtime host has been disposed.",
        },
      ]);
    const transition = this.scenario.transitions.find(
      (item) =>
        item.action.type === action.type &&
        item.action.targetId === action.targetId &&
        (item.action.value === undefined || item.action.value === action.value),
    );
    if (!transition)
      return this.result("unavailable", [
        {
          kind: "native-unavailable",
          code: "UNSUPPORTED_ACTION",
          message: "The declared scenario has no matching transition.",
        },
      ]);
    const previous = { ...this.state };
    this.state = { ...this.state, ...transition.state };
    this.revision += 1;
    const runId = idFor(this.scenario.id, this.revision);
    const items = [
      { kind: "native-event" as const, type: action.type, targetId: action.targetId, order: 0 },
      ...Object.entries(this.state)
        .filter(([key, value]) => previous[key] !== value)
        .map(([key, value]) => ({
          kind: "native-state" as const,
          key,
          value,
          previous: previous[key],
        })),
    ];
    return {
      runId,
      revision: this.revision,
      status: "succeeded",
      evidence: this.envelope(runId, items),
    };
  }
  reset() {
    this.state = { ...this.scenario.initialState };
    this.revision += 1;
    return this.run();
  }
  dispose() {
    this.disposed = true;
    this.revision += 1;
  }
  private envelope(runId: string, items: EvidenceItem[]): EvidenceEnvelope {
    return createEvidenceEnvelope({
      runId,
      revision: this.revision,
      family: "mobile-native",
      phase: "observe",
      timestamp: Date.now(),
      status: "complete",
      source: { host: REACT_NATIVE_HOST_ID, artifactIds: [] },
      items,
    });
  }
  private result(status: NativeRun["status"], items: EvidenceItem[]): NativeRun {
    const runId = idFor(this.scenario.id, this.revision);
    return { runId, revision: this.revision, status, evidence: this.envelope(runId, items) };
  }
}
