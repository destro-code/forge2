import { Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type NodeStatus = "mastered" | "active" | "available" | "locked";

export interface ConstellationNode {
  key: string;
  lessonId: string;
  title: string;
  status: NodeStatus;
}

interface PathConstellationProps {
  pathDomain: string;
  pathTitle: string;
  percent: number;
  nodes: ConstellationNode[];
}

export function PathConstellation({
  pathDomain,
  pathTitle,
  percent,
  nodes,
}: PathConstellationProps) {
  return (
    <section
      aria-label="Your path"
      className="overflow-hidden rounded-lg border border-border bg-card"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 pt-5 sm:px-6">
        <div className="min-w-0">
          <div className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Path / {pathDomain}
          </div>
          <h2 className="mt-1.5 truncate font-serif text-2xl font-medium tracking-tight text-foreground">
            {pathTitle}
          </h2>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-mono text-lg font-semibold tabular-nums text-foreground">
            {percent}%
          </div>
        </div>
      </div>

      {/* Progress rail */}
      <div className="mt-3 px-5 sm:px-6">
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${Math.max(2, percent)}%` }}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2 px-5 pb-5 sm:px-6">
        <div className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
          Next steps
        </div>
        {nodes.slice(0, 4).map((node, index) => {
          const isMastered = node.status === "mastered";
          const isActive = node.status === "active";
          const content = (
            <span className="flex items-center gap-3 rounded-md border border-border/70 bg-background/40 px-3 py-3 text-left transition-colors hover:border-primary/50">
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full border text-xs",
                  isMastered && "bg-secondary text-muted-foreground",
                  isActive && "border-primary bg-primary text-primary-foreground",
                  !isMastered && !isActive && "text-muted-foreground",
                )}
              >
                {isMastered ? <Check aria-hidden="true" /> : index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">
                  {node.title}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {isMastered ? "Completed" : isActive ? "Current focus" : "Up next"}
                </span>
              </span>
              {!isMastered && <ArrowRight aria-hidden="true" />}
            </span>
          );
          return isMastered ? (
            <div key={node.key}>{content}</div>
          ) : (
            <Link
              key={node.key}
              to="/lesson/$lessonId"
              params={{ lessonId: node.lessonId }}
              search={{ mode: "curriculum" }}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function LegendItem({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-2 w-2 rounded-full", className)} aria-hidden="true" />
      {label}
    </span>
  );
}

function ConstellationDot({
  node,
}: {
  node: ConstellationNode & { pos: { x: number; y: number } };
}) {
  const isActive = node.status === "active";
  const isLocked = node.status === "locked";
  const isMastered = node.status === "mastered";

  const size = isActive ? "h-14 w-14 sm:h-16 sm:w-16" : "h-10 w-10 sm:h-11 sm:w-11";

  const inner = (
    <span
      className={cn(
        "grid place-items-center rounded-full border transition-colors",
        size,
        isActive && "node-active-glow border-primary bg-primary text-primary-foreground",
        isMastered && "border-border bg-secondary text-muted-foreground",
        node.status === "available" &&
          "border-primary/40 bg-card text-foreground hover:border-primary hover:text-primary",
        isLocked && "border-dashed border-border bg-card/60 text-muted-foreground/50",
      )}
    >
      {isActive ? (
        <Code2 className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
      ) : isMastered ? (
        <Check className="h-4 w-4" aria-hidden="true" />
      ) : isLocked ? (
        <Lock className="h-3.5 w-3.5" aria-hidden="true" />
      ) : (
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      )}
    </span>
  );

  const style = {
    left: `${node.pos.x}%`,
    top: `${node.pos.y}%`,
  } as const;

  const label = `${node.title} — ${node.status}`;

  if (isLocked) {
    return (
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={style}
        title={`${node.title} (locked)`}
        aria-label={label}
      >
        {inner}
      </div>
    );
  }

  return (
    <Link
      to="/lesson/$lessonId"
      params={{ lessonId: node.lessonId }}
      search={{ mode: "curriculum" }}
      className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
      style={style}
      aria-label={label}
      title={node.title}
    >
      {inner}
    </Link>
  );
}
