import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { HeatMap } from "@/components/shared/heat-map";
import { progressStore, initialTopicMasteryRecords } from "@/lib/providers/progress-provider";
import {
  Clock,
  Percent,
  Award,
  Flame,
  TrendingUp,
  Target,
  BarChart2,
  Calendar,
  CheckCircle2,
  Brain,
  Zap,
  Activity,
  Layers,
  Sparkles,
  PieChart as PieChartIcon,
  ShieldCheck,
  Trophy,
  ListChecks,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
} from "recharts";

export const Route = createFileRoute("/statistics")({
  head: () => ({
    meta: [
      { title: "Analytics & Growth Engine · Forge" },
      {
        name: "description",
        content:
          "Deep analytics on study time, quiz accuracy, topic progress trajectory, interview readiness trends, and streak consistency.",
      },
      { property: "og:title", content: "Analytics & Growth Engine · Forge" },
      { property: "og:description", content: "Data-driven insights that show real growth." },
    ],
  }),
  component: AnalyticsPage,
});

export function AnalyticsPage() {
  const [progress] = progressStore.useStore();
  const [timeHorizon, setTimeHorizon] = useState<"7d" | "30d" | "90d" | "12m">("30d");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Topics & Mastery
  const masteryRecords = useMemo(
    () => progress.topicMasteryRecords || initialTopicMasteryRecords,
    [progress.topicMasteryRecords],
  );
  const recordsList = useMemo(() => Object.values(masteryRecords), [masteryRecords]);

  // Metric 1: Learning Time Data
  const monthlyLearningTime = [
    { month: "Jan", JavaScript: 280, React: 210, CSS: 150, TypeScript: 120, Performance: 60 },
    { month: "Feb", JavaScript: 310, React: 240, CSS: 180, TypeScript: 150, Performance: 90 },
    { month: "Mar", JavaScript: 290, React: 270, CSS: 160, TypeScript: 190, Performance: 110 },
    { month: "Apr", JavaScript: 340, React: 320, CSS: 200, TypeScript: 220, Performance: 140 },
    { month: "May", JavaScript: 380, React: 360, CSS: 210, TypeScript: 260, Performance: 180 },
    { month: "Jun", JavaScript: 420, React: 410, CSS: 230, TypeScript: 290, Performance: 210 },
    { month: "Jul", JavaScript: 460, React: 450, CSS: 250, TypeScript: 320, Performance: 240 },
  ];

  const categoryTimePie = [
    { name: "JavaScript", value: 32, color: "var(--color-chart-1)" },
    { name: "React", value: 28, color: "var(--color-chart-2)" },
    { name: "CSS", value: 16, color: "var(--color-chart-3)" },
    { name: "TypeScript", value: 14, color: "var(--color-chart-4)" },
    { name: "Performance", value: 10, color: "var(--color-chart-5)" },
  ];

  // Metric 2: Accuracy Data
  const accuracyTrend = [
    { week: "W1", quizAccuracy: 62, bugFixAccuracy: 55, overall: 58 },
    { week: "W2", quizAccuracy: 68, bugFixAccuracy: 60, overall: 64 },
    { week: "W3", quizAccuracy: 71, bugFixAccuracy: 68, overall: 70 },
    { week: "W4", quizAccuracy: 75, bugFixAccuracy: 72, overall: 73 },
    { week: "W5", quizAccuracy: 80, bugFixAccuracy: 79, overall: 79 },
    { week: "W6", quizAccuracy: 84, bugFixAccuracy: 81, overall: 82 },
    { week: "W7", quizAccuracy: 88, bugFixAccuracy: 86, overall: 87 },
  ];

  const accuracyByCategory = [
    { category: "CSS", accuracy: 94, totalAttempts: 45 },
    { category: "React", accuracy: 88, totalAttempts: 62 },
    { category: "JavaScript", accuracy: 82, totalAttempts: 78 },
    { category: "TypeScript", accuracy: 74, totalAttempts: 38 },
    { category: "Performance", accuracy: 65, totalAttempts: 24 },
    { category: "System Design", accuracy: 58, totalAttempts: 15 },
  ];

  // Metric 3: Quiz Scores Data
  const quizScoresData = [
    { quizName: "Flexbox Layouts", score: 100, category: "CSS", date: "Jul 20" },
    { quizName: "CSS Grid 2D", score: 90, category: "CSS", date: "Jul 22" },
    { quizName: "Closures & Scope", score: 75, category: "JavaScript", date: "Jul 24" },
    { quizName: "Event Loop & Promises", score: 85, category: "JavaScript", date: "Jul 25" },
    { quizName: "useEffect & Cleanup", score: 80, category: "React", date: "Jul 26" },
    { quizName: "TypeScript Generics", score: 70, category: "TypeScript", date: "Jul 27" },
    { quizName: "Core Web Vitals", score: 60, category: "Performance", date: "Jul 28" },
  ];

  const scoreDistribution = [
    { range: "90-100%", count: 12, fill: "#10b981" },
    { range: "80-89%", count: 8, fill: "#3b82f6" },
    { range: "70-79%", count: 5, fill: "#f59e0b" },
    { range: "< 70%", count: 3, fill: "#f43f5e" },
  ];

  // Metric 4: Interview Readiness Historical Trend & Pillars
  const readinessTrend = [
    { week: "W1", score: 42, goal: 85 },
    { week: "W2", score: 50, goal: 85 },
    { week: "W3", score: 58, goal: 85 },
    { week: "W4", score: 64, goal: 85 },
    { week: "W5", score: 71, goal: 85 },
    { week: "W6", score: 78, goal: 85 },
    { week: "W7", score: 83, goal: 85 },
  ];

  const pillarRadar = [
    { pillar: "JavaScript", score: 82, fullMark: 100 },
    { pillar: "React", score: 88, fullMark: 100 },
    { pillar: "CSS Layout", score: 94, fullMark: 100 },
    { pillar: "TypeScript", score: 74, fullMark: 100 },
    { pillar: "Performance", score: 65, fullMark: 100 },
    { pillar: "System Design", score: 58, fullMark: 100 },
  ];

  // Metric 5: Topic Mastery Stage Progression & Completion
  const masteryStageCounts = useMemo(() => {
    const counts: Record<string, number> = {
      "Not Started": 0,
      Learning: 0,
      Practicing: 0,
      "Needs Review": 0,
      "Interview Ready": 0,
      Mastered: 0,
    };
    recordsList.forEach((r) => {
      counts[r.mastery] = (counts[r.mastery] || 0) + 1;
    });
    return counts;
  }, [recordsList]);

  const stageChartData = [
    { stage: "Mastered", count: masteryStageCounts["Mastered"], fill: "#10b981" },
    { stage: "Interview Ready", count: masteryStageCounts["Interview Ready"], fill: "#06b6d4" },
    { stage: "Practicing", count: masteryStageCounts["Practicing"], fill: "#3b82f6" },
    { stage: "Learning", count: masteryStageCounts["Learning"], fill: "#8b5cf6" },
    { stage: "Needs Review", count: masteryStageCounts["Needs Review"], fill: "#f43f5e" },
    { stage: "Not Started", count: masteryStageCounts["Not Started"], fill: "#6b7280" },
  ];

  // Metric 6: Streaks & Consistency
  const streakStats = {
    currentStreak: progress.streakDays,
    longestStreak: Math.max(progress.streakDays, 18),
    totalActiveDays: progress.heatmap.filter((h) => h.value > 0).length,
    consistencyPercent: Math.round(
      (progress.heatmap.filter((h) => h.value > 0).length / progress.heatmap.length) * 100,
    ),
    shieldsRemaining: 2,
  };

  const avgQuizAccuracy = Math.round(
    quizScoresData.reduce((acc, q) => acc + q.score, 0) / quizScoresData.length,
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          eyebrow="Sprint 14 — Analytics Engine"
          title="Growth & Mastery Analytics"
          description="Comprehensive charts tracking study time, accuracy, quiz scores, interview readiness, topic progress, and streak consistency."
        />

        {/* Time Horizon Selector */}
        <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-lg border text-xs">
          {(["7d", "30d", "90d", "12m"] as const).map((horizon) => (
            <Button
              key={horizon}
              variant={timeHorizon === horizon ? "default" : "ghost"}
              size="xs"
              className="h-7 text-[11px] font-medium"
              onClick={() => setTimeHorizon(horizon)}
            >
              {horizon.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      {/* Top Key Performance Indicator Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Total Study Time"
          value={`${Math.round(progress.totalMinutes / 60)}h ${progress.totalMinutes % 60}m`}
          delta="+12% vs last week"
          icon={<Clock className="h-4 w-4 text-primary" />}
        />
        <StatCard
          label="Avg Quiz Accuracy"
          value={`${avgQuizAccuracy}%`}
          delta="+5% improvement"
          icon={<Percent className="h-4 w-4 text-emerald-500" />}
        />
        <StatCard
          label="Interview Readiness"
          value="83%"
          delta="Senior Tier Goal: 85%"
          icon={<Award className="h-4 w-4 text-amber-500" />}
          tone="primary"
        />
        <StatCard
          label="Current Streak"
          value={`${progress.streakDays} Days`}
          delta={`Record: ${streakStats.longestStreak} Days`}
          icon={<Flame className="h-4 w-4 text-rose-500" />}
        />
        <StatCard
          label="Consistency Rate"
          value={`${streakStats.consistencyPercent}%`}
          delta={`${streakStats.totalActiveDays} / 84 active days`}
          icon={<Activity className="h-4 w-4 text-blue-500" />}
        />
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 h-auto p-1 bg-muted/50 rounded-xl">
          <TabsTrigger value="overview" className="gap-1.5 text-xs py-2 font-medium">
            <BarChart2 className="h-3.5 w-3.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="time" className="gap-1.5 text-xs py-2 font-medium">
            <Clock className="h-3.5 w-3.5 text-primary" /> Learning Time
          </TabsTrigger>
          <TabsTrigger value="accuracy" className="gap-1.5 text-xs py-2 font-medium">
            <Percent className="h-3.5 w-3.5 text-emerald-500" /> Accuracy & Quizzes
          </TabsTrigger>
          <TabsTrigger value="readiness" className="gap-1.5 text-xs py-2 font-medium">
            <Award className="h-3.5 w-3.5 text-amber-500" /> Interview Readiness
          </TabsTrigger>
          <TabsTrigger value="progress" className="gap-1.5 text-xs py-2 font-medium">
            <TrendingUp className="h-3.5 w-3.5 text-cyan-500" /> Topic Progress
          </TabsTrigger>
          <TabsTrigger value="streak" className="gap-1.5 text-xs py-2 font-medium">
            <Flame className="h-3.5 w-3.5 text-rose-500" /> Streaks & Calendar
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: OVERVIEW DASHBOARD */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Learning Time Trend */}
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" /> Monthly Learning Time Distribution
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    Minutes
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Hours dedicated across front-end categories.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer>
                  <BarChart data={monthlyLearningTime}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border)"
                      opacity={0.5}
                    />
                    <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={11} />
                    <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                    <RTooltip
                      contentStyle={{
                        background: "var(--color-popover)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 10,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="JavaScript" stackId="a" fill="#3b82f6" />
                    <Bar dataKey="React" stackId="a" fill="#06b6d4" />
                    <Bar dataKey="CSS" stackId="a" fill="#10b981" />
                    <Bar dataKey="TypeScript" stackId="a" fill="#8b5cf6" />
                    <Bar dataKey="Performance" stackId="a" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Quiz Accuracy & Debug Success Rate */}
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-emerald-500" /> Accuracy & Performance
                    Trajectory
                  </span>
                  <Badge className="bg-emerald-600 text-white text-[10px]">87% Current</Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Quiz accuracy vs. Debug Lab bug solving success rate over 7 weeks.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer>
                  <LineChart data={accuracyTrend}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border)"
                      opacity={0.5}
                    />
                    <XAxis dataKey="week" stroke="var(--color-muted-foreground)" fontSize={11} />
                    <YAxis
                      domain={[40, 100]}
                      stroke="var(--color-muted-foreground)"
                      fontSize={11}
                    />
                    <RTooltip
                      contentStyle={{
                        background: "var(--color-popover)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 10,
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="quizAccuracy"
                      name="Quiz Accuracy"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="bugFixAccuracy"
                      name="Debug Lab Rate"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Category Time Pie */}
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-primary" /> Time per Category
                </CardTitle>
              </CardHeader>
              <CardContent className="h-64 flex flex-col items-center justify-center">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={categoryTimePie}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      {categoryTimePie.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RTooltip
                      contentStyle={{
                        background: "var(--color-popover)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 10,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 text-[11px] text-muted-foreground">
                  {categoryTimePie.map((c) => (
                    <div key={c.name} className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                      <span>
                        {c.name} ({c.value}%)
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Topic Mastery Distribution */}
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-cyan-500" /> Topic Mastery Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer>
                  <BarChart data={stageChartData} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border)"
                      opacity={0.3}
                    />
                    <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={11} />
                    <YAxis
                      dataKey="stage"
                      type="category"
                      stroke="var(--color-muted-foreground)"
                      fontSize={10}
                      width={90}
                    />
                    <RTooltip
                      contentStyle={{
                        background: "var(--color-popover)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 10,
                      }}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                      {stageChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Streak & Consistency Quick Card */}
            <Card className="border-border/60 flex flex-col justify-between">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Flame className="h-4 w-4 text-rose-500" /> Streak & Consistency
                </CardTitle>
                <CardDescription className="text-xs">
                  Maintain your daily coding streak.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <div className="flex items-center gap-3">
                    <Flame className="h-8 w-8 text-rose-500 animate-pulse" />
                    <div>
                      <div className="text-2xl font-bold font-mono">{progress.streakDays} Days</div>
                      <div className="text-[11px] text-muted-foreground">Current Active Streak</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs border-rose-500/30 text-rose-500">
                    🔥 On Fire
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Monthly Consistency Rate:</span>
                    <span className="font-bold font-mono text-foreground">
                      {streakStats.consistencyPercent}%
                    </span>
                  </div>
                  <Progress value={streakStats.consistencyPercent} className="h-2" />
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Streak Shields:
                  </span>
                  <span className="font-bold text-emerald-500">
                    {streakStats.shieldsRemaining} Available
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: LEARNING TIME CHARTS */}
        <TabsContent value="time" className="space-y-6">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> Learning Hours & Time Allocation
              </CardTitle>
              <CardDescription className="text-xs">
                Detailed breakdown of minutes spent per category over time.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer>
                <AreaChart data={monthlyLearningTime}>
                  <defs>
                    <linearGradient id="colorJs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorReact" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
                  <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                  <RTooltip
                    contentStyle={{ background: "var(--color-popover)", borderRadius: 10 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="JavaScript"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorJs)"
                  />
                  <Area
                    type="monotone"
                    dataKey="React"
                    stroke="#06b6d4"
                    fillOpacity={1}
                    fill="url(#colorReact)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: ACCURACY & QUIZZES */}
        <TabsContent value="accuracy" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Accuracy by Category Bar Chart */}
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Percent className="h-4 w-4 text-emerald-500" /> Accuracy Rate by Category
                </CardTitle>
                <CardDescription className="text-xs">
                  Your correct response percentage across quiz categories.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer>
                  <BarChart data={accuracyByCategory}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border)"
                      opacity={0.4}
                    />
                    <XAxis
                      dataKey="category"
                      stroke="var(--color-muted-foreground)"
                      fontSize={11}
                    />
                    <YAxis domain={[0, 100]} stroke="var(--color-muted-foreground)" fontSize={11} />
                    <RTooltip
                      contentStyle={{ background: "var(--color-popover)", borderRadius: 10 }}
                    />
                    <Bar dataKey="accuracy" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Quiz Score Distribution */}
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-blue-500" /> Quiz Score Distribution
                </CardTitle>
                <CardDescription className="text-xs">
                  Number of quiz attempts grouped by score percentage bracket.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer>
                  <BarChart data={scoreDistribution}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border)"
                      opacity={0.4}
                    />
                    <XAxis dataKey="range" stroke="var(--color-muted-foreground)" fontSize={11} />
                    <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                    <RTooltip
                      contentStyle={{ background: "var(--color-popover)", borderRadius: 10 }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {scoreDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Quiz Logs Table */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-sm">Recent Quiz Attempt History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {quizScoresData.map((quiz, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card/60 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold">{quiz.quizName}</div>
                      <div className="text-muted-foreground text-[10px]">
                        {quiz.category} · {quiz.date}
                      </div>
                    </div>
                    <Badge
                      className={
                        quiz.score >= 85
                          ? "bg-emerald-600 text-white font-mono"
                          : quiz.score >= 70
                            ? "bg-blue-600 text-white font-mono"
                            : "bg-amber-600 text-white font-mono"
                      }
                    >
                      {quiz.score}% Score
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: INTERVIEW READINESS */}
        <TabsContent value="readiness" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Historical Readiness Trend */}
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-500" /> Historical Interview Readiness
                  Trajectory
                </CardTitle>
                <CardDescription className="text-xs">
                  Weekly growth progression towards your 85% Senior Readiness target.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer>
                  <AreaChart data={readinessTrend}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border)"
                      opacity={0.4}
                    />
                    <XAxis dataKey="week" stroke="var(--color-muted-foreground)" fontSize={11} />
                    <YAxis domain={[0, 100]} stroke="var(--color-muted-foreground)" fontSize={11} />
                    <RTooltip
                      contentStyle={{ background: "var(--color-popover)", borderRadius: 10 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#f59e0b"
                      fill="#f59e0b"
                      fillOpacity={0.2}
                      strokeWidth={2.5}
                    />
                    <Line type="monotone" dataKey="goal" stroke="#10b981" strokeDasharray="4 4" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Radar Chart */}
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" /> Technical Pillar Skill Radar
                </CardTitle>
                <CardDescription className="text-xs">
                  Comparative balance across 6 front-end domains.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer>
                  <RadarChart data={pillarRadar}>
                    <PolarGrid stroke="var(--color-border)" />
                    <PolarAngleAxis
                      dataKey="pillar"
                      tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                    />
                    <PolarRadiusAxis stroke="var(--color-border)" tick={false} />
                    <Radar
                      dataKey="score"
                      stroke="var(--color-primary)"
                      fill="var(--color-primary)"
                      fillOpacity={0.4}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 5: TOPIC PROGRESS & STAGES */}
        <TabsContent value="progress" className="space-y-6">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-cyan-500" /> Topic Stage Breakdown & Inventory
              </CardTitle>
              <CardDescription className="text-xs">
                Current status distribution across all tracked concept topics.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {recordsList.map((record) => (
                  <Card key={record.topicId} className="p-3 border bg-card/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs">{record.topicTitle}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {record.category}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>
                        Status: <strong className="text-foreground">{record.mastery}</strong>
                      </span>
                      <span className="font-mono text-primary">{record.confidence}%</span>
                    </div>
                    <Progress value={record.confidence} className="h-1.5" />
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 6: STREAKS & CALENDAR */}
        <TabsContent value="streak" className="space-y-6">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Flame className="h-4 w-4 text-rose-500" /> 12-Week Activity Heatmap & Consistency
                Grid
              </CardTitle>
              <CardDescription className="text-xs">
                Daily activity intensity calculated from completed lessons, quizzes, bug fixes, and
                journals.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HeatMap data={progress.heatmap} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
