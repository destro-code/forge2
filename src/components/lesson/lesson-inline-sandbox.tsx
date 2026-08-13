import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, RefreshCw, Terminal, ExternalLink, Code2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { buildPlaygroundHtml, getSandboxFileInfo } from "@/lib/playground-compiler";
import { ErrorBoundary } from "@/components/shared/error-boundary";

interface LessonInlineSandboxProps {
  initialCode: string;
  title?: string;
  instructions?: string;
  lessonId?: string;
  sandboxId?: string;
  language?: string;
}

export function LessonInlineSandbox({
  initialCode,
  title = "Interactive Mini Sandbox",
  instructions,
  lessonId,
  sandboxId,
  language,
}: LessonInlineSandboxProps) {
  const [code, setCode] = useState(initialCode);
  const [key, setKey] = useState(0);
  const [consoleLogs, setConsoleLogs] = useState<{ level: string; msg: string }[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const fileInfo = getSandboxFileInfo(language);

  const labelText =
    language === "html"
      ? "Editable HTML"
      : language === "css"
        ? "Editable CSS"
        : language === "javascript" || language === "js"
          ? "Editable JavaScript"
          : "Editable TypeScript / TSX";

  const sandboxFiles = [
    {
      id: "app-file",
      name: fileInfo.name,
      code: code,
      language: fileInfo.language,
    },
  ];

  useEffect(() => {
    const handleMsg = (e: MessageEvent) => {
      if (e.data && e.data.type === "SANDBOX_LOG") {
        setConsoleLogs((prev) => [...prev.slice(-10), { level: e.data.level, msg: e.data.msg }]);
      }
    };
    window.addEventListener("message", handleMsg);
    return () => window.removeEventListener("message", handleMsg);
  }, []);

  const handleRun = () => {
    setConsoleLogs([]);
    setKey((k) => k + 1);
  };

  return (
    <Card className="my-6 border-primary/40 bg-card/80 overflow-hidden shadow-elegant">
      <CardHeader className="pb-3 border-b border-border/50 bg-muted/30">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-mono border-primary/30">
              Live Inline Runner
            </Badge>

            <Button size="sm" onClick={handleRun} className="h-7 px-2.5 text-xs gap-1 shadow-glow">
              <Play className="h-3 w-3 fill-current" /> Run Code
            </Button>

            <Button size="sm" variant="outline" asChild className="h-7 px-2.5 text-xs gap-1">
              <Link
                to="/playground"
                search={{
                  lessonId,
                  sandboxId,
                  code: code !== initialCode ? code : undefined,
                }}
              >
                Full Playground <ExternalLink className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>

        {instructions && (
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{instructions}</p>
        )}
      </CardHeader>

      <CardContent className="p-0 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/50">
        {/* Code Input */}
        <div className="flex flex-col bg-[#0b0c10] p-3 font-mono text-xs">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase mb-2 flex items-center justify-between">
            <span>{labelText}</span>
            <button
              onClick={() => setCode(initialCode)}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <RefreshCw className="h-2.5 w-2.5" /> Reset
            </button>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            className="w-full h-56 bg-transparent text-foreground resize-none focus:outline-none leading-relaxed text-xs font-mono"
          />
        </div>

        {/* Live Output & Console */}
        <div className="flex flex-col bg-background p-3">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">
            Live DOM Preview & Console
          </div>
          <ErrorBoundary
            title="Inline Sandbox Execution Error"
            description="The inline runner encountered an uncaught runtime exception."
            onReset={handleRun}
          >
            <iframe
              key={key}
              ref={iframeRef}
              srcDoc={buildPlaygroundHtml(sandboxFiles, { isInline: true, title })}
              title="Lesson Inline Sandbox Preview"
              sandbox="allow-scripts"
              className="w-full h-40 rounded-lg border border-border/50 bg-[#090a0f]"
            />
          </ErrorBoundary>

          {/* Console Log area */}
          <div className="mt-2 rounded-lg border border-border/40 bg-black/60 p-2 font-mono text-[11px] max-h-24 overflow-y-auto">
            <div className="text-[10px] font-semibold text-muted-foreground mb-1 flex items-center gap-1">
              <Terminal className="h-3 w-3 text-emerald-400" /> Output Log
            </div>
            {consoleLogs.length === 0 ? (
              <span className="text-muted-foreground/50 italic text-[10px]">
                No console logs yet.
              </span>
            ) : (
              consoleLogs.map((log, i) => (
                <div key={i} className="text-emerald-300">
                  {log.msg}
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
