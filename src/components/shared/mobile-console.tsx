import { useState, useEffect, useRef } from "react";
import {
  Terminal,
  ChevronUp,
  ChevronDown,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Info,
  Filter,
} from "lucide-react";

export interface LogEntry {
  id: string;
  type: "log" | "warn" | "error" | "info";
  message: string;
  timestamp: string;
}

export function MobileConsole() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<"all" | "log" | "warn" | "error">("all");
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalInfo = console.info;

    const formatArg = (arg: unknown): string => {
      if (arg === null) return "null";
      if (arg === undefined) return "undefined";
      if (typeof arg === "string") return arg;
      if (typeof arg === "number" || typeof arg === "boolean") return String(arg);
      if (arg instanceof Error) return `${arg.name}: ${arg.message}\n${arg.stack || ""}`;
      try {
        return JSON.stringify(arg, null, 2);
      } catch {
        return String(arg);
      }
    };

    const addLog = (type: LogEntry["type"], args: unknown[]) => {
      const message = args.map(formatArg).join(" ");
      const timestamp = new Date().toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      setLogs((prev) => {
        const next = [...prev, { id: `${Date.now()}-${Math.random()}`, type, message, timestamp }];
        if (next.length > 300) {
          return next.slice(next.length - 300);
        }
        return next;
      });
    };

    console.log = (...args: unknown[]) => {
      originalLog.apply(console, args);
      addLog("log", args);
    };

    console.warn = (...args: unknown[]) => {
      originalWarn.apply(console, args);
      addLog("warn", args);
    };

    console.error = (...args: unknown[]) => {
      originalError.apply(console, args);
      addLog("error", args);
    };

    console.info = (...args: unknown[]) => {
      originalInfo.apply(console, args);
      addLog("info", args);
    };

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
      console.info = originalInfo;
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, isOpen]);

  const clearLogs = () => setLogs([]);

  const filteredLogs = logs.filter((log) => filter === "all" || log.type === filter);

  const errorCount = logs.filter((l) => l.type === "error").length;
  const warnCount = logs.filter((l) => l.type === "warn").length;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] font-mono text-xs select-none">
      {/* Collapsed Bar / Header */}
      <div
        className="flex items-center justify-between bg-slate-950/95 border-t border-slate-800 px-3 py-2 text-slate-200 backdrop-blur-md shadow-2xl cursor-pointer"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-emerald-400" />
          <span className="font-semibold text-slate-200">Dev Console</span>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
            {logs.length}
          </span>
          {errorCount > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-rose-500/20 text-rose-400 px-2 py-0.5 text-[10px] font-bold border border-rose-500/30">
              <AlertCircle className="h-3 w-3" />
              {errorCount}
            </span>
          )}
          {warnCount > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-amber-500/20 text-amber-300 px-2 py-0.5 text-[10px] font-bold border border-amber-500/30">
              <AlertTriangle className="h-3 w-3" />
              {warnCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {isOpen && (
            <button
              onClick={clearLogs}
              title="Clear Console"
              className="flex items-center gap-1 rounded px-2 py-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
          <button
            onClick={() => setIsOpen((prev) => !prev)}
            className="p-1 text-slate-400 hover:text-slate-100 rounded hover:bg-slate-800 transition-colors"
          >
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Console Panel */}
      {isOpen && (
        <div className="bg-slate-950/95 border-t border-slate-900 text-slate-200 h-64 max-h-[50vh] flex flex-col backdrop-blur-md">
          {/* Filter Toolbar */}
          <div className="flex items-center gap-2 border-b border-slate-900 px-3 py-1.5 bg-slate-900/50">
            <span className="text-[10px] uppercase text-slate-500 font-semibold flex items-center gap-1">
              <Filter className="h-3 w-3" /> Filter:
            </span>
            {(["all", "log", "warn", "error"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold transition-colors ${
                  filter === f
                    ? "bg-primary text-primary-foreground font-bold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Logs List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 select-text">
            {filteredLogs.length === 0 ? (
              <div className="text-slate-600 italic text-center py-6">No logs to display</div>
            ) : (
              filteredLogs.map((log) => {
                let colorClass = "text-emerald-400 border-emerald-500/20 bg-emerald-950/10";
                let icon = <Info className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />;

                if (log.type === "warn") {
                  colorClass = "text-amber-300 border-amber-500/20 bg-amber-950/10";
                  icon = <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />;
                } else if (log.type === "error") {
                  colorClass = "text-rose-400 border-rose-500/20 bg-rose-950/10";
                  icon = <AlertCircle className="h-3 w-3 text-rose-400 shrink-0 mt-0.5" />;
                }

                return (
                  <div
                    key={log.id}
                    className={`flex items-start gap-2 p-1.5 rounded border ${colorClass} text-xs font-mono break-all whitespace-pre-wrap leading-relaxed`}
                  >
                    <span className="text-[10px] text-slate-500 shrink-0 mt-0.5">
                      {log.timestamp}
                    </span>
                    {icon}
                    <div className="flex-1 min-w-0">{log.message}</div>
                  </div>
                );
              })
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}
