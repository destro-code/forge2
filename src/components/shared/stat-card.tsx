import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  delta,
  icon,
  tone = "default",
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
    <Card className={cn("relative overflow-hidden border-border/60", className)}>
      {tone === "primary" && <div className="ember-glow pointer-events-none absolute inset-0" />}
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              {label}
            </div>
            <div className="mt-2 text-2xl font-bold tabular-nums">{value}</div>
            {delta && <div className="mt-1 text-xs text-muted-foreground">{delta}</div>}
          </div>
          {icon && (
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border/60 bg-muted/60 text-muted-foreground">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
