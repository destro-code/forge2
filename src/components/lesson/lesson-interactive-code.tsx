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
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split("\n");

  const handleQuickRun = () => {
    const lang = (language || "").toLowerCase();
    setOutputLog("");
    setPreviewHtml(null);

    if (lang === "css") {
      try {
        const template = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      padding: 16px;
      margin: 0;
      background: #0f172a;
      color: #f8fafc;
    }
    .preview-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #94a3b8;
      margin-bottom: 12px;
      border-bottom: 1px solid #334155;
      padding-bottom: 4px;
    }
    .demo-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    /* User CSS begins */
    ${code}
    /* User CSS ends */
  </style>
</head>
<body>
  <div class="preview-title">Live CSS Preview</div>
  <div class="demo-container">
    <div class="box">
      <strong>.box element</strong> - Useful for padding, margin, borders, and box-sizing checks.
    </div>
    <div class="container">
      <div class="item">Flex Item A</div>
      <div class="item">Flex Item B</div>
    </div>
    <button class="btn">Demo Button</button>
  </div>
</body>
</html>`;
        setPreviewHtml(template);
        setOutputLog("CSS Applied successfully to live preview element.");
        toast.success("CSS applied successfully to live preview");
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        setOutputLog(`Failed to apply CSS: ${errMsg}`);
      }
    } else if (lang === "html") {
      try {
        let template = code;
        if (!code.includes("<html") && !code.includes("<body")) {
          template = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      padding: 16px;
      margin: 0;
      background: #0f172a;
      color: #f8fafc;
    }
  </style>
</head>
<body>
  ${code}
</body>
</html>`;
        }
        setPreviewHtml(template);
        setOutputLog("HTML Rendered successfully inside preview frame.");
        toast.success("HTML rendered successfully");
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        setOutputLog(`Failed to render HTML: ${errMsg}`);
      }
    } else {
      // JS / TS / JSX / TSX
      try {
        const logs: string[] = [];
        const dummyConsole = {
          log: (...args: unknown[]) =>
            logs.push(
              args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" "),
            ),
          warn: (...args: unknown[]) => logs.push(`[WARN] ${args.join(" ")}`),
          error: (...args: unknown[]) => logs.push(`[ERROR] ${args.join(" ")}`),
        };

        // Strip imports/exports to allow quick eval of basic JS/TS
        const cleanCode = code
          .replace(/^import\s+[\s\S]*?from\s+['"].*?['"];?/gm, "")
          .replace(/^export\s+default\s+/gm, "")
          .replace(/^export\s+/gm, "");

        // Detect complex code (JSX tags, types) that raw browser 'new Function()' would throw syntax error on
        const hasJSX = /<[a-zA-Z]+[^>]*>/.test(cleanCode) || /<\/ [a-zA-Z]+>/.test(cleanCode);
        const hasTS =
          /interface\s+\w+|type\s+\w+\s*=|:\s*(string|number|boolean|any|unknown|void|Record<)/.test(
            cleanCode,
          );

        if (hasJSX || hasTS) {
          throw new SyntaxError(
            "Standard JS evaluation is optimized for plain vanilla JavaScript/ES6 snippets. For complex React/TSX/JSX features, use the interactive 'Sandbox' button above to compile and run with full React context.",
          );
        }

        const fn = new Function("console", cleanCode);
        fn(dummyConsole);

        if (logs.length > 0) {
          setOutputLog(logs.join("\n"));
          toast.success("Snippet executed cleanly");
        } else {
          setOutputLog("✓ Executed cleanly (no console output).");
        }
      } catch (err: unknown) {
        let errMsg = err instanceof Error ? err.message : String(err);
        if (err instanceof SyntaxError && !errMsg.includes("Sandbox")) {
          errMsg = `${errMsg}\n\n💡 Tip: If this snippet contains modern TypeScript, JSX, or external package imports, click the "Sandbox" button on the top right to run it in a full-featured browser playground!`;
        }
        setOutputLog(`Runtime Note:\n${errMsg}`);
      }
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

      {/* Console output & preview drawer if quick run executed */}
      {(outputLog !== null || previewHtml !== null) && (
        <div className="border-t border-border/50 bg-[#07080a] p-4 text-[11px] font-mono text-emerald-300">
          <div className="flex items-center justify-between text-muted-foreground text-[10px] mb-2 font-sans">
            <span className="flex items-center gap-1 font-semibold text-foreground">
              <Terminal className="h-3 w-3 text-emerald-400" /> Quick Output Log
            </span>
            <button
              onClick={() => {
                setOutputLog(null);
                setPreviewHtml(null);
              }}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              Dismiss
            </button>
          </div>

          <div className="space-y-3">
            {outputLog && (
              <div className="whitespace-pre-wrap bg-black/40 p-2.5 rounded border border-border/20 text-emerald-300">
                {outputLog}
              </div>
            )}

            {previewHtml && (
              <div className="space-y-1">
                <div className="text-[10px] text-muted-foreground font-sans uppercase font-semibold">
                  Live Preview
                </div>
                <iframe
                  srcDoc={previewHtml}
                  title="Quick Run HTML/CSS Preview"
                  sandbox="allow-scripts"
                  className="w-full h-44 rounded border border-border/30 bg-[#0f172a]"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
