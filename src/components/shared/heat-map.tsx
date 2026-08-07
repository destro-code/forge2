import { cn } from "@/lib/utils";

export function HeatMap({
  data,
  className,
}: {
  data: { date: string; value: number }[];
  className?: string;
}) {
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
