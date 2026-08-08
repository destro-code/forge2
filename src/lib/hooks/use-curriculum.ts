import { useState, useMemo } from "react";
import {
  useCategories,
  useLearningPaths,
  useModules,
  useTopics,
  useLessons,
} from "@/lib/hooks/use-content";
import { useProgress } from "@/lib/hooks/use-progress";
import { contentProvider } from "@/lib/providers/content-provider";
import type { CurriculumFilter, Difficulty, Module, Topic, LearningPath } from "@/lib/types";

export interface CurriculumStats {
  totalModules: number;
  totalTopics: number;
  totalLessons: number;
  completedLessonsCount: number;
  overallProgress: number; // 0 to 100
  totalHours: number;
}

export function getTopicProgress(topicId: string, lessonsCompleted: string[] = []): number {
  if (!topicId) return 0;
  const allLessons = contentProvider.lessons();
  const topicLessons = allLessons.filter((l) => l.topicId === topicId);
  if (topicLessons.length === 0) return 0;
  const completedCount = topicLessons.filter((l) => lessonsCompleted.includes(l.id)).length;
  return Math.round((completedCount / topicLessons.length) * 100);
}

export function getModuleProgress(moduleId: string, lessonsCompleted: string[] = []): number {
  if (!moduleId) return 0;
  const allTopics = contentProvider.topics();
  const moduleTopics = allTopics.filter((t) => t.moduleId === moduleId);
  if (moduleTopics.length === 0) return 0;
  const moduleTopicIds = new Set(moduleTopics.map((t) => t.id));
  const allLessons = contentProvider.lessons();
  const moduleLessons = allLessons.filter((l) => moduleTopicIds.has(l.topicId));
  if (moduleLessons.length === 0) return 0;
  const completedCount = moduleLessons.filter((l) => lessonsCompleted.includes(l.id)).length;
  return Math.round((completedCount / moduleLessons.length) * 100);
}

export function useCurriculum(initialFilter?: CurriculumFilter) {
  const categories = useCategories();
  const learningPaths = useLearningPaths();
  const rawModules = useModules();
  const rawTopics = useTopics();
  const allLessons = useLessons();
  const progress = useProgress();

  const [filter, setFilterState] = useState<CurriculumFilter>({
    query: "",
    categoryId: "all",
    difficulty: "All",
    pathId: "all",
    tag: "all",
    progressStatus: "All",
    ...initialFilter,
  });

  const setFilter = (updates: Partial<CurriculumFilter>) => {
    setFilterState((prev) => ({ ...prev, ...updates }));
  };

  const resetFilter = () => {
    setFilterState({
      query: "",
      categoryId: "all",
      difficulty: "All",
      pathId: "all",
      tag: "all",
      progressStatus: "All",
    });
  };

  // Derive dynamic progress for all modules
  const allModules = useMemo(() => {
    return rawModules.map((m) => {
      const pPercent = getModuleProgress(m.id, progress.lessonsCompleted);
      return {
        ...m,
        progress: pPercent / 100, // 0 to 1 for ProgressRing
        progressPercent: pPercent, // 0 to 100
      };
    });
  }, [rawModules, progress.lessonsCompleted]);

  // Derive dynamic progress for all topics
  const allTopics = useMemo(() => {
    return rawTopics.map((t) => {
      const pPercent = getTopicProgress(t.id, progress.lessonsCompleted);
      return {
        ...t,
        progress: pPercent / 100,
        progressPercent: pPercent,
      };
    });
  }, [rawTopics, progress.lessonsCompleted]);

  // Filter modules
  const filteredModules = useMemo(() => {
    return allModules.filter((m) => {
      // Query search
      if (filter.query && filter.query.trim() !== "") {
        const q = filter.query.toLowerCase().trim();
        const matchesTitle = m.title.toLowerCase().includes(q);
        const matchesDesc = m.description.toLowerCase().includes(q);
        const matchesTags = m.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesTags) return false;
      }

      // Category filter
      if (filter.categoryId && filter.categoryId !== "all" && m.categoryId !== filter.categoryId) {
        return false;
      }

      // Difficulty filter
      if (filter.difficulty && filter.difficulty !== "All" && m.difficulty !== filter.difficulty) {
        return false;
      }

      // Learning Path filter
      if (filter.pathId && filter.pathId !== "all") {
        if (!m.pathIds || !m.pathIds.includes(filter.pathId)) return false;
      }

      // Tag filter
      if (filter.tag && filter.tag !== "all" && !m.tags.includes(filter.tag)) {
        return false;
      }

      // Progress status filter
      if (filter.progressStatus && filter.progressStatus !== "All") {
        const pPercent = m.progressPercent;
        if (filter.progressStatus === "Completed" && pPercent < 100) return false;
        if (filter.progressStatus === "In Progress" && (pPercent === 0 || pPercent === 100))
          return false;
        if (filter.progressStatus === "Not Started" && pPercent > 0) return false;
      }

      return true;
    });
  }, [allModules, filter]);

  // Filter topics
  const filteredTopics = useMemo(() => {
    return allTopics.filter((t) => {
      if (filter.query && filter.query.trim() !== "") {
        const q = filter.query.toLowerCase().trim();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesDesc = t.description.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }
      if (filter.categoryId && filter.categoryId !== "all" && t.categoryId !== filter.categoryId) {
        return false;
      }
      if (filter.difficulty && filter.difficulty !== "All" && t.difficulty !== filter.difficulty) {
        return false;
      }
      return true;
    });
  }, [allTopics, filter]);

  // Compute curriculum overview stats
  const stats: CurriculumStats = useMemo(() => {
    const totalModules = allModules.length;
    const totalTopics = allTopics.length;
    const totalLessons = allLessons.length;
    const completedLessonsCount = progress.lessonsCompleted.length;
    const overallProgress =
      totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0;
    const totalHours = allModules.reduce((acc, m) => acc + m.estimatedHours, 0);

    return {
      totalModules,
      totalTopics,
      totalLessons,
      completedLessonsCount,
      overallProgress,
      totalHours,
    };
  }, [allModules, allTopics, allLessons, progress.lessonsCompleted]);

  // All unique tags across modules
  const allTags = useMemo(() => {
    const set = new Set<string>();
    allModules.forEach((m) => m.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [allModules]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filter.query && filter.query.trim() !== "") count++;
    if (filter.categoryId && filter.categoryId !== "all") count++;
    if (filter.difficulty && filter.difficulty !== "All") count++;
    if (filter.pathId && filter.pathId !== "all") count++;
    if (filter.tag && filter.tag !== "all") count++;
    if (filter.progressStatus && filter.progressStatus !== "All") count++;
    return count;
  }, [filter]);

  return {
    categories,
    learningPaths,
    modules: filteredModules,
    allModules,
    topics: filteredTopics,
    allTopics,
    allTags,
    filter,
    setFilter,
    resetFilter,
    stats,
    activeFiltersCount,
  };
}
