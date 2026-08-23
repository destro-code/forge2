import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Copy,
  Check,
  Maximize2,
  Code2,
  Eye,
  Terminal,
  Trash2,
  AlertTriangle,
  Loader2,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { ExerciseCard } from "./exercise-card";
import { useProgressStore } from "@/lib/stores/use-progress-store";
import { usePlaygroundStore } from "@/lib/stores/use-playground-store";
import { useTheme } from "@/lib/hooks/use-theme";
import { MonacoEditor } from "@/components/shared/monaco-editor";
import { compilePlaygroundProject } from "@/lib/playground-compiler";
import { getCanonicalExerciseId, isExerciseCompleted } from "@/lib/utils/lesson-step-resolver";
import {
  requestPlaygroundValidation,
  cancelPendingValidationRequests,
} from "@/lib/compiler/validation-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { InteractiveExerciseLessonStep, Lesson } from "@/lib/types";
import type { ValidationReport } from "@/lib/types/validation";
import type { PlaygroundProjectManifest } from "@/lib/types/playground";

export interface CompactCodeChallengeViewProps {
  step: InteractiveExerciseLessonStep;
  lesson?: Lesson;
  onComplete?: () => void;
  onExpandToFullPlayground?: () => void;
  className?: string;
}

interface ConsoleLogItem {
  id: string;
  level: "log" | "info" | "warn" | "error";
  message: string;
  timestamp: string;
}

export function CompactCodeChallengeView({
  step,
  lesson,
  onComplete,
  onExpandToFullPlayground,
  className,
}: CompactCodeChallengeViewProps) {
  const { theme: appTheme } = useTheme();
  const playgroundCompletions = useProgressStore((s) => s.playgroundCompletions);
  const completePlaygroundExercise = useProgressStore((s) => s.completePlaygroundExercise);

  const targetExerciseId = step.validation?.exerciseId || step.exerciseId;
  const isAlreadyCompleted =
    isExerciseCompleted(targetExerciseId, playgroundCompletions) ||
    isExerciseCompleted(step.exerciseId, playgroundCompletions);

  const storageKey = `forge_compact_code_${step.exerciseId}`;

  // Initial code state
  const [code, setCode] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) return saved;
    }
    return step.initialCode || "";
  });

  // Keep local storage synced
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, newCode);
    }
  };

  const [copied, setCopied] = useState(false);
  const [monacoFailed, setMonacoFailed] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [logs, setLogs] = useState<ConsoleLogItem[]>([]);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [previewError, setPreviewError] = useState<string | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const editorRef = useRef<any>(null);

  const isHtmlCss = useMemo(() => {
    const lang = (step.language || "").toLowerCase();
    const hasMarkup =
      code.includes("<html") ||
      code.includes("<div") ||
      code.includes("<p") ||
      code.includes("<style>") ||
      code.includes("<body");

    return step.previewType === "browser" || lang === "html" || lang === "css" || hasMarkup;
  }, [step.language, step.previewType, code]);

  // Derived effective preview type: browser iframe, console output, or none
  const effectivePreviewType = useMemo(() => {
    if (step.previewType) return step.previewType;
    return isHtmlCss ? "browser" : "console";
  }, [step.previewType, isHtmlCss]);

  const [activeTab, setActiveTab] = useState<"code" | "preview" | "console">("code");

  // Synchronize when step changes
  useEffect(() => {
    cancelPendingValidationRequests();
    const saved = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
    setCode(saved !== null ? saved : step.initialCode || "");
    setLogs([]);
    setValidationReport(null);
    setExecutionError(null);
    setPreviewError(null);
    setActiveTab("code");
  }, [step.exerciseId, step.initialCode, storageKey]);

  // Clean up pending requests on unmount
  useEffect(() => {
    return () => {
      cancelPendingValidationRequests();
    };
  }, []);

  // Determine file entry name
  const entryFileName = useMemo(() => {
    const lang = (step.language || "").toLowerCase();
    if (lang === "html") return "index.html";
    if (lang === "css") return "styles.css";
    if (lang === "json") return "data.json";
    if (lang === "jsx" || lang === "tsx") return "App.jsx";
    return "index.js";
  }, [step.language]);

  // Listen for console logs emitted from the execution sandbox
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== "object") return;

      // Isolation & security check: only accept events from this component's active iframe
      if (iframeRef.current?.contentWindow && event.source !== iframeRef.current.contentWindow) {
        return;
      }

      if (event.data.type === "PLAYGROUND_CONSOLE" || event.data.type === "SANDBOX_LOG") {
        const msg = event.data.message !== undefined ? event.data.message : event.data.msg;
        if (msg === undefined || msg === null) return;
        const rawLevel = event.data.level;
        const level: "log" | "info" | "warn" | "error" =
          rawLevel === "error" || rawLevel === "warn" || rawLevel === "info" ? rawLevel : "log";

        setLogs((prev) => [
          ...prev.slice(-49),
          {
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            level,
            message: String(msg),
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
          },
        ]);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Generate compilation manifest
  const manifest = useMemo<PlaygroundProjectManifest>(() => {
    const lang = (step.language || "").toLowerCase();
    const runtime =
      effectivePreviewType === "browser" || lang === "html" || lang === "css"
        ? "html-css"
        : "javascript";

    let files = [{ id: "main-file", name: entryFileName, content: code, isEntry: true }];

    // If CSS is written standalone, wrap in basic HTML shell for rendering & preview
    if (lang === "css" && !code.includes("<html")) {
      files = [
        {
          id: "html-file",
          name: "index.html",
          content: `<!DOCTYPE html>\n<html>\n<head>\n  <link rel="stylesheet" href="styles.css">\n</head>\n<body>\n  <div id="root">\n    <h1 id="heading">Forge Academy</h1>\n    <p class="intro">Welcome to the coding challenge.</p>\n  </div>\n</body>\n</html>`,
          isEntry: true,
        },
        { id: "css-file", name: "styles.css", content: code, isEntry: false },
      ];
    }

    return {
      runtime,
      entryFile: files.find((f) => f.isEntry)?.name || entryFileName,
      title: step.title || "Compact Code Challenge",
      files,
    };
  }, [code, entryFileName, effectivePreviewType, step.language, step.title]);

  // Update preview when code changes
  useEffect(() => {
    try {
      const compileReport = compilePlaygroundProject(manifest, {
        title: step.title || "Compact Challenge",
        baseUrl: "",
        workspaceRevision: Date.now(),
      });
      if (compileReport.success) {
        setPreviewHtml(compileReport.outputHtml);
        setPreviewError(null);
      } else {
        const err = compileReport.diagnostics.find((d) => d.severity === "error");
        setPreviewError(err?.message || "Compilation error");
      }
    } catch (e) {
      setPreviewError(e instanceof Error ? e.message : "Preview generation failed");
    }
  }, [manifest, step.title]);

  // Handle Copy
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle Reset to Initial Code
  const handleReset = () => {
    cancelPendingValidationRequests();
    setIsValidating(false);
    const original = step.initialCode || "";
    setCode(original);
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, original);
    }
    setLogs([]);
    setValidationReport(null);
    setExecutionError(null);
    setActiveTab("code");
    toast.info("Code reset to starter code.");
  };

  // Clear Console Logs
  const handleClearLogs = () => {
    setLogs([]);
  };

  // Handle Validation and Execution
  const handleRunAndValidate = async () => {
    if (isValidating) return;

    setLogs([]);
    setExecutionError(null);

    if (!step.validation) {
      // Direct completion for non-asserted exercises
      completePlaygroundExercise(targetExerciseId);
      toast.success("Code run successfully! +50 XP");
      if (onComplete) onComplete();
      return;
    }

    setIsValidating(true);
    const spec = step.validation;

    try {
      // Sync with global store so validation runner and iframe can communicate
      const store = usePlaygroundStore.getState();
      store.setManifest(manifest);
      store.setCompilerOutput(previewHtml, false);

      const report = await requestPlaygroundValidation(spec.exerciseId || targetExerciseId, spec);
      setValidationReport(report);

      if (report.status === "passed") {
        completePlaygroundExercise(targetExerciseId);
        if (!isAlreadyCompleted) {
          toast.success("Challenge completed! +50 XP");
        } else {
          toast.success("All requirements satisfied!");
        }
      } else if (report.status === "failed") {
        toast.error(
          `One or more requirements aren't satisfied (${report.passedCount}/${report.totalRequired} passed)`,
        );
      } else if (report.status === "error") {
        setExecutionError(report.executionError || "Your code couldn't run.");
        toast.error("Your code couldn't run. Check for syntax or runtime errors.");
      }
    } catch (err) {
      console.warn("Validation execution fallback error:", err);
      const errMsg = err instanceof Error ? err.message : "Your code couldn't run.";
      setExecutionError(errMsg);
      toast.error("Your code couldn't run. Check syntax.");
    } finally {
      setIsValidating(false);
    }
  };

  const isSuccess = validationReport?.status === "passed" || isAlreadyCompleted;

  return (
    <ExerciseCard
      title={step.title || "Focused Code Drill"}
      mode={step.mode || "code-completion"}
      leadIn={step.leadIn}
      instructions={step.instructions}
      isCompleted={isSuccess}
      className={className}
    >
      <div className="flex flex-col gap-4 max-w-4xl mx-auto py-1 w-full">
        {/* Editor & Output Container */}
        <div className="flex flex-col rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
          {/* Editor Header */}
          <div className="flex items-center justify-between border-b border-border/70 bg-muted/40 px-3 sm:px-3.5 py-2 text-xs gap-2 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-foreground flex items-center gap-1.5 whitespace-nowrap">
                <Code2 className="h-3.5 w-3.5 text-primary" />
                {entryFileName}
              </span>
              <Badge variant="outline" className="text-[10px] font-mono uppercase px-1.5 py-0">
                {step.language || "javascript"}
              </Badge>
            </div>

            <div className="flex items-center gap-1.5 ml-auto">
              {effectivePreviewType === "browser" && (
                <div
                  role="tablist"
                  aria-label="Editor and Preview Views"
                  className="flex items-center bg-muted/70 rounded-md p-0.5 border border-border/50 mr-1"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "code"}
                    onClick={() => setActiveTab("code")}
                    className={cn(
                      "px-2.5 py-0.5 text-[11px] font-medium rounded transition-colors whitespace-nowrap",
                      activeTab === "code"
                        ? "bg-background text-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Code
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "preview"}
                    onClick={() => setActiveTab("preview")}
                    className={cn(
                      "px-2.5 py-0.5 text-[11px] font-medium rounded transition-colors flex items-center gap-1 whitespace-nowrap",
                      activeTab === "preview"
                        ? "bg-background text-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Eye className="h-3 w-3" />
                    Preview
                  </button>
                </div>
              )}

              {effectivePreviewType === "console" && (
                <div
                  role="tablist"
                  aria-label="Editor and Console Views"
                  className="flex items-center bg-muted/70 rounded-md p-0.5 border border-border/50 mr-1"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "code"}
                    onClick={() => setActiveTab("code")}
                    className={cn(
                      "px-2.5 py-0.5 text-[11px] font-medium rounded transition-colors whitespace-nowrap",
                      activeTab === "code"
                        ? "bg-background text-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Code
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "console"}
                    onClick={() => setActiveTab("console")}
                    className={cn(
                      "px-2.5 py-0.5 text-[11px] font-medium rounded transition-colors flex items-center gap-1 whitespace-nowrap",
                      activeTab === "console"
                        ? "bg-background text-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Terminal className="h-3 w-3" />
                    Console
                    {logs.length > 0 && (
                      <span className="ml-0.5 px-1 py-0.2 rounded-full text-[9px] bg-primary/20 text-primary font-mono font-semibold">
                        {logs.length}
                      </span>
                    )}
                  </button>
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1"
                title="Copy code"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-emerald-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1"
                title="Reset starter code"
              >
                <RotateCcw className="h-3 w-3" />
                <span className="hidden sm:inline">Reset</span>
              </Button>

              {onExpandToFullPlayground && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onExpandToFullPlayground}
                  className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1 hidden md:flex"
                  title="Expand into full playground IDE"
                >
                  <Maximize2 className="h-3 w-3" />
                  Full IDE
                </Button>
              )}
            </div>
          </div>

          {/* Active View Body */}
          <div className="relative min-h-[170px] h-[200px] sm:h-[220px] md:h-[250px] w-full overflow-hidden">
            {activeTab === "code" &&
              (!monacoFailed ? (
                <div className="h-full w-full">
                  <MonacoEditor
                    height="100%"
                    language={step.language || "javascript"}
                    value={code}
                    theme={appTheme === "dark" ? "vs-dark" : "light"}
                    onChange={(val) => handleCodeChange(val || "")}
                    onMount={(editor) => {
                      editorRef.current = editor;
                    }}
                    options={{
                      fontSize: 13,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      lineNumbers: "on",
                      lineNumbersMinChars: 3,
                      folding: false,
                      renderLineHighlight: "all",
                      scrollbar: { vertical: "auto", horizontal: "auto" },
                      padding: { top: 8, bottom: 8 },
                      tabSize: 2,
                      wordWrap: "off",
                    }}
                  />
                </div>
              ) : (
                /* High-accessibility fallback textarea if Monaco fails */
                <textarea
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  className="w-full h-full p-3.5 font-mono text-xs sm:text-[13px] leading-relaxed bg-background text-foreground border-0 resize-none focus:outline-none focus:ring-1 focus:ring-primary whitespace-pre overflow-x-auto"
                  placeholder="Enter your code solution here..."
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                />
              ))}
            {/* Console Output Panel */}
            {activeTab === "console" && (
              <div className="w-full h-full bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden font-mono text-xs">
                <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Terminal className="h-3 w-3 text-primary" />
                    Output Console
                  </span>
                  {logs.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearLogs}
                      className="hover:text-zinc-200 flex items-center gap-1 transition-colors px-1 py-0.5 rounded"
                      title="Clear console output"
                    >
                      <Trash2 className="h-3 w-3" />
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex-1 p-3 overflow-auto space-y-1.5">
                  {logs.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-zinc-500 italic text-[11px]">
                      No console output. Use console.log() to print values, then click &quot;Run
                      &amp; Check Answer&quot;.
                    </div>
                  ) : (
                    logs.map((log) => (
                      <div
                        key={log.id}
                        className={cn(
                          "flex items-start gap-2 leading-relaxed font-mono text-[11px]",
                          log.level === "error"
                            ? "text-rose-400"
                            : log.level === "warn"
                              ? "text-amber-400"
                              : log.level === "info"
                                ? "text-emerald-400"
                                : "text-zinc-200",
                        )}
                      >
                        <span className="text-zinc-600 text-[10px] select-none">
                          {log.timestamp}
                        </span>
                        <span className="select-none font-bold uppercase text-[9px] px-1 py-0.2 rounded bg-zinc-800 text-zinc-400">
                          {log.level}
                        </span>
                        <pre className="whitespace-pre-wrap break-all font-mono flex-1 m-0">
                          {log.message}
                        </pre>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Authoritative Live Preview / Execution Runtime Frame */}
            <div
              className={cn(
                "w-full h-full bg-white text-slate-900 overflow-auto",
                activeTab === "preview"
                  ? "block"
                  : "absolute -top-[9999px] -left-[9999px] w-[1px] h-[1px] opacity-0 pointer-events-none",
              )}
              aria-hidden={activeTab !== "preview"}
            >
              {previewError ? (
                <div className="p-4 text-xs text-rose-500 font-mono flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{previewError}</span>
                </div>
              ) : previewHtml ? (
                <iframe
                  ref={iframeRef}
                  title="Forge Playground Live Preview"
                  srcDoc={previewHtml}
                  sandbox="allow-scripts allow-same-origin"
                  className="w-full h-full border-0"
                />
              ) : null}
            </div>
          </div>
        </div>

        {/* Validation Feedback Banner (Hierarchy: Checking -> Passed / Failed / Error) */}
        {(validationReport || executionError) && (
          <div
            className={cn(
              "rounded-xl border p-3.5 sm:p-4 text-xs space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150",
              validationReport?.status === "passed"
                ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-950 dark:text-emerald-200"
                : executionError || validationReport?.status === "error"
                  ? "border-rose-500/40 bg-rose-500/5 text-rose-950 dark:text-rose-200"
                  : "border-amber-500/40 bg-amber-500/5 text-amber-950 dark:text-amber-200",
            )}
          >
            <div className="flex items-center justify-between font-semibold flex-wrap gap-1.5">
              <div className="flex items-center gap-2">
                {validationReport?.status === "passed" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : executionError || validationReport?.status === "error" ? (
                  <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                )}
                <span>
                  {validationReport?.status === "passed"
                    ? "✓ Challenge completed"
                    : executionError || validationReport?.status === "error"
                      ? "Your code couldn't run."
                      : "Your code runs, but one or more requirements aren't satisfied."}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {validationReport?.status === "passed" && (
                  <Badge
                    variant="outline"
                    className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-mono"
                  >
                    +50 XP
                  </Badge>
                )}
                {validationReport?.durationMs !== undefined && (
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {validationReport.durationMs}ms
                  </span>
                )}
              </div>
            </div>

            {/* Execution error message if any */}
            {executionError && (
              <p className="text-[11px] font-mono text-rose-500 pt-1 border-t border-rose-500/20">
                {executionError}
              </p>
            )}

            {/* Individual Assertion Results */}
            {validationReport?.results && validationReport.results.length > 0 && (
              <div className="space-y-1.5 pt-1.5 border-t border-border/40">
                {validationReport.results.map((res, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    {res.status === "passed" ? (
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-foreground">{res.description}</span>
                      {res.errorMessage && (
                        <p className="text-[11px] text-rose-500 mt-0.5 font-mono">
                          {res.errorMessage}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-1 border-t border-border/50 gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isSuccess ? (
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[11px] gap-1 font-medium py-0.5"
              >
                <Check className="h-3 w-3" />
                Completed
              </Badge>
            ) : step.validation ? (
              <span>
                {step.validation.assertions.length} validation check
                {step.validation.assertions.length === 1 ? "" : "s"}
              </span>
            ) : (
              <span>Focused authoring drill</span>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="default"
              size="sm"
              disabled={isValidating}
              onClick={handleRunAndValidate}
              className="text-xs font-medium gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs min-h-[36px] px-3.5"
            >
              {isValidating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                  <span>Checking your code…</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current shrink-0" />
                  <span>Run &amp; Check Answer</span>
                </>
              )}
            </Button>

            {isSuccess && onComplete && (
              <Button
                variant="default"
                size="sm"
                onClick={onComplete}
                className="text-xs font-medium gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs min-h-[36px] px-3.5 animate-in fade-in duration-200"
              >
                <span>Continue</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </ExerciseCard>
  );
}
