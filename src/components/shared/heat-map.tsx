import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function HeatMap({
  data,
  className,
}: {
  data: { date: string; value: number }[];
  className?: string;
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 12 weeks × 7 days
  const weeks: { date: string; value: number }[][] = [];
  for (let i = 0; i < data.length; i += 7) weeks.push(data.slice(i, i + 7));
  const cell = (v: number) => {
    const opacities = [
      "oklch(1 0 0 / 6%)",
      "oklch(0.72 0.19 45 / 25%)",
      "oklch(0.72 0.19 45 / 45%)",
      "oklch(0.72 0.19 45 / 70%)",
      "oklch(0.72 0.19 45)",
    ];
    return opacities[Math.max(0, Math.min(4, v))];
  };

  if (!isMounted) {
    // Render a stable/empty structure with same dimensions on the server to prevent hydration mismatch
    return (
      <div className={cn("flex gap-1 opacity-0", className)}>
        {Array.from({ length: 12 }).map((_, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {Array.from({ length: 7 }).map((_, di) => (
              <div
                key={di}
                className="h-3 w-3 rounded-sm"
                style={{ background: "oklch(1 0 0 / 6%)" }}
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex gap-1", className)}>
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-1">
          {week.map((d) => (
            <div
              key={d.date}
              title={`${d.date} · ${d.value}h`}
              className="h-3 w-3 rounded-sm"
              style={{ background: cell(d.value) }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
