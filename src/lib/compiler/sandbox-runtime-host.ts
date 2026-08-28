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
      if (this.disposed || event.source !== this.iframe.contentWindow) return;
      const messageRevision = (event.data as { workspaceRevision?: unknown } | null)?.workspaceRevision;
      if (typeof messageRevision === "number" && messageRevision !== this.revision) return;
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
