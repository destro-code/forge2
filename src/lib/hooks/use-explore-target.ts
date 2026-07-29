import { useLessons, useTopics, useModules, useLearningPaths } from "@/lib/hooks/use-content";
import {
  getExploreTarget,
  type ExploreTargetOptions,
  type ExploreTargetResult,
} from "@/lib/utils/explore-target";

export function useExploreTarget(options: ExploreTargetOptions): ExploreTargetResult {
  const lessons = useLessons();
  const topics = useTopics();
  const modules = useModules();
  const learningPaths = useLearningPaths();

  return getExploreTarget(lessons, topics, modules, learningPaths, options);
}
