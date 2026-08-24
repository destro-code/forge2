import { useState } from "react";
import type { CodeExampleActivity } from "@/lib/curriculum/types";
import type { ActivityRendererProps } from "../types";
import { ActivityContainer } from "../primitives/activity-container";
import { ActivityHeader } from "../primitives/activity-header";
import { ActivityActions } from "../primitives/activity-actions";
import { Code2, MessageSquare, Copy, Check, Info } from "lucide-react";
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
    : "example.code";

  return (
    <ActivityContainer id={`activity-${activity.id}`} variant="standard">
      <ActivityHeader activity={activity} />

      <div className="p-6 md:p-10 flex flex-col gap-8">
        {/* Header Title & Intro */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary/80 font-mono">
              Observation & Code Study
            </span>
          </div>
          {title && (
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-foreground leading-snug flex items-center gap-2.5">
              <Code2 className="w-5.5 h-5.5 text-primary shrink-0" />
              <span>{title}</span>
            </h2>
          )}
          {description && (
            <p className="text-base text-muted-foreground leading-relaxed max-w-3xl">
              {description}
            </p>
          )}
        </div>

        {/* Polished Code Viewer Pane */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 shadow-lg overflow-hidden flex flex-col font-mono text-sm max-w-full">
          {/* Mock IDE Header Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 select-none">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5 mr-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="bg-zinc-950 text-zinc-300 px-3.5 py-1 rounded-t-lg border-t border-x border-zinc-800 text-xs font-semibold flex items-center gap-2 translate-y-[11px] relative z-10">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span>{fileName}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors focus:outline-none focus:ring-1 focus:ring-zinc-700"
              aria-label="Copy source code"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Interactive Code Container */}
          <div className="overflow-x-auto max-w-full scrollbar-thin pt-5 pb-5">
            <pre className="text-zinc-300 select-text leading-relaxed min-w-[500px]">
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
                      className={cn(
                        "flex items-center w-full px-4 border-l-4 transition-colors duration-150 relative",
                        isHighlighted
                          ? "bg-amber-500/10 border-amber-500/80"
                          : "border-transparent",
                        isHovered && "bg-zinc-800/40 border-primary/60",
                        isAnnotated && !isHighlighted && "border-l-sky-500/40",
                      )}
                    >
                      {/* Line Number Column */}
                      <span className="w-10 text-right pr-4 text-xs font-bold text-zinc-600 select-none border-r border-zinc-800/80 mr-4">
                        {lineNum}
                      </span>
                      {/* Line Content */}
                      <span className="flex-1 whitespace-pre pr-4 text-[13px] md:text-sm font-semibold tracking-wide">
                        {line || " "}
                      </span>
                      {/* Annotation Anchor Flag */}
                      {isAnnotated && (
                        <span className="absolute right-4 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 select-none animate-pulse">
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

        {/* Polished Line Annotations Grid */}
        {annotations && annotations.length > 0 && (
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 font-mono">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span>Line-by-Line Breakdown</span>
            </h3>
            <div className="grid gap-3.5 sm:grid-cols-2">
              {annotations.map((ann, idx) => {
                const isHovered = activeLine === ann.line;

                return (
                  <motion.div
                    key={idx}
                    layoutId={`ann-${ann.line}`}
                    className={cn(
                      "flex gap-4 p-4 rounded-2xl border transition-all duration-200 text-sm",
                      isHovered
                        ? "border-primary bg-primary/5 ring-1 ring-primary/40 shadow-sm"
                        : "border-lesson-border bg-muted/5 text-foreground hover:bg-muted/10",
                    )}
                    onMouseEnter={() => setActiveLine(ann.line)}
                    onMouseLeave={() => setActiveLine(null)}
                  >
                    <div className="flex flex-col gap-1.5 items-start">
                      <span className="px-2 py-1 rounded-lg font-mono text-xs bg-primary/10 text-primary font-bold">
                        Line {ann.line}
                      </span>
                    </div>
                    <div className="flex-1 flex items-start gap-1.5">
                      <Info className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                      <p className="text-foreground/90 font-medium leading-relaxed">
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

      <ActivityActions
        status={state.status}
        isInteractive={false}
        onContinue={onContinue}
        continueLabel="Continue"
      />
    </ActivityContainer>
  );
}
