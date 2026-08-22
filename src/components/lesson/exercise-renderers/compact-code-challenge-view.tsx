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
  AlertTriangle,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { ExerciseCard } from "./exercise-card";
import { useProgressStore } from "@/lib/stores/use-progress-store";
import { usePlaygroundStore } from "@/lib/stores/use-playground-store";
import { useTheme } from "@/lib/hooks/use-theme";
import { MonacoEditor } from "@/components/shared/monaco-editor";
import { compilePlaygroundProject } from "@/lib/playground-compiler";
import { requestPlaygroundValidation, waitForIframeReady } from "@/lib/compiler/validation-client";
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
  const isAlreadyCompleted = (playgroundCompletions || []).some(
    (c) => c.templateId === targetExerciseId || c.templateId === step.exerciseId,
  );

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
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code");
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [previewError, setPreviewError] = useState<string | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const editorRef = useRef<any>(null);

  const isHtmlCss = useMemo(() => {
    const lang = (step.language || "").toLowerCase();
    return (
      step.showPreview ||
      lang === "html" ||
      lang === "css" ||
      code.includes("<html") ||
      code.includes("<div") ||
      code.includes("<p") ||
      code.includes("<style>") ||
      code.includes("<body")
    );
  }, [step.language, step.showPreview, code]);

  // Determine file entry name
  const entryFileName = useMemo(() => {
    const lang = (step.language || "").toLowerCase();
    if (lang === "html") return "index.html";
    if (lang === "css") return "styles.css";
    if (lang === "json") return "data.json";
    if (lang === "jsx" || lang === "tsx") return "App.jsx";
    return "index.js";
  }, [step.language]);

  // Generate compilation manifest
  const manifest = useMemo<PlaygroundProjectManifest>(() => {
    const lang = (step.language || "").toLowerCase();
    const runtime = lang === "html" || lang === "css" || isHtmlCss ? "html-css" : "javascript";

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
  }, [code, entryFileName, isHtmlCss, step.language, step.title]);

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
    const original = step.initialCode || "";
    setCode(original);
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, original);
    }
    setValidationReport(null);
    toast.info("Code reset to starter code.");
  };

  // Handle Validation and Execution
  const handleRunAndValidate = async () => {
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
          toast.success("🎉 Challenge Passed! +50 XP awarded");
        } else {
          toast.success("✨ All checks satisfied!");
        }
        if (onComplete) onComplete();
      } else {
        toast.error(`Validation incomplete: ${report.passedCount}/${report.totalRequired} passed`);
      }
    } catch (err) {
      console.warn("Validation execution via client fallback:", err);
      toast.error("Validation failed to complete. Check code syntax.");
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
      <div className="flex flex-col gap-4 max-w-4xl mx-auto py-1">
        {/* Editor & Preview Container */}
        <div className="flex flex-col rounded-xl border border-border/80 bg-card overflow-hidden shadow-sm">
          {/* Editor Header */}
          <div className="flex items-center justify-between border-b border-border/70 bg-muted/40 px-3.5 py-2 text-xs gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Code2 className="h-3.5 w-3.5 text-primary" />
                {entryFileName}
              </span>
              <Badge variant="outline" className="text-[10px] font-mono uppercase">
                {step.language || "javascript"}
              </Badge>
            </div>

            <div className="flex items-center gap-1.5">
              {isHtmlCss && (
                <div className="flex items-center bg-muted/70 rounded-md p-0.5 border border-border/50 mr-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab("code")}
                    className={cn(
                      "px-2 py-0.5 text-[11px] font-medium rounded transition-colors",
                      activeTab === "code"
                        ? "bg-background text-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("preview")}
                    className={cn(
                      "px-2 py-0.5 text-[11px] font-medium rounded transition-colors flex items-center gap-1",
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
                {copied ? "Copied" : "Copy"}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1"
                title="Reset starter code"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </Button>

              {onExpandToFullPlayground && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onExpandToFullPlayground}
                  className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1 hidden sm:flex"
                  title="Expand into full playground IDE"
                >
                  <Maximize2 className="h-3 w-3" />
                  Full IDE
                </Button>
              )}
            </div>
          </div>

          {/* Active View Body */}
          <div className="relative min-h-[160px] max-h-[320px]">
            {activeTab === "code" ? (
              !monacoFailed ? (
                <div className="h-[200px] w-full">
                  <MonacoEditor
                    height="200px"
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
                    }}
                  />
                </div>
              ) : (
                /* High-accessibility fallback textarea if Monaco fails */
                <textarea
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  className="w-full h-[200px] p-3.5 font-mono text-xs leading-relaxed bg-background text-foreground border-0 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Enter your code solution here..."
                  spellCheck={false}
                />
              )
            ) : (
              /* Live Preview Frame */
              <div className="w-full h-[200px] bg-white text-slate-900 overflow-auto">
                {previewError ? (
                  <div className="p-4 text-xs text-rose-500 font-mono flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{previewError}</span>
                  </div>
                ) : (
                  <iframe
                    ref={iframeRef}
                    title="Compact Drill Preview"
                    srcDoc={previewHtml}
                    sandbox="allow-scripts allow-same-origin"
                    className="w-full h-full border-0"
                  />
                )}
              </div>
            )}
          </div>

          {/* Hidden Background Iframe for Validation Runtime if in Code Tab */}
          {isHtmlCss && activeTab === "code" && previewHtml && (
            <iframe
              title="Forge Validation Barrier"
              srcDoc={previewHtml}
              sandbox="allow-scripts allow-same-origin"
              className="hidden w-0 h-0 pointer-events-none"
              tabIndex={-1}
              aria-hidden="true"
            />
          )}
        </div>

        {/* Validation Feedback Banner (if executed) */}
        {validationReport && (
          <div
            className={cn(
              "rounded-xl border p-3.5 sm:p-4 text-xs space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150",
              validationReport.status === "passed"
                ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-950 dark:text-emerald-200"
                : "border-amber-500/40 bg-amber-500/5 text-amber-950 dark:text-amber-200",
            )}
          >
            <div className="flex items-center justify-between font-semibold">
              <div className="flex items-center gap-1.5">
                {validationReport.status === "passed" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-amber-500" />
                )}
                <span>
                  {validationReport.status === "passed"
                    ? "All checks passed! Great job!"
                    : `Checks: ${validationReport.passedCount}/${validationReport.totalRequired} passed`}
                </span>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">
                {validationReport.durationMs}ms
              </span>
            </div>

            {/* Individual Assertion Results */}
            {validationReport.results && validationReport.results.length > 0 && (
              <div className="space-y-1.5 pt-1 border-t border-border/40">
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
          <div className="text-xs text-muted-foreground">
            {step.validation
              ? `${step.validation.assertions.length} validation check${step.validation.assertions.length === 1 ? "" : "s"}`
              : "Focused authoring drill"}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              disabled={isValidating}
              onClick={handleRunAndValidate}
              className="text-xs font-medium gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
            >
              {isValidating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Run & Check Answer
                </>
              )}
            </Button>

            {isSuccess && onComplete && (
              <Button
                variant="default"
                size="sm"
                onClick={onComplete}
                className="text-xs font-medium gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Continue
              </Button>
            )}
          </div>
        </div>
      </div>
    </ExerciseCard>
  );
}
