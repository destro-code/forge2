import { useState } from "react";
import { Copy, Check, Terminal, Play, Eye } from "lucide-react";
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
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewCss, setPreviewCss] = useState<string | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split("\n");

  const handleQuickRun = () => {
    setOutputLog(null);
    setPreviewHtml(null);
    setPreviewCss(null);

    const lang = (language || "").toLowerCase().trim();

    try {
      if (lang === "css") {
        setPreviewCss(code);
        setOutputLog("CSS Applied successfully to live preview element.");
        toast.success("CSS applied to live preview element");
        return;
      }

      if (lang === "html" || lang === "htm" || lang === "svg") {
        setPreviewHtml(code);
        setOutputLog("HTML rendered successfully in live preview frame.");
        toast.success("HTML rendered in preview frame");
        return;
      }

      if (lang === "json") {
        try {
          const parsed = JSON.parse(code);
          setOutputLog(
            `Valid JSON object parsed successfully:\n${JSON.stringify(parsed, null, 2)}`,
          );
          toast.success("JSON parsed successfully");
        } catch (jsonErr: unknown) {
          const msg = jsonErr instanceof Error ? jsonErr.message : String(jsonErr);
          setOutputLog(`[JSON SyntaxError] ${msg}`);
          toast.error(`JSON SyntaxError: ${msg}`);
        }
        return;
      }

      // JS / TS / JSX / TSX or fallback code execution
      const logs: string[] = [];
      const dummyConsole = {
        log: (...args: unknown[]) =>
          logs.push(
            args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" "),
          ),
        warn: (...args: unknown[]) => logs.push(`[WARN] ${args.join(" ")}`),
        error: (...args: unknown[]) => logs.push(`[ERROR] ${args.join(" ")}`),
        info: (...args: unknown[]) => logs.push(`[INFO] ${args.join(" ")}`),
      };

      // Strip TS annotations & import/export statements to allow safe JS evaluation
      const cleanCode = code
        .replace(/^import\s+[\s\S]*?from\s+['"].*?['"];?/gm, "")
        .replace(/^import\s+['"].*?['"];?/gm, "")
        .replace(/^export\s+default\s+/gm, "")
        .replace(/^export\s+/gm, "")
        .replace(/interface\s+\w+\s*\{[\s\S]*?\}/g, "")
        .replace(/type\s+\w+\s*=[\s\S]*?;/g, "")
        .replace(
          /:\s*(string|number|boolean|any|void|unknown|object|never|Record<.*?>|Array<.*?>)(\[\])?/g,
          "",
        )
        .replace(/\s+as\s+\w+/g, "");

      const fn = new Function("console", cleanCode);
      fn(dummyConsole);

      if (logs.length > 0) {
        setOutputLog(logs.join("\n"));
        toast.success("Snippet executed cleanly");
      } else {
        setOutputLog("✓ Executed cleanly (no console output).");
        toast.success("Executed cleanly");
      }
    } catch (err: unknown) {
      const errName = err instanceof Error ? err.name : "RuntimeError";
      const errMsg = err instanceof Error ? err.message : String(err);
      setOutputLog(`[${errName}] ${errMsg}`);
      toast.error(`Execution note: ${errMsg}`);
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
            title="Evaluate or preview snippet"
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

      {/* Console output & live preview drawer */}
      {(outputLog !== null || previewCss !== null || previewHtml !== null) && (
        <div className="border-t border-border/50 bg-black/80 p-3 text-[11px] font-mono text-emerald-300 space-y-3">
          <div className="flex items-center justify-between text-muted-foreground text-[10px] font-sans">
            <span className="flex items-center gap-1.5 font-semibold text-foreground">
              <Terminal className="h-3.5 w-3.5 text-emerald-400" />
              Quick Execution Console & Preview
            </span>
            <button
              onClick={() => {
                setOutputLog(null);
                setPreviewHtml(null);
                setPreviewCss(null);
              }}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors px-2 py-0.5 rounded bg-muted/20"
            >
              Dismiss
            </button>
          </div>

          {outputLog && (
            <div className="whitespace-pre-wrap font-mono text-emerald-300 bg-slate-950/90 p-3 rounded-lg border border-slate-800/80 leading-relaxed max-h-48 overflow-y-auto">
              {outputLog}
            </div>
          )}

          {/* Live CSS Preview Element */}
          {previewCss && (
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 font-sans">
              <style>{previewCss}</style>
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider text-muted-foreground mb-2">
                <Eye className="h-3 w-3 text-cyan-400" /> CSS Live Element Preview
              </div>
              <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-slate-200">
                <div className="preview-target font-sans space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">
                    Live Styled Target Element
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Custom layout, colors, box-sizing, and typography rules defined in the CSS
                    snippet are live in this container.
                  </p>
                  <button className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium shadow-sm">
                    Interactive Sample Button
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Live HTML Preview Container */}
          {previewHtml && (
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 font-sans">
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider text-muted-foreground mb-2">
                <Eye className="h-3 w-3 text-emerald-400" /> Rendered HTML Frame
              </div>
              <div
                className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
