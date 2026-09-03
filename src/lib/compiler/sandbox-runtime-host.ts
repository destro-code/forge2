export const CANONICAL_IFRAME_SANDBOX = "allow-scripts allow-modals" as const;
export const PLAYGROUND_PREVIEW_TITLE = "Forge Playground Live Preview" as const;

const FORGE_RUNTIME_MESSAGE_TYPES = new Set([
  "PLAYGROUND_READY",
  "PLAYGROUND_CONSOLE",
  "PLAYGROUND_BUILD_ERROR",
  "PLAYGROUND_VALIDATE_RESPONSE",
]);

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
  private objectUrl: string | null = null;
  private disposed = false;

  constructor(options: SandboxRuntimeHostOptions) {
    this.iframe = options.iframe;
    this.revision = options.workspaceRevision;
    this.listener = (event) => {
      const data = event.data as { type?: unknown; workspaceRevision?: unknown } | null;
      const messageType = typeof data?.type === "string" ? data.type : null;
      if (!messageType || !FORGE_RUNTIME_MESSAGE_TYPES.has(messageType)) return;

      const sourceMatches = event.source === this.iframe.contentWindow;
      const revisionMatches = data?.workspaceRevision === this.revision;
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

  loadDocument(html: string): void {
    if (this.disposed) return;
    this.revokeObjectUrl();
    this.objectUrl = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    this.iframe.src = this.objectUrl;
  }

  dispose(target: Window = window): void {
    if (this.disposed) return;
    this.disposed = true;
    target.removeEventListener("message", this.listener);
    this.revokeObjectUrl();
  }

  private revokeObjectUrl(): void {
    if (this.objectUrl === null) return;
    URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = null;
  }

  get isDisposed(): boolean {
    return this.disposed;
  }
}
