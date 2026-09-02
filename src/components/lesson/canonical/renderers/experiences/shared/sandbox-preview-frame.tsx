import type { RefObject } from "react";
import { cn } from "@/lib/utils";

export interface SandboxPreviewFrameProps {
  iframeRef: RefObject<HTMLIFrameElement | null>;
  title: string;
  /** Exactly what `SandboxRuntimeHost.mount()` sets — never "allow-same-origin". */
  sandbox: string;
  label?: string;
  ariaLabel: string;
  className?: string;
  /** Visually hidden but still present in the DOM/execution — used when a
   *  console-first experience has no meaningful visual surface to show. */
  visuallyHidden?: boolean;
}

/**
 * The shared sandboxed `<iframe>`. This component only renders the frame —
 * it never constructs a compiler manifest or owns the sandbox host
 * lifecycle; that stays entirely inside `useExperienceController`.
 */
export function SandboxPreviewFrame({
  iframeRef,
  title,
  sandbox,
  label,
  ariaLabel,
  className,
  visuallyHidden = false,
}: SandboxPreviewFrameProps) {
  if (visuallyHidden) {
    return (
      <iframe
        ref={iframeRef}
        title={title}
        sandbox={sandbox}
        className="sr-only"
        aria-hidden="true"
      />
    );
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <p className="text-xs font-semibold uppercase tracking-wider text-lesson-text-muted">
          {label}
        </p>
      )}
      <div className="overflow-hidden rounded-xl border border-lesson-border bg-background shadow-xs">
        <iframe
          ref={iframeRef}
          title={title}
          sandbox={sandbox}
          className="h-full min-h-56 w-full"
          aria-label={ariaLabel}
        />
      </div>
    </div>
  );
}
