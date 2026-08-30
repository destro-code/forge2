import type {
  CapabilityRequirement,
  EvidenceEnvelope,
  EvidenceItem,
  ExecutionMetadata,
  RuntimeRequest,
} from "./contracts";
import { BROWSER_DOCUMENT_DESCRIPTOR, createEvidenceEnvelope } from "./contracts";

export const BROWSER_EVIDENCE_LIMITS = {
  maxItems: 100,
  maxMessageLength: 2000,
  maxDomSnapshotLength: 8000,
  maxTraceEvents: 100,
} as const;

export interface BrowserRuntimeMessage {
  type?: string;
  workspaceRevision?: number;
  runId?: string;
  level?: "log" | "info" | "warn" | "error";
  message?: unknown;
  html?: unknown;
  target?: unknown;
  property?: unknown;
  value?: unknown;
  error?: { name?: unknown; message?: unknown; line?: unknown; column?: unknown };
  report?: unknown;
}

export interface BrowserRuntimeResult {
  runId: string;
  revision: number;
  lifecycle: ExecutionMetadata["status"];
  evidence: EvidenceEnvelope;
}

const bounded = (value: unknown, limit: number): string => String(value ?? "").slice(0, limit);

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export function browserCapabilities(): readonly CapabilityRequirement[] {
  return BROWSER_DOCUMENT_DESCRIPTOR.capabilities;
}

export function browserMessageToEvidence(message: BrowserRuntimeMessage): EvidenceItem | null {
  switch (message.type) {
    case "CONSOLE_OUTPUT":
    case "PLAYGROUND_CONSOLE":
      return {
        kind: "console",
        level: message.level ?? "log",
        message: bounded(message.message, BROWSER_EVIDENCE_LIMITS.maxMessageLength),
      };
    case "RUNTIME_ERROR":
    case "PLAYGROUND_RUNTIME_ERROR": {
      const error = isObject(message.error) ? message.error : message;
      return {
        kind: "runtime-error",
        message: bounded(error.message, BROWSER_EVIDENCE_LIMITS.maxMessageLength),
      };
    }
    case "DOM_SNAPSHOT":
      return {
        kind: "dom-snapshot",
        html: bounded(message.html, BROWSER_EVIDENCE_LIMITS.maxDomSnapshotLength),
      };
    case "COMPUTED_STYLE":
      return {
        kind: "computed-style",
        target: bounded(message.target, 200),
        property: bounded(message.property, 200),
        value: bounded(message.value, 500),
      };
    default:
      return null;
  }
}

export function createBrowserEvidence(
  input: Omit<EvidenceEnvelope, "schemaVersion" | "items" | "family"> & {
    items?: readonly EvidenceItem[];
  },
): EvidenceEnvelope {
  return createEvidenceEnvelope({
    ...input,
    family: "browser-document",
    items: (input.items ?? []).slice(0, BROWSER_EVIDENCE_LIMITS.maxItems),
  });
}

export class BrowserFamilyAdapter {
  private readonly host: string;
  private readonly request: RuntimeRequest;
  private runSequence = 0;
  private revision = 0;
  private disposed = false;

  constructor(
    host: string,
    request: RuntimeRequest = {
      family: "browser-document",
      deterministic: true,
      network: "deny",
      timeoutMs: 10000,
    },
  ) {
    this.host = host;
    this.request = request;
  }

  beginRun(): { runId: string; revision: number } {
    if (this.disposed) throw new Error("Browser family adapter is disposed.");
    this.revision += 1;
    return { runId: `browser-run-${++this.runSequence}`, revision: this.revision };
  }

  collect(
    runId: string,
    revision: number,
    messages: readonly BrowserRuntimeMessage[],
    status: BrowserRuntimeResult["lifecycle"] = "succeeded",
  ): BrowserRuntimeResult {
    if (revision !== this.revision) {
      return {
        runId,
        revision,
        lifecycle: "failed",
        evidence: createBrowserEvidence({
          runId,
          revision,
          phase: "observe",
          timestamp: Date.now(),
          status: "unavailable",
          source: { host: this.host, artifactIds: [] },
          items: [],
        }),
      };
    }
    const items = messages
      .map(browserMessageToEvidence)
      .filter((item): item is EvidenceItem => item !== null);
    return {
      runId,
      revision,
      lifecycle: status,
      evidence: createBrowserEvidence({
        runId,
        revision,
        phase: "observe",
        timestamp: Date.now(),
        status: status === "succeeded" ? "complete" : "partial",
        source: { host: this.host, artifactIds: [] },
        items,
      }),
    };
  }

  reset(): { revision: number } {
    this.revision += 1;
    return { revision: this.revision };
  }

  dispose(): void {
    this.disposed = true;
  }
  get timeoutMs(): number {
    return this.request.timeoutMs;
  }
  get currentRevision(): number {
    return this.revision;
  }
}

export function isCurrentBrowserRun(adapter: BrowserFamilyAdapter, revision: number): boolean {
  return adapter.currentRevision === revision;
}
