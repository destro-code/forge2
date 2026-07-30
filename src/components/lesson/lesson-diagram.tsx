import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, RotateCcw, ArrowRight, Layers, Cpu, GitMerge, Activity } from "lucide-react";

interface LessonDiagramProps {
  diagramType: "closure-scope" | "event-loop" | "fiber-tree" | "state-flow" | "custom";
  title: string;
  description?: string;
}

export function LessonDiagram({ diagramType, title, description }: LessonDiagramProps) {
  // State for interactive closure diagram
  const [closureStep, setClosureStep] = useState(0);
  const [counterVal, setCounterVal] = useState(0);

  // State for interactive event loop diagram
  const [eventLoopStep, setEventLoopStep] = useState(0);

  // State for fiber tree active node
  const [activeFiberNode, setActiveFiberNode] = useState<string>("App");

  // Closure diagram interactive state
  const handleNextClosureStep = () => {
    if (closureStep === 0) {
      setClosureStep(1);
    } else {
      setCounterVal((v) => v + 1);
      setClosureStep(2);
    }
  };

  const resetClosure = () => {
    setClosureStep(0);
    setCounterVal(0);
  };

  return (
    <Card className="my-6 border-primary/30 bg-card/60 overflow-hidden shadow-elegant">
      <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {diagramType === "closure-scope" && <Layers className="h-4 w-4 text-primary" />}
            {diagramType === "event-loop" && <Cpu className="h-4 w-4 text-emerald-400" />}
            {diagramType === "fiber-tree" && <GitMerge className="h-4 w-4 text-sky-400" />}
            {diagramType === "state-flow" && <Activity className="h-4 w-4 text-purple-400" />}
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px] uppercase font-mono border-primary/30">
            Interactive Visualizer
          </Badge>
        </div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        {/* 1. CLOSURE SCOPE VISUALIZER */}
        {diagramType === "closure-scope" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Outer Global Scope */}
              <div className="rounded-xl border border-border/80 bg-background/80 p-4 relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold font-mono text-muted-foreground uppercase">
                    Outer Scope (counter())
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    Heap Memory
                  </Badge>
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between items-center rounded-lg bg-muted/40 p-2 border border-border/40">
                    <span className="text-sky-400">let count</span>
                    <span className="font-bold text-emerald-400">{counterVal}</span>
                  </div>

                  {/* Inner Scope Box */}
                  <div
                    className={`rounded-lg border p-3 transition-all duration-300 ${
                      closureStep > 0
                        ? "border-primary bg-primary/10 shadow-glow"
                        : "border-border/40 bg-muted/20 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-primary mb-1">
                      <span>Inner Function Closure () =&gt; ++count</span>
                      <span>[[Scope]]</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-sans">
                      Retains reference link to outer variable{" "}
                      <code className="text-sky-300">count</code> even after{" "}
                      <code className="text-amber-300">counter()</code> finishes execution.
                    </p>
                  </div>
                </div>
              </div>

              {/* Execution Stack Log */}
              <div className="rounded-xl border border-border/80 bg-muted/10 p-4 font-mono text-xs flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-bold text-muted-foreground uppercase mb-2">
                    Call Stack & Output
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="p-1.5 rounded bg-background/60 border border-border/40">
                      const increment = counter();
                    </div>
                    {closureStep >= 1 && (
                      <div className="p-1.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                        increment(); // Returns: {counterVal}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/40">
                  <Button
                    size="sm"
                    onClick={handleNextClosureStep}
                    className="gap-1 text-xs flex-1"
                  >
                    <Play className="h-3 w-3" />
                    {closureStep === 0 ? "1. Execute counter()" : "2. Invoke increment()"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={resetClosure} className="text-xs">
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. EVENT LOOP VISUALIZER */}
        {diagramType === "event-loop" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-3">
                <div className="font-bold text-sky-400 mb-2 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" /> Call Stack
                </div>
                <div className="space-y-1">
                  {eventLoopStep === 1 && (
                    <div className="p-1.5 rounded bg-sky-500/20 text-sky-200">
                      console.log('Start')
                    </div>
                  )}
                  {eventLoopStep === 2 && (
                    <div className="p-1.5 rounded bg-purple-500/20 text-purple-200">
                      Promise.then()
                    </div>
                  )}
                  {eventLoopStep === 3 && (
                    <div className="p-1.5 rounded bg-amber-500/20 text-amber-200">
                      setTimeout cb()
                    </div>
                  )}
                  {eventLoopStep === 0 && (
                    <div className="text-muted-foreground italic text-[11px]">
                      [Empty Call Stack]
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-3">
                <div className="font-bold text-purple-400 mb-2">Microtask Queue</div>
                <div className="space-y-1">
                  {eventLoopStep === 1 ? (
                    <div className="p-1.5 rounded bg-purple-500/20 text-purple-200">
                      Promise callback
                    </div>
                  ) : (
                    <div className="text-muted-foreground italic text-[11px]">[Empty Queue]</div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                <div className="font-bold text-amber-400 mb-2">Macrotask Queue</div>
                <div className="space-y-1">
                  {eventLoopStep <= 2 ? (
                    <div className="p-1.5 rounded bg-amber-500/20 text-amber-200">
                      setTimeout (0ms)
                    </div>
                  ) : (
                    <div className="text-muted-foreground italic text-[11px]">[Empty Queue]</div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              <span className="text-xs text-muted-foreground">
                Step {eventLoopStep + 1} of 4: Microtasks (Promises) ALWAYS execute before
                Macrotasks (timers)!
              </span>
              <Button
                size="sm"
                onClick={() => setEventLoopStep((s) => (s + 1) % 4)}
                className="gap-1.5 text-xs"
              >
                Next Cycle <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* 3. FIBER TREE VISUALIZER */}
        {diagramType === "fiber-tree" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-center gap-3">
              {["App", "Header", "Sidebar", "TodoList", "TodoItem (dirty)"].map((node) => (
                <button
                  key={node}
                  onClick={() => setActiveFiberNode(node)}
                  className={`rounded-xl border px-3 py-2 text-xs font-mono transition-all ${
                    activeFiberNode === node
                      ? "border-sky-400 bg-sky-500/20 text-sky-200 shadow-glow font-bold"
                      : "border-border/60 bg-muted/20 hover:border-primary/50 text-muted-foreground"
                  }`}
                >
                  {node}
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-border/60 bg-background/90 p-4 text-xs">
              <span className="font-bold text-primary font-mono block mb-1">
                Fiber Node Inspection: {activeFiberNode}
              </span>
              <p className="text-muted-foreground leading-relaxed">
                {activeFiberNode === "App" &&
                  "Root HostFiber node. Holds workInProgress tree reference."}
                {activeFiberNode === "Header" &&
                  "Memoized component. Skipped during diffing because props are unchanged."}
                {activeFiberNode === "Sidebar" && "Static component layout subtree."}
                {activeFiberNode === "TodoList" &&
                  "Parent container fiber holding key reconciliation child list."}
                {activeFiberNode === "TodoItem (dirty)" &&
                  "State change triggered dirty flag (Placement/Update effect tag). Scheduled for Commit phase DOM update."}
              </p>
            </div>
          </div>
        )}

        {/* 4. STATE FLOW VISUALIZER */}
        {(diagramType === "state-flow" || diagramType === "custom") && (
          <div className="space-y-4 text-xs font-mono">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-3 rounded-xl border border-border/60 bg-background">
              <div className="p-2 rounded bg-primary/10 border border-primary/30 text-primary font-bold">
                1. User Action
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
              <div className="p-2 rounded bg-sky-500/10 border border-sky-500/30 text-sky-300 font-bold">
                2. setState() Dispatch
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
              <div className="p-2 rounded bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold">
                3. React Re-render
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
              <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold">
                4. Virtual DOM Commit
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
