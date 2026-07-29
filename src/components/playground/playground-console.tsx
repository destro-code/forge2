import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Terminal,
  Trash2,
  Search,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Filter,
} from "lucide-react";
import type { PlaygroundConsoleLog } from "@/lib/types/playground";

interface PlaygroundConsoleProps {
  logs: PlaygroundConsoleLog[];
  onClearConsole: () => void;
}

export function PlaygroundConsole({ logs, onClearConsole }: PlaygroundConsoleProps) {
  const [filterLevel, setFilterLevel] = useState<"all" | "log" | "warn" | "error">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLogs = logs.filter((log) => {
    if (filterLevel !== "all" && log.level !== filterLevel) return false;
    if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getLogIcon = (level: PlaygroundConsoleLog["level"]) => {
    switch (level) {
      case "error":
        return <AlertCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />;
      case "warn":
        return <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />;
      case "info":
        return <Info className="h-3.5 w-3.5 text-sky-400 shrink-0" />;
      default:
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />;
    }
  };

  const getLogBg = (level: PlaygroundConsoleLog["level"]) => {
    switch (level) {
      case "error":
        return "bg-rose-500/10 border-rose-500/30 text-rose-300";
      case "warn":
        return "bg-amber-500/10 border-amber-500/30 text-amber-300";
      case "info":
        return "bg-sky-500/10 border-sky-500/30 text-sky-300";
      default:
        return "bg-card/40 border-border/40 text-foreground";
    }
  };

  return (
    <div className="flex h-full flex-col bg-background font-mono text-xs">
      {/* Console Bar Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-card/60 px-3 py-2">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground">Console Stream</span>
          <Badge variant="outline" className="text-[10px] px-1.5 h-4">
            {filteredLogs.length} logs
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Pills */}
          <div className="flex items-center rounded-md border border-border/60 bg-background p-0.5">
            <button
              onClick={() => setFilterLevel("all")}
              className={`px-2 py-0.5 rounded text-[10px] transition ${
                filterLevel === "all"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterLevel("log")}
              className={`px-2 py-0.5 rounded text-[10px] transition ${
                filterLevel === "log"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Logs
            </button>
            <button
              onClick={() => setFilterLevel("warn")}
              className={`px-2 py-0.5 rounded text-[10px] transition ${
                filterLevel === "warn"
                  ? "bg-amber-500 text-white font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Warns
            </button>
            <button
              onClick={() => setFilterLevel("error")}
              className={`px-2 py-0.5 rounded text-[10px] transition ${
                filterLevel === "error"
                  ? "bg-rose-500 text-white font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Errors
            </button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={onClearConsole}
            title="Clear Console"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="border-b border-border/40 px-3 py-1 bg-card/20">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter console logs..."
            className="h-6 pl-7 text-[11px]"
          />
        </div>
      </div>

      {/* Console Output Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <Terminal className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-xs">No console messages logged yet.</p>
            <p className="text-[11px] text-muted-foreground/70">
              Run your code or interact with the preview to capture console output.
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className={`flex items-start gap-2.5 rounded border p-2 text-xs transition leading-relaxed ${getLogBg(
                log.level,
              )}`}
            >
              {getLogIcon(log.level)}
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground/80">
                  <span className="uppercase font-semibold tracking-wider">{log.level}</span>
                  <span>{log.timestamp}</span>
                </div>
                <div className="whitespace-pre-wrap break-words">{log.message}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
