import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useProgress } from "@/lib/hooks/use-progress";
import { useModules, useLessons, useProjects, useTopics } from "@/lib/hooks/use-content";
import { getModuleProgress, getTopicProgress } from "@/lib/hooks/use-curriculum";
import { useCurriculumResume } from "@/lib/utils/curriculum-order";

import { HeroStudio } from "@/components/dashboard/hero-studio";
import { LearningLadder } from "@/components/dashboard/learning-ladder";
import { SecondaryWorkspaces } from "@/components/dashboard/secondary-workspaces";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Forge" },
      {
        name: "description",
        content:
          "Your Forge learning studio — continuous curriculum progression and frontend mastery.",
      },
      { property: "og:title", content: "Dashboard · Forge" },
      {
        property: "og:description",
        content: "Your precision engineering studio for frontend mastery.",
      },
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

  const { currentLesson: curriculumContinueLesson } = useCurriculumResume();
  const continueLesson = curriculumContinueLesson || lessons[0];
  const activeProject = projects[0];

  const continueLessonModuleId =
    continueLesson?.moduleId || topics.find((t) => t.id === continueLesson?.topicId)?.moduleId;

  const currentModule = modules.find((m) => m.id === continueLessonModuleId) || modules[0];
  const currentTopic = topics.find((t) => t.id === continueLesson?.topicId);

  const currentModuleLessons = useMemo(() => {
    if (!currentModule) return [];
    const moduleTopics = topics.filter((t) => t.moduleId === currentModule.id);
    const topicIdSet = new Set(moduleTopics.map((t) => t.id));

    const modLessons = lessons.filter(
      (l) => l.moduleId === currentModule.id || (l.topicId && topicIdSet.has(l.topicId)),
    );

    return [...modLessons].sort((a, b) => {
      const topicA = moduleTopics.find((t) => t.id === a.topicId);
      const topicB = moduleTopics.find((t) => t.id === b.topicId);
      const topicOrderA = topicA?.order ?? 0;
      const topicOrderB = topicB?.order ?? 0;
      if (topicOrderA !== topicOrderB) {
        return topicOrderA - topicOrderB;
      }
      return (a.order ?? 0) - (b.order ?? 0);
    });
  }, [currentModule, lessons, topics]);

  const continueProgressPercent = continueLessonModuleId
    ? getModuleProgress(continueLessonModuleId, progress.lessonsCompleted)
    : continueLesson?.topicId
      ? getTopicProgress(continueLesson.topicId, progress.lessonsCompleted)
      : 0;

  const currentStepNumber = Math.max(
    1,
    currentModuleLessons.findIndex((l) => l.id === continueLesson?.id) + 1,
  );

  const isNewLearner = progress.lessonsCompleted.length === 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 pt-2 px-2 sm:px-4">
      {/* 1. Primary Hero Focus Block */}
      {continueLesson && (
        <HeroStudio
          lesson={continueLesson}
          module={currentModule}
          topic={currentTopic}
          moduleLessonsCount={currentModuleLessons.length || 1}
          currentStepNumber={currentStepNumber}
          progressPercent={continueProgressPercent}
          isNewLearner={isNewLearner}
        />
      )}

      {/* 2. Primary Curriculum Roadmap */}
      {currentModule && (
        <LearningLadder
          module={currentModule}
          moduleLessons={currentModuleLessons}
          completedLessonIds={progress.lessonsCompleted}
          currentLessonId={continueLesson?.id}
        />
      )}

      {/* 3. Supporting Workspaces */}
      <SecondaryWorkspaces
        activeProject={activeProject}
        flashcardsDueCount={progress.flashcardStats?.dueCount || 0}
        completedLessonsCount={progress.lessonsCompleted.length}
        streakDays={progress.streakDays}
      />
    </div>
  );
}
