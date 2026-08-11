import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  delta,
  icon,
  className,
}: {
  label: string;
  value: ReactNode;
  delta?: string;
  icon?: ReactNode;
  tone?: "default" | "primary" | "success" | "warning";
  className?: string;
}) {
  return (
    <Card className={cn("relative overflow-hidden border-border/50 bg-card/80", className)}>
      <CardContent className="p-3.5 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-medium text-muted-foreground">{label}</div>
            <div className="mt-1.5 text-2xl font-bold tracking-tight tabular-nums text-foreground">
              {value}
            </div>
            {delta && <div className="mt-1 text-xs text-muted-foreground/80">{delta}</div>}
          </div>
          {icon && (
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border/40 bg-muted/40 text-muted-foreground">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
