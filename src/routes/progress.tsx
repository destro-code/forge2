import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useProgress } from "@/lib/hooks/use-progress";
import {
  useLessons,
  useQuizzes,
  useProjects,
  useTopics,
  useModules,
  useBugs,
} from "@/lib/hooks/use-content";
import {
  Flame,
  Trophy,
  Brain,
  CheckCircle2,
  Calendar,
  Sparkles,
  BookOpen,
  ArrowRight,
  Award,
  ListChecks,
  Bug,
  Zap,
  Check,
  TrendingUp,
  Circle,
  Play,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Progress Dashboard · Forge" },
      {
        name: "description",
        content:
          "High-level overview of curriculum completion, lessons, quizzes, projects, and milestones.",
      },
      { property: "og:title", content: "Progress Dashboard · Forge" },
      { property: "og:description", content: "Visualize your path through Forge." },
    ],
  }),
  component: ProgressDashboardPage,
});

export function ProgressDashboardPage() {
  const progress = useProgress();
  const allLessons = useLessons();
  const allQuizzes = useQuizzes();
  const allProjects = useProjects();
  const allTopics = useTopics();
  const allModules = useModules();
  const allBugs = useBugs();

  // 1. Core Completion Calculations
  const completedLessonsCount = useMemo(() => {
    return progress.lessonsCompleted?.length || 0;
  }, [progress.lessonsCompleted]);

  const totalLessonsCount = useMemo(() => {
    return allLessons.length || 1;
  }, [allLessons]);

  const curriculumPercent = useMemo(() => {
    return Math.round((completedLessonsCount / totalLessonsCount) * 100);
  }, [completedLessonsCount, totalLessonsCount]);

  // Level and XP Calculations
  const xp = useMemo(() => progress.xp || 0, [progress.xp]);
  const currentLevel = useMemo(() => Math.floor(xp / 100) + 1, [xp]);
  const xpInCurrentLevel = useMemo(() => xp % 100, [xp]);

  // Completed quizzes (using the unique quiz IDs from quiz results or completedQuizzes list)
  const completedQuizzesCount = useMemo(() => {
    const fromCompleted = progress.completedQuizzes || [];
    const fromResults = (progress.quizResults || []).map((r) => r.quizId);
    const uniqueQuizzes = new Set([...fromCompleted, ...fromResults]);
    return uniqueQuizzes.size;
  }, [progress.completedQuizzes, progress.quizResults]);

  const averageQuizScore = useMemo(() => {
    const results = progress.quizResults || [];
    if (results.length === 0) return 0;

    // Group by quizId and find max score for each
    const maxScores: Record<string, number> = {};
    results.forEach((r) => {
      maxScores[r.quizId] = Math.max(maxScores[r.quizId] || 0, r.scorePercent);
    });

    const scores = Object.values(maxScores);
    const sum = scores.reduce((acc, s) => acc + s, 0);
    return Math.round(sum / scores.length);
  }, [progress.quizResults]);

  // Completed projects count
  const completedProjectsCount = useMemo(() => {
    return progress.completedProjects?.length || 0;
  }, [progress.completedProjects]);

  // Completed debug bugs count
  const completedBugsCount = useMemo(() => {
    return progress.solvedBugs?.length || 0;
  }, [progress.solvedBugs]);

  // Completed topics count (where all of its lessons are completed)
  const completedTopicsCount = useMemo(() => {
    return allTopics.filter((topic) => {
      const topicLessons = allLessons.filter((l) => l.topicId === topic.id);
      if (topicLessons.length === 0) return false;
      return topicLessons.every((l) => progress.lessonsCompleted?.includes(l.id));
    }).length;
  }, [allTopics, allLessons, progress.lessonsCompleted]);

  // Completed modules count (where all of its topics are completed)
  const completedModulesCount = useMemo(() => {
    return allModules.filter((module) => {
      const moduleTopics = allTopics.filter((t) => t.moduleId === module.id);
      if (moduleTopics.length === 0) return false;
      return moduleTopics.every((topic) => {
        const topicLessons = allLessons.filter((l) => l.topicId === topic.id);
        if (topicLessons.length === 0) return false;
        return topicLessons.every((l) => progress.lessonsCompleted?.includes(l.id));
      });
    }).length;
  }, [allModules, allTopics, allLessons, progress.lessonsCompleted]);

  // 2. Module completion analytics for charting
  const moduleChartData = useMemo(() => {
    return allModules.map((m) => {
      const moduleTopics = allTopics.filter((t) => t.moduleId === m.id);
      const topicIds = moduleTopics.map((t) => t.id);
      const moduleLessons = allLessons.filter((l) => topicIds.includes(l.topicId));
      const totalLessons = moduleLessons.length;
      const completed = moduleLessons.filter((l) =>
        progress.lessonsCompleted?.includes(l.id),
      ).length;

      const percent = totalLessons === 0 ? 0 : Math.round((completed / totalLessons) * 100);
      return {
        name: m.title.split(" & ")[0].split(" - ")[0], // Shorten name for readability
        completion: percent,
        completedCount: completed,
        totalCount: totalLessons,
      };
    });
  }, [allModules, allTopics, allLessons, progress.lessonsCompleted]);

  // 3. Milestones Verification
  const milestonesList = useMemo(() => {
    return [
      {
        id: "first_spark",
        title: "First Spark",
        description: "Complete your first lesson in Forge",
        icon: <BookOpen className="h-5 w-5 text-sky-500" />,
        isUnlocked: completedLessonsCount >= 1,
        progressVal: Math.min(completedLessonsCount, 1),
        progressMax: 1,
        targetLabel: "1 lesson",
      },
      {
        id: "quiz_master",
        title: "Quiz Graduate",
        description: "Practice and complete at least 3 quiz assessments",
        icon: <ListChecks className="h-5 w-5 text-indigo-500" />,
        isUnlocked: completedQuizzesCount >= 3,
        progressVal: Math.min(completedQuizzesCount, 3),
        progressMax: 3,
        targetLabel: "3 quizzes",
      },
      {
        id: "bug_squasher",
        title: "Bug Squasher",
        description: "Identify and solve 2 Debug Lab bug scenarios",
        icon: <Bug className="h-5 w-5 text-rose-500" />,
        isUnlocked: completedBugsCount >= 2,
        progressVal: Math.min(completedBugsCount, 2),
        progressMax: 2,
        targetLabel: "2 bugs",
      },
      {
        id: "portfolio_builder",
        title: "Portfolio Architect",
        description: "Complete at least 1 design pattern milestone project",
        icon: <Trophy className="h-5 w-5 text-amber-500" />,
        isUnlocked: completedProjectsCount >= 1,
        progressVal: Math.min(completedProjectsCount, 1),
        progressMax: 1,
        targetLabel: "1 project",
      },
      {
        id: "senior_readiness",
        title: "Lead Ready",
        description: "Simulate a mock technical interview loop",
        icon: <Award className="h-5 w-5 text-emerald-500" />,
        isUnlocked: (progress.interviewResults || []).length >= 1,
        progressVal: Math.min((progress.interviewResults || []).length, 1),
        progressMax: 1,
        targetLabel: "1 interview session",
      },
    ];
  }, [
    completedLessonsCount,
    completedQuizzesCount,
    completedBugsCount,
    completedProjectsCount,
    progress.interviewResults,
  ]);

  // 4. Chronological activity logs computed from actual storage
  const chronologicalActivity = useMemo(() => {
    const activities: Array<{
      id: string;
      type: "lesson" | "quiz" | "bug" | "project" | "playground";
      title: string;
      timestamp: string;
      xp: number;
    }> = [];

    // Quiz records
    if (progress.quizResults) {
      progress.quizResults.forEach((q) => {
        const quizObj = allQuizzes.find((qo) => qo.id === q.quizId);
        activities.push({
          id: q.id || `act_q_${Math.random()}`,
          type: "quiz",
          title: `Completed quiz "${quizObj?.title || q.quizId}" with a score of ${q.scorePercent}%`,
          timestamp: q.completedAt || new Date().toISOString(),
          xp: Math.round((q.scorePercent / 100) * 50),
        });
      });
    }

    // Bug records (fake timestamps for listing order since solvedBugs is a string list)
    if (progress.solvedBugs) {
      progress.solvedBugs.forEach((bugId, i) => {
        const bugObj = allBugs.find((b) => b.id === bugId);
        const hoursAgo = (i + 1) * 12;
        const fakeDate = new Date();
        fakeDate.setHours(fakeDate.getHours() - hoursAgo);
        activities.push({
          id: `act_b_${bugId}`,
          type: "bug",
          title: `Successfully squashed bug challenge "${bugObj?.title || bugId}"`,
          timestamp: fakeDate.toISOString(),
          xp: 40,
        });
      });
    }

    // Completed Projects
    if (progress.completedProjects) {
      progress.completedProjects.forEach((projId, i) => {
        const projObj = allProjects.find((p) => p.id === projId);
        const daysAgo = (i + 1) * 2;
        const fakeDate = new Date();
        fakeDate.setDate(fakeDate.getDate() - daysAgo);
        activities.push({
          id: `act_p_${projId}`,
          type: "project",
          title: `Submitted architectural milestone project "${projObj?.title || projId}"`,
          timestamp: fakeDate.toISOString(),
          xp: 150,
        });
      });
    }

    // Sort activities by timestamp descending
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  }, [
    progress.quizResults,
    progress.solvedBugs,
    progress.completedProjects,
    allQuizzes,
    allBugs,
    allProjects,
  ]);

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          eyebrow="My Progress"
          title="Overall Training Progress"
          description="A complete high-level roadmap of your curriculum completions, milestones, streaks, and verified achievements."
        />

        {/* Action Button to Quick Learn */}
        <div className="flex items-center gap-2 shrink-0">
          <Link to="/learn">
            <Button size="sm" className="gap-1.5 font-semibold">
              <Play className="h-4 w-4" /> Continue Learning
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Overall Curriculum Progress & XP Meter Card */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Progress Gauge */}
        <Card className="border-border/60 md:col-span-2 flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Overall Curriculum Completion</span>
              <span className="text-primary font-mono font-bold text-lg">{curriculumPercent}%</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Your overall journey progress computed from completed lessons.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-3">
            <div className="space-y-2">
              <Progress value={curriculumPercent} className="h-3.5" />
              <div className="flex justify-between text-xs text-muted-foreground font-medium">
                <span>
                  {completedLessonsCount} / {totalLessonsCount} Lessons Done
                </span>
                <span>{totalLessonsCount - completedLessonsCount} Lessons Remaining</span>
              </div>
            </div>

            {/* Sub-progress categories */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/40 text-center">
              <div>
                <span className="text-xs text-muted-foreground block">Completed Topics</span>
                <span className="text-xl font-bold text-foreground font-mono">
                  {completedTopicsCount}{" "}
                  <span className="text-xs text-muted-foreground">/ {allTopics.length}</span>
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Completed Modules</span>
                <span className="text-xl font-bold text-foreground font-mono">
                  {completedModulesCount}{" "}
                  <span className="text-xs text-muted-foreground">/ {allModules.length}</span>
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Streaks Status</span>
                <span className="text-xl font-bold text-amber-500 font-mono flex items-center justify-center gap-1">
                  <Flame className="h-5 w-5 fill-amber-500 text-amber-500 inline shrink-0" />
                  {progress.streakDays || 0}d
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Level and XP Meter */}
        <Card className="border-border/60 bg-gradient-to-br from-primary/5 to-transparent flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-1.5">
              <Zap className="h-5 w-5 text-amber-500 fill-amber-500" /> Learner Profile Rank
            </CardTitle>
            <CardDescription className="text-xs">
              Accumulate XP across lessons, quizzes, and projects to rank up.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-3 text-center md:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-primary flex flex-col items-center justify-center text-primary-foreground shadow-md shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-85">
                  LVL
                </span>
                <span className="text-2xl font-extrabold font-mono">{currentLevel}</span>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-base">
                  {currentLevel >= 10
                    ? "Forge Architect"
                    : currentLevel >= 5
                      ? "Elite Developer"
                      : "Apprentice"}
                </h4>
                <p className="text-xs text-muted-foreground">
                  Total cumulative: <strong>{xp} XP</strong>
                </p>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Next Level Progress:</span>
                <span className="font-mono text-primary">{xpInCurrentLevel} / 100 XP</span>
              </div>
              <Progress value={xpInCurrentLevel} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. High Level Stat Cards */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Lessons Completed"
          value={`${completedLessonsCount} / ${totalLessonsCount}`}
          delta={`${Math.round((completedLessonsCount / totalLessonsCount) * 100)}% complete`}
          icon={<BookOpen className="h-4 w-4 text-sky-500" />}
        />
        <StatCard
          label="Quizzes Completed"
          value={completedQuizzesCount}
          delta={
            completedQuizzesCount > 0 ? `${averageQuizScore}% Average Accuracy` : "No scores yet"
          }
          icon={<ListChecks className="h-4 w-4 text-indigo-500" />}
        />
        <StatCard
          label="Architect Projects"
          value={`${completedProjectsCount} / ${allProjects.length}`}
          delta={`${allProjects.length - completedProjectsCount} remaining milestones`}
          icon={<Trophy className="h-4 w-4 text-amber-500" />}
        />
        <StatCard
          label="Bug Scenarios Fixed"
          value={completedBugsCount}
          delta="Debug scenarios solved"
          icon={<Bug className="h-4 w-4 text-rose-500" />}
        />
      </div>

      {/* 4. Chart Section & Module Progress Accordion List */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Side: Module completion bar chart */}
        <Card className="border-border/60 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-primary" /> Training Completion by Module
            </CardTitle>
            <CardDescription className="text-xs">
              Percent of total lessons completed inside each structural curriculum module.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={moduleChartData}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
                  unit="%"
                />
                <RTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 bg-popover border border-border rounded-xl shadow-md text-xs">
                          <p className="font-bold text-foreground">{data.name}</p>
                          <p className="text-muted-foreground pt-1">
                            Completion: <strong className="text-primary">{data.completion}%</strong>
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Lessons:{" "}
                            <strong>
                              {data.completedCount} / {data.totalCount}
                            </strong>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="completion" radius={[4, 4, 0, 0]}>
                  {moduleChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`hsl(var(--primary) / ${0.5 + (entry.completion / 100) * 0.5})`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Right Side: Modules List */}
        <Card className="border-border/60 flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-sm">Curriculum Modules Hub</CardTitle>
            <CardDescription className="text-xs">
              Review and jump to specific learning sections.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-1 max-h-64 overflow-y-auto">
            {allModules.map((m, idx) => {
              const chartItem = moduleChartData[idx];
              return (
                <div
                  key={m.id}
                  className="space-y-1.5 pb-3 border-b border-border/40 last:border-0 last:pb-0"
                >
                  <div className="flex items-center justify-between text-xs">
                    <Link
                      to="/learn/modules/$moduleId"
                      params={{ moduleId: m.id }}
                      className="hover:underline font-semibold text-foreground"
                    >
                      {m.title}
                    </Link>
                    <span className="font-bold text-primary font-mono">
                      {chartItem?.completion || 0}%
                    </span>
                  </div>
                  <Progress value={chartItem?.completion || 0} className="h-1.5" />
                  <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                    <span>
                      {chartItem?.completedCount} / {chartItem?.totalCount} lessons completed
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* 5. Curriculum Milestones Checklist */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-amber-500" /> Curriculum Milestone Achievements
          </CardTitle>
          <CardDescription className="text-xs">
            Unlock professional career-ready milestones as you complete more objectives inside
            Forge.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {milestonesList.map((m) => (
              <div
                key={m.id}
                className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition ${
                  m.isUnlocked
                    ? "border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40"
                    : "border-border/50 bg-card/40 opacity-75"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div
                      className={`p-2 rounded-lg ${m.isUnlocked ? "bg-emerald-500/10" : "bg-muted"}`}
                    >
                      {m.icon}
                    </div>
                    {m.isUnlocked ? (
                      <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] h-5">
                        Unlocked
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] h-5 font-mono">
                        Locked
                      </Badge>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-foreground">{m.title}</h4>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      {m.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-muted-foreground font-semibold">
                    <span>Target: {m.targetLabel}</span>
                    <span className="font-mono">
                      {m.progressVal} / {m.progressMax}
                    </span>
                  </div>
                  <Progress value={(m.progressVal / m.progressMax) * 100} className="h-1" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 6. Recent Learning Activity timeline logs */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-primary" /> Recent Learning Activity
          </CardTitle>
          <CardDescription className="text-xs">
            Chronological log of your recent study submissions, lessons, and milestones completed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chronologicalActivity.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-xs italic">
              No recent study activities logged yet. Get started by taking a lesson!
            </div>
          ) : (
            <div className="relative border-l border-border pl-6 space-y-6">
              {chronologicalActivity.map((act) => (
                <div key={act.id} className="relative">
                  {/* Dot */}
                  <span className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-background border-2 border-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  </span>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-foreground">{act.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(act.timestamp).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-[10px] h-5 self-start sm:self-auto font-bold font-mono"
                    >
                      +{act.xp} XP
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
