import { useState } from "react";
import { Copy, Check, Terminal, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface LessonInteractiveCodeProps {
  language: string;
  code: string;
  title?: string;
  highlightLines?: number[];
  onOpenSandbox?: (code: string) => void;
}

export function LessonInteractiveCode({
  language,
  code,
  title,
  highlightLines = [],
  onOpenSandbox,
}: LessonInteractiveCodeProps) {
  const [copied, setCopied] = useState(false);
  const [outputLog, setOutputLog] = useState<string | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split("\n");

  const handleQuickRun = () => {
    try {
      // Intercept console output for simple snippet evaluation
      const logs: string[] = [];
      const dummyConsole = {
        log: (...args: unknown[]) =>
          logs.push(
            args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" "),
          ),
        warn: (...args: unknown[]) => logs.push(`[WARN] ${args.join(" ")}`),
        error: (...args: unknown[]) => logs.push(`[ERROR] ${args.join(" ")}`),
      };

      // Strip import / export statements to allow quick eval if simple JS/TS
      const cleanCode = code
        .replace(/^import\s+[\s\S]*?from\s+['"].*?['"];?/gm, "")
        .replace(/^export\s+default\s+/gm, "")
        .replace(/^export\s+/gm, "");

      const fn = new Function("console", cleanCode);
      fn(dummyConsole);

      if (logs.length > 0) {
        setOutputLog(logs.join("\n"));
        toast.success("Snippet executed cleanly");
      } else {
        setOutputLog("✓ Executed cleanly (no console output).");
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setOutputLog(`Runtime Note: ${errMsg}`);
    }
  };

  return (
    <div className="my-6 rounded-xl border border-border/70 bg-[#0d0e12] overflow-hidden shadow-elegant font-mono text-xs">
      {/* Code Bar Header */}
      <div className="flex items-center justify-between border-b border-border/50 bg-card/60 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
          {title && <span className="ml-2 font-sans text-xs text-muted-foreground">{title}</span>}
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-border/60 uppercase">
            {language}
          </Badge>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleQuickRun}
            className="h-6 px-2 text-[10px] gap-1 hover:text-foreground"
            title="Evaluate console output"
          >
            <Play className="h-3 w-3 text-emerald-400" /> Run Quick
          </Button>

          {onOpenSandbox && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenSandbox(code)}
              className="h-6 px-2 text-[10px] gap-1 hover:text-foreground text-primary"
              title="Edit in live sandbox"
            >
              <Terminal className="h-3 w-3" /> Sandbox
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            title="Copy code"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      {/* Code Lines Body */}
      <div className="p-4 overflow-x-auto text-[13px] leading-relaxed">
        <pre className="grid">
          {lines.map((line, idx) => {
            const lineNum = idx + 1;
            const isHighlighted = highlightLines.includes(lineNum);
            return (
              <div
                key={idx}
                className={`table-row ${
                  isHighlighted
                    ? "bg-primary/15 font-semibold text-primary border-l-2 border-primary"
                    : ""
                }`}
              >
                <span className="table-cell select-none pr-4 text-right text-muted-foreground/40 text-[11px] w-8">
                  {lineNum}
                </span>
                <span className="table-cell text-foreground/90 whitespace-pre">{line}</span>
              </div>
            );
          })}
        </pre>
      </div>

      {/* Console output drawer if quick run executed */}
      {outputLog !== null && (
        <div className="border-t border-border/50 bg-black/60 p-3 text-[11px] font-mono text-emerald-300">
          <div className="flex items-center justify-between text-muted-foreground text-[10px] mb-1 font-sans">
            <span className="flex items-center gap-1 font-semibold text-foreground">
              <Terminal className="h-3 w-3 text-emerald-400" /> Quick Output Log
            </span>
            <button
              onClick={() => setOutputLog(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              Dismiss
            </button>
          </div>
          <div className="whitespace-pre-wrap">{outputLog}</div>
        </div>
      )}
    </div>
  );
}
