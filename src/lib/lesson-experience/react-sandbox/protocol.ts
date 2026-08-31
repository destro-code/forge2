export const REACT_RUNTIME_PROTOCOL_VERSION = 1 as const;

export type RuntimeReadyMessage = {
  type: "runtime:ready";
  protocolVersion: typeof REACT_RUNTIME_PROTOCOL_VERSION;
  runId: string;
  revision: number;
  nonce: string;
};

export type RuntimeExecuteMessage = {
  type: "runtime:execute";
  protocolVersion: typeof REACT_RUNTIME_PROTOCOL_VERSION;
  runId: string;
  revision: number;
  nonce: string;
  requestId: string;
  source: string;
  props: Record<string, unknown>;
};

export type RuntimeResultMessage = {
  type: "runtime:result";
  protocolVersion: typeof REACT_RUNTIME_PROTOCOL_VERSION;
  runId: string;
  revision: number;
  nonce: string;
  requestId: string;
  dom: string;
  runtimeError: string | null;
  console: string[];
  renderCount: number;
};

export type RuntimeErrorMessage = {
  type: "runtime:error";
  protocolVersion: typeof REACT_RUNTIME_PROTOCOL_VERSION;
  runId: string;
  revision: number;
  nonce: string;
  requestId?: string;
  message: string;
};

export type RuntimeDisposeMessage = {
  type: "runtime:dispose";
  protocolVersion: typeof REACT_RUNTIME_PROTOCOL_VERSION;
  runId: string;
  revision: number;
  nonce: string;
};

export type RuntimeMessage =
  | RuntimeReadyMessage
  | RuntimeResultMessage
  | RuntimeErrorMessage;
export type ParentRuntimeMessage = RuntimeExecuteMessage | RuntimeDisposeMessage;

export const RUNTIME_LIMITS = {
  sourceBytes: 100_000,
  propsBytes: 32_000,
  messageBytes: 150_000,
  domBytes: 12_000,
  consoleBytes: 4_000,
  consoleEntries: 50,
  timeoutMs: 3_000,
} as const;

export function isProtocolMessage(value: unknown): value is RuntimeMessage {
  return Boolean(
    value &&
      typeof value === "object" &&
      (value as { protocolVersion?: unknown }).protocolVersion === REACT_RUNTIME_PROTOCOL_VERSION,
  );
}

export function encodedBytes(value: unknown) {
  try {
    return new TextEncoder().encode(JSON.stringify(value)).byteLength;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}
