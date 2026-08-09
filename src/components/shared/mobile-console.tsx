import { useState, useEffect, useRef } from "react";
import {
  Terminal,
  Trash2,
  ChevronUp,
  ChevronDown,
  Move,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";

export interface LogEntry {
  id: string;
  type: "log" | "warn" | "error";
  message: string;
  timestamp: string;
}

export function MobileConsole() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    const formatArgs = (args: unknown[]): string => {
      return args
        .map((arg) => {
          if (typeof arg === "object" && arg !== null) {
            try {
              return JSON.stringify(arg, null, 2);
            } catch {
              return String(arg);
            }
          }
          return String(arg);
        })
        .join(" ");
    };

    const getTimestamp = () => {
      const now = new Date();
      return (
        now.toTimeString().split(" ")[0] + "." + String(now.getMilliseconds()).padStart(3, "0")
      );
    };

    console.log = (...args: unknown[]) => {
      originalLog(...args);
      setLogs((prev) => [
        ...prev.slice(-199),
        {
          id: Math.random().toString(36).substring(2, 9),
          type: "log",
          message: formatArgs(args),
          timestamp: getTimestamp(),
        },
      ]);
    };

    console.warn = (...args: unknown[]) => {
      originalWarn(...args);
      setLogs((prev) => [
        ...prev.slice(-199),
        {
          id: Math.random().toString(36).substring(2, 9),
          type: "warn",
          message: formatArgs(args),
          timestamp: getTimestamp(),
        },
      ]);
    };

    console.error = (...args: unknown[]) => {
      originalError(...args);
      setLogs((prev) => [
        ...prev.slice(-199),
        {
          id: Math.random().toString(36).substring(2, 9),
          type: "error",
          message: formatArgs(args),
          timestamp: getTimestamp(),
        },
      ]);
    };

    const handleWindowError = (event: ErrorEvent) => {
      setLogs((prev) => [
        ...prev.slice(-199),
        {
          id: Math.random().toString(36).substring(2, 9),
          type: "error",
          message: `Uncaught Error: ${event.message} at ${event.filename}:${event.lineno}`,
          timestamp: getTimestamp(),
        },
      ]);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setLogs((prev) => [
        ...prev.slice(-199),
        {
          id: Math.random().toString(36).substring(2, 9),
          type: "error",
          message: `Unhandled Promise Rejection: ${event.reason?.message || String(event.reason)}`,
          timestamp: getTimestamp(),
        },
      ]);
    };

    window.addEventListener("error", handleWindowError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
      window.removeEventListener("error", handleWindowError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  useEffect(() => {
    if (isExpanded && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, isExpanded]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;
    setPosition({
      x: dragStartRef.current.initialX + deltaX,
      y: dragStartRef.current.initialY + deltaY,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore if pointer capture released automatically
      }
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const errorCount = logs.filter((l) => l.type === "error").length;
  const warnCount = logs.filter((l) => l.type === "warn").length;

  return (
    <div
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
      }}
      className="fixed bottom-4 right-4 z-50 flex flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/95 font-mono text-xs text-zinc-100 shadow-2xl backdrop-blur-md max-w-[calc(100vw-2rem)] sm:max-w-md"
    >
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="flex cursor-grab items-center justify-between border-b border-zinc-800/80 bg-zinc-900/90 px-3 py-2 active:cursor-grabbing select-none"
      >
        <div className="flex items-center gap-2">
          <Move className="h-3.5 w-3.5 text-zinc-400" />
          <Terminal className="h-3.5 w-3.5 text-emerald-400" />
          <span className="font-semibold tracking-wide text-zinc-200">Dev Console</span>
          <div className="flex items-center gap-1.5 ml-1">
            <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-300">
              {logs.length}
            </span>
            {errorCount > 0 && (
              <span className="flex items-center gap-0.5 rounded bg-red-950/80 px-1.5 py-0.5 text-[10px] font-medium text-red-400 border border-red-800/50">
                <AlertCircle className="h-2.5 w-2.5" />
                {errorCount}
              </span>
            )}
            {warnCount > 0 && (
              <span className="flex items-center gap-0.5 rounded bg-amber-950/80 px-1.5 py-0.5 text-[10px] font-medium text-amber-400 border border-amber-800/50">
                <AlertTriangle className="h-2.5 w-2.5" />
                {warnCount}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isExpanded && (
            <button
              type="button"
              onClick={clearLogs}
              title="Clear Console"
              className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            title={isExpanded ? "Collapse Console" : "Expand Console"}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="flex h-64 w-80 sm:w-96 flex-col overflow-y-auto p-2 space-y-1.5 bg-zinc-950/90 text-[11px] leading-relaxed select-text">
          {logs.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-zinc-500 italic">
              No console logs recorded
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className={`flex items-start gap-2 rounded px-2 py-1 break-words border ${
                  log.type === "error"
                    ? "border-red-900/40 bg-red-950/30 text-red-300"
                    : log.type === "warn"
                      ? "border-amber-900/40 bg-amber-950/30 text-amber-300"
                      : "border-zinc-800/50 bg-zinc-900/40 text-emerald-400"
                }`}
              >
                <span className="shrink-0 text-[10px] text-zinc-500 font-normal">
                  [{log.timestamp}]
                </span>
                <div className="flex-1 whitespace-pre-wrap font-mono">{log.message}</div>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      )}
    </div>
  );
}
