import { lazy, Suspense, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code2, Wand2, Sun, Moon, FileCode } from "lucide-react";
import type { PlaygroundFile } from "@/lib/types/playground";

const MonacoEditor = lazy(() =>
  import("@monaco-editor/react").then((m) => ({ default: m.default })),
);

interface PlaygroundEditorProps {
  activeFile: PlaygroundFile;
  onCodeChange: (newCode: string) => void;
  onFormatCode?: () => void;
}

export function PlaygroundEditor({
  activeFile,
  onCodeChange,
  onFormatCode,
}: PlaygroundEditorProps) {
  const [theme, setTheme] = useState<"vs-dark" | "light">("vs-dark");

  const getLanguage = (fileName: string) => {
    if (fileName.endsWith(".tsx") || fileName.endsWith(".ts")) return "typescript";
    if (fileName.endsWith(".jsx") || fileName.endsWith(".js")) return "javascript";
    if (fileName.endsWith(".css")) return "css";
    if (fileName.endsWith(".html")) return "html";
    if (fileName.endsWith(".json")) return "json";
    return "javascript";
  };

  const lineCount = activeFile.code.split("\n").length;
  const charCount = activeFile.code.length;

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Editor Main */}
      <div className="flex-1 relative overflow-hidden">
        <Suspense
          fallback={
            <div className="flex h-full w-full items-center justify-center bg-card p-6">
              <Skeleton className="h-full w-full rounded-lg" />
            </div>
          }
        >
          <MonacoEditor
            height="100%"
            language={getLanguage(activeFile.name)}
            value={activeFile.code}
            onChange={(v) => onCodeChange(v ?? "")}
            theme={theme}
            options={{
              fontSize: 13,
              fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace",
              minimap: { enabled: false },
              tabSize: 2,
              wordWrap: "on",
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              automaticLayout: true,
              padding: { top: 12, bottom: 12 },
              lineNumbersMinChars: 3,
            }}
          />
        </Suspense>
      </div>

      {/* Editor Status Bar */}
      <div className="flex items-center justify-between border-t border-border/50 bg-card/60 px-3 py-1.5 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-medium text-foreground">
            <FileCode className="h-3.5 w-3.5 text-primary" />
            {activeFile.name}
          </span>
          <Badge variant="outline" className="text-[10px] px-1.5 h-4 border-border/60">
            {getLanguage(activeFile.name)}
          </Badge>
          <span>{lineCount} lines</span>
          <span>{charCount} chars</span>
        </div>

        <div className="flex items-center gap-2">
          {onFormatCode && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px] gap-1 hover:text-foreground"
              onClick={onFormatCode}
              title="Auto-format code"
            >
              <Wand2 className="h-3 w-3 text-primary" /> Format
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[10px] gap-1"
            onClick={() => setTheme(theme === "vs-dark" ? "light" : "vs-dark")}
            title="Toggle Editor Theme"
          >
            {theme === "vs-dark" ? (
              <>
                <Sun className="h-3 w-3 text-amber-400" /> Light Theme
              </>
            ) : (
              <>
                <Moon className="h-3 w-3 text-sky-400" /> Dark Theme
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
