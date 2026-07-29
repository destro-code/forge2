import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Info, Lightbulb, AlertTriangle, XOctagon } from "lucide-react";

type Variant = "tip" | "warning" | "mistake" | "info";
const styles: Record<Variant, { border: string; bg: string; icon: ReactNode; label: string }> = {
  tip: {
    border: "border-success/40",
    bg: "bg-success/10",
    icon: <Lightbulb className="h-4 w-4 text-success" />,
    label: "Tip",
  },
  warning: {
    border: "border-warning/50",
    bg: "bg-warning/10",
    icon: <AlertTriangle className="h-4 w-4 text-warning" />,
    label: "Warning",
  },
  mistake: {
    border: "border-destructive/50",
    bg: "bg-destructive/10",
    icon: <XOctagon className="h-4 w-4 text-destructive" />,
    label: "Common mistake",
  },
  info: {
    border: "border-info/40",
    bg: "bg-info/10",
    icon: <Info className="h-4 w-4 text-info" />,
    label: "Note",
  },
};

export function Callout({
  variant = "info",
  children,
  title,
}: {
  variant?: Variant;
  children: ReactNode;
  title?: string;
}) {
  const s = styles[variant];
  return (
    <div className={cn("my-4 flex gap-3 rounded-xl border p-4", s.border, s.bg)}>
      <div className="mt-0.5 shrink-0">{s.icon}</div>
      <div className="min-w-0 text-sm leading-relaxed">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title ?? s.label}
        </div>
        <div className="text-foreground/90">{children}</div>
      </div>
    </div>
  );
}
