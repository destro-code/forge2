import { useState, useEffect, useRef, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Wand2,
  Sun,
  Moon,
  FileCode,
  Copy,
  Check,
  Undo2,
  Redo2,
  Type,
  Command,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import type { PlaygroundFile } from "@/lib/types/playground";
import { usePlaygroundStore } from "@/lib/stores/use-playground-store";
import { useTheme } from "@/lib/hooks/use-theme";
import { MonacoEditor } from "@/components/shared/monaco-editor";
import { getLanguageFromFileName } from "@/lib/playground-templates";

interface PlaygroundEditorProps {
  onCodeChange?: (code: string) => void;
  onFormatCode?: () => void;
  onRunCode?: () => void;
}

export function PlaygroundEditor({ onCodeChange, onFormatCode, onRunCode }: PlaygroundEditorProps) {
  const { files, activeFileId, updateFileContent } = usePlaygroundStore();
  const activeFile = files.find((f) => f.id === activeFileId);
  const activeFileRef = useRef(activeFile);
  activeFileRef.current = activeFile;

  const lastSyncedFileIdRef = useRef<string | null>(null);
  const lastSyncedCodeRef = useRef<string | null>(null);

  const [mounted, setMounted] = useState(false);
  const [editorLoaded, setEditorLoaded] = useState(false);
  const [editorError, setEditorError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const { theme: appTheme } = useTheme();

  // Font size setting stored in state & persisted in localStorage
  const [fontSize, setFontSize] = useState<number>(() => {
    if (typeof window === "undefined") return 13;
    const saved = localStorage.getItem("forge_playground_fontsize");
    return saved ? parseInt(saved, 10) : 13;
  });

  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 1024;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Editor theme setting: "auto" (synced with app) | "vs-dark" | "light"
  const [editorThemeMode, setEditorThemeMode] = useState<"auto" | "vs-dark" | "light">("auto");
  const [copied, setCopied] = useState(false);

  // Monaco editor instance ref for command bindings (Undo / Redo)

  const editorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("[Forge Monaco] mount started");
    setMounted(true);
  }, []);

  // ResizeObserver for container element to trigger Monaco layout on visibility / tab / viewport change
  useEffect(() => {
    if (!containerRef.current) return;

    const initialRect = containerRef.current.getBoundingClientRect();
    console.log(
      `[Forge Monaco] container dimensions: ${initialRect.width} x ${initialRect.height}`,
    );

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (
          width > 0 &&
          height > 0 &&
          editorRef.current &&
          typeof editorRef.current.layout === "function"
        ) {
          console.log(`[Forge Monaco] layout: ${width} x ${height}`);
          editorRef.current.layout({ width, height });
        }
      }
    });
    observer.observe(containerRef.current);

    if (
      initialRect.width > 0 &&
      initialRect.height > 0 &&
      editorRef.current &&
      typeof editorRef.current.layout === "function"
    ) {
      console.log(`[Forge Monaco] layout: ${initialRect.width} x ${initialRect.height}`);
      editorRef.current.layout({ width: initialRect.width, height: initialRect.height });
    }

    return () => observer.disconnect();
  }, [editorLoaded, activeFile?.id]);

  // Set 12-second loading timeout to catch genuine Monaco mount failures on slow mobile networks
  useEffect(() => {
    if (!mounted || !activeFile) return;

    setEditorError(false);
    setEditorLoaded(false);

    let active = true;

    const timer = setTimeout(() => {
      if (active && !editorRef.current) {
        setEditorError(true);
      }
    }, 12000);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [mounted, activeFile, retryKey]);

  const handleFontSizeChange = (newSize: number) => {
    setFontSize(newSize);
    if (typeof window !== "undefined") {
      localStorage.setItem("forge_playground_fontsize", String(newSize));
    }
  };

  const effectiveTheme =
    editorThemeMode === "auto" ? (appTheme === "light" ? "light" : "vs-dark") : editorThemeMode;

  const getLanguage = (fileName: string) => {
    return getLanguageFromFileName(fileName || "");
  };

  const lineCount = (activeFile?.code || "").split("\n").length;
  const charCount = (activeFile?.code || "").length;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeFile?.code || "");
    setCopied(true);
    toast.success(`Copied ${activeFile?.name} to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUndo = () => {
    if (editorRef.current) {
      editorRef.current.trigger("keyboard", "undo", null);
    }
  };

  const handleRedo = () => {
    if (editorRef.current) {
      editorRef.current.trigger("keyboard", "redo", null);
    }
  };

  const handleEditorMount = (editor: any, monaco: any) => {
    const model = editor?.getModel?.();
    const modelUri = model?.uri?.toString?.() || "unknown";
    console.log(`[Forge Monaco] editor mounted for file: ${activeFile?.id}, model: ${modelUri}`);
    setEditorLoaded(true);
    setEditorError(false);
    editorRef.current = editor;

    // 1. Verify the current Monaco model exists.
    // 2. Verify its value equals activeFile.code.
    // 3. If not equal, synchronize the model with activeFile.code.
    // 4. Force Monaco to refresh its view rendering.
    if (model && activeFile) {
      const currentModelVal = model.getValue();
      const targetCode = activeFile.code || "";
      if (currentModelVal !== targetCode) {
        console.log(
          `[Forge Monaco] Synchronizing model value on mount. Expected: ${targetCode.substring(0, 40)}... Actual: ${currentModelVal.substring(0, 40)}...`,
        );
        model.setValue(targetCode);
      }
      if (typeof editor.render === "function") {
        editor.render(true);
      }
      lastSyncedFileIdRef.current = activeFile.id;
      lastSyncedCodeRef.current = targetCode;
    }

    const rect = containerRef.current
      ? containerRef.current.getBoundingClientRect()
      : { width: 0, height: 0 };
    console.log(`[Forge Monaco] container dimensions on mount: ${rect.width} x ${rect.height}`);

    const triggerLayout = () => {
      if (containerRef.current && editor && typeof editor.layout === "function") {
        const r = containerRef.current.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          console.log(`[Forge Monaco] layout: ${r.width} x ${r.height}`);
          editor.layout({ width: r.width, height: r.height });
        } else {
          editor.layout();
        }
      }
    };

    triggerLayout();
    requestAnimationFrame(triggerLayout);
    setTimeout(triggerLayout, 100);
    setTimeout(triggerLayout, 300);

    if (editor && typeof editor.onDidDispose === "function") {
      editor.onDidDispose(() => {
        if (editorRef.current === editor) {
          editorRef.current = null;
        }
      });
    }

    // Cmd/Ctrl + S -> Save & Format
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onFormatCode?.();
      toast.success("Code formatted & state saved");
    });

    // Cmd/Ctrl + Enter -> Run Code
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onRunCode?.();
    });

    // Cmd/Ctrl + Shift + F -> Format
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
      onFormatCode?.();
    });
  };

  // Synchronize model and layout whenever active file ID or session changes (with user edit protection)
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !activeFile) return;

    const fileChanged = lastSyncedFileIdRef.current !== activeFile.id;
    if (fileChanged) {
      const model = editor.getModel();
      if (model) {
        const currentVal = model.getValue();
        const targetCode = activeFile.code || "";
        if (currentVal !== targetCode) {
          console.log(
            `[Forge Monaco] Synchronizing model value on file change. Target: ${targetCode.substring(0, 40)}...`,
          );
          model.setValue(targetCode);
        }
        if (typeof editor.render === "function") {
          editor.render(true);
        }
      }
      lastSyncedFileIdRef.current = activeFile.id;
      lastSyncedCodeRef.current = activeFile.code;

      if (containerRef.current && typeof editor.layout === "function") {
        const r = containerRef.current.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          editor.layout({ width: r.width, height: r.height });
        } else {
          editor.layout();
        }
      }
    }
  }, [activeFile]);

  if (!activeFile) {
    return (
      <div className="flex-1 flex flex-col h-full min-h-[400px] bg-background w-full min-w-0 overflow-hidden">
        <div className="flex h-full w-full items-center justify-center bg-card p-6">
          <div className="text-xs text-muted-foreground animate-pulse">
            {files.length === 0
              ? "Loading workspace files..."
              : "No open file selected. Select a file in Files tab."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full min-h-[400px] bg-background w-full min-w-0 overflow-hidden">
      {/* Editor Main */}
      <div
        ref={containerRef}
        className="flex-1 relative min-h-[350px] h-full w-full overflow-hidden"
      >
        {editorError ? (
          <div className="flex h-full w-full flex-col bg-card border border-border/50 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-amber-500/10 px-3 py-2 text-xs">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-medium">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>
                  Monaco timed out — switched to lightweight code editor. You can still edit, run,
                  and validate your code.
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[11px] px-2 gap-1 bg-background hover:bg-muted shrink-0"
                onClick={() => {
                  editorRef.current = null;
                  setEditorError(false);
                  setEditorLoaded(false);
                  setRetryKey((prev) => prev + 1);
                }}
              >
                <RotateCcw className="h-3 w-3" />
                Retry Monaco
              </Button>
            </div>
            <div className="flex-1 p-2 bg-background min-h-0">
              <textarea
                value={activeFile?.code || ""}
                onChange={(e) => {
                  const newCode = e.target.value;
                  lastSyncedCodeRef.current = newCode;
                  if (activeFile) {
                    updateFileContent(activeFile.id, newCode);
                  }
                  if (onCodeChange) onCodeChange(newCode);
                }}
                className="w-full h-full p-3 font-mono text-xs sm:text-sm bg-muted/20 text-foreground border border-border/40 rounded-md resize-none focus:outline-none focus:border-primary leading-relaxed"
                spellCheck={false}
                placeholder="Type your code here..."
              />
            </div>
          </div>
        ) : mounted ? (
          <Suspense
            fallback={
              <div className="flex h-full w-full items-center justify-center bg-card p-6">
                <Skeleton className="h-full w-full rounded-lg" />
              </div>
            }
          >
            <MonacoEditor
              key={`${activeFile.id}_${retryKey}`}
              path={activeFile.name ? `${activeFile.id}/${activeFile.name}` : activeFile.id}
              height="100%"
              language={getLanguage(activeFile.name)}
              value={activeFile.code || ""}
              onChange={(v) => {
                const currentActive = activeFileRef.current;
                if (currentActive && activeFile && currentActive.id === activeFile.id) {
                  const newCode = v ?? "";
                  lastSyncedCodeRef.current = newCode;
                  updateFileContent(currentActive.id, newCode);
                  if (onCodeChange) onCodeChange(newCode);
                }
              }}
              onMount={handleEditorMount}
              theme={effectiveTheme}
              options={{
                fontSize: isMobile ? 12 : fontSize,
                lineHeight: isMobile ? 18 : undefined,
                fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace",
                minimap: { enabled: false },
                tabSize: 2,
                wordWrap: "on",
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                automaticLayout: true,
                padding: isMobile ? { top: 6, bottom: 6 } : { top: 12, bottom: 12 },
                lineNumbersMinChars: 3,
                autoClosingBrackets: "always",
                autoClosingQuotes: "always",
                bracketPairColorization: { enabled: true },
                matchBrackets: "always",
                autoIndent: "full",
                suggest: { showWords: true, showSnippets: true },
                tabCompletion: "on",
                formatOnType: true,
                formatOnPaste: true,
                folding: true,
                renderLineHighlight: "all",
              }}
            />
          </Suspense>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-card p-6">
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
        )}
      </div>

      {/* Editor Status & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-1 sm:gap-2 border-t border-border/50 bg-card/60 px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5 sm:gap-3">
          <span className="flex items-center gap-1 font-medium text-foreground">
            <FileCode className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
            {activeFile?.name}
          </span>
          <Badge
            variant="outline"
            className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 h-3.5 sm:h-4 border-border/60"
          >
            {getLanguage(activeFile?.name)}
          </Badge>
          <span className="hidden sm:inline">{lineCount} lines</span>
          <span className="hidden sm:inline">{charCount} chars</span>
          <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-muted-foreground/70">
            <Command className="h-3 w-3" /> S (Save) · <Command className="h-3 w-3" /> ↵ (Run)
          </span>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1">
          {/* Undo / Redo */}
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground hover:text-foreground"
            onClick={handleUndo}
            title="Undo (Ctrl/Cmd+Z)"
          >
            <Undo2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground hover:text-foreground"
            onClick={handleRedo}
            title="Redo (Ctrl/Cmd+Y)"
          >
            <Redo2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
          </Button>

          {/* Copy Code */}
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground hover:text-foreground"
            onClick={handleCopyCode}
            title="Copy file code"
          >
            {copied ? (
              <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-emerald-400" />
            ) : (
              <Copy className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            )}
          </Button>

          {/* Font Size Selector */}
          <div className="flex items-center gap-0.5 rounded border border-border/50 bg-background/50 px-1 py-0">
            <Type className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground" />
            <select
              value={isMobile ? 12 : fontSize}
              onChange={(e) => handleFontSizeChange(parseInt(e.target.value, 10))}
              className="bg-transparent text-[9px] sm:text-[10px] text-foreground focus:outline-none cursor-pointer"
              title="Font Size"
            >
              <option value={12}>12px</option>
              <option value={13}>13px</option>
              <option value={14}>14px</option>
              <option value={16}>16px</option>
              <option value={18}>18px</option>
            </select>
          </div>

          {/* Format */}
          {onFormatCode && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 sm:h-6 px-1 sm:px-1.5 text-[9px] sm:text-[10px] gap-0.5 sm:gap-1 hover:text-foreground"
              onClick={onFormatCode}
              title="Auto-format code (Ctrl/Cmd+Shift+F)"
            >
              <Wand2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary" />
              <span className="hidden sm:inline">Format</span>
            </Button>
          )}

          {/* Theme Sync Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="h-5 sm:h-6 px-1 sm:px-1.5 text-[9px] sm:text-[10px] gap-0.5 sm:gap-1"
            onClick={() => {
              if (editorThemeMode === "auto") setEditorThemeMode("vs-dark");
              else if (editorThemeMode === "vs-dark") setEditorThemeMode("light");
              else setEditorThemeMode("auto");
            }}
            title={`Editor Theme: ${editorThemeMode} (Click to toggle)`}
          >
            {effectiveTheme === "vs-dark" ? (
              <Sun className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-400" />
            ) : (
              <Moon className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-sky-400" />
            )}
            <span className="capitalize hidden sm:inline">
              {editorThemeMode === "auto"
                ? "Sync"
                : effectiveTheme === "vs-dark"
                  ? "Dark"
                  : "Light"}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
