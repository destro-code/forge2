import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Play,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Bug,
  Activity,
  Trash2,
  Volume2,
  Search,
  Zap,
} from "lucide-react";

interface InteractiveBugSimulatorProps {
  interactiveType:
    | "counter_stale"
    | "layout_shift"
    | "memory_leak"
    | "network_race"
    | "a11y_button"
    | "perf_renders"
    | "console_null_map"
    | "hooks_infinite";
  isFixed: boolean;
}

export function InteractiveBugSimulator({
  interactiveType,
  isFixed,
}: InteractiveBugSimulatorProps) {
  return (
    <Card className="border-border/60 bg-card/50 overflow-hidden">
      <CardHeader className="bg-muted/30 border-b border-border/40 py-3 px-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary animate-pulse" />
          <CardTitle className="text-sm font-medium">Interactive Bug Diagnostic Sandbox</CardTitle>
        </div>
        <Badge variant={isFixed ? "default" : "destructive"} className="text-xs">
          {isFixed ? "Fixed Implementation" : "Broken Implementation"}
        </Badge>
      </CardHeader>
      <CardContent className="p-4">
        {interactiveType === "counter_stale" && <StaleCounterSandbox isFixed={isFixed} />}
        {interactiveType === "layout_shift" && <LayoutShiftSandbox isFixed={isFixed} />}
        {interactiveType === "memory_leak" && <MemoryLeakSandbox isFixed={isFixed} />}
        {interactiveType === "network_race" && <NetworkRaceSandbox isFixed={isFixed} />}
        {interactiveType === "a11y_button" && <A11yButtonSandbox isFixed={isFixed} />}
        {interactiveType === "perf_renders" && <PerfRendersSandbox isFixed={isFixed} />}
        {interactiveType === "console_null_map" && <ConsoleNullMapSandbox isFixed={isFixed} />}
        {interactiveType === "hooks_infinite" && <HooksInfiniteSandbox isFixed={isFixed} />}
      </CardContent>
    </Card>
  );
}

/* --- 1. Stale Counter Sandbox --- */
function StaleCounterSandbox({ isFixed }: { isFixed: boolean }) {
  const [count, setCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      if (isFixed) {
        setCount((prev) => {
          const next = prev + 1;
          setLogs((l) => [`[Tick] State updated to ${next}`, ...l.slice(0, 4)]);
          return next;
        });
      } else {
        // Stale closure simulation: closure captures 'count' value at start of interval
        setCount(count + 1);
        setLogs((l) => [
          `[Tick] Set count called with (${count} + 1) -> output is 1! (Stale closure)`,
          ...l.slice(0, 4),
        ]);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isFixed, count]);

  const handleReset = () => {
    setCount(0);
    setIsRunning(false);
    setLogs(["[System] Counter reset to 0"]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 rounded-lg bg-background border border-border">
        <div>
          <div className="text-xs text-muted-foreground uppercase font-semibold">
            Live Counter Value
          </div>
          <div className="text-4xl font-extrabold font-mono mt-1 text-primary">{count}</div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={isRunning ? "secondary" : "default"}
            onClick={() => setIsRunning(!isRunning)}
          >
            {isRunning ? "Pause Interval" : "Start Interval (1s)"}
          </Button>
          <Button size="sm" variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-lg bg-slate-950 p-3 font-mono text-xs text-slate-200 border border-slate-800">
        <div className="text-slate-400 font-semibold mb-1 flex items-center gap-2">
          <span>Console Execution Log</span>
          {!isFixed && count === 1 && isRunning && (
            <Badge variant="destructive" className="text-[10px] py-0">
              Counter Frozen
            </Badge>
          )}
        </div>
        {logs.length === 0 ? (
          <div className="text-slate-500 italic">Click Start Interval to monitor ticks...</div>
        ) : (
          logs.map((log, idx) => (
            <div
              key={idx}
              className={log.includes("Stale closure") ? "text-amber-400" : "text-emerald-400"}
            >
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* --- 2. Layout Shift Sandbox --- */
function LayoutShiftSandbox({ isFixed }: { isFixed: boolean }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clsScore, setClsScore] = useState(0);

  const simulateLoad = () => {
    setImageLoaded(false);
    setLoading(true);
    setClsScore(0);

    setTimeout(() => {
      setLoading(false);
      setImageLoaded(true);
      if (!isFixed) {
        setClsScore(0.34);
      } else {
        setClsScore(0.0);
      }
    }, 1200);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={simulateLoad} disabled={loading}>
            {loading ? "Downloading Image..." : "Simulate Async Image Load"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setImageLoaded(false);
              setClsScore(0);
            }}
          >
            Reset
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">CLS Score:</span>
          <Badge variant={clsScore > 0.1 ? "destructive" : "default"}>
            {clsScore.toFixed(2)} {clsScore > 0.1 ? "(Poor Layout Shift)" : "(Good: 0.00)"}
          </Badge>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-background border border-border space-y-3 transition-all">
        <div className="text-xs font-semibold text-muted-foreground">Hero Section Container</div>

        {/* Hero image container */}
        <div
          className={
            isFixed
              ? "w-full aspect-video bg-muted/60 rounded-md overflow-hidden relative border border-primary/30 flex items-center justify-center"
              : "w-full rounded-md overflow-hidden relative flex items-center justify-center transition-all duration-300"
          }
          style={!isFixed ? { height: imageLoaded ? "180px" : "0px" } : undefined}
        >
          {loading && (
            <div className="text-xs text-muted-foreground animate-pulse">
              Image loading over network...
            </div>
          )}
          {imageLoaded && (
            <div className="w-full h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-inner">
              Loaded Banner Asset (1920x1080)
            </div>
          )}
          {!isFixed && !imageLoaded && !loading && (
            <div className="text-xs text-amber-500 italic">
              Container height is 0px before load!
            </div>
          )}
        </div>

        {/* Content beneath image */}
        <div className="p-3 bg-muted/30 rounded border border-border/50 space-y-2">
          <h4 className="font-semibold text-sm">Action Buttons (Downstream Element)</h4>
          <p className="text-xs text-muted-foreground">
            {clsScore > 0
              ? "⚠️ Notice how this content was abruptly pushed down by 180px!"
              : "Space is pre-reserved, so this text never shifts when image arrives."}
          </p>
          <Button size="sm" className="w-full">
            Call to Action
          </Button>
        </div>
      </div>
    </div>
  );
}

/* --- 3. Memory Leak Sandbox --- */
function MemoryLeakSandbox({ isFixed }: { isFixed: boolean }) {
  const [mounted, setMounted] = useState(true);
  const [listenerCount, setListenerCount] = useState(1);
  const [resizeLog, setResizeLog] = useState<string[]>([]);

  useEffect(() => {
    if (!mounted) {
      if (!isFixed) {
        // In broken mode, unmounting leaves the listener attached
        setResizeLog((l) => [
          `[Leak Warning] Component unmounted, but event listener remains attached to window!`,
          ...l,
        ]);
      } else {
        setListenerCount(0);
        setResizeLog((l) => [
          `[Cleanup Success] Component unmounted. window.removeEventListener called. Active listeners: 0`,
          ...l,
        ]);
      }
    } else {
      setListenerCount((prev) => (isFixed ? 1 : prev === 0 ? 1 : prev));
      setResizeLog((l) => [`[Mount] Listener attached to window.activeListeners`, ...l]);
    }
  }, [mounted, isFixed]);

  const triggerMountToggle = () => {
    if (mounted) {
      setMounted(false);
    } else {
      if (!isFixed) {
        setListenerCount((c) => c + 1);
      }
      setMounted(true);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button size="sm" variant="outline" onClick={triggerMountToggle}>
          {mounted ? "Unmount Component" : "Remount Component"}
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Active Window Listeners:</span>
          <Badge
            variant={
              listenerCount > 1 || (!mounted && listenerCount > 0) ? "destructive" : "default"
            }
          >
            {listenerCount} Listener{listenerCount !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-background border border-border">
        {mounted ? (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-300 text-xs flex items-center justify-between">
            <span>Component WindowTracker is currently MOUNTED.</span>
            <Badge variant="outline" className="text-emerald-400 border-emerald-500/40">
              Active
            </Badge>
          </div>
        ) : (
          <div className="p-3 bg-slate-900 border border-slate-800 rounded text-slate-400 text-xs flex items-center justify-between">
            <span>Component WindowTracker is UNMOUNTED.</span>
            <Badge variant="secondary">In-Active</Badge>
          </div>
        )}
      </div>

      <div className="rounded-lg bg-slate-950 p-3 font-mono text-xs text-slate-200 border border-slate-800 space-y-1">
        <div className="text-slate-400 font-semibold mb-1">Heap Memory & Listener Trace</div>
        {resizeLog.map((log, idx) => (
          <div
            key={idx}
            className={log.includes("Leak Warning") ? "text-amber-400" : "text-slate-300"}
          >
            {log}
          </div>
        ))}
      </div>
    </div>
  );
}

/* --- 4. Network Race Sandbox --- */
function NetworkRaceSandbox({ isFixed }: { isFixed: boolean }) {
  const [query, setQuery] = useState("");
  const [activeResult, setActiveResult] = useState<string | null>(null);
  const [requests, setRequests] = useState<{ query: string; status: string; id: number }[]>([]);
  const reqIdRef = useRef(0);

  const handleType = (text: string) => {
    setQuery(text);
    if (!text) return;

    const currentId = ++reqIdRef.current;
    const latency = text === "Rea" ? 1200 : 300; // Simulate "Rea" taking 1200ms and "React" taking 300ms

    setRequests((prev) => [
      { query: text, status: `In-Flight (${latency}ms delay)`, id: currentId },
      ...prev.slice(0, 3),
    ]);

    setTimeout(() => {
      if (isFixed && currentId < reqIdRef.current) {
        // Canceled by AbortController
        setRequests((prev) =>
          prev.map((r) => (r.id === currentId ? { ...r, status: "Aborted (Canceled)" } : r)),
        );
        return;
      }

      setRequests((prev) =>
        prev.map((r) => (r.id === currentId ? { ...r, status: "Completed & Rendered" } : r)),
      );
      setActiveResult(`Results for '${text}' (Response ID #${currentId})`);
    }, latency);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground">
          Search Auto-Suggest Input
        </label>
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => handleType(e.target.value)}
            placeholder="Type 'Rea' then 'React' quickly..."
            className="font-mono text-sm"
          />
          <Button size="sm" variant="outline" onClick={() => handleType("React")}>
            Simulate "React"
          </Button>
        </div>
      </div>

      <div className="p-3 bg-background border border-border rounded-lg space-y-2">
        <div className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
          <span>Displayed Results State</span>
          {!isFixed && activeResult?.includes("Rea'") && query === "React" && (
            <Badge variant="destructive" className="text-[10px]">
              Race Condition Bug! Showing 'Rea' for 'React'
            </Badge>
          )}
        </div>
        <div className="p-2 bg-muted/40 rounded font-mono text-xs text-foreground">
          {activeResult || "No search results displayed"}
        </div>
      </div>

      <div className="rounded-lg bg-slate-950 p-3 font-mono text-xs border border-slate-800">
        <div className="text-slate-400 font-semibold mb-1">Network Waterfall Log</div>
        {requests.length === 0 ? (
          <div className="text-slate-500 italic">
            Type in input to observe async request order...
          </div>
        ) : (
          requests.map((r) => (
            <div key={r.id} className="flex justify-between py-0.5 border-b border-slate-900">
              <span className="text-slate-300">GET /api/search?q={r.query}</span>
              <span
                className={
                  r.status.includes("Aborted")
                    ? "text-slate-500"
                    : r.status.includes("Completed")
                      ? "text-emerald-400"
                      : "text-amber-400"
                }
              >
                {r.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* --- 5. A11y Button Sandbox --- */
function A11yButtonSandbox({ isFixed }: { isFixed: boolean }) {
  const [announcement, setAnnouncement] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="p-4 bg-background border border-border rounded-lg space-y-3">
        <div className="text-xs font-semibold text-muted-foreground">
          Interactive Component Preview
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm">Item #1: Product License Key</span>

          {/* Icon Button */}
          {isFixed ? (
            <button
              onClick={() => setAnnouncement("Screen reader announces: 'Button, Delete item'")}
              className="p-2 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Delete item"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Delete item</span>
            </button>
          ) : (
            <button
              onClick={() =>
                setAnnouncement("Screen reader announces: 'Unlabeled button, clickable'")
              }
              className="p-2 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Volume2 className="h-4 w-4 text-primary" />
          <span>Screen Reader Accessibility Voiceover Inspector</span>
        </div>
        <div className="p-2 rounded bg-slate-900 text-xs font-mono text-slate-200">
          {announcement || "Click the trash icon button above to test screen reader output..."}
        </div>
      </div>
    </div>
  );
}

/* --- 6. Perf Renders Sandbox --- */
function PerfRendersSandbox({ isFixed }: { isFixed: boolean }) {
  const [filter, setFilter] = useState("");
  const [renderCount, setRenderCount] = useState(0);

  const handleInput = (val: string) => {
    setFilter(val);
    if (!isFixed) {
      // Inline callbacks recreate functions forcing all 500 children to re-render
      setRenderCount((c) => c + 500);
    } else {
      // Memoized callbacks prevent unnecessary re-renders
      setRenderCount((c) => c + 1);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1 flex-1 max-w-xs">
          <label className="text-xs font-semibold text-muted-foreground">Search Products</label>
          <Input
            value={filter}
            onChange={(e) => handleInput(e.target.value)}
            placeholder="Type to filter products..."
            className="text-sm"
          />
        </div>

        <div className="text-right space-y-1">
          <div className="text-xs text-muted-foreground">Child Item Re-renders:</div>
          <Badge
            variant={renderCount > 100 ? "destructive" : "default"}
            className="text-sm px-3 py-1 font-mono"
          >
            {renderCount} Re-renders
          </Badge>
        </div>
      </div>

      <div className="p-3 bg-background border border-border rounded-lg grid grid-cols-3 gap-2">
        {["Product Alpha", "Product Beta", "Product Gamma"].map((item, idx) => (
          <div
            key={idx}
            className={`p-2 rounded border text-xs font-medium flex justify-between items-center transition-colors ${
              renderCount > 0 && !isFixed
                ? "bg-destructive/10 border-destructive/40"
                : "bg-muted/40 border-border"
            }`}
          >
            <span>{item}</span>
            <Badge variant="outline" className="text-[10px] py-0">
              {isFixed ? "memoized" : "re-rendered"}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --- 7. Console Null Map Sandbox --- */
function ConsoleNullMapSandbox({ isFixed }: { isFixed: boolean }) {
  const [hasCrashed, setHasCrashed] = useState(!isFixed);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-muted-foreground">Asynchronous Data State</span>
        <Button size="sm" variant="outline" onClick={() => setHasCrashed(!isFixed)}>
          Re-test Load
        </Button>
      </div>

      {hasCrashed && !isFixed ? (
        <div className="p-4 bg-destructive/10 border border-destructive/40 rounded-lg text-destructive space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>Uncaught TypeError: Cannot read properties of undefined (reading 'map')</span>
          </div>
          <p className="text-xs text-destructive/80 font-mono">
            at UserList (user-list.tsx:15:15)
            <br />
            at renderWithHooks (react-dom.development.js:16305)
          </p>
        </div>
      ) : (
        <div className="p-4 bg-background border border-border rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
            <CheckCircle2 className="h-4 w-4" />
            <span>State Initialized safely with [] fallback</span>
          </div>
          <ul className="text-xs space-y-1 list-disc list-inside text-muted-foreground font-mono">
            <li>User #101: Alex Morgan</li>
            <li>User #102: Jordan Smith</li>
          </ul>
        </div>
      )}
    </div>
  );
}

/* --- 8. Hooks Infinite Sandbox --- */
function HooksInfiniteSandbox({ isFixed }: { isFixed: boolean }) {
  const [renderLoopCount, setRenderLoopCount] = useState(isFixed ? 1 : 9999);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-muted-foreground">Render Cycle Guard</span>
        <Button size="sm" variant="outline" onClick={() => setRenderLoopCount(isFixed ? 1 : 9999)}>
          Test Effect Cycle
        </Button>
      </div>

      {!isFixed ? (
        <div className="p-4 bg-destructive/10 border border-destructive/40 rounded-lg space-y-2 text-destructive">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Zap className="h-4 w-4" />
            <span>Infinite Render Loop Detected! (Count: {renderLoopCount})</span>
          </div>
          <p className="text-xs text-destructive/80">
            React safety threshold exceeded: `setSettings` triggered inside `useEffect` with
            `[settings]` dependency.
          </p>
        </div>
      ) : (
        <div className="p-4 bg-background border border-border rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
            <CheckCircle2 className="h-4 w-4" />
            <span>Effect mounted cleanly with 0 loop re-triggers</span>
          </div>
          <div className="text-xs font-mono text-muted-foreground">
            Last synced: {new Date().toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
}
