import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { useLessonLayout } from "./lesson-layout-context";

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
  const { shellManagedWidth } = useLessonLayout();

  // Width is a layout concern. Inside the lesson shell the shell owns it, so
  // the frame stays a fixed measure instead of resizing on every advance.
  const variantWidths = {
    reading: "max-w-3xl max-w-[70ch]",
    standard: "max-w-4xl",
    wide: "max-w-5xl",
    workspace: "max-w-7xl xl:max-w-[95vw]",
    immersive: "max-w-5xl",
  };

  // Chrome (border/background) is a presentation concern and always applies.
  const variantChrome = {
    reading: "",
    standard: "",
    wide: "",
    workspace: "",
    immersive: "border-none shadow-none bg-transparent dark:bg-transparent",
  };

  return (
    <div
      id={id || "canonical-activity-container"}
      className={cn(
        "w-full mx-auto flex flex-col bg-lesson-surface border border-lesson-border rounded-xl shadow-xs overflow-visible text-lesson-text-primary",
        shellManagedWidth ? "max-w-none" : variantWidths[variant],
        variantChrome[variant],
        className,
      )}
    >
      {children}
    </div>
  );
}
