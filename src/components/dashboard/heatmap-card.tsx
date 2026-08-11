import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HeatMap } from "@/components/shared/heat-map";
import { CalendarDays, Info } from "lucide-react";

interface HeatmapCardProps {
  heatmapData: { date: string; value: number }[];
}

export function HeatmapCard({ heatmapData }: HeatmapCardProps) {
  return (
    <Card className="border-border/50 bg-card/80 transition duration-200 hover:border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            Learning Activity
          </CardTitle>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Info className="h-3 w-3" /> Past 12 Weeks
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="overflow-x-auto scrollbar-none pb-2">
          <HeatMap data={heatmapData} className="justify-between" />
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/40 pt-3">
          <span>84 days of learning activity logged</span>
          <div className="flex items-center gap-1.5">
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((v) => (
              <div
                key={v}
                className="h-3 w-3 rounded-sm"
                style={{ background: `oklch(0.72 0.19 45 / ${10 + v * 20}%)` }}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
