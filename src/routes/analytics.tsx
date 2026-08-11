import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { HeatMap } from "@/components/shared/heat-map";
import { useProgress } from "@/lib/hooks/use-progress";
import { useQuizzes, useTopics, useLessons } from "@/lib/hooks/use-content";
import {
  getQuizAnalytics,
  getCategoryAccuracyAnalytics,
  getCategoryActivityAnalytics,
  getMonthlyActivityAnalytics,
  getWeeklyAccuracyTrend,
  getReadinessAnalytics,
  getPillarRadarAnalytics,
} from "@/lib/analytics/progress-analytics";
import {
  Clock,
  Percent,
  Award,
  Flame,
  TrendingUp,
  BarChart2,
  Brain,
  Activity,
  PieChart as PieChartIcon,
  ShieldCheck,
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
} from "recharts";

export const Route = createFileRoute("/analytics")({
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
  const progress = useProgress();
  const quizzes = useQuizzes();
  const topics = useTopics();
  const lessons = useLessons();

  const [timeHorizon, setTimeHorizon] = useState<"7d" | "30d" | "90d" | "12m">("30d");
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Topics & Mastery
  const masteryRecords = useMemo(
    () => progress.topicMasteryRecords || {},
    [progress.topicMasteryRecords],
  );
  const recordsList = useMemo(() => Object.values(masteryRecords), [masteryRecords]);

  // Reactive Analytics Calculations via Reusable Helper
  const quizAnalytics = useMemo(
    () => getQuizAnalytics(progress, quizzes, topics),
    [progress, quizzes, topics],
  );

  const categoryAccuracy = useMemo(
    () => getCategoryAccuracyAnalytics(progress, quizzes, topics),
    [progress, quizzes, topics],
  );

  const categoryActivity = useMemo(
    () => getCategoryActivityAnalytics(progress, topics, lessons),
    [progress, topics, lessons],
  );

  const monthlyActivity = useMemo(
    () => getMonthlyActivityAnalytics(progress, topics),
    [progress, topics],
  );

  const weeklyAccuracy = useMemo(() => getWeeklyAccuracyTrend(progress), [progress]);

  const readinessAnalytics = useMemo(() => getReadinessAnalytics(progress), [progress]);

  const pillarRadarAnalytics = useMemo(() => getPillarRadarAnalytics(progress), [progress]);

  // Topic Mastery Stage Counts
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

  // Streaks & Consistency
  const streakStats = {
    currentStreak: progress.streakDays,
    bestStreak: Math.max(progress.streakDays, progress.bestStreakDays || 0),
    totalActiveDays: progress.heatmap.filter((h) => h.value > 0).length,
    consistencyPercent:
      progress.heatmap.length > 0
        ? Math.round(
            (progress.heatmap.filter((h) => h.value > 0).length / progress.heatmap.length) * 100,
          )
        : 0,
    shieldsRemaining: 2,
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          eyebrow="Statistics & Analytics"
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
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Total Study Time"
          value={`${Math.round(progress.totalMinutes / 60)}h ${progress.totalMinutes % 60}m`}
          delta="Accumulated practice"
          icon={<Clock className="h-4 w-4 text-primary" />}
        />
        <StatCard
          label="Avg Quiz Accuracy"
          value={
            quizAnalytics.hasQuizData ? `${quizAnalytics.avgQuizAccuracy}%` : "No quiz data yet"
          }
          delta={
            quizAnalytics.hasQuizData
              ? `${quizAnalytics.totalQuizzesTaken} quiz attempt${
                  quizAnalytics.totalQuizzesTaken === 1 ? "" : "s"
                }`
              : "Complete quizzes to see score"
          }
          icon={<Percent className="h-4 w-4 text-emerald-500" />}
        />
        <StatCard
          label="Interview Readiness"
          value={`${readinessAnalytics.overallReadinessPercent}%`}
          delta={`${readinessAnalytics.interviewReadyCount} / ${readinessAnalytics.totalTrackedTopics} topics ready`}
          icon={<Award className="h-4 w-4 text-amber-500" />}
          tone="primary"
        />
        <StatCard
          label="Current Streak"
          value={`${progress.streakDays} Days`}
          delta={
            streakStats.bestStreak > 0 ? `Best: ${streakStats.bestStreak} Days` : "Keep it up!"
          }
          icon={<Flame className="h-4 w-4 text-rose-500" />}
        />
        <StatCard
          label="Consistency Rate"
          value={`${streakStats.consistencyPercent}%`}
          delta={`${streakStats.totalActiveDays} active day${
            streakStats.totalActiveDays === 1 ? "" : "s"
          }`}
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
            {/* Learning Time / Activity Distribution */}
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" /> Monthly Activity Distribution
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    Activities
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Activity volume across front-end categories.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                {monthlyActivity.hasTrendData ? (
                  <ResponsiveContainer>
                    <BarChart data={monthlyActivity.monthlyTrend}>
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
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                    <Activity className="h-8 w-8 mb-2 opacity-50 text-primary" />
                    <p className="text-sm font-medium text-foreground">
                      No monthly activity data yet
                    </p>
                    <p className="text-xs mt-1 max-w-xs">
                      Complete lessons, quizzes, or practice sessions to unlock monthly activity
                      distribution insights.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quiz Accuracy Trajectory */}
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-emerald-500" /> Accuracy & Performance
                    Trajectory
                  </span>
                  <Badge className="bg-emerald-600 text-white text-[10px]">
                    {quizAnalytics.hasQuizData
                      ? `${quizAnalytics.avgQuizAccuracy}% Average`
                      : "No Quiz Data"}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Weekly accuracy trajectory derived from completed quiz attempts.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                {weeklyAccuracy.hasTrendData ? (
                  <ResponsiveContainer>
                    <LineChart data={weeklyAccuracy.trend}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--color-border)"
                        opacity={0.5}
                      />
                      <XAxis dataKey="week" stroke="var(--color-muted-foreground)" fontSize={11} />
                      <YAxis
                        domain={[0, 100]}
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
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                    <Percent className="h-8 w-8 mb-2 opacity-50 text-emerald-500" />
                    <p className="text-sm font-medium text-foreground">
                      Complete more activities to see your trend
                    </p>
                    <p className="text-xs mt-1 max-w-xs">
                      Complete quiz attempts to view your performance trajectory over time.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Category Activity Pie */}
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-primary" /> Activity per Category
                </CardTitle>
              </CardHeader>
              <CardContent className="h-64 flex flex-col items-center justify-center">
                {categoryActivity.hasActivityData ? (
                  <>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={categoryActivity.categoryPie}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={4}
                        >
                          {categoryActivity.categoryPie.map((entry, index) => (
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
                      {categoryActivity.categoryPie.map((c) => (
                        <div key={c.name} className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                          <span>
                            {c.name} ({c.value}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                    <PieChartIcon className="h-8 w-8 mb-2 opacity-50 text-primary" />
                    <p className="text-sm font-medium text-foreground">
                      No category activity data yet
                    </p>
                    <p className="text-xs mt-1">
                      Start learning topics across categories to see distribution.
                    </p>
                  </div>
                )}
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
                <Clock className="h-4 w-4 text-primary" /> Learning Activity & Time Allocation
              </CardTitle>
              <CardDescription className="text-xs">
                Detailed breakdown of completed learning activities per category over time.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {monthlyActivity.hasTrendData ? (
                <ResponsiveContainer>
                  <AreaChart data={monthlyActivity.monthlyTrend}>
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
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border)"
                      opacity={0.5}
                    />
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
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                  <Clock className="h-8 w-8 mb-2 opacity-50 text-primary" />
                  <p className="text-sm font-medium text-foreground">No activity data yet</p>
                  <p className="text-xs mt-1 max-w-xs">
                    Complete lessons, quizzes, or practice sessions to record learning activity
                    allocation over time.
                  </p>
                </div>
              )}
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
                {categoryAccuracy.hasCategoryData ? (
                  <ResponsiveContainer>
                    <BarChart data={categoryAccuracy.categories}>
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
                      <YAxis
                        domain={[0, 100]}
                        stroke="var(--color-muted-foreground)"
                        fontSize={11}
                      />
                      <RTooltip
                        contentStyle={{ background: "var(--color-popover)", borderRadius: 10 }}
                      />
                      <Bar dataKey="accuracy" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                    <Percent className="h-8 w-8 mb-2 opacity-50 text-emerald-500" />
                    <p className="text-sm font-medium text-foreground">
                      No category accuracy data yet
                    </p>
                    <p className="text-xs mt-1 max-w-xs">
                      Take quizzes in different categories to unlock category performance metrics.
                    </p>
                  </div>
                )}
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
                {quizAnalytics.hasQuizData ? (
                  <ResponsiveContainer>
                    <BarChart data={quizAnalytics.scoreDistribution}>
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
                        {quizAnalytics.scoreDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                    <ListChecks className="h-8 w-8 mb-2 opacity-50 text-blue-500" />
                    <p className="text-sm font-medium text-foreground">No quiz data yet</p>
                    <p className="text-xs mt-1 max-w-xs">
                      Complete quiz attempts in the Practice tab to track score distribution
                      brackets.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Quiz Logs Table */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-sm">Recent Quiz Attempt History</CardTitle>
            </CardHeader>
            <CardContent>
              {quizAnalytics.hasQuizData ? (
                <div className="space-y-2">
                  {quizAnalytics.quizHistory.map((quiz, i) => (
                    <div
                      key={quiz.id || i}
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
              ) : (
                <div className="p-8 text-center border rounded-lg bg-card/40 space-y-2">
                  <ListChecks className="h-8 w-8 mx-auto text-muted-foreground/60" />
                  <div className="font-semibold text-sm text-foreground">No quiz data yet</div>
                  <p className="text-xs text-muted-foreground">
                    Complete quizzes in Practice or Learn modules to record attempt history.
                  </p>
                </div>
              )}
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
                {weeklyAccuracy.hasTrendData ? (
                  <ResponsiveContainer>
                    <AreaChart data={weeklyAccuracy.trend}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--color-border)"
                        opacity={0.4}
                      />
                      <XAxis dataKey="week" stroke="var(--color-muted-foreground)" fontSize={11} />
                      <YAxis
                        domain={[0, 100]}
                        stroke="var(--color-muted-foreground)"
                        fontSize={11}
                      />
                      <RTooltip
                        contentStyle={{ background: "var(--color-popover)", borderRadius: 10 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="quizAccuracy"
                        stroke="#f59e0b"
                        fill="#f59e0b"
                        fillOpacity={0.2}
                        strokeWidth={2.5}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                    <Award className="h-8 w-8 mb-2 opacity-50 text-amber-500" />
                    <p className="text-sm font-medium text-foreground">
                      Complete more activities to see your trend
                    </p>
                    <p className="text-xs mt-1 max-w-xs">
                      As you complete topic assessments and quizzes, your readiness trajectory will
                      plot here.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Radar Chart */}
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" /> Technical Pillar Skill Radar
                </CardTitle>
                <CardDescription className="text-xs">
                  Comparative balance across 6 front-end technical pillars.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                {pillarRadarAnalytics.hasRadarData ? (
                  <ResponsiveContainer>
                    <RadarChart data={pillarRadarAnalytics.pillars}>
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
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground space-y-2">
                    <Brain className="h-8 w-8 opacity-50 text-primary" />
                    <p className="text-sm font-medium text-foreground">
                      No diagnostic radar data yet
                    </p>
                    <p className="text-xs max-w-xs">
                      Skill radar will populate as you complete topic assessments across technical
                      pillars.
                    </p>
                  </div>
                )}
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
