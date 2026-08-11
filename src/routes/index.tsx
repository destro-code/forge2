import { useState, useEffect } from "react";
import { useProgressStore } from "@/lib/stores/use-progress-store";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useProgress } from "@/lib/hooks/use-progress";
import {
  useModules,
  useLessons,
  useAchievements,
  useProjects,
  useBugs,
  useTopics,
  useLearningPaths,
} from "@/lib/hooks/use-content";
import { Flame, Clock, BookOpen, Trophy, Sparkles, ChevronRight, ArrowRight, X, Compass } from "lucide-react";

import { QuickResumeBar } from "@/components/dashboard/quick-resume-bar";
import { ContinueLearningCard } from "@/components/dashboard/continue-learning-card";
import { ContinueProjectCard } from "@/components/dashboard/continue-project-card";
import { DailyGoalCard } from "@/components/dashboard/daily-goal-card";
import { StreakCard } from "@/components/dashboard/streak-card";
import { RecentLessonsCard } from "@/components/dashboard/recent-lessons-card";
import { WeeklyProgressCard } from "@/components/dashboard/weekly-progress-card";
import { HeatmapCard } from "@/components/dashboard/heatmap-card";
import { RecommendedTopicsCard } from "@/components/dashboard/recommended-topics-card";
import { ProgressRing } from "@/components/shared/progress-ring";
import { getModuleProgress, getTopicProgress } from "@/lib/hooks/use-curriculum";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Forge" },
      {
        name: "description",
        content:
          "Your Forge dashboard — continue learning, track streaks, daily targets, and weekly progress.",
      },
      { property: "og:title", content: "Dashboard · Forge" },
      { property: "og:description", content: "Your daily launchpad for frontend mastery." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const progress = useProgress();
  const modules = useModules();
  const lessons = useLessons();
  const projects = useProjects();
  const bugs = useBugs();
  const topics = useTopics();
  const paths = useLearningPaths();
  const achievements = useAchievements();

  const [showOrientation, setShowOrientation] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem("forge_orientation_dismissed");
    if (!isDismissed && progress.lessonsCompleted.length < 5) {
      setShowOrientation(true);
    }
  }, [progress.lessonsCompleted.length]);

  const continueLesson =
    lessons.find((l) => l.id === progress.lastActiveLessonId) ??
    lessons.find((l) => !progress.lessonsCompleted.includes(l.id)) ??
    lessons[0];
  const activeProject = projects[0];
  const latestBug = bugs[0];

  const continueLessonModuleId =
    continueLesson?.moduleId || topics.find((t) => t.id === continueLesson?.topicId)?.moduleId;

  const continueProgressPercent = continueLessonModuleId
    ? getModuleProgress(continueLessonModuleId, progress.lessonsCompleted)
    : continueLesson?.topicId
      ? getTopicProgress(continueLesson.topicId, progress.lessonsCompleted)
      : 0;

  const handleAddMinutes = (addedMins: number) => {
    useProgressStore.getState().setProgress((prev: any) => ({
      ...prev,
      totalMinutes: prev.totalMinutes + addedMins,
      weekly: [
        prev.weekly[0],
        prev.weekly[1],
        prev.weekly[2],
        prev.weekly[3],
        prev.weekly[4],
        prev.weekly[5],
        (prev.weekly[6] || 0) + addedMins,
      ],
    }));
  };

  return (
    <div className="space-y-4 sm:space-y-8">
      {/* Header */}
      <PageHeader
        className="mb-0 sm:mb-0"
        eyebrow="Welcome back"
        title={
          <>
            Let's forge <span className="text-gradient-primary">something new</span> today
          </>
        }
        description={`You're on a ${progress.streakDays}-day streak — complete a lesson or exercise to keep the momentum going.`}
        actions={
          <Button asChild variant="outline" size="sm" className="h-8 text-xs">
            <Link suppressHydrationWarning to="/learn">
              <BookOpen className="mr-1.5 h-3.5 w-3.5" />
              Browse library
            </Link>
          </Button>
        }
      />

      {/* First-Time Learner Orientation Banner */}
      {showOrientation && (
        <Card className="border-primary/40 bg-gradient-to-r from-primary/10 via-card to-card p-5 relative overflow-hidden shadow-xs">
          <button
            onClick={() => {
              localStorage.setItem("forge_orientation_dismissed", "true");
              setShowOrientation(false);
            }}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground p-1 rounded-md transition"
            aria-label="Dismiss orientation"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-3.5 pr-8">
            <div className="h-10 w-10 rounded-xl bg-primary/20 grid place-items-center shrink-0 text-primary">
              <Compass className="h-5 w-5" />
            </div>
            <div className="space-y-2.5">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Welcome to Forge! The Canonical Learner Lifecycle
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Forge guides you through a 6-stage frontend mastery lifecycle. Progress fluidly across any stage at your own pace:
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                {[
                  { stage: "START", desc: "Select Path", color: "border-blue-500/30 text-blue-400" },
                  { stage: "LEARN", desc: "Read Lessons", color: "border-indigo-500/30 text-indigo-400" },
                  { stage: "PRACTICE", desc: "Quizzes & Labs", color: "border-amber-500/30 text-amber-400" },
                  { stage: "BUILD", desc: "Guided Projects", color: "border-emerald-500/30 text-emerald-400" },
                  { stage: "TEST", desc: "Mock Interviews", color: "border-purple-500/30 text-purple-400" },
                  { stage: "MASTER", desc: "Track Mastery", color: "border-rose-500/30 text-rose-400" },
                ].map((s) => (
                  <div key={s.stage} className={`p-2 rounded-lg border bg-background/60 text-center ${s.color}`}>
                    <div className="font-extrabold text-[11px] font-mono">{s.stage}</div>
                    <div className="text-[10px] text-muted-foreground">{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Resume Action Bar */}
      <QuickResumeBar lesson={continueLesson} progressPercent={continueProgressPercent} />

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Current streak"
          value={`${progress.streakDays} days`}
          delta={`Best: ${progress.bestStreakDays ?? progress.streakDays} days`}
          icon={<Flame className="h-4 w-4" />}
          tone="primary"
        />
        <StatCard
          label="Time studied"
          value={`${Math.round(progress.totalMinutes / 60)}h`}
          delta="+2.5h this week"
          icon={<Clock className="h-4 w-4" />}
        />
        <StatCard
          label="Lessons done"
          value={progress.lessonsCompleted.length}
          delta={`of ${lessons.length} available`}
          icon={<BookOpen className="h-4 w-4" />}
        />
        <StatCard
          label="Achievements"
          value={`${achievements.filter((a) => a.unlocked).length}/${achievements.length}`}
          icon={<Trophy className="h-4 w-4" />}
        />
      </div>

      {/* Row 1: Continue Learning & Daily Goal + Streak */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {continueLesson && (
            <ContinueLearningCard
              lesson={continueLesson}
              progressPercent={continueProgressPercent}
            />
          )}
        </div>
        <div className="space-y-6">
          <DailyGoalCard
            todayMinutes={progress.weekly[6] || 0}
            dailyTargetMinutes={30}
            onAddMinutes={handleAddMinutes}
          />
          <StreakCard
            streakDays={progress.streakDays}
            bestStreak={progress.bestStreakDays ?? progress.streakDays}
          />
        </div>
      </div>

      {/* Row 2: Recent Lessons & Continue Active Project */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentLessonsCard lessons={lessons} masteryMap={progress.mastery} />
        </div>
        <div>
          <ContinueProjectCard project={activeProject} />
        </div>
      </div>

      {/* Row 3: Weekly Progress & Heat Map */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WeeklyProgressCard weeklyMinutes={progress.weekly} />
        </div>
        <div>
          <HeatmapCard heatmapData={progress.heatmap} />
        </div>
      </div>

      {/* Row 4: Recommended Topics */}
      <RecommendedTopicsCard topics={topics} />

      {/* Module Quick Access Grid */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Modules</h2>
          <Link
            suppressHydrationWarning
            to="/learn/modules"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            All modules <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.slice(0, 6).map((m) => {
            const moduleProgress = getModuleProgress(m.id, progress.lessonsCompleted) / 100;
            return (
              <Link
                suppressHydrationWarning
                key={m.id}
                to="/learn/modules/$moduleId"
                params={{ moduleId: m.id }}
                className="group"
              >
                <Card className="h-full border-border/50 bg-card/80 transition duration-200 hover:border-border">
                  <CardContent className="p-5 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-xs font-medium text-muted-foreground">
                            {m.difficulty}
                          </div>
                          <div className="mt-1 text-base font-semibold group-hover:text-primary transition-colors">
                            {m.title}
                          </div>
                        </div>
                        <ProgressRing value={moduleProgress} size={40} />
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {m.description}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/40">
                      <span>
                        {m.lessonCount} lessons · ~{m.estimatedHours}h
                      </span>
                      <span className="inline-flex items-center gap-1 text-primary font-medium">
                        Open Module{" "}
                        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
