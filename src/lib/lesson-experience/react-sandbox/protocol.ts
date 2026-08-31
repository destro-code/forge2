export const REACT_RUNTIME_PROTOCOL_VERSION = 1 as const;

export type RuntimeIdentity = {
  protocolVersion: typeof REACT_RUNTIME_PROTOCOL_VERSION;
  runId: string;
  revision: number;
  nonce: string;
};
export type RuntimeReadyMessage = RuntimeIdentity & { type: "runtime:ready" };
export type RuntimeExecuteMessage = RuntimeIdentity & { type: "runtime:execute"; requestId: string; source: string; props: Record<string, unknown> };
export type RuntimeResultMessage = RuntimeIdentity & { type: "runtime:result"; requestId: string; dom: string; runtimeError: string | null; console: string[]; renderCount: number; networkAttempts: string[]; parentAccess: string[] };
export type RuntimeErrorMessage = RuntimeIdentity & { type: "runtime:error"; requestId?: string; message: string };
export type RuntimeDisposeMessage = RuntimeIdentity & { type: "runtime:dispose" };
export type RuntimeResetMessage = RuntimeIdentity & { type: "runtime:reset"; requestId: string };
export type RuntimeInteractMessage = RuntimeIdentity & { type: "runtime:interact"; requestId: string; target: string };
export type RuntimeMessage = RuntimeReadyMessage | RuntimeResultMessage | RuntimeErrorMessage;
export type ParentRuntimeMessage = RuntimeExecuteMessage | RuntimeDisposeMessage | RuntimeResetMessage | RuntimeInteractMessage;
export const RUNTIME_LIMITS = { sourceBytes: 100_000, propsBytes: 32_000, messageBytes: 150_000, domBytes: 12_000, consoleBytes: 4_000, consoleEntries: 50, networkEntries: 20, timeoutMs: 3_000, idBytes: 256 } as const;
export function encodedBytes(value: unknown) { try { return new TextEncoder().encode(JSON.stringify(value)).byteLength; } catch { return Number.POSITIVE_INFINITY; } }
export function isRuntimeIdentity(value: unknown): value is RuntimeIdentity { if (!value || typeof value !== "object") return false; const item = value as RuntimeIdentity; return item.protocolVersion === REACT_RUNTIME_PROTOCOL_VERSION && typeof item.runId === "string" && item.runId.length > 0 && encodedBytes(item.runId) <= RUNTIME_LIMITS.idBytes && Number.isSafeInteger(item.revision) && item.revision >= 0 && typeof item.nonce === "string" && item.nonce.length > 0 && encodedBytes(item.nonce) <= RUNTIME_LIMITS.idBytes; }
export function isProtocolMessage(value: unknown): value is RuntimeMessage { return isRuntimeIdentity(value) && typeof (value as RuntimeMessage).type === "string"; }
export function isJsonProps(value: unknown): value is Record<string, unknown> { const seen = new WeakSet<object>(); const visit = (item: unknown): boolean => { if (typeof item === "function" || typeof item === "bigint" || typeof item === "symbol" || item instanceof Date || item instanceof RegExp) return false; if (!item || typeof item !== "object") return true; if (seen.has(item)) return false; seen.add(item); return Object.values(item).every(visit); }; if (!value || typeof value !== "object" || Array.isArray(value) || encodedBytes(value) > RUNTIME_LIMITS.propsBytes || !visit(value)) return false; try { JSON.stringify(value); return true; } catch { return false; } }
export function isParentRuntimeMessage(value: unknown): value is ParentRuntimeMessage { if (!isRuntimeIdentity(value) || typeof (value as ParentRuntimeMessage).type !== "string") return false; const item = value as ParentRuntimeMessage; if (item.type === "runtime:dispose") return true; if (item.type === "runtime:reset") return typeof (item as RuntimeResetMessage).requestId === "string"; if (typeof (item as { requestId?: unknown }).requestId !== "string" || encodedBytes((item as { requestId: string }).requestId) > RUNTIME_LIMITS.idBytes) return false; if (item.type === "runtime:interact") return typeof (item as RuntimeInteractMessage).target === "string" && /^[A-Za-z][\w-]{0,63}$/.test((item as RuntimeInteractMessage).target); if (item.type === "runtime:execute") return typeof (item as RuntimeExecuteMessage).source === "string" && encodedBytes((item as RuntimeExecuteMessage).source) <= RUNTIME_LIMITS.sourceBytes && isJsonProps((item as RuntimeExecuteMessage).props); return false; }

export type { RuntimeIdentity as RuntimeEnvelope };
