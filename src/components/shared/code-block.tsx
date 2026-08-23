import { useState } from "react";
import { Check, Copy, Sparkles, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConceptPlayground } from "@/components/shared/concept-playground";
import { cn } from "@/lib/utils";

const RUNNABLE_LANGS = new Set([
  "html",
  "css",
  "javascript",
  "js",
  "jsx",
  "typescript",
  "ts",
  "tsx",
  "json",
]);

export interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
  showTryIt?: boolean;
}

export function CodeBlock({ code, language, className, showTryIt = true }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);

  const normLang = (language || "").toLowerCase();
  const hasRunnableMarkupOrCode =
    code.includes("<html") ||
    code.includes("<div") ||
    code.includes("<p") ||
    code.includes("<h1") ||
    code.includes("<style") ||
    code.includes("console.log") ||
    code.includes("function ");

  const isRunnable =
    showTryIt &&
    code.trim().length > 0 &&
    (RUNNABLE_LANGS.has(normLang) || hasRunnableMarkupOrCode) &&
    normLang !== "bash" &&
    normLang !== "shell" &&
    normLang !== "http" &&
    normLang !== "text";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* ignore */
    }
  };

  if (isInteractive) {
    return (
      <ConceptPlayground
        initialCode={code}
        language={language}
        onClose={() => setIsInteractive(false)}
        className={className}
      />
    );
  }

  return (
    <div
      className={cn(
        "group relative my-4 overflow-hidden rounded-xl border border-border/70 bg-[oklch(0.11_0.008_60)] font-mono text-[13px]",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border/50 px-3 py-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {language ?? "code"}
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            onClick={copy}
            aria-label="Copy code"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            <span>{copied ? "Copied" : "Copy"}</span>
          </Button>

          {isRunnable && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 text-xs border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary transition-colors font-medium px-2.5"
              onClick={() => setIsInteractive(true)}
              aria-label="Try code in interactive playground"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Try it &rarr;</span>
            </Button>
          )}
        </div>
      </div>
      <pre className="scrollbar-thin overflow-x-auto p-4 leading-relaxed text-foreground/90">
        <code>{code}</code>
      </pre>
    </div>
  );
}
