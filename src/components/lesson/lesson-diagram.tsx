import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  RotateCcw,
  ArrowRight,
  Layers,
  Cpu,
  GitMerge,
  Activity,
  Laptop,
  Server,
  Code,
  Info,
  ChevronRight,
  Sparkles,
  Database,
  Globe,
  Settings,
  HelpCircle,
} from "lucide-react";

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

  // State for interactive timeline/stepper
  const [activeStepIdx, setActiveStepIdx] = useState(0);

  // State for Web Conversation animation
  const [webConvStep, setWebConvStep] = useState<
    "idle" | "requesting" | "processing" | "responding" | "completed"
  >("idle");
  const [webConvLog, setWebConvLog] = useState<string>("Ready to start the conversation.");

  // State for Flexbox playground
  const [flexDir, setFlexDir] = useState<"row" | "column">("row");
  const [justifyContent, setJustifyContent] = useState<"start" | "center" | "between">("between");

  // State for Box Model hover
  const [hoveredBoxLayer, setHoveredBoxLayer] = useState<
    "margin" | "border" | "padding" | "content" | null
  >(null);

  // State for HTML Tree selection
  const [selectedTreeNode, setSelectedTreeNode] = useState<string>("document");

  // State for syntax anatomy selection
  const [selectedAnatomyPart, setSelectedAnatomyPart] = useState<string>("none");

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

  // Web conversation trigger
  const runWebConversation = () => {
    setWebConvStep("requesting");
    setWebConvLog("1. Client sends HTTP GET request across the network...");

    setTimeout(() => {
      setWebConvStep("processing");
      setWebConvLog("2. Server receives request, parses headers, and checks database...");

      setTimeout(() => {
        setWebConvStep("responding");
        setWebConvLog("3. Server serializes HTML payload and sends HTTP 200 OK response...");

        setTimeout(() => {
          setWebConvStep("completed");
          setWebConvLog("4. Browser receives resource stream and renders pixels to screen!");
        }, 1500);
      }, 1500);
    }, 1500);
  };

  const resetWebConversation = () => {
    setWebConvStep("idle");
    setWebConvLog("Ready to start the conversation.");
  };

  // Determine actual visualization type dynamically based on title, description & diagramType
  const normalizedTitle = title.toLowerCase();
  const normalizedDesc = description?.toLowerCase() || "";

  let activeType:
    | "closure-scope"
    | "event-loop"
    | "fiber-tree"
    | "state-flow"
    | "flexbox"
    | "box-model"
    | "anatomy-element"
    | "html-tree"
    | "web-conversation"
    | "timeline"
    | "stepper";

  if (normalizedTitle.includes("flexbox") || normalizedDesc.includes("flexbox")) {
    activeType = "flexbox";
  } else if (normalizedTitle.includes("box model") || normalizedDesc.includes("box model")) {
    activeType = "box-model";
  } else if (normalizedTitle.includes("anatomy of") || normalizedTitle.includes("syntax of")) {
    activeType = "anatomy-element";
  } else if (normalizedTitle.includes("tree") || normalizedDesc.includes("dom tree")) {
    activeType = "html-tree";
  } else if (
    normalizedTitle.includes("web conversation") ||
    normalizedTitle.includes("who is responsible") ||
    (normalizedDesc.includes("client") && normalizedDesc.includes("server"))
  ) {
    activeType = "web-conversation";
  } else if (
    diagramType === "closure-scope" ||
    normalizedTitle.includes("closure") ||
    normalizedDesc.includes("closure")
  ) {
    activeType = "closure-scope";
  } else if (
    diagramType === "event-loop" ||
    normalizedTitle.includes("event loop") ||
    normalizedDesc.includes("event loop")
  ) {
    activeType = "event-loop";
  } else if (
    diagramType === "fiber-tree" ||
    normalizedTitle.includes("fiber") ||
    normalizedTitle.includes("reconciliation")
  ) {
    activeType = "fiber-tree";
  } else if (
    diagramType === "state-flow" ||
    normalizedTitle.includes("state flow") ||
    normalizedTitle.includes("setstate")
  ) {
    activeType = "state-flow";
  } else if (description && description.includes("→")) {
    activeType = "timeline";
  } else {
    activeType = "stepper";
  }

  // Parse steps for timelines and steppers
  let steps: string[] = [];
  if (activeType === "timeline" && description) {
    steps = description.split("→").map((s) => s.trim());
  } else if (activeType === "stepper" && description) {
    // Split description by sentences
    steps = description
      .split(/[.!?]\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((s) => (s.endsWith(".") ? s : s + "."));
  }

  return (
    <Card className="my-6 border-primary/30 bg-card/60 overflow-hidden shadow-elegant">
      <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {activeType === "closure-scope" && <Layers className="h-4 w-4 text-primary" />}
            {activeType === "event-loop" && <Cpu className="h-4 w-4 text-emerald-400" />}
            {activeType === "fiber-tree" && <GitMerge className="h-4 w-4 text-sky-400" />}
            {activeType === "state-flow" && <Activity className="h-4 w-4 text-purple-400" />}
            {activeType === "flexbox" && <Settings className="h-4 w-4 text-pink-400" />}
            {activeType === "box-model" && <Layers className="h-4 w-4 text-amber-500" />}
            {activeType === "anatomy-element" && <Code className="h-4 w-4 text-indigo-400" />}
            {activeType === "html-tree" && <GitMerge className="h-4 w-4 text-teal-400" />}
            {activeType === "web-conversation" && <Globe className="h-4 w-4 text-sky-500" />}
            {activeType === "timeline" && <Activity className="h-4 w-4 text-emerald-500" />}
            {activeType === "stepper" && <Info className="h-4 w-4 text-primary" />}
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px] uppercase font-mono border-primary/30">
            Interactive Visualizer
          </Badge>
        </div>
        {description && activeType !== "timeline" && activeType !== "stepper" && (
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
        )}
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        {/* 1. CLOSURE SCOPE VISUALIZER */}
        {activeType === "closure-scope" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Outer Scope Card */}
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
        {activeType === "event-loop" && (
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
        {activeType === "fiber-tree" && (
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
        {activeType === "state-flow" && (
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

        {/* 5. FLEXBOX PLAYGROUND VISUALIZER */}
        {activeType === "flexbox" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground font-mono">
                  DIRECTION:
                </span>
                <Button
                  size="xs"
                  variant={flexDir === "row" ? "default" : "outline"}
                  onClick={() => setFlexDir("row")}
                  className="text-[10px] h-6 px-2.5"
                >
                  row
                </Button>
                <Button
                  size="xs"
                  variant={flexDir === "column" ? "default" : "outline"}
                  onClick={() => setFlexDir("column")}
                  className="text-[10px] h-6 px-2.5"
                >
                  column
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground font-mono">
                  JUSTIFY-CONTENT:
                </span>
                <Button
                  size="xs"
                  variant={justifyContent === "start" ? "default" : "outline"}
                  onClick={() => setJustifyContent("start")}
                  className="text-[10px] h-6 px-2.5"
                >
                  flex-start
                </Button>
                <Button
                  size="xs"
                  variant={justifyContent === "center" ? "default" : "outline"}
                  onClick={() => setJustifyContent("center")}
                  className="text-[10px] h-6 px-2.5"
                >
                  center
                </Button>
                <Button
                  size="xs"
                  variant={justifyContent === "between" ? "default" : "outline"}
                  onClick={() => setJustifyContent("between")}
                  className="text-[10px] h-6 px-2.5"
                >
                  space-between
                </Button>
              </div>
            </div>

            {/* Simulated Canvas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 rounded-xl border border-border/80 bg-background/40 p-6 min-h-[180px] flex relative overflow-hidden">
                {/* Flex Container */}
                <div
                  className={`w-full h-full rounded-lg border-2 border-dashed border-primary/30 p-2 flex transition-all duration-300 ${
                    flexDir === "row" ? "flex-row" : "flex-col"
                  } ${
                    justifyContent === "start"
                      ? "justify-start"
                      : justifyContent === "center"
                        ? "justify-center"
                        : "justify-between"
                  } gap-2`}
                >
                  {[1, 2, 3].map((num) => (
                    <div
                      key={num}
                      className="w-12 h-12 rounded-lg bg-pink-500/20 border border-pink-500/50 flex items-center justify-center font-bold font-mono text-pink-300 shadow-glow"
                    >
                      {num}
                    </div>
                  ))}
                </div>

                {/* Main Axis Line */}
                <div
                  className={`absolute transition-all duration-300 pointer-events-none flex items-center justify-center text-[10px] font-mono text-pink-400 ${
                    flexDir === "row"
                      ? "left-6 right-6 bottom-1 h-4 flex-row border-b border-pink-500/40"
                      : "top-6 bottom-6 right-1 w-4 flex-col border-r border-pink-500/40"
                  }`}
                >
                  <span className="bg-background px-1.5 py-0.5 rounded border border-pink-500/20">
                    Main Axis ({flexDir})
                  </span>
                  <ChevronRight
                    className={`h-3.5 w-3.5 absolute ${
                      flexDir === "row"
                        ? "right-0 translate-x-1"
                        : "bottom-0 translate-y-1 rotate-90"
                    }`}
                  />
                </div>
              </div>

              {/* Flexbox Info Panel */}
              <div className="rounded-xl border border-border/80 bg-muted/10 p-4 space-y-3 text-xs leading-relaxed">
                <div>
                  <strong className="text-pink-400 block font-mono">Main Axis Details:</strong>
                  <p className="text-muted-foreground mt-0.5">
                    Aligns children on the{" "}
                    <strong>{flexDir === "row" ? "horizontal" : "vertical"}</strong> axis.
                  </p>
                </div>
                <div>
                  <strong className="text-pink-400 block font-mono">justify-content:</strong>
                  <p className="text-muted-foreground mt-0.5">
                    Currently set to <strong>{justifyContent}</strong>, determining how the
                    remaining space along the axis is distributed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. BOX MODEL VISUALIZER */}
        {activeType === "box-model" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Box representation */}
              <div className="flex flex-col items-center justify-center p-4 bg-background/50 rounded-xl border border-border/80 min-h-[220px]">
                {/* Margin */}
                <div
                  onMouseEnter={() => setHoveredBoxLayer("margin")}
                  onMouseLeave={() => setHoveredBoxLayer(null)}
                  className={`w-full max-w-[280px] rounded-xl p-3 border text-center transition-all cursor-pointer ${
                    hoveredBoxLayer === "margin"
                      ? "bg-amber-500/20 border-amber-500 shadow-glow"
                      : "bg-amber-500/5 border-amber-500/20"
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold text-amber-500 uppercase block mb-1">
                    Margin
                  </span>

                  {/* Border */}
                  <div
                    onMouseEnter={(e) => {
                      e.stopPropagation();
                      setHoveredBoxLayer("border");
                    }}
                    onMouseLeave={() => setHoveredBoxLayer(null)}
                    className={`rounded-lg p-3 border text-center transition-all ${
                      hoveredBoxLayer === "border"
                        ? "bg-blue-500/20 border-blue-500 shadow-glow"
                        : "bg-blue-500/5 border-blue-500/20"
                    }`}
                  >
                    <span className="text-[10px] font-mono font-bold text-blue-400 uppercase block mb-1">
                      Border
                    </span>

                    {/* Padding */}
                    <div
                      onMouseEnter={(e) => {
                        e.stopPropagation();
                        setHoveredBoxLayer("padding");
                      }}
                      onMouseLeave={() => setHoveredBoxLayer(null)}
                      className={`rounded p-3 border text-center transition-all ${
                        hoveredBoxLayer === "padding"
                          ? "bg-emerald-500/20 border-emerald-500 shadow-glow"
                          : "bg-emerald-500/5 border-emerald-500/20"
                      }`}
                    >
                      <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase block mb-1">
                        Padding
                      </span>

                      {/* Content */}
                      <div
                        onMouseEnter={(e) => {
                          e.stopPropagation();
                          setHoveredBoxLayer("content");
                        }}
                        onMouseLeave={() => setHoveredBoxLayer(null)}
                        className={`rounded border p-3 text-center transition-all ${
                          hoveredBoxLayer === "content"
                            ? "bg-purple-500/25 border-purple-500 shadow-glow"
                            : "bg-purple-500/10 border-purple-500/20"
                        }`}
                      >
                        <span className="text-[10px] font-mono font-bold text-purple-400 uppercase block mb-0.5">
                          Content
                        </span>
                        <div className="text-xs font-mono text-purple-200">element.innerText</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Explanatory text */}
              <div className="rounded-xl border border-border/80 bg-muted/10 p-4 flex flex-col justify-center">
                <div className="text-xs font-semibold text-muted-foreground font-mono uppercase mb-2">
                  Interactive Node Inspector
                </div>
                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-background/80 border border-border/40 text-xs min-h-[100px] flex flex-col justify-center">
                    {!hoveredBoxLayer ? (
                      <div className="text-muted-foreground italic text-center">
                        Hover over any nested box layer to inspect its role and properties!
                      </div>
                    ) : (
                      <>
                        <strong
                          className={`font-mono text-sm uppercase block mb-1 ${
                            hoveredBoxLayer === "margin"
                              ? "text-amber-500"
                              : hoveredBoxLayer === "border"
                                ? "text-blue-400"
                                : hoveredBoxLayer === "padding"
                                  ? "text-emerald-400"
                                  : "text-purple-400"
                          }`}
                        >
                          {hoveredBoxLayer} Layer
                        </strong>
                        <p className="text-muted-foreground leading-relaxed">
                          {hoveredBoxLayer === "margin" &&
                            "Creates invisible spacing outside the element, pushing it away from neighboring elements. Margin collapses vertically in flow layouts."}
                          {hoveredBoxLayer === "border" &&
                            "Acts as the physical perimeter. Can be styled with borders, patterns, and radii. Sits between Padding and Margin."}
                          {hoveredBoxLayer === "padding" &&
                            "Creates spacing inside the box, around the content. Background colors/images extend into padding. Perfect for giving text breathing room."}
                          {hoveredBoxLayer === "content" &&
                            "The actual meat of the element. Where text, children, images, and nested structures live. Sized by width and height."}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. ANATOMY ELEMENT VISUALIZER */}
        {activeType === "anatomy-element" && (
          <div className="space-y-4">
            <div className="p-4 bg-background/90 rounded-xl border border-border/80 flex flex-wrap justify-center gap-1 font-mono text-sm sm:text-base select-none">
              <span
                onMouseEnter={() => setSelectedAnatomyPart("opening")}
                onMouseLeave={() => setSelectedAnatomyPart("none")}
                className={`p-1 rounded cursor-pointer transition-all ${
                  selectedAnatomyPart === "opening"
                    ? "bg-primary/25 text-primary font-bold shadow-glow"
                    : "hover:bg-muted"
                }`}
              >
                &lt;p
              </span>
              <span
                onMouseEnter={() => setSelectedAnatomyPart("attribute")}
                onMouseLeave={() => setSelectedAnatomyPart("none")}
                className={`p-1 rounded cursor-pointer transition-all ${
                  selectedAnatomyPart === "attribute"
                    ? "bg-amber-500/25 text-amber-300 font-bold shadow-glow"
                    : "hover:bg-muted"
                }`}
              >
                class="highlight"
              </span>
              <span
                onMouseEnter={() => setSelectedAnatomyPart("opening")}
                onMouseLeave={() => setSelectedAnatomyPart("none")}
                className={`p-1 rounded cursor-pointer transition-all ${
                  selectedAnatomyPart === "opening"
                    ? "bg-primary/25 text-primary font-bold shadow-glow"
                    : "hover:bg-muted"
                }`}
              >
                &gt;
              </span>
              <span
                onMouseEnter={() => setSelectedAnatomyPart("content")}
                onMouseLeave={() => setSelectedAnatomyPart("none")}
                className={`p-1 rounded cursor-pointer transition-all ${
                  selectedAnatomyPart === "content"
                    ? "bg-emerald-500/25 text-emerald-300 font-bold shadow-glow"
                    : "hover:bg-muted"
                }`}
              >
                Hello, Forge.
              </span>
              <span
                onMouseEnter={() => setSelectedAnatomyPart("closing")}
                onMouseLeave={() => setSelectedAnatomyPart("none")}
                className={`p-1 rounded cursor-pointer transition-all ${
                  selectedAnatomyPart === "closing"
                    ? "bg-indigo-500/25 text-indigo-300 font-bold shadow-glow"
                    : "hover:bg-muted"
                }`}
              >
                &lt;/p&gt;
              </span>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/10 p-4 text-xs leading-relaxed min-h-[90px] flex flex-col justify-center">
              {selectedAnatomyPart === "none" && (
                <p className="text-muted-foreground italic text-center">
                  Hover over the syntax segments above to analyze element anatomy!
                </p>
              )}
              {selectedAnatomyPart === "opening" && (
                <div>
                  <strong className="text-primary font-mono text-sm block mb-1">
                    Opening Tag (&lt;p&gt;)
                  </strong>
                  <p className="text-muted-foreground">
                    Marks the start of the element and declares its type (in this case, a
                    paragraph). It tells the browser how to structure and interpret what follows.
                  </p>
                </div>
              )}
              {selectedAnatomyPart === "attribute" && (
                <div>
                  <strong className="text-amber-400 font-mono text-sm block mb-1">
                    Attribute (class="highlight")
                  </strong>
                  <p className="text-muted-foreground">
                    Key-value pair placed inside opening tags to add configuration, classes, styles,
                    identifiers, or custom behavior data to the node.
                  </p>
                </div>
              )}
              {selectedAnatomyPart === "content" && (
                <div>
                  <strong className="text-emerald-400 font-mono text-sm block mb-1">
                    Element Content
                  </strong>
                  <p className="text-muted-foreground">
                    The actual information wrapped by the tags. This can be text, text nodes,
                    images, or nested children HTML structures.
                  </p>
                </div>
              )}
              {selectedAnatomyPart === "closing" && (
                <div>
                  <strong className="text-indigo-400 font-mono text-sm block mb-1">
                    Closing Tag (&lt;/p&gt;)
                  </strong>
                  <p className="text-muted-foreground">
                    Includes a forward slash and signals the browser that the element has ended,
                    ensuring valid nested structures on the page.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 8. HTML TREE STRUCTURE VISUALIZER */}
        {activeType === "html-tree" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tree node explorer */}
              <div className="p-4 bg-background/50 rounded-xl border border-border/80 flex flex-col gap-2 font-mono text-xs select-none">
                <div
                  onClick={() => setSelectedTreeNode("document")}
                  className={`p-2 rounded cursor-pointer border ${
                    selectedTreeNode === "document"
                      ? "border-teal-500 bg-teal-500/10 text-teal-300 font-bold"
                      : "border-transparent hover:bg-muted"
                  }`}
                >
                  📄 document (Root Node)
                </div>
                <div className="pl-4 flex flex-col gap-1 border-l border-border/60 ml-2">
                  <div
                    onClick={() => setSelectedTreeNode("html")}
                    className={`p-1.5 rounded cursor-pointer border ${
                      selectedTreeNode === "html"
                        ? "border-teal-500 bg-teal-500/10 text-teal-300 font-bold"
                        : "border-transparent hover:bg-muted"
                    }`}
                  >
                    📂 &lt;html&gt;
                  </div>
                  <div className="pl-4 flex flex-col gap-1 border-l border-border/60 ml-2">
                    <div
                      onClick={() => setSelectedTreeNode("head")}
                      className={`p-1.5 rounded cursor-pointer border ${
                        selectedTreeNode === "head"
                          ? "border-teal-500 bg-teal-500/10 text-teal-300 font-bold"
                          : "border-transparent hover:bg-muted"
                      }`}
                    >
                      📂 &lt;head&gt;
                    </div>
                    <div
                      onClick={() => setSelectedTreeNode("body")}
                      className={`p-1.5 rounded cursor-pointer border ${
                        selectedTreeNode === "body"
                          ? "border-teal-500 bg-teal-500/10 text-teal-300 font-bold"
                          : "border-transparent hover:bg-muted"
                      }`}
                    >
                      📂 &lt;body&gt;
                    </div>
                    <div className="pl-4 flex flex-col gap-1 border-l border-border/60 ml-2">
                      <div
                        onClick={() => setSelectedTreeNode("heading")}
                        className={`p-1.5 rounded cursor-pointer border ${
                          selectedTreeNode === "heading"
                            ? "border-teal-500 bg-teal-500/10 text-teal-300 font-bold"
                            : "border-transparent hover:bg-muted"
                        }`}
                      >
                        🏷️ &lt;h1&gt; "Forge"
                      </div>
                      <div
                        onClick={() => setSelectedTreeNode("paragraph")}
                        className={`p-1.5 rounded cursor-pointer border ${
                          selectedTreeNode === "paragraph"
                            ? "border-teal-500 bg-teal-500/10 text-teal-300 font-bold"
                            : "border-transparent hover:bg-muted"
                        }`}
                      >
                        🏷️ &lt;p&gt; "Learning loops."
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Inspector panel */}
              <div className="rounded-xl border border-border/80 bg-muted/10 p-4 flex flex-col justify-center min-h-[200px]">
                <div className="text-xs font-semibold text-muted-foreground font-mono uppercase mb-2">
                  DOM Node Inspector
                </div>
                <div className="space-y-3 text-xs leading-relaxed">
                  <div>
                    <span className="font-bold text-teal-400 font-mono block text-sm">
                      Active:{" "}
                      {selectedTreeNode === "document" ? "document" : `<${selectedTreeNode}>`}
                    </span>
                    <p className="text-muted-foreground mt-1">
                      {selectedTreeNode === "document" &&
                        "The topmost object of the webpage. Represents the entire window/page document, serving as the entry point into the tree structure."}
                      {selectedTreeNode === "html" &&
                        "The root wrapper element of the document. Contains all other tags on the page."}
                      {selectedTreeNode === "head" &&
                        "Contains machine-readable information (metadata) about the page, such as page title, character set, linked CSS files, and SEO metadata. Does not render pixels directly."}
                      {selectedTreeNode === "body" &&
                        "Contains the visible content of the document. Everything inside this element is rendered by the browser on the viewport canvas."}
                      {selectedTreeNode === "heading" &&
                        "An H1 leaf node nested inside body. Displays visual layout heading with default larger sizes and bold tracking."}
                      {selectedTreeNode === "paragraph" &&
                        "A paragraph layout block wrapping textual element nodes. Sibling element to the <h1> heading."}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-border/40 font-mono text-[10px] text-muted-foreground">
                    <div>
                      Parent Node:{" "}
                      <span className="text-teal-400">
                        {selectedTreeNode === "document"
                          ? "none"
                          : selectedTreeNode === "html"
                            ? "document"
                            : selectedTreeNode === "head" || selectedTreeNode === "body"
                              ? "html"
                              : "body"}
                      </span>
                    </div>
                    <div>
                      Children Nodes:{" "}
                      <span className="text-teal-400">
                        {selectedTreeNode === "document"
                          ? "html"
                          : selectedTreeNode === "html"
                            ? "head, body"
                            : selectedTreeNode === "body"
                              ? "h1, p"
                              : "none (leaf node)"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 9. WEB CONVERSATION VISUALIZER */}
        {activeType === "web-conversation" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Interaction diagram */}
              <div className="rounded-xl border border-border/80 bg-background/50 p-4 min-h-[180px] flex flex-col justify-between select-none">
                <div className="flex items-center justify-around py-4 relative">
                  {/* Client */}
                  <div className="flex flex-col items-center gap-1.5 z-10">
                    <div
                      className={`p-3 rounded-full border transition-all ${
                        webConvStep === "requesting" || webConvStep === "completed"
                          ? "bg-sky-500/20 border-sky-400 shadow-glow text-sky-300"
                          : "bg-muted border-border"
                      }`}
                    >
                      <Laptop className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase text-muted-foreground">
                      Browser / Client
                    </span>
                  </div>

                  {/* Packet tracker */}
                  <div className="absolute left-1/4 right-1/4 h-1.5 bg-muted/40 rounded-full overflow-hidden top-9 border border-border/30">
                    {webConvStep === "requesting" && (
                      <div
                        className="h-full w-4 bg-sky-400 rounded-full animate-ping absolute left-0"
                        style={{ animationDuration: "1.5s", animationIterationCount: "infinite" }}
                      />
                    )}
                    {webConvStep === "responding" && (
                      <div
                        className="h-full w-4 bg-emerald-400 rounded-full animate-ping absolute right-0"
                        style={{ animationDuration: "1.5s", animationIterationCount: "infinite" }}
                      />
                    )}
                  </div>

                  {/* Server */}
                  <div className="flex flex-col items-center gap-1.5 z-10">
                    <div
                      className={`p-3 rounded-full border transition-all ${
                        webConvStep === "processing" || webConvStep === "responding"
                          ? "bg-emerald-500/20 border-emerald-400 shadow-glow text-emerald-300"
                          : "bg-muted border-border"
                      }`}
                    >
                      <Server className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase text-muted-foreground">
                      App Server
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 border-t border-border/40 pt-3">
                  <Button
                    size="sm"
                    onClick={runWebConversation}
                    disabled={webConvStep !== "idle" && webConvStep !== "completed"}
                    className="gap-1 text-xs flex-1"
                  >
                    <Play className="h-3 w-3" />
                    Trigger Request
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetWebConversation}
                    className="text-xs"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Status log panel */}
              <div className="rounded-xl border border-border/80 bg-muted/10 p-4 flex flex-col justify-center min-h-[180px]">
                <div className="text-xs font-semibold text-muted-foreground font-mono uppercase mb-2">
                  Conversation Logs
                </div>
                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-background/80 border border-border/40 font-mono text-xs min-h-[90px] flex items-center justify-center">
                    <span
                      className={
                        webConvStep === "requesting"
                          ? "text-sky-400"
                          : webConvStep === "processing"
                            ? "text-amber-400"
                            : webConvStep === "responding"
                              ? "text-emerald-400"
                              : webConvStep === "completed"
                                ? "text-emerald-400 font-bold"
                                : "text-muted-foreground italic"
                      }
                    >
                      {webConvLog}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 10. ARROW-BASED TIMELINE VISUALIZER */}
        {activeType === "timeline" && (
          <div className="space-y-4">
            <div className="relative border-l-2 border-primary/30 pl-4 space-y-4 text-xs font-mono">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveStepIdx(idx)}
                  className={`relative p-3 rounded-xl border transition-all cursor-pointer ${
                    activeStepIdx === idx
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-200 shadow-glow font-bold"
                      : "border-border/60 bg-muted/10 hover:border-emerald-500/40 text-muted-foreground"
                  }`}
                >
                  {/* Glowing dot index marker */}
                  <div
                    className={`absolute -left-[23px] top-[15px] h-2.5 w-2.5 rounded-full border border-background transition-all ${
                      activeStepIdx === idx
                        ? "bg-emerald-400 animate-pulse scale-125 shadow-glow"
                        : "bg-muted-foreground"
                    }`}
                  />
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] uppercase font-bold text-emerald-400">
                    <span>
                      Step {idx + 1} of {steps.length}
                    </span>
                  </div>
                  <p className="leading-relaxed font-sans text-xs">{step}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border/40">
              <span className="text-[11px] text-muted-foreground">
                Step through each timeline phase to review progression sequence!
              </span>
              <Button
                size="sm"
                onClick={() => setActiveStepIdx((idx) => (idx + 1) % steps.length)}
                className="gap-1.5 text-xs border border-emerald-500/30 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300"
              >
                Next Phase <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* 11. GENERAL STEPPER VISUALIZER */}
        {activeType === "stepper" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 min-h-[140px] flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-primary uppercase">
                  <span>Concept Breakout</span>
                  <span>·</span>
                  <span>
                    Node {activeStepIdx + 1} of {steps.length || 1}
                  </span>
                </div>
                <p className="text-xs sm:text-xs leading-relaxed text-foreground/90">
                  {steps[activeStepIdx] ||
                    description ||
                    "Detailed interactive walkthrough of this core curriculum concept."}
                </p>
              </div>

              {/* Indicator Circles */}
              {steps.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 pt-4">
                  {steps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveStepIdx(i)}
                      className={`h-2 w-2 rounded-full transition-all ${
                        activeStepIdx === i
                          ? "bg-primary w-4"
                          : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {steps.length > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <Button
                  size="xs"
                  variant="ghost"
                  disabled={activeStepIdx === 0}
                  onClick={() => setActiveStepIdx((i) => Math.max(0, i - 1))}
                  className="text-[11px] h-7 px-2.5"
                >
                  Previous
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => setActiveStepIdx((i) => (i + 1) % steps.length)}
                  className="text-[11px] h-7 px-2.5 border-primary/30 hover:bg-primary/10 text-primary"
                >
                  Next Explanation
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
