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
  useTopics,
} from "@/lib/hooks/use-content";
import { Flame, Clock, BookOpen, Trophy, ChevronRight, ArrowRight, X, Compass } from "lucide-react";
import { evaluateAchievements } from "@/lib/utils/achievements";

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
import { useCurriculumResume } from "@/lib/utils/curriculum-order";

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
  const topics = useTopics();
  const rawAchievements = useAchievements();
  const achievements = evaluateAchievements(rawAchievements, progress, lessons);

  const [showOrientation, setShowOrientation] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem("forge_orientation_dismissed");
    if (!isDismissed && progress.lessonsCompleted.length < 5) {
      setShowOrientation(true);
    }
  }, [progress.lessonsCompleted.length]);

  const { currentLesson: curriculumContinueLesson } = useCurriculumResume();
  const continueLesson = curriculumContinueLesson || lessons[0];
  const activeProject = projects[0];

  const continueLessonModuleId =
    continueLesson?.moduleId || topics.find((t) => t.id === continueLesson?.topicId)?.moduleId;

  const currentModule = modules.find((m) => m.id === continueLessonModuleId);
  const currentTopic = topics.find((t) => t.id === continueLesson?.topicId);

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
    <div className="space-y-8">
      <PageHeader
        className="mb-0"
        eyebrow="Your learning workspace"
        title="Keep building your frontend skills"
        description={`You're on a ${progress.streakDays}-day streak. Pick up where you left off and keep the momentum going.`}
        actions={
          <Button asChild variant="outline" size="sm" className="h-9 px-3 text-sm">
            <Link suppressHydrationWarning to="/learn">
              <BookOpen className="mr-1.5 h-4 w-4" />
              Browse library
            </Link>
          </Button>
        }
      />

      {showOrientation && (
        <Card className="relative border-border/60 bg-card shadow-none">
          <button
            onClick={() => {
              localStorage.setItem("forge_orientation_dismissed", "true");
              setShowOrientation(false);
            }}
            className="absolute right-3 top-3 rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Dismiss orientation"
          >
            <X className="h-4 w-4" />
          </button>
          <CardContent className="flex items-start gap-4 p-5 pr-12">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <Compass className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold">How Forge works</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                Learn concepts, practice them, build projects, and review what you have mastered.
              </p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                {[
                  ["01", "Learn"],
                  ["02", "Practice"],
                  ["03", "Build"],
                  ["04", "Review"],
                  ["05", "Master"],
                ].map(([step, label]) => (
                  <span key={step} className="inline-flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-primary">{step}</span>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {continueLesson && (
        <section aria-labelledby="continue-learning-heading">
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Up next
              </p>
              <h2 id="continue-learning-heading" className="mt-1 text-xl font-semibold tracking-tight">
                Continue learning
              </h2>
            </div>
            <Link
              suppressHydrationWarning
              to="/learn"
              className="hidden items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              View library <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <ContinueLearningCard
            lesson={continueLesson}
            progressPercent={continueProgressPercent}
            moduleTitle={currentModule?.title}
            topicTitle={currentTopic?.title}
          />
        </section>
      )}

      <section aria-labelledby="progress-heading">
        <div className="mb-3">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">At a glance</p>
          <h2 id="progress-heading" className="mt-1 text-lg font-semibold tracking-tight">Your progress</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
      </section>

      <section aria-labelledby="learning-activity-heading" className="space-y-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Keep moving</p>
          <h2 id="learning-activity-heading" className="mt-1 text-lg font-semibold tracking-tight">Learning activity</h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecentLessonsCard lessons={lessons} masteryMap={progress.mastery} />
          </div>
          <div className="space-y-6">
            <DailyGoalCard
              todayMinutes={progress.weekly[6] || 0}
              dailyTargetMinutes={30}
              onAddMinutes={handleAddMinutes}
            />
            {activeProject && <ContinueProjectCard project={activeProject} />}
          </div>
        </div>
      </section>

      <section aria-labelledby="progress-trends-heading">
        <div className="mb-3">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Consistency</p>
          <h2 id="progress-trends-heading" className="mt-1 text-lg font-semibold tracking-tight">Your rhythm</h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <WeeklyProgressCard weeklyMinutes={progress.weekly} />
          </div>
          <div>
            <StreakCard
              streakDays={progress.streakDays}
              bestStreak={progress.bestStreakDays ?? progress.streakDays}
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="recommended-heading">
        <div className="mb-3">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Explore</p>
          <h2 id="recommended-heading" className="mt-1 text-lg font-semibold tracking-tight">Recommended for you</h2>
        </div>
        <RecommendedTopicsCard topics={topics} />
      </section>

      <section aria-labelledby="modules-heading">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Curriculum</p>
            <h2 id="modules-heading" className="mt-1 text-lg font-semibold tracking-tight">Modules</h2>
          </div>
          <Link
            suppressHydrationWarning
            to="/learn/modules"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            All modules <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {modules.slice(0, 6).map((m) => {
            const moduleProgress = getModuleProgress(m.id, progress.lessonsCompleted) / 100;
            return (
              <Link
                suppressHydrationWarning
                key={m.id}
                to="/learn/modules/$moduleId"
                params={{ moduleId: m.id }}
                className="group min-w-0"
              >
                <Card className="h-full border-border/50 bg-card transition-colors duration-200 hover:border-border">
                  <CardContent className="flex h-full flex-col justify-between p-5">
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-muted-foreground">{m.difficulty}</div>
                          <div className="mt-1 text-base font-semibold transition-colors group-hover:text-primary">
                            {m.title}
                          </div>
                        </div>
                        <ProgressRing value={moduleProgress} size={40} />
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm leading-5 text-muted-foreground">{m.description}</p>
                    </div>
                    <div className="mt-5 flex items-center justify-between border-t border-border/40 pt-3 text-xs text-muted-foreground">
                      <span>{m.lessonCount} lessons · ~{m.estimatedHours}h</span>
                      <span className="inline-flex items-center gap-1 font-medium text-primary">
                        Open <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <section aria-label="Learning history" className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <HeatmapCard heatmapData={progress.heatmap} />
        </div>
        <div>
          <ContinueProjectCard project={activeProject} />
        </div>
      </section>
    </div>
  );
}
