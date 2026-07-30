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

  // Level 2 -> Level 3: Topic Explore routes to Topic Lesson Catalog
  if (topicId) {
    return { to: "/learn/lessons", search: { topicId } };
  }

  // Level 1 -> Level 2: Module Explore routes to Module Chapter Topics Hub
  if (moduleId) {
    return { to: "/learn/topics", search: { moduleId } };
  }

  // Path Explore -> Level 1: Learning Path Explore routes to Module Pillars
  if (pathId) {
    return { to: "/learn/modules", search: { pathId } };
  }

  return { to: "/learn" };
}
