import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Play,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  PanelLeft,
  Terminal,
  Monitor,
  Lightbulb,
  ShieldCheck,
  FileCode2,
} from "lucide-react";
import { useState, useCallback, useEffect, useRef } from "react";
import { usePlaygroundStore } from "@/lib/stores/use-playground-store";
import { useProgressStore } from "@/lib/stores/use-progress-store";
import { buildPlaygroundHtml } from "@/lib/playground-compiler";

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

  const {
    files,
    activeFileId,
    openTabIds,
    consoleLogs,
    isBuilding,
    compilerOutput,
    setFiles,
    setActiveFileId,
    setOpenTabIds,
    setConsoleLogs,
    setIsBuilding,
    setCompilerOutput,
    updateFileContent,
  } = usePlaygroundStore();
  const { completePlaygroundExercise } = useProgressStore();

  const [executionStatus, setExecutionStatus] = useState<"idle" | "running" | "success" | "error">(
    "idle",
  );
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  // Initialize store on mount if empty
  useEffect(() => {
    if (files.length === 0) {
      if (typeof window !== "undefined") {
        const key = `forge_playground_files_${currentPresetId}`;
        const saved = localStorage.getItem(key);
        let loadedFiles = activePreset.files;
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) loadedFiles = parsed;
          } catch (e) {
            /* ignore */
          }
        }
        setFiles(loadedFiles);
        setActiveFileId(loadedFiles[0]?.id || "f-1");
        setOpenTabIds(loadedFiles.map((f) => f.id));
      } else {
        setFiles(activePreset.files);
        setActiveFileId(activePreset.files[0]?.id || "f-1");
        setOpenTabIds(activePreset.files.map((f) => f.id));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Solution modal state
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [codeReviewOpen, setCodeReviewOpen] = useState(false);
  const [showFileTree, setShowFileTree] = useState(true);

  // Active right/bottom tab
  const [activePaneTab, setActivePaneTab] = useState<"preview" | "console" | "hints">("preview");
  // Mobile single-pane active tab
  const [mobileTab, setMobileTab] = useState<"editor" | "preview" | "console" | "hints" | "files">(
    "editor",
  );

  const activeFile = files.find((f) => f.id === activeFileId) || files[0];

  // Auto-persist files to localStorage whenever files change
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `forge_playground_files_${currentPresetId}`;
    localStorage.setItem(key, JSON.stringify(files));
  }, [files, currentPresetId]);

  // Preset switch handler
  const handleSelectPreset = (presetId: string) => {
    const nextPreset = PLAYGROUND_PRESETS.find((p) => p.id === presetId);
    if (!nextPreset) return;
    setCurrentPresetId(presetId);

    let nextFiles = nextPreset.files;
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`forge_playground_files_${presetId}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) nextFiles = parsed;
        } catch (e) {
          /* ignore */
        }
      }
    }
    setFiles(nextFiles);
    setActiveFileId(nextFiles[0]?.id || "f-1");
    setOpenTabIds(nextFiles.map((f) => f.id));
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

    const state = usePlaygroundStore.getState();
    setFiles([...state.files, newFile]);
    setOpenTabIds([...usePlaygroundStore.getState().openTabIds, newFile.id]);
    setActiveFileId(newFile.id);
    toast.success(`Created ${fileName}`);
  };

  // Delete file handler
  const handleDeleteFile = (fileId: string) => {
    const fileToDelete = files.find((f) => f.id === fileId);
    if (!fileToDelete) return;

    setFiles(usePlaygroundStore.getState().files.filter((f) => f.id !== fileId));
    setOpenTabIds(usePlaygroundStore.getState().openTabIds.filter((id) => id !== fileId));

    if (activeFileId === fileId) {
      const remaining = files.filter((f) => f.id !== fileId);
      if (remaining.length > 0) {
        setActiveFileId(remaining[0].id);
      }
    }
    toast.info(`Deleted ${fileToDelete.name}`);
  };

  const compileTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Code update handler
  const handleCodeChange = (newCode: string) => {
    updateFileContent(activeFileId, newCode);

    // Debounce compiler execution calls by 300ms
    if (compileTimeoutRef.current) clearTimeout(compileTimeoutRef.current);
    compileTimeoutRef.current = setTimeout(() => {
      handleRun(true);
    }, 300);
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
    [setConsoleLogs],
  );

  // Run code handler
  const handleRun = (isAuto = false) => {
    setIsBuilding(true);
    if (!isAuto) setExecutionStatus("running");
    const startTime = performance.now();

    if (!isAuto) {
      setConsoleLogs((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          level: "info",
          message: `⚡ Compiling & executing playground project (${usePlaygroundStore.getState().files.length} files)...`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }

    // We defer the heavy buildPlaygroundHtml to let UI render the 'building' state
    setTimeout(() => {
      try {
        const currentFiles = usePlaygroundStore.getState().files;
        const html = buildPlaygroundHtml(currentFiles, { title: "Forge Playground Live Preview" });
        setCompilerOutput(html, false);

        const duration = Math.round(performance.now() - startTime);
        if (!isAuto) {
          setExecutionTime(duration);
          setExecutionStatus("success");
          toast.success(`Compiled & executed in ${duration}ms`);
          completePlaygroundExercise(activePreset.id);
        }
      } catch (err) {
        setIsBuilding(false);
        if (!isAuto) {
          setExecutionStatus("error");
          toast.error("Compilation failed");
        }
      }
    }, 10);
  };

  // Reset handler
  const handleReset = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(`forge_playground_files_${currentPresetId}`);
    }
    setFiles(activePreset.files);
    setActiveFileId(activePreset.files[0]?.id || "f-1");
    setOpenTabIds(activePreset.files.map((f) => f.id));
    setConsoleLogs([]);
    setExecutionStatus("idle");
    setExecutionTime(null);
    toast.info("Playground reset to default preset code.");
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
              Explain / AI Code Review
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

            <Button size="sm" onClick={() => handleRun()} className="gap-1.5 shadow-glow text-xs">
              <Play className="h-3.5 w-3.5" />
              Run Code
            </Button>
          </div>
        }
      />

      {/* Main Playground Editor & Panel Window */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-elegant flex flex-col min-h-[600px] lg:h-[750px]">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-border/60 bg-muted/30 px-3 py-2 text-xs gap-2">
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
            <span className="font-semibold text-foreground truncate max-w-[200px] sm:max-w-none">
              {activePreset.title}
            </span>
            <Badge variant="secondary" className="text-[10px] hidden sm:inline-flex">
              {activePreset.difficulty}
            </Badge>
          </div>

          {/* Right Pane Selector (Desktop) */}
          <div className="hidden lg:flex items-center gap-1">
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

        {/* Mobile Single-Pane Tab Bar */}
        <div className="flex lg:hidden items-center border-b border-border/60 bg-muted/40 p-1 text-xs gap-1 overflow-x-auto">
          <Button
            variant={mobileTab === "editor" ? "secondary" : "ghost"}
            size="sm"
            className="flex-1 h-8 text-xs gap-1 shrink-0"
            onClick={() => setMobileTab("editor")}
          >
            <FileCode2 className="h-3.5 w-3.5 text-primary" /> Code
          </Button>
          <Button
            variant={mobileTab === "preview" ? "secondary" : "ghost"}
            size="sm"
            className="flex-1 h-8 text-xs gap-1 shrink-0"
            onClick={() => setMobileTab("preview")}
          >
            <Monitor className="h-3.5 w-3.5 text-primary" /> Preview
          </Button>
          <Button
            variant={mobileTab === "console" ? "secondary" : "ghost"}
            size="sm"
            className="flex-1 h-8 text-xs gap-1 shrink-0"
            onClick={() => setMobileTab("console")}
          >
            <Terminal className="h-3.5 w-3.5 text-primary" /> Console ({consoleLogs.length})
          </Button>
          <Button
            variant={mobileTab === "hints" ? "secondary" : "ghost"}
            size="sm"
            className="flex-1 h-8 text-xs gap-1 shrink-0"
            onClick={() => setMobileTab("hints")}
          >
            <Lightbulb className="h-3.5 w-3.5 text-amber-400" /> Hints
          </Button>
          <Button
            variant={mobileTab === "files" ? "secondary" : "ghost"}
            size="sm"
            className="flex-1 h-8 text-xs gap-1 shrink-0"
            onClick={() => setMobileTab("files")}
          >
            <PanelLeft className="h-3.5 w-3.5 text-primary" /> Files
          </Button>
        </div>

        {/* Mobile Single-Pane View (< lg) */}
        <div className="flex-1 flex flex-col overflow-hidden lg:hidden min-h-[500px]">
          {mobileTab === "files" && (
            <div className="flex-1 overflow-y-auto">
              <PlaygroundFileTree
                onAddFile={handleAddFile}
                onDeleteFile={handleDeleteFile}
                presets={PLAYGROUND_PRESETS}
                currentPresetId={currentPresetId}
                onSelectPreset={handleSelectPreset}
              />
            </div>
          )}

          {mobileTab === "editor" && (
            <div className="flex-1 flex flex-col min-h-0">
              <PlaygroundTabs
                onNewFileClick={() =>
                  handleAddFile(`Component-${usePlaygroundStore.getState().files.length + 1}.tsx`)
                }
              />
              <div className="flex-1 min-h-0">
                {activeFile ? (
                  <PlaygroundEditor
                    onCodeChange={handleCodeChange}
                    onFormatCode={handleFormatCode}
                    onRunCode={() => handleRun()}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground text-xs p-6">
                    No open file selected. Select a file in Files tab.
                  </div>
                )}
              </div>
            </div>
          )}

          {mobileTab === "preview" && (
            <div className="flex-1 flex flex-col bg-background min-h-0">
              <PlaygroundPreview onLogCaptured={handleLogCaptured} />
            </div>
          )}

          {mobileTab === "console" && (
            <div className="flex-1 flex flex-col bg-background min-h-0">
              <PlaygroundConsole />
            </div>
          )}

          {mobileTab === "hints" && (
            <div className="flex-1 flex flex-col bg-background p-4 space-y-4 text-xs overflow-y-auto min-h-0">
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

        {/* Desktop Multi-Column IDE Grid (>= lg) */}
        <div className="hidden lg:flex flex-1 flex-row overflow-hidden">
          {/* Sidebar File Explorer */}
          {showFileTree && (
            <div className="w-56 shrink-0 border-r border-border/60">
              <PlaygroundFileTree
                onAddFile={handleAddFile}
                onDeleteFile={handleDeleteFile}
                presets={PLAYGROUND_PRESETS}
                currentPresetId={currentPresetId}
                onSelectPreset={handleSelectPreset}
              />
            </div>
          )}

          {/* Center Editor Column */}
          <div className="flex-1 flex flex-col min-w-0 border-r border-border/60 min-h-[350px]">
            {/* Tabs Bar */}
            <PlaygroundTabs
              onNewFileClick={() =>
                handleAddFile(`Component-${usePlaygroundStore.getState().files.length + 1}.tsx`)
              }
            />

            {/* Monaco Editor */}
            <div className="flex-1 min-h-0">
              {activeFile ? (
                <PlaygroundEditor
                  onCodeChange={handleCodeChange}
                  onFormatCode={handleFormatCode}
                  onRunCode={() => handleRun()}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-xs p-6">
                  No open file selected. Click a file in Explorer.
                </div>
              )}
            </div>
          </div>

          {/* Right Pane Column (Preview / Console / Hints) */}
          <div className="w-[420px] shrink-0 flex flex-col bg-background min-h-[300px]">
            {activePaneTab === "preview" && <PlaygroundPreview onLogCaptured={handleLogCaptured} />}

            {activePaneTab === "console" && <PlaygroundConsole />}

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

      {/* AI Code Reviewer Modal (Explain / AI Code Review) */}
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
