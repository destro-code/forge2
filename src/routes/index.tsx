import { createFileRoute } from "@tanstack/react-router";
import { useProgress } from "@/lib/hooks/use-progress";
import { useModules, useLessons, useProjects, useTopics } from "@/lib/hooks/use-content";
import { getModuleProgress, getTopicProgress } from "@/lib/hooks/use-curriculum";
import { useCurriculumResume } from "@/lib/utils/curriculum-order";

import { HeroStudio } from "@/components/dashboard/hero-studio";
import { LearningLadder } from "@/components/dashboard/learning-ladder";
import { SecondaryWorkspaces } from "@/components/dashboard/secondary-workspaces";
import { MobileStickyAction } from "@/components/dashboard/mobile-sticky-action";

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

  const currentModuleLessons = lessons.filter((l) => {
    const mId = l.moduleId || topics.find((t) => t.id === l.topicId)?.moduleId;
    return mId === currentModule?.id;
  });

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
    <div className="space-y-8 max-w-5xl mx-auto pb-12 pt-2 px-2 sm:px-4">
      {/* 1. Primary Hero Studio Monolith (Dominant Viewport Centerpiece) */}
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

      {/* 2. Frameless Learning Ladder (Structural Curriculum Progression) */}
      {currentModule && (
        <LearningLadder
          module={currentModule}
          moduleLessons={currentModuleLessons}
          completedLessonIds={progress.lessonsCompleted}
          currentLessonId={continueLesson?.id}
        />
      )}

      {/* 3. Quiet Secondary Studio Workspaces */}
      <SecondaryWorkspaces
        activeProject={activeProject}
        flashcardsDueCount={progress.flashcardStats?.dueCount || 0}
        completedLessonsCount={progress.lessonsCompleted.length}
        streakDays={progress.streakDays}
      />

      {/* 4. Mobile Thumb-Accessible Sticky Action Bar */}
      {continueLesson && <MobileStickyAction lesson={continueLesson} isNewLearner={isNewLearner} />}
    </div>
  );
}
