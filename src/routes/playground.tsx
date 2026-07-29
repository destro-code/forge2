import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Play,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Clock,
  Code2,
  PanelLeft,
  Terminal,
  Monitor,
  Lightbulb,
  ShieldCheck,
} from "lucide-react";
import { useState, useCallback } from "react";

import type { PlaygroundFile, PlaygroundConsoleLog } from "@/lib/types/playground";
import { PLAYGROUND_PRESETS } from "@/lib/playground-data";
import { PlaygroundFileTree } from "@/components/playground/playground-file-tree";
import { PlaygroundTabs } from "@/components/playground/playground-tabs";
import { PlaygroundEditor } from "@/components/playground/playground-editor";
import { PlaygroundPreview } from "@/components/playground/playground-preview";
import { PlaygroundConsole } from "@/components/playground/playground-console";
import { PlaygroundSolutionModal } from "@/components/playground/playground-solution-modal";
import { PlaygroundCodeReviewerModal } from "@/components/playground/playground-code-reviewer-modal";

export const Route = createFileRoute("/playground")({
  head: () => ({
    meta: [
      { title: "Playground · Forge" },
      {
        name: "description",
        content:
          "Full Monaco editor, multi-file explorer, live preview, console stream, and reference solution comparison.",
      },
      { property: "og:title", content: "Playground · Forge" },
      { property: "og:description", content: "Production-grade frontend sandbox." },
    ],
  }),
  component: Playground,
});

export function Playground() {
  const [currentPresetId, setCurrentPresetId] = useState<string>(PLAYGROUND_PRESETS[0].id);
  const activePreset =
    PLAYGROUND_PRESETS.find((p) => p.id === currentPresetId) || PLAYGROUND_PRESETS[0];

  // Playground state
  const [files, setFiles] = useState<PlaygroundFile[]>(activePreset.files);
  const [activeFileId, setActiveFileId] = useState<string>(activePreset.files[0]?.id || "f-1");
  const [openTabIds, setOpenTabIds] = useState<string[]>(activePreset.files.map((f) => f.id));

  // Console & execution state
  const [consoleLogs, setConsoleLogs] = useState<PlaygroundConsoleLog[]>([]);
  const [executionStatus, setExecutionStatus] = useState<"idle" | "running" | "success" | "error">(
    "idle",
  );
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  // Solution modal state
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [codeReviewOpen, setCodeReviewOpen] = useState(false);
  const [showFileTree, setShowFileTree] = useState(true);

  // Active right/bottom tab
  const [activePaneTab, setActivePaneTab] = useState<"preview" | "console" | "hints">("preview");

  const activeFile = files.find((f) => f.id === activeFileId) || files[0];

  // Preset switch handler
  const handleSelectPreset = (presetId: string) => {
    const nextPreset = PLAYGROUND_PRESETS.find((p) => p.id === presetId);
    if (!nextPreset) return;
    setCurrentPresetId(presetId);
    setFiles(nextPreset.files);
    setActiveFileId(nextPreset.files[0]?.id || "f-1");
    setOpenTabIds(nextPreset.files.map((f) => f.id));
    setConsoleLogs([]);
    setExecutionStatus("idle");
    setExecutionTime(null);
    toast.success(`Loaded preset: ${nextPreset.title}`);
  };

  // Add file handler
  const handleAddFile = (fileName: string) => {
    const ext = fileName.split(".").pop() || "";
    let lang: PlaygroundFile["language"] = "typescript";
    if (ext === "css") lang = "css";
    if (ext === "html") lang = "html";
    if (ext === "json") lang = "json";
    if (ext === "js" || ext === "jsx") lang = "javascript";

    const newFile: PlaygroundFile = {
      id: `custom-${Date.now()}`,
      name: fileName,
      code: `// ${fileName}\nexport default function Component() {\n  return <div>New Component</div>;\n}\n`,
      language: lang,
    };

    setFiles((prev) => [...prev, newFile]);
    setOpenTabIds((prev) => [...prev, newFile.id]);
    setActiveFileId(newFile.id);
    toast.success(`Created ${fileName}`);
  };

  // Delete file handler
  const handleDeleteFile = (fileId: string) => {
    const fileToDelete = files.find((f) => f.id === fileId);
    if (!fileToDelete) return;

    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    setOpenTabIds((prev) => prev.filter((id) => id !== fileId));

    if (activeFileId === fileId) {
      const remaining = files.filter((f) => f.id !== fileId);
      if (remaining.length > 0) {
        setActiveFileId(remaining[0].id);
      }
    }
    toast.info(`Deleted ${fileToDelete.name}`);
  };

  // Code update handler
  const handleCodeChange = (newCode: string) => {
    setFiles((prev) => prev.map((f) => (f.id === activeFileId ? { ...f, code: newCode } : f)));
  };

  // Format code handler
  const handleFormatCode = () => {
    if (!activeFile) return;
    try {
      const formatted = activeFile.code
        .split("\n")
        .map((line) => line.trimEnd())
        .join("\n");
      handleCodeChange(formatted);
      toast.success(`Formatted ${activeFile.name}`);
    } catch {
      toast.error("Failed to format code");
    }
  };

  // Log capturer callback from iframe
  const handleLogCaptured = useCallback(
    (level: "log" | "info" | "warn" | "error", message: string) => {
      setConsoleLogs((prev) => [
        ...prev,
        {
          id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          level,
          message,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    },
    [],
  );

  // Run code handler
  const handleRun = () => {
    setExecutionStatus("running");
    const startTime = performance.now();

    // Log run trigger
    setConsoleLogs((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        level: "info",
        message: `⚡ Compiling & executing playground project (${files.length} files)...`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);

    setTimeout(() => {
      const duration = Math.round(performance.now() - startTime);
      setExecutionTime(duration);
      setExecutionStatus("success");
      toast.success(`Compiled & executed in ${duration}ms`);
    }, 250);
  };

  // Reset handler
  const handleReset = () => {
    setFiles(activePreset.files);
    setActiveFileId(activePreset.files[0]?.id || "f-1");
    setOpenTabIds(activePreset.files.map((f) => f.id));
    setConsoleLogs([]);
    setExecutionStatus("idle");
    setExecutionTime(null);
    toast.info("Playground reset to preset default.");
  };

  // Apply solution handler
  const handleApplySolution = (solutionFiles: PlaygroundFile[]) => {
    setFiles(solutionFiles);
    setActiveFileId(solutionFiles[0]?.id || "f-1");
    setOpenTabIds(solutionFiles.map((f) => f.id));
    toast.success("Applied reference solution to playground!");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        eyebrow="Interactive Workspace"
        title="Playground Engine"
        description="Write code, test state hooks, run live component renders, and inspect console logs in real time."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {executionStatus === "success" && executionTime !== null && (
              <Badge
                variant="outline"
                className="gap-1 border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-xs"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Compiled ({executionTime}ms)
              </Badge>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCodeReviewOpen(true)}
              className="gap-1.5 text-xs border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Sprint 17 — AI Code Review
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSolutionOpen(true)}
              className="gap-1.5 text-xs"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Compare Solution
            </Button>

            <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5 text-xs">
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>

            <Button size="sm" onClick={handleRun} className="gap-1.5 shadow-glow text-xs">
              <Play className="h-3.5 w-3.5" />
              Run Code
            </Button>
          </div>
        }
      />

      {/* Main Playground Editor & Panel Window */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-elegant flex flex-col h-[750px]">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${showFileTree ? "text-primary bg-primary/10" : "text-muted-foreground"}`}
              onClick={() => setShowFileTree(!showFileTree)}
              title="Toggle File Explorer"
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold text-foreground">{activePreset.title}</span>
            <Badge variant="secondary" className="text-[10px]">
              {activePreset.difficulty}
            </Badge>
          </div>

          {/* Right Pane Selector */}
          <div className="flex items-center gap-1">
            <Button
              variant={activePaneTab === "preview" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setActivePaneTab("preview")}
            >
              <Monitor className="h-3.5 w-3.5 text-primary" /> Preview
            </Button>
            <Button
              variant={activePaneTab === "console" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setActivePaneTab("console")}
            >
              <Terminal className="h-3.5 w-3.5 text-primary" /> Console ({consoleLogs.length})
            </Button>
            <Button
              variant={activePaneTab === "hints" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setActivePaneTab("hints")}
            >
              <Lightbulb className="h-3.5 w-3.5 text-amber-400" /> Hints
            </Button>
          </div>
        </div>

        {/* Inner IDE Grid */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar File Explorer */}
          {showFileTree && (
            <div className="w-56 shrink-0">
              <PlaygroundFileTree
                files={files}
                activeFileId={activeFileId}
                onSelectFile={(id) => {
                  setActiveFileId(id);
                  if (!openTabIds.includes(id)) {
                    setOpenTabIds((prev) => [...prev, id]);
                  }
                }}
                onAddFile={handleAddFile}
                onDeleteFile={handleDeleteFile}
                presets={PLAYGROUND_PRESETS}
                currentPresetId={currentPresetId}
                onSelectPreset={handleSelectPreset}
              />
            </div>
          )}

          {/* Center Editor Column */}
          <div className="flex-1 flex flex-col min-w-0 border-r border-border/60">
            {/* Tabs Bar */}
            <PlaygroundTabs
              files={files}
              openTabIds={openTabIds}
              activeFileId={activeFileId}
              onSelectTab={(id) => setActiveFileId(id)}
              onCloseTab={(id) => {
                setOpenTabIds((prev) => prev.filter((t) => t !== id));
                if (activeFileId === id && openTabIds.length > 1) {
                  const remaining = openTabIds.filter((t) => t !== id);
                  setActiveFileId(remaining[0]);
                }
              }}
              onNewFileClick={() => handleAddFile(`Component-${files.length + 1}.tsx`)}
            />

            {/* Monaco Editor */}
            <div className="flex-1 min-h-0">
              {activeFile ? (
                <PlaygroundEditor
                  activeFile={activeFile}
                  onCodeChange={handleCodeChange}
                  onFormatCode={handleFormatCode}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-xs">
                  No open file selected. Click a file in Explorer.
                </div>
              )}
            </div>
          </div>

          {/* Right Pane Column (Preview / Console / Hints) */}
          <div className="w-[420px] shrink-0 flex flex-col bg-background">
            {activePaneTab === "preview" && (
              <PlaygroundPreview files={files} onLogCaptured={handleLogCaptured} />
            )}

            {activePaneTab === "console" && (
              <PlaygroundConsole logs={consoleLogs} onClearConsole={() => setConsoleLogs([])} />
            )}

            {activePaneTab === "hints" && (
              <div className="p-4 space-y-4 text-xs overflow-y-auto">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                  <Lightbulb className="h-4 w-4" /> Lab Hints & Key Concepts
                </div>

                <div className="space-y-2">
                  {activePreset.hints.map((hint, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-200/90 leading-relaxed"
                    >
                      <strong className="text-amber-400 block mb-1">Hint #{idx + 1}:</strong>
                      {hint}
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5 text-xs mt-4"
                  onClick={() => setSolutionOpen(true)}
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  View Reference Solution
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compare Solution Modal */}
      <PlaygroundSolutionModal
        open={solutionOpen}
        onOpenChange={setSolutionOpen}
        preset={activePreset}
        userFiles={files}
        onApplySolution={handleApplySolution}
      />

      {/* AI Code Reviewer Modal (Sprint 17) */}
      <PlaygroundCodeReviewerModal
        open={codeReviewOpen}
        onOpenChange={setCodeReviewOpen}
        files={files}
        activeFile={activeFile}
        onApplyRefactoredCode={(newCode) => handleCodeChange(newCode)}
      />
    </div>
  );
}
