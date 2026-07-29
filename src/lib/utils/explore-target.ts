import type { Lesson, Topic, Module, LearningPath } from "@/lib/types";

export interface ExploreTargetOptions {
  topicId?: string;
  moduleId?: string;
  pathId?: string;
}

export interface ExploreTargetResult {
  to: string;
  search?: Record<string, string>;
}

/**
  Resolves the direct destination for an Explore action.
  If a matching lesson exists for a topic, module, or learning path,
  navigates directly to /lesson/:lessonId. Otherwise falls back to
  /learn/lessons with search parameters.
 */
export function getExploreTarget(
  lessons: Lesson[],
  topics: Topic[],
  modules: Module[],
  learningPaths: LearningPath[],
  options: ExploreTargetOptions,
): ExploreTargetResult {
  const { topicId, moduleId, pathId } = options;

  if (topicId) {
    const matchingLesson = lessons.find((l) => l.topicId === topicId);
    if (matchingLesson) {
      return { to: `/lesson/${matchingLesson.id}` };
    }
    return { to: "/learn/lessons", search: { topicId } };
  }

  if (moduleId) {
    const moduleTopics = topics.filter((t) => t.moduleId === moduleId).map((t) => t.id);
    const matchingLesson = lessons.find((l) => moduleTopics.includes(l.topicId));
    if (matchingLesson) {
      return { to: `/lesson/${matchingLesson.id}` };
    }
    return { to: "/learn/lessons", search: { moduleId } };
  }

  if (pathId) {
    const path = learningPaths.find((p) => p.id === pathId);
    if (path) {
      const pathModuleIds = path.moduleIds;
      const pathTopics = topics.filter((t) => pathModuleIds.includes(t.moduleId)).map((t) => t.id);
      const matchingLesson = lessons.find((l) => pathTopics.includes(l.topicId));
      if (matchingLesson) {
        return { to: `/lesson/${matchingLesson.id}` };
      }
    }
    return { to: "/learn/lessons", search: { pathId } };
  }

  if (lessons.length > 0) {
    return { to: `/lesson/${lessons[0].id}` };
  }

  return { to: "/learn/lessons" };
}
