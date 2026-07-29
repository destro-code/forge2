import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  Cell,
} from "recharts";
import { BarChart3, TrendingUp, Clock } from "lucide-react";

interface WeeklyProgressCardProps {
  weeklyMinutes: number[]; // 7 days (Mon-Sun)
}

export function WeeklyProgressCard({
  weeklyMinutes = [42, 18, 65, 30, 90, 55, 78],
}: WeeklyProgressCardProps) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const data = days.map((day, idx) => ({
    day,
    minutes: weeklyMinutes[idx] || 0,
  }));

  const totalWeeklyMins = weeklyMinutes.reduce((a, b) => a + b, 0);
  const totalWeeklyHours = (totalWeeklyMins / 60).toFixed(1);
  const avgDailyMins = Math.round(totalWeeklyMins / 7);

  return (
    <Card className="border-border/60 shadow-sm transition duration-200 hover:border-primary/40">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Weekly Progress & Activity
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Study minutes logged over the past 7 days
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 border-primary/30 text-primary text-xs">
              <Clock className="h-3 w-3" />
              {totalWeeklyHours} Hours Total
            </Badge>
            <Badge variant="secondary" className="gap-1 text-xs">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              Avg: {avgDailyMins} m/day
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-56 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="day"
                stroke="var(--color-muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--color-muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={30}
              />
              <RTooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 10,
                  fontSize: 12,
                }}
                formatter={(val: number) => [`${val} minutes`, "Study Time"]}
              />
              <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.minutes >= 30 ? "var(--color-primary)" : "oklch(0.72 0.19 45 / 40%)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
