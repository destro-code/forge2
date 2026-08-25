import { useState, useEffect } from "react";
import { useProgressStore } from "@/lib/stores/use-progress-store";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useProgress } from "@/lib/hooks/use-progress";
import {
  useModules,
  useLessons,
  useAchievements,
  useProjects,
  useTopics,
} from "@/lib/hooks/use-content";
import { BookOpen, X, Compass } from "lucide-react";
import { evaluateAchievements } from "@/lib/utils/achievements";

import { ContinueLearningCard } from "@/components/dashboard/continue-learning-card";
import { CompactProgressSummary } from "@/components/dashboard/compact-progress-summary";
import { CurrentPathOverview } from "@/components/dashboard/current-path-overview";
import { RecentLessonsCard } from "@/components/dashboard/recent-lessons-card";
import { RecommendedTopicsCard } from "@/components/dashboard/recommended-topics-card";
import { DailyGoalCard } from "@/components/dashboard/daily-goal-card";
import { ContinueProjectCard } from "@/components/dashboard/continue-project-card";
import { WeeklyProgressCard } from "@/components/dashboard/weekly-progress-card";
import { HeatmapCard } from "@/components/dashboard/heatmap-card";
import { getModuleProgress, getTopicProgress } from "@/lib/hooks/use-curriculum";
import { useCurriculumResume } from "@/lib/utils/curriculum-order";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Forge" },
      {
        name: "description",
        content:
          "Your Forge dashboard — continue learning, track progress, and build frontend mastery.",
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

  const currentModule = modules.find((m) => m.id === continueLessonModuleId) || modules[0];
  const currentTopic = topics.find((t) => t.id === continueLesson?.topicId);

  const currentModuleLessons = lessons.filter((l) => {
    const mId = l.moduleId || topics.find((t) => t.id === l.topicId)?.moduleId;
    return mId === currentModule?.id;
  });

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

  const unlockedAchievementsCount = achievements.filter((a) => a.unlocked).length;
  const isNewLearner = progress.lessonsCompleted.length === 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-8">
      {/* 1. Header / Greeting Context */}
      <PageHeader
        className="mb-0 border-b-0 pb-0"
        eyebrow="Frontend Engineering Academy"
        title={isNewLearner ? "Welcome to Forge" : "Welcome back"}
        description={
          isNewLearner
            ? "Your interactive engineering workbench. Start your journey with your first lesson below."
            : progress.streakDays > 0
              ? `You are on a ${progress.streakDays}-day active learning streak. Continue your path below.`
              : "Continue your frontend engineering curriculum below."
        }
        actions={
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-9 text-xs font-medium border-border/60"
          >
            <Link suppressHydrationWarning to="/learn">
              <BookOpen className="mr-1.5 h-3.5 w-3.5 text-primary" />
              Browse Curriculum
            </Link>
          </Button>
        }
      />

      {/* First-Time Learner Orientation Banner */}
      {showOrientation && (
        <Card className="border-primary/20 bg-card/60 p-4 relative overflow-hidden shadow-xs">
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

          <div className="flex items-start gap-3 pr-8">
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 grid place-items-center shrink-0 text-primary mt-0.5">
              <Compass className="h-4 w-4" />
            </div>
            <div className="space-y-2">
              <div>
                <h3 className="text-xs font-semibold text-foreground">
                  Welcome to Forge — Frontend Mastery Lifecycle
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Progress fluidly through each stage of the engineering mastery curriculum:
                </p>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {[
                  { stage: "START", desc: "Select Path" },
                  { stage: "LEARN", desc: "Lessons" },
                  { stage: "PRACTICE", desc: "Quizzes" },
                  { stage: "BUILD", desc: "Projects" },
                  { stage: "REVIEW", desc: "Cards" },
                  { stage: "MASTER", desc: "Skill Matrix" },
                ].map((s) => (
                  <div
                    key={s.stage}
                    className="p-1.5 rounded-md border border-border/40 bg-background/50 text-center"
                  >
                    <div className="font-bold text-[10px] font-mono text-primary">{s.stage}</div>
                    <div className="text-[9px] text-muted-foreground">{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 2. Primary Continue Learning Hero Experience (Dominant Viewport Centerpiece) */}
      {continueLesson && (
        <section aria-label="Continue Learning">
          <ContinueLearningCard
            lesson={continueLesson}
            progressPercent={continueProgressPercent}
            moduleTitle={currentModule?.title}
            topicTitle={currentTopic?.title}
            isNewLearner={isNewLearner}
          />
        </section>
      )}

      {/* 3. Current Learning Path (Timeline / Active Module Map) */}
      {currentModule && (
        <section aria-label="Current Learning Path">
          <CurrentPathOverview
            module={currentModule}
            moduleLessons={currentModuleLessons}
            completedLessonIds={progress.lessonsCompleted}
            currentLessonId={continueLesson?.id}
          />
        </section>
      )}

      {/* 4. Curriculum Details & Supporting Practice Context */}
      <section aria-label="Curriculum and Studio Practice" className="grid gap-6 lg:grid-cols-3">
        {/* Main 2-Column: Topics & Recent Lessons */}
        <div className="lg:col-span-2 space-y-6">
          <RecommendedTopicsCard topics={topics} />
          <RecentLessonsCard lessons={lessons} masteryMap={progress.mastery} />
        </div>

        {/* Sidebar 1-Column: Progress Summary, Daily Practice & Portfolio Project */}
        <div className="space-y-6">
          <CompactProgressSummary
            streakDays={progress.streakDays}
            bestStreakDays={progress.bestStreakDays ?? progress.streakDays}
            totalHours={(progress.totalMinutes / 60).toFixed(1)}
            completedLessonsCount={progress.lessonsCompleted.length}
            totalLessonsCount={lessons.length}
            unlockedAchievementsCount={unlockedAchievementsCount}
            totalAchievementsCount={achievements.length}
          />
          <DailyGoalCard
            todayMinutes={progress.weekly[6] || 0}
            dailyTargetMinutes={30}
            onAddMinutes={handleAddMinutes}
          />
          {activeProject && <ContinueProjectCard project={activeProject} />}
        </div>
      </section>

      {/* 5. Activity Overview / Trends */}
      <section aria-label="Activity Analytics" className="pt-4 border-t border-border/40">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Study Habits & Activity Log</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Practice history and consistency across recent weeks
            </p>
          </div>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <Link to="/analytics">View Full Analytics →</Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <WeeklyProgressCard weeklyMinutes={progress.weekly} />
          </div>
          <div>
            <HeatmapCard heatmapData={progress.heatmap} />
          </div>
        </div>
      </section>
    </div>
  );
}
