import { useMemo } from "react";
import { useModules, useTopics, useLessons } from "@/lib/hooks/use-content";
import { useProgress } from "@/lib/hooks/use-progress";
import type { Module, Topic, Lesson } from "@/lib/types";

/**
 * Returns the deterministically ordered global curriculum lesson queue:
 * Module Order -> Topic Order -> Lesson Order.
 */
export function getOrderedCurriculumLessons(
  modules: Module[],
  topics: Topic[],
  lessons: Lesson[],
): Lesson[] {
  const sortedModules = [...modules].sort((a, b) => (a.order || 0) - (b.order || 0));
  const queue: Lesson[] = [];

  sortedModules.forEach((mod) => {
    const modTopics = topics
      .filter((t) => t.moduleId === mod.id)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    modTopics.forEach((top) => {
      const topLessons = lessons
        .filter((l) => l.topicId === top.id || (l.moduleId === mod.id && !l.topicId))
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      queue.push(...topLessons);
    });

    // Also include any lessons belonging to module without topic
    const orphanModuleLessons = lessons
      .filter((l) => l.moduleId === mod.id && !l.topicId && !queue.some((q) => q.id === l.id))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    queue.push(...orphanModuleLessons);
  });

  return queue.length > 0 ? queue : lessons;
}

/**
 * Resolves the appropriate resume lesson for the global curriculum:
 * 1. If lastActiveLessonId is valid, belongs to the curriculum, and is NOT completed, use it.
 * 2. Otherwise, use the first incomplete lesson in the ordered curriculum.
 * 3. If all lessons are completed, fallback to the first curriculum lesson for review.
 */
export function getCurriculumResumeLesson(
  orderedLessons: Lesson[],
  lastActiveLessonId: string | null | undefined,
  lessonsCompleted: string[] = [],
): Lesson | undefined {
  if (orderedLessons.length === 0) return undefined;

  if (lastActiveLessonId) {
    const lastActive = orderedLessons.find((l) => l.id === lastActiveLessonId);
    if (lastActive && !lessonsCompleted.includes(lastActive.id)) {
      return lastActive;
    }
  }

  const firstIncomplete = orderedLessons.find((l) => !lessonsCompleted.includes(l.id));
  return firstIncomplete || orderedLessons[0];
}

/**
 * React hook providing the active curriculum resume lesson and ordered queue.
 */
export function useCurriculumResume() {
  const modules = useModules();
  const topics = useTopics();
  const lessons = useLessons();
  const { lessonsCompleted, lastActiveLessonId } = useProgress();

  const orderedLessons = useMemo(() => {
    return getOrderedCurriculumLessons(modules, topics, lessons);
  }, [modules, topics, lessons]);

  const currentLesson = useMemo(() => {
    return getCurriculumResumeLesson(orderedLessons, lastActiveLessonId, lessonsCompleted);
  }, [orderedLessons, lastActiveLessonId, lessonsCompleted]);

  const completedCount = useMemo(() => {
    return orderedLessons.filter((l) => lessonsCompleted.includes(l.id)).length;
  }, [orderedLessons, lessonsCompleted]);

  const isCompleted = orderedLessons.length > 0 && completedCount === orderedLessons.length;
  const isReturningLearner = lessonsCompleted.length > 0 || !!lastActiveLessonId;

  return {
    modules,
    topics,
    lessons,
    orderedLessons,
    currentLesson,
    completedCount,
    totalLessons: orderedLessons.length,
    isCompleted,
    isReturningLearner,
  };
}
