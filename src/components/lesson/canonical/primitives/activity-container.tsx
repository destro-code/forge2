import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type LayoutVariant = "reading" | "standard" | "wide" | "workspace" | "immersive";

export interface ActivityContainerProps {
  children: ReactNode;
  className?: string;
  id?: string;
  variant?: LayoutVariant;
}

export function ActivityContainer({
  children,
  className,
  id,
  variant = "standard",
}: ActivityContainerProps) {
  // Map variant to optimized max-widths and responsive containers
  const variantClasses = {
    reading: "max-w-3xl max-w-[70ch]",
    standard: "max-w-4xl",
    wide: "max-w-5xl",
    workspace: "max-w-7xl xl:max-w-[95vw]",
    immersive: "max-w-5xl border-none shadow-none bg-transparent dark:bg-transparent",
  };

  return (
    <div
      id={id || "canonical-activity-container"}
      className={cn(
        "w-full mx-auto flex flex-col bg-lesson-surface border border-lesson-border rounded-xl shadow-xs overflow-visible sm:overflow-hidden transition-all text-lesson-text-primary",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </div>
  );
}
