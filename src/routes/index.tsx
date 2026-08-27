import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useProgress } from "@/lib/hooks/use-progress";
import { useLessons, useAchievements, useLearningPaths } from "@/lib/hooks/use-content";
import { useCurriculumResume } from "@/lib/utils/curriculum-order";
import { evaluateAchievements } from "@/lib/utils/achievements";

import { JourneyIntro } from "@/components/dashboard/journey-intro";
import {
  PathConstellation,
  type ConstellationNode,
  type NodeStatus,
} from "@/components/dashboard/path-constellation";
import { CurrentFocus } from "@/components/dashboard/current-focus";
import { MomentumPanel } from "@/components/dashboard/momentum-panel";
import { RecentWins, type Win } from "@/components/dashboard/recent-wins";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Forge" },
      {
        name: "description",
        content:
          "Your Forge learning journey — a vertically flowing path from your current focus to proof of work.",
      },
      { property: "og:title", content: "Dashboard · Forge" },
      {
        property: "og:description",
        content: "Shape your craft through deliberate practice.",
      },
    ],
  }),
  component: Dashboard,
});

const TIER_RANK: Record<Win["tier"], number> = {
  platinum: 4,
  gold: 3,
  silver: 2,
  bronze: 1,
};

function Dashboard() {
  const progress = useProgress();
  const lessons = useLessons();
  const achievements = useAchievements();
  const paths = useLearningPaths();

  const { currentLesson, orderedLessons, completedCount, totalLessons } = useCurriculumResume();

  const isNewLearner = progress.lessonsCompleted.length === 0;

  // Path identity — the featured curriculum path.
  const featuredPath = paths.find((p) => p.featured) || paths[0];
  const pathPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  // Constellation window around the active lesson.
  const { nodes, nextLesson } = useMemo(() => {
    if (orderedLessons.length === 0) {
      return { nodes: [] as ConstellationNode[], nextLesson: undefined };
    }
    const activeIndex = Math.max(
      0,
      orderedLessons.findIndex((l) => l.id === currentLesson?.id),
    );
    const windowSize = 6;
    const start = Math.min(
      Math.max(0, activeIndex - 2),
      Math.max(0, orderedLessons.length - windowSize),
    );
    const slice = orderedLessons.slice(start, start + windowSize);
    const completed = new Set(progress.lessonsCompleted);

    const built: ConstellationNode[] = slice.map((lesson) => {
      const gi = orderedLessons.indexOf(lesson);
      let status: NodeStatus;
      if (gi === activeIndex) status = "active";
      else if (completed.has(lesson.id)) status = "mastered";
      else if (gi === activeIndex + 1) status = "available";
      else if (gi > activeIndex + 1) status = "locked";
      else status = "available";
      return {
        key: lesson.id,
        lessonId: lesson.id,
        title: lesson.title,
        status,
      };
    });

    return { nodes: built, nextLesson: orderedLessons[activeIndex + 1] };
  }, [orderedLessons, currentLesson, progress.lessonsCompleted]);

  // Sessions this week (distinct active days over the trailing 7 days).
  const sessionsThisWeek = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 6);
    const startStr = start.toISOString().slice(0, 10);
    return new Set((progress.activityDates || []).filter((d) => d.slice(0, 10) >= startStr)).size;
  }, [progress.activityDates]);

  // Recent wins — unlocked achievements, strongest tiers first.
  const wins = useMemo<Win[]>(() => {
    const evaluated = evaluateAchievements(achievements as never, progress, lessons);
    return evaluated
      .filter((a) => a.unlocked)
      .sort((a, b) => TIER_RANK[b.tier] - TIER_RANK[a.tier])
      .slice(0, 4)
      .map((a) => ({ id: a.id, title: a.title, icon: a.icon, tier: a.tier }));
  }, [achievements, progress, lessons]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-10 pb-16 pt-2 sm:gap-12">
      <JourneyIntro isNewLearner={isNewLearner} />

      {featuredPath && (
        <PathConstellation
          pathDomain="Frontend"
          pathTitle={featuredPath.title}
          percent={pathPercent}
          nodes={nodes}
        />
      )}

      {currentLesson && (
        <CurrentFocus lesson={currentLesson} nextLesson={nextLesson} isNewLearner={isNewLearner} />
      )}

      <MomentumPanel sessionsThisWeek={sessionsThisWeek} weeklyGoal={5} />

      <RecentWins wins={wins} />
    </div>
  );
}
