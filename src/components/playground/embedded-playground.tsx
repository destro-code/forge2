import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  ExternalLink,
  Loader2,
} from "lucide-react";
import { usePlaygroundStore } from "@/lib/stores/use-playground-store";
import { useProgressStore } from "@/lib/stores/use-progress-store";
import { buildPlaygroundHtml, compilePlaygroundProject } from "@/lib/playground-compiler";
import {
  getStarterContentForFile,
  suggestNewFileName,
  normalizeNewFileName,
  buildLessonWorkspaceFiles,
  restorePersistedPlaygroundWorkspace,
} from "@/lib/playground-templates";
import {
  requestPlaygroundValidation,
  cancelPendingValidationRequests,
  waitForIframeReady,
} from "@/lib/compiler/validation-client";
import { getCanonicalExerciseId } from "@/lib/utils/lesson-step-resolver";

import type { Lesson, InteractiveExerciseLessonStep } from "@/lib/types";
import type { PlaygroundFile, PlaygroundProjectManifest } from "@/lib/types/playground";
import { PlaygroundFileTree } from "@/components/playground/playground-file-tree";
import { PlaygroundTabs } from "@/components/playground/playground-tabs";
import { PlaygroundEditor } from "@/components/playground/playground-editor";
import { PlaygroundPreview } from "@/components/playground/playground-preview";
import { PlaygroundConsole } from "@/components/playground/playground-console";
import { ValidationResultsPanel } from "@/components/playground/validation-results-panel";
import { PlaygroundSolutionModal } from "@/components/playground/playground-solution-modal";
import { PlaygroundCodeReviewerModal } from "@/components/playground/playground-code-reviewer-modal";
import { cn } from "@/lib/utils";

export interface EmbeddedPlaygroundProps {
  exerciseStep: InteractiveExerciseLessonStep;
  lesson?: Lesson;
  lessonId?: string;
  onValidationSuccess?: () => void;
  className?: string;
}

export function EmbeddedPlayground({
  exerciseStep,
  lesson,
  lessonId,
  onValidationSuccess,
  className,
}: EmbeddedPlaygroundProps) {
  const currentLessonId = lessonId || exerciseStep.lessonId;
  const exerciseId = exerciseStep.exerciseId;
  const validationSpec = exerciseStep.validation;

  const currentSessionIdentity = `sandbox:${currentLessonId}:${exerciseId}`;
  const [hydratedSessionId, setHydratedSessionId] = useState<string | null>(null);

  const {
    manifest,
    files,
    activeFileId,
    openTabIds,
    consoleLogs,
    isBuilding,
    isValidating,
    validationReport,
    setManifest,
    setFiles,
    setActiveFileId,
    setOpenTabIds,
    setConsoleLogs,
    setIsBuilding,
    setCompilerOutput,
    updateFileContent,
    addFile,
    deleteFile,
  } = usePlaygroundStore();

  const { completePlaygroundExercise, playgroundCompletions = [] } = useProgressStore();

  const [executionStatus, setExecutionStatus] = useState<"idle" | "running" | "success" | "error">(
    "idle",
  );
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  // Modal states
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [codeReviewOpen, setCodeReviewOpen] = useState(false);
  const [showFileTree, setShowFileTree] = useState(false);

  // Pane tabs (Desktop)
  const [activePaneTab, setActivePaneTab] = useState<
    "preview" | "validation" | "console" | "hints"
  >(validationSpec ? "validation" : "preview");

  // Pane tabs (Mobile)
  const [mobileTab, setMobileTab] = useState<
    "editor" | "validation" | "preview" | "console" | "hints" | "files"
  >("editor");

  const canonExerciseId = exerciseId ? getCanonicalExerciseId(exerciseId) : undefined;
  const canonValId = validationSpec?.exerciseId
    ? getCanonicalExerciseId(validationSpec.exerciseId)
    : undefined;
  const isCompletedInStore = (playgroundCompletions || []).some(
    (c) =>
      c.templateId === exerciseId ||
      (validationSpec?.exerciseId && c.templateId === validationSpec.exerciseId) ||
      (canonExerciseId && c.templateId === canonExerciseId) ||
      (canonValId && c.templateId === canonValId),
  );

  // Initialize workspace when exerciseStep or session changes
  useEffect(() => {
    const sandboxSection = exerciseStep.section || {
      id: exerciseId,
      title: exerciseStep.title || "Interactive Exercise",
      initialCode: exerciseStep.initialCode || "",
      language: exerciseStep.language || "javascript",
      instructions: exerciseStep.instructions,
      validation: exerciseStep.validation,
    };

    const workspace = buildLessonWorkspaceFiles(
      lesson,
      sandboxSection as any,
      exerciseStep.initialCode || "",
      exerciseStep.language || "javascript",
    );

    let initialManifest: PlaygroundProjectManifest = {
      runtime: workspace.runtime,
      entryFile: workspace.entryFile,
      title: exerciseStep.title || "Interactive Exercise",
      files: workspace.files,
    };
    let initialActiveId = workspace.activeFileId;
    let initialOpenTabs = workspace.files.map((f) => f.id);

    // Check localStorage for saved edits
    if (typeof window !== "undefined") {
      const storageKey = `forge_playground_files_lesson_${currentLessonId}_${exerciseId}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const restored = restorePersistedPlaygroundWorkspace(
          saved,
          workspace.runtime,
          workspace.entryFile,
        );
        if (restored) {
          initialManifest = restored.manifest;
          initialActiveId = restored.activeFileId || initialActiveId;
          initialOpenTabs = restored.openTabIds || initialOpenTabs;
        }
      }
    }

    setManifest(initialManifest);
    setActiveFileId(initialActiveId);
    setOpenTabIds(initialOpenTabs);

    // Build initial compilerOutput so iframe is ready on mount
    const initialHtml = buildPlaygroundHtml(initialManifest, {
      title: exerciseStep.title || "Interactive Exercise",
      baseUrl: "",
    });
    setCompilerOutput(initialHtml, false);

    cancelPendingValidationRequests();
    setHydratedSessionId(currentSessionIdentity);
    setActivePaneTab(validationSpec ? "validation" : "preview");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSessionIdentity, exerciseId, currentLessonId]);

  const isSessionReady = hydratedSessionId === currentSessionIdentity;

  const sessionInitialFiles = useMemo(() => {
    const sandboxSection = exerciseStep.section || {
      id: exerciseId,
      title: exerciseStep.title || "Interactive Exercise",
      initialCode: exerciseStep.initialCode || "",
      language: exerciseStep.language || "javascript",
    };
    const workspace = buildLessonWorkspaceFiles(
      lesson,
      sandboxSection as any,
      exerciseStep.initialCode || "",
      exerciseStep.language || "javascript",
    );
    let loaded = workspace.files;

    if (typeof window !== "undefined") {
      const storageKey = `forge_playground_files_lesson_${currentLessonId}_${exerciseId}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            loaded = parsed;
          }
        } catch (e) {
          /* ignore */
        }
      }
    }
    return loaded;
  }, [exerciseStep, lesson, currentLessonId, exerciseId]);

  const activeFile = isSessionReady
    ? files.find((f) => f.id === activeFileId) || files[0]
    : sessionInitialFiles
      ? sessionInitialFiles[0]
      : files.find((f) => f.id === activeFileId) || files[0];

  // Auto-persist edits to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (hydratedSessionId !== currentSessionIdentity) return;

    const payloadToPersist = {
      manifest,
      activeFileId,
      openTabIds,
    };
    const storageKey = `forge_playground_files_lesson_${currentLessonId}_${exerciseId}`;
    localStorage.setItem(storageKey, JSON.stringify(payloadToPersist));
  }, [
    manifest,
    activeFileId,
    openTabIds,
    hydratedSessionId,
    currentSessionIdentity,
    currentLessonId,
    exerciseId,
  ]);

  const handleAddFile = (rawFileName: string) => {
    const state = usePlaygroundStore.getState();
    const fileName = normalizeNewFileName(rawFileName, state.manifest.files);
    const { code, language } = getStarterContentForFile(fileName);

    const newFile: PlaygroundFile = {
      id: `custom-${Date.now()}`,
      name: fileName,
      code,
      language,
    };

    addFile(newFile);
    toast.success(`Created ${fileName}`);
  };

  const handleDeleteFile = (fileId: string) => {
    const fileToDelete = files.find((f) => f.id === fileId);
    if (!fileToDelete) return;

    deleteFile(fileId);
    toast.info(`Deleted ${fileToDelete.name}`);
  };

  const compileTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleCodeChange = (newCode: string) => {
    updateFileContent(activeFileId, newCode);

    if (compileTimeoutRef.current) clearTimeout(compileTimeoutRef.current);
    compileTimeoutRef.current = setTimeout(() => {
      handleRun(true);
    }, 300);
  };

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

  const handleRun = (isAuto = false) => {
    setIsBuilding(true);
    if (!isAuto) setExecutionStatus("running");
    const startTime = performance.now();

    const currentManifest = usePlaygroundStore.getState().manifest;

    if (!isAuto) {
      setConsoleLogs((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          level: "info",
          message: `⚡ Compiling & executing playground project (${currentManifest.files.length} files, runtime: ${currentManifest.runtime})...`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }

    const currentOutput = usePlaygroundStore.getState().compilerOutput;

    if (!isAuto || !currentOutput) {
      setTimeout(() => {
        try {
          const html = buildPlaygroundHtml(currentManifest, {
            title: exerciseStep.title || "Interactive Exercise",
            baseUrl: "",
          });
          setCompilerOutput(html, false);

          const duration = Math.round(performance.now() - startTime);
          if (!isAuto) {
            setExecutionTime(duration);
            setExecutionStatus("success");
            toast.success(`Compiled & executed in ${duration}ms`);
            if (!validationSpec) {
              completePlaygroundExercise(exerciseId);
            }
          }
        } catch (err) {
          setIsBuilding(false);
          if (!isAuto) {
            setExecutionStatus("error");
            toast.error("Compilation failed");
          }
        }
      }, 10);
    } else {
      const iframes = document.querySelectorAll<HTMLIFrameElement>(
        "iframe[title='Forge Playground Live Preview']",
      );
      if (iframes.length === 0) {
        try {
          const html = buildPlaygroundHtml(currentManifest, {
            title: exerciseStep.title || "Interactive Exercise",
            baseUrl: "",
          });
          setCompilerOutput(html, false);
        } catch (e) {
          /* ignore */
        }
      } else {
        iframes.forEach((iframe) => {
          iframe.contentWindow?.postMessage(
            { type: "PLAYGROUND_UPDATE_FILES", files: currentManifest.files },
            "*",
          );
        });
      }
      setIsBuilding(false);
    }
  };

  const handleRunAndValidate = async () => {
    if (!validationSpec) {
      handleRun(false);
      return;
    }

    const currentIsValidating = usePlaygroundStore.getState().isValidating;
    if (currentIsValidating) return;

    setIsBuilding(true);
    setExecutionStatus("running");
    const startTime = performance.now();

    const currentStore = usePlaygroundStore.getState();
    const currentManifest = currentStore.manifest;
    const currentRevision = currentStore.workspaceRevision;

    setConsoleLogs((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        level: "info",
        message: `⚡ Compiling & validating exercise: ${validationSpec.exerciseId} (rev ${currentRevision}, ${validationSpec.assertions.length} assertions)...`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);

    const compileReport = compilePlaygroundProject(currentManifest, {
      title: exerciseStep.title || "Interactive Exercise",
      baseUrl: "",
      workspaceRevision: currentRevision,
    });

    if (!compileReport.success) {
      setIsBuilding(false);
      setExecutionStatus("error");
      const errDiag = compileReport.diagnostics.find((d) => d.severity === "error");
      const errMsg = errDiag?.message || "Project compilation failed with diagnostic errors.";
      setConsoleLogs((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          level: "error",
          message: `❌ Build failed: ${errMsg}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      toast.error(`Build failed: ${errMsg}`);
      return;
    }

    setCompilerOutput(compileReport.outputHtml, false);

    setActivePaneTab("validation");
    setMobileTab("validation");

    try {
      await waitForIframeReady(currentRevision, 7000);
    } catch (barrierErr) {
      setIsBuilding(false);
      setExecutionStatus("error");
      const errMsg =
        barrierErr instanceof Error ? barrierErr.message : "Preview runtime failed to initialize.";
      setConsoleLogs((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          level: "error",
          message: `❌ ${errMsg}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      toast.error(`Runtime error: ${errMsg}`);
      return;
    }

    if (usePlaygroundStore.getState().workspaceRevision !== currentRevision) {
      setIsBuilding(false);
      setExecutionStatus("idle");
      return;
    }

    try {
      const report = await requestPlaygroundValidation(validationSpec.exerciseId, validationSpec);

      const duration = Math.round(performance.now() - startTime);
      setExecutionTime(duration);
      setIsBuilding(false);

      if (report.status === "passed") {
        setExecutionStatus("success");

        const targetExerciseId = validationSpec.exerciseId || exerciseId;
        const canonTargetId = targetExerciseId
          ? getCanonicalExerciseId(targetExerciseId)
          : undefined;
        const wasCompletedBefore = (playgroundCompletions || []).some(
          (c) =>
            c.templateId === targetExerciseId ||
            c.templateId === exerciseId ||
            (canonTargetId && c.templateId === canonTargetId) ||
            (canonExerciseId && c.templateId === canonExerciseId),
        );

        completePlaygroundExercise(targetExerciseId);

        if (!wasCompletedBefore) {
          toast.success("Exercise Passed! +50 XP awarded");
        } else {
          toast.success(`All ${report.totalRequired} required checks passed!`);
        }

        onValidationSuccess?.();
      } else {
        setExecutionStatus("idle");
        toast.error(
          `Validation not passed: ${report.passedCount}/${report.totalRequired} required checks passed`,
        );
      }
    } catch (err) {
      setIsBuilding(false);
      setExecutionStatus("error");
      toast.error("Validation execution encountered an error.");
    }
  };

  const handleReset = () => {
    const sandboxSection = exerciseStep.section || {
      id: exerciseId,
      title: exerciseStep.title || "Interactive Exercise",
      initialCode: exerciseStep.initialCode || "",
      language: exerciseStep.language || "javascript",
    };

    const resetWorkspace = buildLessonWorkspaceFiles(
      lesson,
      sandboxSection as any,
      exerciseStep.initialCode || "",
      exerciseStep.language || "javascript",
    );

    if (typeof window !== "undefined") {
      const storageKey = `forge_playground_files_lesson_${currentLessonId}_${exerciseId}`;
      localStorage.removeItem(storageKey);
    }

    const resetManifest: PlaygroundProjectManifest = {
      runtime: resetWorkspace.runtime,
      entryFile: resetWorkspace.entryFile,
      title: exerciseStep.title || "Interactive Exercise",
      files: resetWorkspace.files,
    };

    setManifest(resetManifest);
    setActiveFileId(resetWorkspace.activeFileId);
    setOpenTabIds(resetWorkspace.files.map((f) => f.id));
    setConsoleLogs([]);
    setExecutionStatus("idle");
    setExecutionTime(null);

    const html = buildPlaygroundHtml(resetManifest, {
      title: exerciseStep.title || "Interactive Exercise",
      baseUrl: "",
    });
    setCompilerOutput(html, false);

    toast.info("Exercise reset to original starter code.");
  };

  const hintsList = exerciseStep.instructions
    ? [exerciseStep.instructions]
    : ["Follow the instructions and satisfy all assertion checks to complete this exercise."];

  return (
    <div
      className={cn(
        "flex flex-col w-full min-w-0 rounded-xl border border-border/70 bg-card overflow-hidden shadow-sm",
        className,
      )}
      data-testid="embedded-playground"
    >
      {/* Exercise Brief Header */}
      {exerciseStep.instructions && (
        <div className="bg-muted/30 border-b border-border/60 p-3 md:p-4 text-xs md:text-sm leading-relaxed text-foreground/90 flex flex-col gap-1">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
            <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-emerald-500" />
              Exercise Instructions
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-[10px]">
                {exerciseStep.language || "javascript"}
              </Badge>
              {isCompletedInStore ? (
                <Badge
                  variant="outline"
                  className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]"
                >
                  ✓ Solved
                </Badge>
              ) : validationSpec ? (
                <Badge
                  variant="outline"
                  className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px]"
                >
                  Requires Validation
                </Badge>
              ) : null}
            </div>
          </div>
          <div>{exerciseStep.instructions}</div>
        </div>
      )}

      {/* Action Control Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-border/60 bg-muted/40 px-3 py-2 text-xs gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-7 w-7",
              showFileTree ? "text-primary bg-primary/10" : "text-muted-foreground",
            )}
            onClick={() => setShowFileTree(!showFileTree)}
            title="Toggle File Explorer"
          >
            <PanelLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="font-medium text-muted-foreground text-xs truncate max-w-[180px] sm:max-w-none">
            {exerciseStep.title
              ? exerciseStep.title.replace(/^(Interact|Exercise|Checkpoint):\s*/i, "").trim()
              : "Interactive Practice Task"}
          </span>
          {executionStatus === "success" && executionTime !== null && (
            <Badge
              variant="outline"
              className="gap-1 border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[10px] hidden sm:inline-flex"
            >
              <CheckCircle2 className="h-3 w-3" />
              {executionTime}ms
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCodeReviewOpen(true)}
            className="h-7 px-2 text-[11px] gap-1 border-primary/40 text-primary hover:bg-primary/10"
          >
            <ShieldCheck className="h-3 w-3" />
            <span className="hidden sm:inline">AI Review</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="h-7 px-2 text-[11px] gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>

          <Button variant="outline" size="sm" asChild className="h-7 px-2 text-[11px] gap-1">
            <Link
              to="/playground"
              search={{
                lessonId: currentLessonId,
                sandboxId: exerciseId,
              }}
              title="Open full-screen playground page"
            >
              Pop Out <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>

          {validationSpec ? (
            <Button
              size="sm"
              onClick={handleRunAndValidate}
              disabled={isValidating || isBuilding}
              className="h-7 px-3 text-xs gap-1.5 font-semibold bg-primary text-primary-foreground shadow-glow"
            >
              {isValidating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Validating...</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Run &amp; Validate</span>
                </>
              )}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => handleRun()}
              className="h-7 px-3 text-xs gap-1.5 shadow-glow"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Run Code</span>
            </Button>
          )}
        </div>
      </div>

      {/* Pane Selector Bar (Desktop >= lg) */}
      <div className="hidden lg:flex items-center justify-between border-b border-border/60 bg-muted/20 px-3 py-1 text-xs">
        <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-2">
          <span>
            Active File: <strong className="text-foreground">{activeFile?.name}</strong>
          </span>
          <span>•</span>
          <span>Runtime: {manifest.runtime}</span>
        </div>

        <div className="flex items-center gap-1">
          {validationSpec && (
            <Button
              variant={activePaneTab === "validation" ? "secondary" : "ghost"}
              size="sm"
              className="h-6 text-[11px] gap-1"
              onClick={() => setActivePaneTab("validation")}
            >
              <ShieldCheck className="h-3 w-3 text-primary" />
              <span>Validation</span>
              {validationReport && (
                <span
                  className={cn(
                    "ml-1 text-[9px] font-mono px-1 rounded",
                    validationReport.status === "passed"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-rose-500/20 text-rose-400",
                  )}
                >
                  {validationReport.status === "passed"
                    ? "✓"
                    : `${validationReport.passedCount}/${validationReport.totalRequired}`}
                </span>
              )}
            </Button>
          )}

          <Button
            variant={activePaneTab === "preview" ? "secondary" : "ghost"}
            size="sm"
            className="h-6 text-[11px] gap-1"
            onClick={() => setActivePaneTab("preview")}
          >
            <Monitor className="h-3 w-3 text-primary" /> Preview
          </Button>

          <Button
            variant={activePaneTab === "console" ? "secondary" : "ghost"}
            size="sm"
            className="h-6 text-[11px] gap-1"
            onClick={() => setActivePaneTab("console")}
          >
            <Terminal className="h-3 w-3 text-primary" /> Console ({consoleLogs.length})
          </Button>

          <Button
            variant={activePaneTab === "hints" ? "secondary" : "ghost"}
            size="sm"
            className="h-6 text-[11px] gap-1"
            onClick={() => setActivePaneTab("hints")}
          >
            <Lightbulb className="h-3 w-3 text-amber-400" /> Hints
          </Button>
        </div>
      </div>

      {/* Mobile Tab Selector (< lg) */}
      <div className="flex lg:hidden items-center border-b border-border/60 bg-muted/30 p-0.5 text-xs gap-0.5 overflow-x-auto w-full no-scrollbar">
        <Button
          variant={mobileTab === "editor" ? "secondary" : "ghost"}
          size="sm"
          className="flex-1 h-7 text-[11px] px-2 py-0.5 gap-1 shrink-0"
          onClick={() => setMobileTab("editor")}
        >
          <FileCode2 className="h-3 w-3 text-primary" /> Code
        </Button>
        {validationSpec && (
          <Button
            variant={mobileTab === "validation" ? "secondary" : "ghost"}
            size="sm"
            className="flex-1 h-7 text-[11px] px-2 py-0.5 gap-1 shrink-0"
            onClick={() => setMobileTab("validation")}
          >
            <ShieldCheck className="h-3 w-3 text-primary" /> Validation
          </Button>
        )}
        <Button
          variant={mobileTab === "preview" ? "secondary" : "ghost"}
          size="sm"
          className="flex-1 h-7 text-[11px] px-2 py-0.5 gap-1 shrink-0"
          onClick={() => setMobileTab("preview")}
        >
          <Monitor className="h-3 w-3 text-primary" /> Preview
        </Button>
        <Button
          variant={mobileTab === "console" ? "secondary" : "ghost"}
          size="sm"
          className="flex-1 h-7 text-[11px] px-2 py-0.5 gap-1 shrink-0"
          onClick={() => setMobileTab("console")}
        >
          <Terminal className="h-3 w-3 text-primary" /> Console ({consoleLogs.length})
        </Button>
        <Button
          variant={mobileTab === "hints" ? "secondary" : "ghost"}
          size="sm"
          className="flex-1 h-7 text-[11px] px-2 py-0.5 gap-1 shrink-0"
          onClick={() => setMobileTab("hints")}
        >
          <Lightbulb className="h-3 w-3 text-amber-400" /> Hints
        </Button>
        <Button
          variant={mobileTab === "files" ? "secondary" : "ghost"}
          size="sm"
          className="flex-1 h-7 text-[11px] px-2 py-0.5 gap-1 shrink-0"
          onClick={() => setMobileTab("files")}
        >
          <PanelLeft className="h-3 w-3 text-primary" /> Files
        </Button>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-[380px] h-full overflow-hidden w-full min-w-0">
        {/* Sidebar File Explorer (Optional/Toggleable) */}
        {showFileTree && (
          <div className="w-52 shrink-0 border-r border-border/60 bg-muted/10 hidden lg:block overflow-y-auto">
            <PlaygroundFileTree
              onAddFile={handleAddFile}
              onDeleteFile={handleDeleteFile}
              presets={[]}
              currentPresetId=""
              onSelectPreset={() => {}}
              isLessonSandbox={true}
            />
          </div>
        )}

        {/* Mobile File View */}
        {mobileTab === "files" && (
          <div className="flex-1 overflow-y-auto w-full lg:hidden">
            <PlaygroundFileTree
              onAddFile={handleAddFile}
              onDeleteFile={handleDeleteFile}
              presets={[]}
              currentPresetId=""
              onSelectPreset={() => {}}
              isLessonSandbox={true}
            />
          </div>
        )}

        {/* Editor Area (Mobile/Desktop) */}
        <div
          className={cn(
            "flex-1 flex flex-col min-w-0 border-r border-border/60 h-full overflow-hidden",
            mobileTab !== "editor" && "hidden lg:flex",
          )}
        >
          <PlaygroundTabs
            onNewFileClick={() => {
              const nextName = suggestNewFileName(usePlaygroundStore.getState().files);
              handleAddFile(nextName);
            }}
          />
          <div className="flex-1 flex flex-col min-h-0 w-full min-w-0 overflow-hidden">
            {!isSessionReady ? (
              <div className="flex h-full w-full items-center justify-center bg-card p-6">
                <Skeleton className="h-full w-full rounded-lg" />
              </div>
            ) : activeFile ? (
              <PlaygroundEditor
                onCodeChange={handleCodeChange}
                onFormatCode={handleFormatCode}
                onRunCode={() => handleRun()}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-xs p-6">
                No open file selected. Select a file in Explorer.
              </div>
            )}
          </div>
        </div>

        {/* Right Pane Column (Desktop & Mobile) */}
        <div
          className={cn(
            "w-full lg:w-[380px] shrink-0 flex flex-col bg-background h-full overflow-hidden",
            mobileTab === "editor" || mobileTab === "files" ? "hidden lg:flex" : "flex",
          )}
        >
          {/* Always Keep Preview Mounted in DOM for iframe postMessage & validation */}
          <div
            className={
              (activePaneTab === "preview" &&
                mobileTab !== "validation" &&
                mobileTab !== "console" &&
                mobileTab !== "hints") ||
              mobileTab === "preview"
                ? "flex-1 flex flex-col h-full overflow-hidden"
                : "hidden"
            }
          >
            <PlaygroundPreview onLogCaptured={handleLogCaptured} />
          </div>

          {((activePaneTab === "validation" &&
            mobileTab !== "preview" &&
            mobileTab !== "console" &&
            mobileTab !== "hints") ||
            mobileTab === "validation") &&
            validationSpec && (
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                <ValidationResultsPanel
                  validationSpec={validationSpec}
                  onRunValidation={handleRunAndValidate}
                  isBuilding={isBuilding}
                />
              </div>
            )}

          {((activePaneTab === "console" &&
            mobileTab !== "preview" &&
            mobileTab !== "validation" &&
            mobileTab !== "hints") ||
            mobileTab === "console") && (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <PlaygroundConsole />
            </div>
          )}

          {((activePaneTab === "hints" &&
            mobileTab !== "preview" &&
            mobileTab !== "validation" &&
            mobileTab !== "console") ||
            mobileTab === "hints") && (
            <div className="flex-1 flex flex-col p-4 space-y-4 text-xs overflow-y-auto">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                <Lightbulb className="h-4 w-4" /> Exercise Hints
              </div>
              <div className="space-y-2">
                {hintsList.map((hint, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-200/90 leading-relaxed"
                  >
                    <strong className="text-amber-400 block mb-1">Hint #{idx + 1}:</strong>
                    {hint}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Code Reviewer Modal */}
      <PlaygroundCodeReviewerModal
        open={codeReviewOpen}
        onOpenChange={setCodeReviewOpen}
        files={files}
        activeFile={activeFile}
        onApplyRefactoredCode={(newCode) => handleCodeChange(newCode)}
      />

      {/* Solution Modal */}
      <PlaygroundSolutionModal
        open={solutionOpen}
        onOpenChange={setSolutionOpen}
        preset={{
          id: exerciseId,
          title: exerciseStep.title || "Interactive Exercise",
          runtime: "react",
          difficulty: "Beginner",
          hints: hintsList,
          files: [],
          solutionFiles: exerciseStep.exercise?.solution
            ? [
                {
                  id: "sol-1",
                  name: activeFile.name || "App.tsx",
                  code: exerciseStep.exercise.solution,
                  path: activeFile.path || "/App.tsx",
                },
              ]
            : files,
        }}
        userFiles={files}
        onApplySolution={(solutionFiles) => {
          if (solutionFiles && solutionFiles.length > 0) {
            setFiles(solutionFiles);
            setActiveFileId(solutionFiles[0]?.id || "f-1");
            setOpenTabIds(solutionFiles.map((f) => f.id));
          }
        }}
      />
    </div>
  );
}
