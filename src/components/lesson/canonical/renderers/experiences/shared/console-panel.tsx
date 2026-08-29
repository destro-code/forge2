import { Terminal, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConsolePanelProps {
  output: string[];
  buildError?: string;
  emptyHint?: string;
  className?: string;
  /** Renders as the dominant surface (JavaScript experience) vs. a secondary strip. */
  prominent?: boolean;
}

/**
 * The shared console/output surface. JavaScript treats this as its primary
 * feedback surface; HTML/CSS/Debug use it as a secondary diagnostic strip.
 */
export function ConsolePanel({
  output,
  buildError,
  emptyHint = "Run the code to see console output.",
  className,
  prominent = false,
}: ConsolePanelProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 text-xs font-semibold text-lesson-text-muted">
        <Terminal className="h-3.5 w-3.5" />
        <span>Console</span>
      </div>
      {output.length > 0 ? (
        <pre
          className={cn(
            "overflow-auto rounded-xl border border-lesson-border bg-zinc-950 p-4 font-mono text-xs leading-6 text-zinc-100",
            prominent ? "max-h-72 min-h-40" : "max-h-48",
          )}
        >
          {output.join("\n")}
        </pre>
      ) : (
        <div
          className={cn(
            "flex items-center justify-center rounded-xl border border-dashed border-lesson-border px-6 text-center text-sm text-lesson-text-muted",
            prominent ? "min-h-40" : "min-h-32",
          )}
        >
          {emptyHint}
        </div>
      )}
      {buildError && (
        <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3.5 py-2.5 text-xs text-rose-900 dark:text-rose-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
          <div>
            <p className="font-semibold">There&apos;s an error in your code</p>
            <p className="mt-0.5 font-mono text-[11px] opacity-90">{buildError}</p>
          </div>
        </div>
      )}
    </div>
  );
}
