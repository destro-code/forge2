import { Copy, PlusCircle } from "lucide-react";
import type { LessonHighlightColor } from "@/lib/types";

interface HighlightingPopoverProps {
  position: { x: number; y: number };
  onHighlight: (color: LessonHighlightColor) => void;
  onAddNote: () => void;
  onCopyQuote: () => void;
  onClose: () => void;
}

export function HighlightingPopover({
  position,
  onHighlight,
  onAddNote,
  onCopyQuote,
}: HighlightingPopoverProps) {
  const colors: { name: LessonHighlightColor; bg: string; border: string }[] = [
    { name: "yellow", bg: "bg-amber-400", border: "border-amber-300" },
    { name: "emerald", bg: "bg-emerald-400", border: "border-emerald-300" },
    { name: "cyan", bg: "bg-cyan-400", border: "border-cyan-300" },
    { name: "purple", bg: "bg-purple-400", border: "border-purple-300" },
    { name: "rose", bg: "bg-rose-400", border: "border-rose-300" },
  ];

  return (
    <div
      style={{
        position: "absolute",
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "translate(-50%, -100%)",
      }}
      className="z-50 flex items-center gap-1.5 rounded-xl border border-border/80 bg-popover/95 p-1.5 shadow-xl backdrop-blur-md animate-in fade-in-50 zoom-in-95"
    >
      <div className="flex items-center gap-1 pr-1 border-r border-border/60">
        {colors.map((c) => (
          <button
            key={c.name}
            onClick={() => onHighlight(c.name)}
            title={`Highlight ${c.name}`}
            className={`h-4 w-4 rounded-full ${c.bg} ${c.border} border transition hover:scale-125 focus:outline-none`}
          />
        ))}
      </div>

      <button
        onClick={onAddNote}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-popover-foreground hover:bg-muted"
        title="Add quote to note"
      >
        <PlusCircle className="h-3.5 w-3.5 text-primary" />
        <span>Note</span>
      </button>

      <button
        onClick={onCopyQuote}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-popover-foreground hover:bg-muted"
        title="Copy text snippet"
      >
        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
    </div>
  );
}
