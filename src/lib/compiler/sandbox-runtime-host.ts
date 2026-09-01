export const CANONICAL_IFRAME_SANDBOX = "allow-scripts allow-modals" as const;
export const PLAYGROUND_PREVIEW_TITLE = "Forge Playground Live Preview" as const;

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
      console.log("[v0][sandbox-runtime] message", {
        type: data?.type,
        hostRevision: this.revision,
        messageRevision: data?.workspaceRevision,
        sourceMatches,
        revisionMatches,
        accepted: !this.disposed && sourceMatches && revisionMatches,
      });
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
