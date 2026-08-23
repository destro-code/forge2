import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface ActivityContainerProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

export function ActivityContainer({ children, className, id }: ActivityContainerProps) {
  return (
    <div
      id={id || "canonical-activity-container"}
      className={cn(
        "w-full max-w-4xl mx-auto flex flex-col bg-card border border-border/80 rounded-xl shadow-sm overflow-hidden transition-all",
        className,
      )}
    >
      {children}
    </div>
  );
}
