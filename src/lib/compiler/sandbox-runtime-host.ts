export const CANONICAL_IFRAME_SANDBOX = "allow-scripts allow-modals" as const;
export const PLAYGROUND_PREVIEW_TITLE = "Forge Playground Live Preview" as const;

import { emitRuntimeDebugEvent } from "@/lib/debug/runtime-debug-sink";

function serializeMessageData(data: unknown): string {
  try {
    return JSON.stringify(data, (_key, value) => {
      if (typeof value === "bigint") return `${value}n`;
      if (typeof value === "function") return `[Function${value.name ? ` ${value.name}` : ""}]`;
      if (typeof value === "symbol") return value.toString();
      return value;
    });
  } catch {
    try {
      return String(data);
    } catch {
      return "[Unserializable message data]";
    }
  }
}

export interface SandboxRuntimeHostOptions {
  iframe: HTMLIFrameElement;
  workspaceRevision: number;
  onMessage: (event: MessageEvent) => void;
}

/** Listener lifecycle and authenticity filter for one active playground iframe. */
export class SandboxRuntimeHost {
  private readonly iframe: HTMLIFrameElement;
  private readonly revision: number;
  private readonly listener: (event: MessageEvent) => void;
  private disposed = false;

  constructor(options: SandboxRuntimeHostOptions) {
    this.iframe = options.iframe;
    this.revision = options.workspaceRevision;
    this.listener = (event) => {
      const data = event.data as { type?: unknown; workspaceRevision?: unknown } | null;
      const sourceMatches = event.source === this.iframe.contentWindow;
      const revisionMatches = data?.workspaceRevision === this.revision;
      const accepted = !this.disposed && sourceMatches && revisionMatches;
      const messageType = String(data?.type ?? "unknown");
      const protocolData =
        messageType === "unknown" || !revisionMatches
          ? ` data=${serializeMessageData(event.data)}`
          : "";
      emitRuntimeDebugEvent(
        "MESSAGE",
        `${messageType} hostRevision=${this.revision} messageRevision=${String(data?.workspaceRevision ?? "missing")} sourceMatches=${sourceMatches} revisionMatches=${revisionMatches} accepted=${accepted}${protocolData}`,
      );
      if (this.disposed || !sourceMatches) return;
      const messageRevision = data?.workspaceRevision;
      // Every protocol message must carry the revision owned by this host. Messages
      // without an identity are not trusted because they may be delayed stale events.
      if (messageRevision !== this.revision) return;
      options.onMessage(event);
    };
  }

  mount(target: Window = window): void {
    if (this.disposed) return;
    this.iframe.setAttribute("sandbox", CANONICAL_IFRAME_SANDBOX);
    target.addEventListener("message", this.listener);
  }

  dispose(target: Window = window): void {
    if (this.disposed) return;
    this.disposed = true;
    target.removeEventListener("message", this.listener);
  }

  get isDisposed(): boolean {
    return this.disposed;
  }
}
