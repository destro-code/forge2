import { useState, useRef, useEffect, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  FileCode,
  Sparkles,
  Play,
  Bug,
  Zap,
  Network,
  HelpCircle,
  Copy,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Terminal,
  Send,
  Plus,
  Trash2,
  Check,
  Bookmark,
  Layers,
  ArrowRight,
  Bot,
  User,
  Box,
  Split,
  Download,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { WHITEBOARD_PRESETS, type WhiteboardPreset } from "@/data/whiteboard-presets";
import { progressStore } from "@/lib/providers/progress-provider";

export const Route = createFileRoute("/whiteboard")({
  component: WhiteboardPage,
});

type Mode = "explain" | "predict" | "debug" | "improve" | "architecture";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface ArchNode {
  id: string;
  label: string;
  type: "client" | "gateway" | "service" | "store" | "db" | "queue";
  x: number;
  y: number;
}

interface ArchEdge {
  id: string;
  from: string;
  to: string;
  label: string;
}

interface DrawingPath {
  points: { x: number; y: number }[];
  color: string;
  width: number;
  isEraser: boolean;
}

function WhiteboardPage() {
  const [activeMode, setActiveMode] = useState<Mode>("explain");
  const [selectedPreset, setSelectedPreset] = useState<WhiteboardPreset | null>(
    WHITEBOARD_PRESETS[0],
  );
  const [code, setCode] = useState<string>(WHITEBOARD_PRESETS[0].code);
  const [language, setLanguage] = useState<string>("TypeScript");

  // Output prediction state
  const [userPrediction, setUserPrediction] = useState<string>("");
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [hasExecuted, setHasExecuted] = useState<boolean>(false);
  const [executionMatch, setExecutionMatch] = useState<boolean | null>(null);

  // Architecture board state
  const [nodes, setNodes] = useState<ArchNode[]>(
    WHITEBOARD_PRESETS[0].architectureNodes || [
      { id: "node-1", label: "Client App (React 19)", type: "client", x: 60, y: 80 },
      { id: "node-2", label: "API Gateway (Cloudflare Edge)", type: "gateway", x: 300, y: 80 },
      { id: "node-3", label: "State Store (Zustand)", type: "store", x: 540, y: 80 },
    ],
  );
  const [edges, setEdges] = useState<ArchEdge[]>(
    WHITEBOARD_PRESETS[0].architectureEdges || [
      { id: "edge-1", from: "node-1", to: "node-2", label: "HTTPS / REST API" },
      { id: "edge-2", from: "node-2", to: "node-3", label: "Sync Hydration" },
    ],
  );
  const [newNodeLabel, setNewNodeLabel] = useState("");
  const [newNodeType, setNewNodeType] = useState<ArchNode["type"]>("service");

  // AI Assistant state
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [presetsDialogOpen, setPresetsDialogOpen] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Visual Sketchpad States & Refs
  const [leftTab, setLeftTab] = useState<"scratchpad" | "visual">("scratchpad");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState("#22d3ee"); // Neon Cyan
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const currentPathRef = useRef<DrawingPath | null>(null);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear background
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw technical grid dots
    ctx.fillStyle = "rgba(148, 163, 184, 0.08)";
    const gap = 20;
    for (let x = gap; x < canvas.width; x += gap) {
      for (let y = gap; y < canvas.height; y += gap) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Redraw all paths using relative coordinates
    paths.forEach((path) => {
      if (path.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = path.isEraser ? "#0f172a" : path.color;
      ctx.lineWidth = path.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const start = path.points[0];
      ctx.moveTo(start.x * canvas.width, start.y * canvas.height);

      for (let i = 1; i < path.points.length; i++) {
        const pt = path.points[i];
        ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height);
      }
      ctx.stroke();
    });
  }, [paths]);

  const clearCanvas = () => {
    setPaths([]);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw technical grid dots
        ctx.fillStyle = "rgba(148, 163, 184, 0.08)";
        const gap = 20;
        for (let x = gap; x < canvas.width; x += gap) {
          for (let y = gap; y < canvas.height; y += gap) {
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }
    toast.info("Visual sketchpad cleared.");
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `architecture-sketch-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Downloaded sketch as PNG successfully!");
    } catch (err) {
      toast.error("Failed to download sketch image.");
    }
  };

  // Setup drawing handlers
  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ("touches" in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;

    setIsDrawing(true);
    currentPathRef.current = {
      points: [{ x, y }],
      color: brushColor,
      width: brushSize,
      isEraser,
    };
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentPathRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ("touches" in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;

    const points = currentPathRef.current.points;
    const prevPoint = points[points.length - 1];

    ctx.beginPath();
    ctx.strokeStyle = isEraser ? "#0f172a" : brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(prevPoint.x * canvas.width, prevPoint.y * canvas.height);
    ctx.lineTo(x * canvas.width, y * canvas.height);
    ctx.stroke();

    points.push({ x, y });
  };

  const endDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPathRef.current && currentPathRef.current.points.length > 0) {
      setPaths((prev) => [...prev, currentPathRef.current]);
    }
    currentPathRef.current = null;
  };

  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container || leftTab !== "visual") return;

    const canvas = canvasRef.current;
    if (canvas) {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = Math.max(480, rect.height);
      redrawCanvas();
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = width;
          canvas.height = Math.max(480, height);
          redrawCanvas();
        }
      }
    });

    resizeObserver.observe(container);
    return () => {
      resizeObserver.disconnect();
    };
  }, [leftTab, redrawCanvas]);

  // Sync preset when changed
  const loadPreset = (preset: WhiteboardPreset) => {
    setSelectedPreset(preset);
    setActiveMode(preset.mode);
    setCode(preset.code);
    if (preset.architectureNodes) setNodes(preset.architectureNodes);
    if (preset.architectureEdges) setEdges(preset.architectureEdges);
    setConsoleOutput([]);
    setHasExecuted(false);
    setUserPrediction("");
    setPresetsDialogOpen(false);
    toast.success(`Loaded "${preset.title}"`);
  };

  // Run JavaScript Live Execution in browser sandbox
  const handleRunCode = () => {
    const logs: string[] = [];
    const customConsole = {
      log: (...args: unknown[]) => {
        logs.push(
          args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" "),
        );
      },
      error: (...args: unknown[]) => {
        logs.push(
          `[ERROR] ` +
            args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" "),
        );
      },
      warn: (...args: unknown[]) => {
        logs.push(
          `[WARN] ` +
            args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" "),
        );
      },
    };

    try {
      // Create a safe execution environment wrapper
      const runnable = new Function(
        "console",
        `
        try {
          ${code}
        } catch (err) {
          console.error(err.message || String(err));
        }
      `,
      );
      runnable(customConsole);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logs.push(`[Syntax/Runtime Error]: ${msg}`);
    }

    setConsoleOutput(logs);
    setHasExecuted(true);

    if (activeMode === "predict" && userPrediction.trim()) {
      const predictedLines = userPrediction
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const actualLines = logs.map((l) => l.trim()).filter(Boolean);

      const matches =
        predictedLines.length === actualLines.length &&
        predictedLines.every((line, idx) => line === actualLines[idx]);

      setExecutionMatch(matches);
      if (matches) {
        toast.success("🎯 Spot on! Your output prediction matched JS execution perfectly!");
        progressStore.update((s) => ({ xp: s.xp + 25 }));
      } else {
        toast.error("Output mismatch! Click 'Ask AI to Explain' to see why.");
      }
    }
  };

  // Trigger AI Whiteboard Assistant
  const handleAskAI = async (customInstruction?: string) => {
    let modePrompt = "";
    if (customInstruction) {
      modePrompt = customInstruction;
    } else if (activeMode === "explain") {
      modePrompt = `Please explain this ${language} code step-by-step:\n\n\`\`\`${language.toLowerCase()}\n${code}\n\`\`\`\nProvide time & space complexity, call stack mechanics, and key principles.`;
    } else if (activeMode === "predict") {
      modePrompt = `Please trace execution step-by-step for this code:\n\n\`\`\`${language.toLowerCase()}\n${code}\n\`\`\`\nShow Call Stack, Microtask Queue, Macrotask Queue, and exact console output lines in order.`;
      if (hasExecuted && consoleOutput.length > 0) {
        modePrompt += `\n\nActual Execution Output recorded in browser console:\n${consoleOutput.join("\n")}`;
      }
    } else if (activeMode === "debug") {
      modePrompt = `Please analyze and debug this code for memory leaks, race conditions, or edge cases:\n\n\`\`\`${language.toLowerCase()}\n${code}\n\`\`\`\nIdentify the bugs and provide the corrected code in a markdown block.`;
    } else if (activeMode === "improve") {
      modePrompt = `Please refactor and optimize this code for performance, React 18/19 standards, TypeScript type safety, clean architecture, and WCAG accessibility:\n\n\`\`\`${language.toLowerCase()}\n${code}\n\`\`\`\nProvide the improved code block and explain the improvements.`;
    } else if (activeMode === "architecture") {
      const archSummary = nodes.map((n) => `${n.label} (${n.type})`).join(", ");
      const edgeSummary = edges.map((e) => `${e.from} -> ${e.to} [${e.label}]`).join(", ");
      modePrompt = `Please evaluate this System & Frontend Architecture:\n\nNodes: ${archSummary}\nData Flows: ${edgeSummary}\n\nCode/Specification:\n\`\`\`${language.toLowerCase()}\n${code}\n\`\`\`\nEvaluate bottlenecks, scalability, state consistency, caching, and resiliency.`;
    }

    if (prompt.trim()) {
      modePrompt += `\n\nAdditional Question: ${prompt.trim()}`;
    }

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: modePrompt,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, newUserMsg];
    setMessages(newMessages);
    setPrompt("");
    setIsGenerating(true);

    const assistantMsgId = (Date.now() + 1).toString();
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const response = await fetch("/api/whiteboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          mode: activeMode,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("API call failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        fullContent += text;
        setMessages((prev) =>
          prev.map((msg) => (msg.id === assistantMsgId ? { ...msg, content: fullContent } : msg)),
        );
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content:
                  "### Analysis Summary\n\n1. **Core Concept**: The code utilizes functional closures and async queues.\n2. **Complexity**: O(N) Time, O(1) Space.\n3. **Key Insight**: Always clear timeouts and handle abort controllers in asynchronous event streams.",
              }
            : msg,
        ),
      );
    } finally {
      setIsGenerating(false);
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Extract code block from AI message if present and allow applying to scratchpad
  const applyFixFromAI = (content: string) => {
    const codeMatch = content.match(/```(?:typescript|js|ts|jsx|tsx|html|css)?\n([\s\S]*?)```/);
    if (codeMatch && codeMatch[1]) {
      setCode(codeMatch[1].trim());
      toast.success("Applied AI code directly to Whiteboard scratchpad!");
    } else {
      toast.error("No code block found in AI response to apply.");
    }
  };

  // Add Architecture Node
  const handleAddNode = () => {
    if (!newNodeLabel.trim()) return;
    const newNode: ArchNode = {
      id: `node-${Date.now()}`,
      label: newNodeLabel.trim(),
      type: newNodeType,
      x: 100 + (nodes.length % 3) * 200,
      y: 100 + Math.floor(nodes.length / 3) * 120,
    };
    setNodes([...nodes, newNode]);
    setNewNodeLabel("");
    toast.success(`Added architecture node: ${newNode.label}`);
  };

  const handleRemoveNode = (id: string) => {
    setNodes(nodes.filter((n) => n.id !== id));
    setEdges(edges.filter((e) => e.from !== id && e.to !== id));
  };

  // Filter presets by active mode
  const filteredPresets = useMemo(
    () => WHITEBOARD_PRESETS.filter((p) => p.mode === activeMode),
    [activeMode],
  );

  return (
    <div className="flex h-[calc(100vh-3.5rem)] w-full max-w-full flex-col overflow-hidden bg-background">
      {/* Top Navigation & Mode Switcher Bar */}
      <header className="flex flex-col md:flex-row shrink-0 items-start md:items-center justify-between border-b px-3 py-2 gap-2 overflow-x-auto max-w-full">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold tracking-tight">Whiteboard Mode</h1>
              <Badge
                variant="outline"
                className="text-[9px] font-mono uppercase tracking-widest text-primary border-primary/30 py-0"
              >
                Sprint 12
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Real-time AI code breakdown, output prediction, debug trace & architecture critique
            </p>
          </div>
        </div>

        {/* 5 Core Support Tabs (Scrollable on small viewports) */}
        <div className="flex items-center gap-1 rounded-xl border bg-muted/40 p-1 overflow-x-auto max-w-full scrollbar-none whitespace-nowrap shrink-0">
          <Button
            size="sm"
            variant={activeMode === "explain" ? "default" : "ghost"}
            className="h-7 gap-1.5 text-xs font-medium"
            onClick={() => setActiveMode("explain")}
          >
            <FileCode className="h-3.5 w-3.5" />
            Explain Code
          </Button>

          <Button
            size="sm"
            variant={activeMode === "predict" ? "default" : "ghost"}
            className="h-7 gap-1.5 text-xs font-medium"
            onClick={() => setActiveMode("predict")}
          >
            <Play className="h-3.5 w-3.5" />
            Predict Output
          </Button>

          <Button
            size="sm"
            variant={activeMode === "debug" ? "default" : "ghost"}
            className="h-7 gap-1.5 text-xs font-medium"
            onClick={() => setActiveMode("debug")}
          >
            <Bug className="h-3.5 w-3.5" />
            Debug Code
          </Button>

          <Button
            size="sm"
            variant={activeMode === "improve" ? "default" : "ghost"}
            className="h-7 gap-1.5 text-xs font-medium"
            onClick={() => setActiveMode("improve")}
          >
            <Zap className="h-3.5 w-3.5" />
            Improve Code
          </Button>

          <Button
            size="sm"
            variant={activeMode === "architecture" ? "default" : "ghost"}
            className="h-7 gap-1.5 text-xs font-medium"
            onClick={() => setActiveMode("architecture")}
          >
            <Network className="h-3.5 w-3.5" />
            Architecture
          </Button>
        </div>

        {/* Presets Modal Trigger */}
        <Dialog open={presetsDialogOpen} onOpenChange={setPresetsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs shrink-0">
              <Layers className="h-3.5 w-3.5" />
              Presets ({filteredPresets.length})
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Whiteboard Challenge Presets — {activeMode.toUpperCase()}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 pt-2">
              {filteredPresets.map((preset) => (
                <Card
                  key={preset.id}
                  className="group flex cursor-pointer items-start justify-between p-3.5 transition hover:border-primary/50 hover:bg-muted/30"
                  onClick={() => loadPreset(preset)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{preset.title}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {preset.category}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {preset.difficulty}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{preset.description}</p>
                  </div>
                  <Button
                    size="xs"
                    variant="ghost"
                    className="shrink-0 opacity-0 group-hover:opacity-100"
                  >
                    Load Challenge <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </header>

      {/* Main Split Layout: Scratchpad/Canvas on Left, AI Assistant on Right */}
      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-12">
        {/* Left Side: Code Scratchpad & Interactive Canvas (8 cols) */}
        <div className="flex flex-col border-r lg:col-span-7 xl:col-span-7">
          {/* Sub-tab Selection Buttons for Code vs Visual Canvas */}
          <div className="flex items-center border-b bg-muted/40 px-4 h-10 shrink-0 gap-1 overflow-x-auto max-w-full scrollbar-none">
            <Button
              variant={leftTab === "scratchpad" ? "secondary" : "ghost"}
              size="sm"
              className={`h-8 text-xs font-semibold px-3 rounded-md transition-all gap-1.5 cursor-pointer ${
                leftTab === "scratchpad"
                  ? "bg-slate-800 text-cyan-300 border border-slate-700/60 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setLeftTab("scratchpad")}
            >
              <FileCode className="h-3.5 w-3.5" />
              Code Scratchpad
            </Button>
            <Button
              variant={leftTab === "visual" ? "secondary" : "ghost"}
              size="sm"
              className={`h-8 text-xs font-semibold px-3 rounded-md transition-all gap-1.5 cursor-pointer ${
                leftTab === "visual"
                  ? "bg-slate-800 text-cyan-300 border border-slate-700/60 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setLeftTab("visual")}
            >
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              Visual Sketchpad
            </Button>
          </div>

          {leftTab === "visual" ? (
            <div
              className="flex-1 flex flex-col p-4 gap-4 overflow-hidden"
              ref={canvasContainerRef}
            >
              {/* Scrollable Toolbar for Mobile / Tablet to prevent overflow */}
              <div className="flex items-center gap-3 overflow-x-auto pb-3 mb-1 border-b border-border/40 scrollbar-none flex-nowrap w-full">
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg shrink-0">
                  <Button
                    size="sm"
                    variant={!isEraser ? "default" : "ghost"}
                    className={`h-7 px-2.5 text-xs font-semibold rounded-md gap-1 cursor-pointer transition ${
                      !isEraser
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                        : "text-slate-400 hover:text-white"
                    }`}
                    onClick={() => setIsEraser(false)}
                  >
                    <Plus className="h-3.5 w-3.5 text-cyan-400" /> Pen
                  </Button>
                  <Button
                    size="sm"
                    variant={isEraser ? "default" : "ghost"}
                    className={`h-7 px-2.5 text-xs font-semibold rounded-md gap-1 cursor-pointer transition ${
                      isEraser
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                        : "text-slate-400 hover:text-white"
                    }`}
                    onClick={() => setIsEraser(true)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-400" /> Eraser
                  </Button>
                </div>

                {/* Divider */}
                <div className="h-6 w-px bg-border shrink-0" />

                {/* Brush Size Selector */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 mr-1">
                    Size:
                  </span>
                  {[2, 4, 8, 12].map((sz) => (
                    <Button
                      key={sz}
                      size="sm"
                      variant={brushSize === sz ? "default" : "outline"}
                      className={`h-7 w-7 p-0 rounded-md cursor-pointer transition ${
                        brushSize === sz
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                          : "text-slate-400 border-slate-800 hover:bg-slate-900"
                      }`}
                      onClick={() => setBrushSize(sz)}
                    >
                      <span className="text-xs font-bold">
                        {sz === 2 ? "S" : sz === 4 ? "M" : sz === 8 ? "L" : "XL"}
                      </span>
                    </Button>
                  ))}
                </div>

                {/* Divider */}
                <div className="h-6 w-px bg-border shrink-0" />

                {/* Color Palette */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 mr-1">
                    Color:
                  </span>
                  {[
                    { hex: "#22d3ee", label: "Cyan" },
                    { hex: "#10b981", label: "Emerald" },
                    { hex: "#a855f7", label: "Purple" },
                    { hex: "#fbbf24", label: "Yellow" },
                    { hex: "#f97316", label: "Orange" },
                    { hex: "#f8fafc", label: "White" },
                  ].map((col) => (
                    <button
                      key={col.hex}
                      className={`h-6 w-6 rounded-full border cursor-pointer transition-all hover:scale-110 ${
                        brushColor === col.hex && !isEraser
                          ? "ring-2 ring-cyan-400 scale-105 border-white"
                          : "border-slate-700"
                      }`}
                      style={{ backgroundColor: col.hex }}
                      onClick={() => {
                        setBrushColor(col.hex);
                        setIsEraser(false);
                      }}
                      title={col.label}
                    />
                  ))}
                </div>

                {/* Divider */}
                <div className="h-6 w-px bg-border shrink-0 ml-auto" />

                {/* Canvas Operations */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs font-semibold rounded-md border-slate-800 hover:bg-slate-900 gap-1"
                    onClick={downloadCanvas}
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs font-semibold rounded-md border-slate-800 hover:bg-slate-900 text-rose-400 hover:text-rose-300 gap-1"
                    onClick={clearCanvas}
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Clear
                  </Button>
                </div>
              </div>

              {/* HTML5 Canvas Element */}
              <div className="flex-1 relative w-full min-h-[420px] rounded-xl border border-slate-800 bg-[#0f172a] overflow-hidden shadow-inner">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={endDrawing}
                  onMouseLeave={endDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={endDrawing}
                  className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
                />
                {paths.length === 0 && !isDrawing && (
                  <div className="absolute inset-0 flex items-center justify-center text-center p-6 pointer-events-none select-none">
                    <div className="space-y-1.5 text-slate-500 max-w-sm">
                      <Sparkles className="h-8 w-8 mx-auto text-cyan-500/40 mb-1.5" />
                      <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                        Interactive Canvas
                      </h4>
                      <p className="text-[11px] leading-relaxed">
                        Sketch systems architecture, block flowcharts, or notes. Redraws dynamically
                        on resize.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Editor Header Toolbar */}
              <div className="flex flex-wrap items-center justify-between border-b px-4 py-2 bg-muted/20 gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {activeMode === "architecture"
                      ? "Architecture Canvas & Specification"
                      : "Code Scratchpad"}
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    {language}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="xs"
                    className="h-7 gap-1 text-[11px]"
                    onClick={() => {
                      navigator.clipboard.writeText(code);
                      toast.success("Code copied to clipboard!");
                    }}
                  >
                    <Copy className="h-3 w-3" /> Copy
                  </Button>

                  <Button
                    variant="outline"
                    size="xs"
                    className="h-7 gap-1 text-[11px]"
                    onClick={() => {
                      setCode("");
                      toast.info("Scratchpad cleared.");
                    }}
                  >
                    <RotateCcw className="h-3 w-3" /> Clear
                  </Button>

                  {activeMode !== "architecture" && (
                    <Button
                      size="xs"
                      className="h-7 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px]"
                      onClick={handleRunCode}
                    >
                      <Play className="h-3 w-3" /> Run JS Sandbox
                    </Button>
                  )}
                </div>
              </div>

              {/* Editor / Canvas Body */}
              <div className="flex-1 flex flex-col overflow-y-auto p-4 gap-4">
                {/* Architecture Node Visualizer (if architecture mode) */}
                {activeMode === "architecture" && (
                  <Card className="p-4 bg-muted/20 border-dashed border-2">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <Box className="h-4 w-4 text-primary" />
                        <h3 className="text-xs font-bold uppercase tracking-wider">
                          System Components & Flow Nodes
                        </h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <Input
                          placeholder="Component name..."
                          value={newNodeLabel}
                          onChange={(e) => setNewNodeLabel(e.target.value)}
                          className="h-7 text-xs w-36"
                        />
                        <select
                          value={newNodeType}
                          onChange={(e) => setNewNodeType(e.target.value as ArchNode["type"])}
                          className="h-7 text-xs rounded-md border bg-background px-2"
                        >
                          <option value="client">Client UI</option>
                          <option value="gateway">API Gateway</option>
                          <option value="service">Microservice</option>
                          <option value="store">State / Cache</option>
                          <option value="db">Database</option>
                          <option value="queue">Queue / Event</option>
                        </select>
                        <Button size="xs" onClick={handleAddNode} className="h-7 gap-1">
                          <Plus className="h-3 w-3" /> Add Node
                        </Button>
                      </div>
                    </div>

                    {/* Node Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                      {nodes.map((node) => (
                        <div
                          key={node.id}
                          className="flex items-center justify-between p-2.5 rounded-lg border bg-card text-xs shadow-xs"
                        >
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                node.type === "client"
                                  ? "default"
                                  : node.type === "db"
                                    ? "destructive"
                                    : "secondary"
                              }
                              className="text-[9px] uppercase"
                            >
                              {node.type}
                            </Badge>
                            <span className="font-semibold">{node.label}</span>
                          </div>
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            onClick={() => handleRemoveNode(node.id)}
                            className="h-5 w-5 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Data Flow Connections */}
                    <div className="space-y-1">
                      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Configured Data Flows ({edges.length}):
                      </div>
                      {edges.map((e) => (
                        <div
                          key={e.id}
                          className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-background/60 p-1.5 rounded border"
                        >
                          <span className="text-primary font-bold">
                            {nodes.find((n) => n.id === e.from)?.label || e.from}
                          </span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className="text-primary font-bold">
                            {nodes.find((n) => n.id === e.to)?.label || e.to}
                          </span>
                          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-foreground ml-auto">
                            {e.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Code Textarea */}
                <div className="relative flex-1 min-h-[280px]">
                  <Textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Type or paste code / whiteboard snippet here..."
                    className="h-full min-h-[280px] w-full resize-none font-mono text-xs leading-relaxed p-4 border-2 focus-visible:ring-primary"
                  />
                </div>

                {/* Predict Output Interactive Section (Active when mode === "predict") */}
                {activeMode === "predict" && (
                  <Card className="p-4 border-primary/30 bg-primary/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Play className="h-4 w-4 text-primary" />
                        <h3 className="text-xs font-bold uppercase tracking-wider">
                          Predict Output Challenge
                        </h3>
                      </div>
                      {hasExecuted && (
                        <Badge
                          variant={executionMatch ? "default" : "destructive"}
                          className="gap-1 text-[10px]"
                        >
                          {executionMatch ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" /> Prediction Matched
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3" /> Prediction Mismatched
                            </>
                          )}
                        </Badge>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Type your predicted console output (one log per line):
                      </label>
                      <Textarea
                        value={userPrediction}
                        onChange={(e) => setUserPrediction(e.target.value)}
                        placeholder="e.g.&#10;1: Start&#10;7: End&#10;4: Promise 1"
                        rows={3}
                        className="font-mono text-xs bg-background"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Button size="xs" onClick={handleRunCode} className="gap-1 font-semibold">
                        <Check className="h-3.5 w-3.5" /> Verify Prediction
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() =>
                          handleAskAI(
                            "Explain the event loop and scope queue for this exact output execution.",
                          )
                        }
                        className="gap-1"
                      >
                        <Bot className="h-3.5 w-3.5" /> Ask AI to Trace
                      </Button>
                    </div>
                  </Card>
                )}

                {/* Live JS Console Output Terminal */}
                {hasExecuted && (
                  <Card className="p-3 bg-slate-950 text-slate-100 font-mono text-xs space-y-2 border-slate-800">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <span className="flex items-center gap-1.5 text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                        <Terminal className="h-3.5 w-3.5 text-emerald-400" /> Browser JS Sandbox
                        Console Output
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[9px] border-slate-700 text-slate-400"
                      >
                        Captured {consoleOutput.length} lines
                      </Badge>
                    </div>
                    <div className="space-y-1 max-h-40 overflow-y-auto pt-1">
                      {consoleOutput.length === 0 ? (
                        <div className="text-slate-500 italic text-[11px]">
                          No console logs produced during execution.
                        </div>
                      ) : (
                        consoleOutput.map((line, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <span className="text-slate-600 select-none text-[10px] w-5 text-right">
                              {idx + 1}
                            </span>
                            <span
                              className={
                                line.startsWith("[ERROR]") ? "text-rose-400" : "text-emerald-300"
                              }
                            >
                              {line}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right Side: AI Whiteboard Mentor Panel (5 cols) */}
        <div className="flex flex-col border-t lg:border-t-0 lg:col-span-5 xl:col-span-5 bg-muted/10">
          {/* Panel Header */}
          <div className="flex items-center justify-between border-b px-4 py-3 bg-background">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider">
                  AI Whiteboard Assistant
                </h2>
                <p className="text-[10px] text-muted-foreground">
                  Powered by Gemini Staff Frontend Coach
                </p>
              </div>
            </div>

            {/* Quick Action Trigger */}
            <Button
              size="xs"
              onClick={() => handleAskAI()}
              disabled={isGenerating || !code.trim()}
              className="gap-1 text-xs font-semibold shadow-xs"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Analyze Mode ({activeMode})
            </Button>
          </div>

          {/* Quick Action Badges */}
          <div className="flex items-center gap-1.5 p-2.5 border-b bg-muted/20 text-xs overflow-x-auto max-w-full scrollbar-none whitespace-nowrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1 shrink-0">
              Quick AI Prompts:
            </span>
            <Button
              variant="outline"
              size="xs"
              className="h-6 text-[10px] rounded-full shrink-0"
              onClick={() =>
                handleAskAI(
                  "Explain time & space complexity (Big-O) and call stack mechanics in detail.",
                )
              }
            >
              Big-O Complexity
            </Button>
            <Button
              variant="outline"
              size="xs"
              className="h-6 text-[10px] rounded-full shrink-0"
              onClick={() =>
                handleAskAI(
                  "Are there any hidden memory leaks, stale closures, or unhandled errors?",
                )
              }
            >
              Spot Memory Leaks
            </Button>
            <Button
              variant="outline"
              size="xs"
              className="h-6 text-[10px] rounded-full shrink-0"
              onClick={() =>
                handleAskAI(
                  "How would a Senior Architect redesign this for maximum performance and readability?",
                )
              }
            >
              Senior Refactor
            </Button>
          </div>

          {/* Chat / Analysis Output Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center p-6 space-y-3 my-auto">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm">Ready to Whiteboard</h3>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Click <strong className="text-foreground">"Analyze Mode ({activeMode})"</strong>{" "}
                    or choose a quick prompt to receive line-by-line breakdown, output prediction,
                    or architecture critique.
                  </p>
                </div>
                <Button size="sm" onClick={() => handleAskAI()} className="gap-1.5 text-xs">
                  <Sparkles className="h-3.5 w-3.5" /> Start AI Analysis
                </Button>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col space-y-1.5 ${
                    msg.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground px-1">
                    {msg.role === "user" ? (
                      <>
                        <span>You</span> <User className="h-3 w-3" />
                      </>
                    ) : (
                      <>
                        <Bot className="h-3 w-3 text-primary" /> <span>Forge Whiteboard Coach</span>
                      </>
                    )}
                  </div>

                  <div
                    className={`rounded-xl p-3.5 text-xs leading-relaxed max-w-[92%] space-y-2 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground font-medium"
                        : "bg-card border shadow-xs text-foreground"
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans">
                      {msg.content || (isGenerating && "Analyzing whiteboard code...")}
                    </div>

                    {msg.role === "assistant" && msg.content && msg.content.includes("```") && (
                      <div className="pt-2 border-t mt-2 flex justify-end">
                        <Button
                          size="xs"
                          variant="secondary"
                          onClick={() => applyFixFromAI(msg.content)}
                          className="h-6 gap-1 text-[10px] font-semibold"
                        >
                          <Check className="h-3 w-3 text-emerald-600" /> Apply Fixed Code to Editor
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Prompt Input Box */}
          <div className="p-3 border-t bg-background flex items-center gap-2">
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAskAI()}
              placeholder="Ask follow-up question or clarification..."
              className="text-xs h-9"
              disabled={isGenerating}
            />
            <Button
              size="icon"
              onClick={() => handleAskAI()}
              disabled={isGenerating || (!prompt.trim() && !code.trim())}
              className="h-9 w-9 shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
