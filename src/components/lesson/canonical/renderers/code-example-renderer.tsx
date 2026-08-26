import { useState } from "react";
import type { CodeExampleActivity } from "@/lib/curriculum/types";
import type { ActivityRendererProps } from "../types";
import { ActivityContainer } from "../primitives/activity-container";
import { ActivityHeader } from "../primitives/activity-header";
import { ActivityActions } from "../primitives/activity-actions";
import { Code2, MessageSquare, Copy, Check, Info, Eye, Columns } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function CodeExampleRenderer({
  activity,
  state,
  onContinue,
}: ActivityRendererProps<CodeExampleActivity>) {
  const {
    title,
    description,
    code,
    language,
    highlightedLines = [],
    annotations = [],
  } = activity.content;
  const [copied, setCopied] = useState(false);
  const [activeLine, setActiveLine] = useState<number | null>(null);

  const isHtml = language?.toLowerCase() === "html" || (code.includes("<") && code.includes(">"));

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore copy failures gracefully */
    }
  };

  const lines = code.split("\n");

  // Determine a default file extension/name for the header tab
  const fileName = language
    ? `example.${language === "javascript" ? "js" : language === "typescript" ? "ts" : language}`
    : "example.html";

  return (
    <ActivityContainer id={`activity-${activity.id}`} variant="standard">
      <ActivityHeader activity={activity} />

      <div className="p-4 sm:p-6 md:p-8 flex flex-col gap-6">
        {/* Header Title & Intro */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-primary font-mono">
            Observation & Code Study
          </span>

          {title && (
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-foreground leading-snug flex items-center gap-2.5">
              <Code2 className="w-5.5 h-5.5 text-primary shrink-0" />
              <span>{title}</span>
            </h2>
          )}
          {description && (
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-3xl">
              {description}
            </p>
          )}
        </div>

        {/* Vertically Stacked Learning Flow: CODE -> BROWSER OUTPUT -> HOW IT WORKS */}
        <div className="flex flex-col gap-6 w-full max-w-full">
          {/* SECTION 1: CODE */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 font-mono">
                <Code2 className="w-4 h-4 text-primary" />
                <span>Code</span>
              </h3>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 shadow-lg overflow-hidden flex flex-col font-mono text-sm max-w-full">
              {/* Mock IDE Header Bar */}
              <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 select-none">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5 mr-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="bg-zinc-950 text-zinc-300 px-3 py-0.5 rounded-t-lg border-t border-x border-zinc-800 text-xs font-semibold flex items-center gap-2 translate-y-[9px] relative z-10">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <span>{fileName}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors focus:outline-none focus:ring-1 focus:ring-zinc-700 cursor-pointer"
                  aria-label="Copy source code"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code Container */}
              <div className="overflow-x-auto max-w-full scrollbar-thin py-4">
                <pre className="text-zinc-300 select-text leading-relaxed min-w-[300px]">
                  <code>
                    {lines.map((line, idx) => {
                      const lineNum = idx + 1;
                      const isHighlighted = highlightedLines.includes(lineNum);
                      const isAnnotated = annotations.some((ann) => ann.line === lineNum);
                      const isHovered = activeLine === lineNum;

                      return (
                        <div
                          key={idx}
                          onMouseEnter={() => isAnnotated && setActiveLine(lineNum)}
                          onMouseLeave={() => setActiveLine(null)}
                          onClick={() =>
                            isAnnotated && setActiveLine(activeLine === lineNum ? null : lineNum)
                          }
                          className={cn(
                            "flex items-center w-full px-4 border-l-4 transition-colors duration-150 relative cursor-pointer",
                            isHighlighted
                              ? "bg-amber-500/10 border-amber-500/80"
                              : "border-transparent",
                            isHovered && "bg-zinc-800/40 border-primary/60",
                            isAnnotated && !isHighlighted && "border-l-sky-500/60",
                          )}
                        >
                          {/* Line Number Column */}
                          <span className="w-8 text-right pr-3 text-xs font-bold text-zinc-600 select-none border-r border-zinc-800/80 mr-3">
                            {lineNum}
                          </span>
                          {/* Line Content */}
                          <span className="flex-1 whitespace-pre pr-4 text-[13px] md:text-sm font-semibold tracking-wide">
                            {line || " "}
                          </span>
                          {/* Anatomical Callout Flag Anchor */}
                          {isAnnotated && (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30 select-none shrink-0 ml-2">
                              Note
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </code>
                </pre>
              </div>
            </div>
          </div>

          {/* SECTION 2: BROWSER OUTPUT (HTML Examples Only) */}
          {isHtml && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 font-mono">
                <Eye className="w-4 h-4 text-primary" />
                <span>Browser Output</span>
              </h3>

              <div className="rounded-2xl border border-lesson-border bg-white shadow-md overflow-hidden flex flex-col font-sans">
                {/* Clean Browser Address Bar Header */}
                <div className="flex items-center justify-between px-4 py-2 bg-slate-100 border-b border-slate-200 text-xs font-mono font-medium text-slate-600 select-none">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    <span className="ml-2 text-slate-500 font-semibold text-[11px]">
                      localhost:3000/preview
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                    Rendered HTML
                  </span>
                </div>

                {/* Safe Isolated Iframe Container */}
                <div className="p-4 bg-white min-h-[140px] flex-1">
                  <iframe
                    title="Rendered HTML Output"
                    srcDoc={`
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <meta charset="utf-8" />
                          <style>
                            body {
                              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                              margin: 8px;
                              color: #0f172a;
                              background-color: #ffffff;
                            }
                            p { line-height: 1.5; margin: 6px 0; }
                            h1, h2, h3, h4 { margin-top: 8px; margin-bottom: 6px; color: #020617; font-weight: 800; }
                          </style>
                        </head>
                        <body>${code}</body>
                      </html>
                    `}
                    className="w-full h-full min-h-[120px] border-0"
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: HOW IT WORKS (Line Breakdown / Annotations) */}
          {annotations && annotations.length > 0 && (
            <div className="space-y-3 pt-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 font-mono">
                <MessageSquare className="w-4 h-4 text-primary" />
                <span>How It Works</span>
              </h3>

              <div className="grid gap-3 sm:grid-cols-2">
                {annotations.map((ann, idx) => {
                  const isHovered = activeLine === ann.line;

                  return (
                    <motion.div
                      key={idx}
                      layoutId={`ann-${ann.line}`}
                      className={cn(
                        "flex gap-3.5 p-3.5 rounded-xl border transition-all duration-200 text-sm cursor-pointer",
                        isHovered
                          ? "border-primary bg-primary/5 ring-1 ring-primary/40 shadow-xs"
                          : "border-lesson-border bg-muted/5 text-foreground hover:bg-muted/10",
                      )}
                      onMouseEnter={() => setActiveLine(ann.line)}
                      onMouseLeave={() => setActiveLine(null)}
                      onClick={() => setActiveLine(activeLine === ann.line ? null : ann.line)}
                    >
                      <div className="flex flex-col gap-1 items-start shrink-0">
                        <span className="px-2 py-0.5 rounded font-mono text-xs bg-primary/10 text-primary font-bold">
                          Line {ann.line}
                        </span>
                      </div>
                      <div className="flex-1 flex items-start gap-1.5 min-w-0">
                        <Info className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                        <p className="text-foreground/90 font-medium leading-relaxed text-xs sm:text-sm">
                          {ann.comment}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <ActivityActions
        status={state.status}
        isInteractive={false}
        onContinue={onContinue}
        continueLabel="Continue"
      />
    </ActivityContainer>
  );
}
