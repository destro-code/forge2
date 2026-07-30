import { useState } from "react";
import { ChevronDown, Sparkles, AlertTriangle, Lightbulb, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LessonCollapsibleProps {
  title: string;
  subtitle?: string;
  content: string;
  variant?: "deep-dive" | "pitfall" | "senior-tip" | "default";
}

export function LessonCollapsible({
  title,
  subtitle,
  content,
  variant = "default",
}: LessonCollapsibleProps) {
  const [isOpen, setIsOpen] = useState(false);

  let icon = <Info className="h-4 w-4 text-sky-400" />;
  let badgeText = "Explainer";
  let borderStyle = "border-border/60 bg-card/60";
  let headerStyle = "hover:bg-muted/30";

  if (variant === "deep-dive") {
    icon = <Sparkles className="h-4 w-4 text-primary" />;
    badgeText = "Deep Dive";
    borderStyle = "border-primary/30 bg-primary/5";
    headerStyle = "hover:bg-primary/10";
  } else if (variant === "pitfall") {
    icon = <AlertTriangle className="h-4 w-4 text-rose-400" />;
    badgeText = "Common Pitfall";
    borderStyle = "border-rose-500/30 bg-rose-500/5";
    headerStyle = "hover:bg-rose-500/10";
  } else if (variant === "senior-tip") {
    icon = <Lightbulb className="h-4 w-4 text-amber-400" />;
    badgeText = "Senior Dev Take";
    borderStyle = "border-amber-500/30 bg-amber-500/5";
    headerStyle = "hover:bg-amber-500/10";
  }

  return (
    <div
      className={`my-4 rounded-xl border transition-all duration-200 overflow-hidden ${borderStyle}`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-4 text-left transition ${headerStyle}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 p-1.5 rounded-lg bg-background/60">{icon}</div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-foreground truncate">{title}</span>
              <Badge variant="outline" className="text-[10px] px-1.5 h-4 uppercase">
                {badgeText}
              </Badge>
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">
            {isOpen ? "Collapse" : "Expand"}
          </span>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
              isOpen ? "rotate-180 text-foreground" : ""
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="p-4 pt-2 border-t border-border/40 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap animate-in fade-in-50 duration-150">
          {content}
        </div>
      )}
    </div>
  );
}
