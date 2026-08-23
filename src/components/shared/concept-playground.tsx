import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  RotateCcw,
  Copy,
  Check,
  Code2,
  Eye,
  Terminal,
  X,
  Sparkles,
  ChevronRight,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { MonacoEditor } from "@/components/shared/monaco-editor";
import { compilePlaygroundProject } from "@/lib/playground-compiler";
import { useTheme } from "@/lib/hooks/use-theme";
import { cn } from "@/lib/utils";
import type { PlaygroundProjectManifest } from "@/lib/types/playground";

export interface ConceptPlaygroundProps {
  initialCode: string;
  language?: string;
  title?: string;
  onClose?: () => void;
  className?: string;
}

interface ConsoleLogItem {
  id: string;
  level: "log" | "info" | "warn" | "error";
  message: string;
  timestamp: string;
}

export function ConceptPlayground({
  initialCode,
  language = "html",
  title,
  onClose,
  className,
}: ConceptPlaygroundProps) {
  const { theme: appTheme } = useTheme();
  const [code, setCode] = useState<string>(initialCode);
  const [copied, setCopied] = useState(false);
  const [logs, setLogs] = useState<ConsoleLogItem[]>([]);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const normLang = (language || "").toLowerCase();
  const isHtmlOrCss =
    normLang === "html" ||
    normLang === "css" ||
    initialCode.includes("<html") ||
    initialCode.includes("<div") ||
    initialCode.includes("<p") ||
    initialCode.includes("<h1") ||
    initialCode.includes("<style");

  const [activeTab, setActiveTab] = useState<"code" | "preview" | "console">("code");

  // Determine entry file name
  const entryFileName = useMemo(() => {
    if (normLang === "html") return "index.html";
    if (normLang === "css") return "styles.css";
    if (normLang === "json") return "data.json";
    if (normLang === "jsx" || normLang === "tsx") return "App.jsx";
    if (normLang === "ts" || normLang === "typescript") return "index.ts";
    return "index.js";
  }, [normLang]);

  // Determine monaco language mode
  const monacoLanguage = useMemo(() => {
    if (normLang === "html") return "html";
    if (normLang === "css") return "css";
    if (normLang === "json") return "json";
    if (normLang === "jsx" || normLang === "tsx") return "javascript";
    if (normLang === "ts" || normLang === "typescript") return "typescript";
    return "javascript";
  }, [normLang]);

  // Listen for iframe console logs
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== "object") return;
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
          ...prev.slice(-30),
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

  // Compile project to HTML
  const executeCode = (codeToRun: string) => {
    try {
      setIsCompiling(true);
      setPreviewError(null);

      const runtime = isHtmlOrCss ? "html-css" : "javascript";
      let files = [{ id: "main-file", name: entryFileName, content: codeToRun, isEntry: true }];

      if (normLang === "css" && !codeToRun.includes("<html")) {
        files = [
          {
            id: "html-file",
            name: "index.html",
            content: `<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="utf-8">\n  <link rel="stylesheet" href="styles.css">\n</head>\n<body>\n  <div class="demo-wrapper">\n    <h1>Sample Heading</h1>\n    <p>This is a live preview paragraph styled by your CSS.</p>\n    <button class="btn">Sample Button</button>\n  </div>\n</body>\n</html>`,
            isEntry: true,
          },
          { id: "css-file", name: "styles.css", content: codeToRun, isEntry: false },
        ];
      }

      const manifest: PlaygroundProjectManifest = {
        runtime,
        entryFile: files.find((f) => f.isEntry)?.name || entryFileName,
        title: title || "Concept Code Playground",
        files,
      };

      const result = compilePlaygroundProject(manifest);
      setPreviewHtml(result.outputHtml);

      if (result.diagnostics?.errors && result.diagnostics.errors.length > 0) {
        setPreviewError(result.diagnostics.errors.map((e) => e.message).join("\n"));
      }
    } catch (err: any) {
      setPreviewError(err?.message || "Failed to compile concept code");
    } finally {
      setIsCompiling(false);
    }
  };

  // Compile on mount & initial code
  useEffect(() => {
    executeCode(initialCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* ignore */
    }
  };

  const handleReset = () => {
    setCode(initialCode);
    setLogs([]);
    executeCode(initialCode);
  };

  const handleRun = () => {
    setLogs([]);
    executeCode(code);
    if (!isHtmlOrCss && activeTab === "code") {
      setActiveTab("console");
    } else if (isHtmlOrCss && activeTab === "code") {
      setActiveTab("preview");
    }
  };

  return (
    <div
      className={cn(
        "my-4 rounded-xl border border-primary/30 bg-card shadow-sm overflow-hidden flex flex-col transition-all",
        isExpanded ? "min-h-[420px]" : "min-h-[280px]",
        className,
      )}
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-muted/40 px-3 py-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Try It Playground</span>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] uppercase font-mono px-1.5 py-0 bg-background/60"
          >
            {language}
          </Badge>
        </div>

        {/* View / Tab Switcher */}
        <div className="flex items-center gap-1 bg-background/80 p-0.5 rounded-lg border border-border/50">
          <button
            type="button"
            onClick={() => setActiveTab("code")}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all",
              activeTab === "code"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Code2 className="h-3 w-3" />
            <span>Code</span>
          </button>

          {isHtmlOrCss && (
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all",
                activeTab === "preview"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Eye className="h-3 w-3" />
              <span>Preview</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab("console")}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all",
              activeTab === "console"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Terminal className="h-3 w-3" />
            <span>Console</span>
            {logs.length > 0 && (
              <span className="ml-0.5 px-1 py-0.2 rounded-full text-[9px] bg-primary/20 text-primary">
                {logs.length}
              </span>
            )}
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="default"
            size="sm"
            onClick={handleRun}
            disabled={isCompiling}
            className="h-7 px-2.5 text-[11px] gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            title="Run code & update output"
          >
            <Play className="h-3 w-3 fill-current" />
            <span>Run</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-7 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
            title="Reset to original code"
          >
            <RotateCcw className="h-3 w-3" />
            <span className="hidden sm:inline">Reset</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
            title="Copy code"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hidden sm:flex items-center justify-center"
            title={isExpanded ? "Compact view" : "Expand view"}
          >
            {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </Button>

          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
              title="Close playground & view static code"
            >
              <X className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Close</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Sandbox Content Region */}
      <div className={cn("relative flex-1 bg-background", isExpanded ? "h-80" : "h-56 sm:h-64")}>
        {/* Tab 1: Code Editor */}
        <div className={cn("h-full w-full", activeTab === "code" ? "block" : "hidden")}>
          <MonacoEditor
            height="100%"
            language={monacoLanguage}
            value={code}
            onChange={(val) => {
              const newCode = val || "";
              setCode(newCode);
            }}
            theme={appTheme === "dark" ? "vs-dark" : "light"}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, monospace",
              lineNumbers: "on",
              folding: false,
              wordWrap: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              padding: { top: 8, bottom: 8 },
            }}
          />
        </div>

        {/* Tab 2: Browser Preview */}
        {isHtmlOrCss && (
          <div
            className={cn(
              "h-full w-full bg-white dark:bg-zinc-950 flex flex-col",
              activeTab === "preview" ? "flex" : "hidden",
            )}
          >
            {previewError ? (
              <div className="p-4 text-xs text-destructive bg-destructive/10 font-mono overflow-auto h-full">
                <div className="font-semibold mb-1">Preview Error:</div>
                <pre>{previewError}</pre>
              </div>
            ) : (
              <iframe
                ref={iframeRef}
                title="Live Concept Preview"
                srcDoc={previewHtml}
                sandbox="allow-scripts allow-modals allow-same-origin"
                className="w-full h-full border-0 bg-white"
              />
            )}
          </div>
        )}

        {/* Tab 3: Console Output */}
        <div
          className={cn(
            "h-full w-full bg-zinc-950 text-zinc-100 p-3 font-mono text-xs overflow-y-auto scrollbar-thin",
            activeTab === "console" ? "block" : "hidden",
          )}
        >
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-center gap-2">
              <Terminal className="h-6 w-6 opacity-40" />
              <div>No console output yet.</div>
              <div className="text-[11px] opacity-75">
                Click <span className="text-emerald-400 font-semibold">Run</span> or edit code with{" "}
                <code className="text-zinc-300">console.log(...)</code> to see output.
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={cn(
                    "flex items-start gap-2 py-0.5 leading-relaxed break-words",
                    log.level === "error" && "text-rose-400 bg-rose-950/30 px-1.5 rounded",
                    log.level === "warn" && "text-amber-300 bg-amber-950/30 px-1.5 rounded",
                    log.level === "info" && "text-sky-300",
                    log.level === "log" && "text-zinc-200",
                  )}
                >
                  <span className="text-[10px] text-zinc-500 shrink-0 select-none">
                    [{log.timestamp}]
                  </span>
                  <span
                    className={cn(
                      "text-[9px] uppercase px-1 rounded shrink-0 select-none font-semibold",
                      log.level === "error" && "bg-rose-500/20 text-rose-300",
                      log.level === "warn" && "bg-amber-500/20 text-amber-300",
                      log.level === "info" && "bg-sky-500/20 text-sky-300",
                      log.level === "log" && "bg-zinc-800 text-zinc-400",
                    )}
                  >
                    {log.level}
                  </span>
                  <span className="flex-1 whitespace-pre-wrap">{log.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* Hidden iframe for executing JavaScript in console mode */}
          {!isHtmlOrCss && (
            <iframe
              ref={iframeRef}
              title="JS Sandbox Execution"
              srcDoc={previewHtml}
              sandbox="allow-scripts allow-modals allow-same-origin"
              className="hidden w-0 h-0"
            />
          )}
        </div>
      </div>
    </div>
  );
}
