import { useEffect, useState } from "react";
import { Bug, Clipboard, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  clearRuntimeDebugEvents,
  getRuntimeDebugEvents,
  subscribeRuntimeDebug,
  type RuntimeDebugEvent,
} from "@/lib/debug/runtime-debug-sink";

function formatEvent(event: RuntimeDebugEvent) {
  const time = new Date(event.timestamp).toISOString().slice(11, 23);
  return `${time}  [${event.category}] ${event.message}`;
}

export function RuntimeDebugConsole() {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<RuntimeDebugEvent[]>(getRuntimeDebugEvents);

  useEffect(
    () => subscribeRuntimeDebug((event) => setEvents((current) => [...current, event])),
    [],
  );

  if (!open) {
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        aria-label="Open runtime debug console"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 gap-2 rounded-full shadow-lg"
      >
        <Bug data-icon="inline-start" /> Debug
      </Button>
    );
  }

  const log = events.map(formatEvent).join("\n");
  const clear = () => {
    clearRuntimeDebugEvents();
    setEvents([]);
  };

  return (
    <section
      aria-label="Runtime debug console"
      className="fixed inset-3 z-50 flex max-h-[calc(100dvh-1.5rem)] flex-col overflow-hidden rounded-xl border bg-background shadow-2xl sm:inset-auto sm:bottom-4 sm:right-4 sm:h-[min(620px,calc(100dvh-2rem))] sm:w-[min(720px,calc(100vw-2rem))]"
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <h2 className="font-semibold">Runtime debug console</h2>
          <p className="text-xs text-muted-foreground">
            Observational only · {events.length} events
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={clear}
            aria-label="Clear debug logs"
          >
            <Trash2 data-icon="inline-start" /> Clear
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => void navigator.clipboard?.writeText(log)}
            aria-label="Copy all debug logs"
          >
            <Clipboard data-icon="inline-start" /> Copy
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => setOpen(false)}
            aria-label="Close debug console"
          >
            <X />
          </Button>
        </div>
      </header>
      <pre className="min-h-0 flex-1 overflow-auto overscroll-contain whitespace-pre-wrap break-words p-4 font-mono text-[11px] leading-5 text-foreground [padding-bottom:env(safe-area-inset-bottom)]">
        {log || "Waiting for runtime events…"}
      </pre>
    </section>
  );
}
