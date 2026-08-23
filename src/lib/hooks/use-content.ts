import { contentProvider } from "@/lib/providers/content-provider";
import { useMemo } from "react";

export function useCategories() {
  return useMemo(() => contentProvider.categories(), []);
}
export function useCategory(id: string | undefined) {
  return useMemo(() => contentProvider.categories().find((c) => c.id === id), [id]);
}
export function useLearningPaths() {
  return useMemo(() => contentProvider.learningPaths(), []);
}
export function useLearningPath(id: string | undefined) {
  return useMemo(() => contentProvider.learningPaths().find((p) => p.id === id), [id]);
}
export function useModules() {
  return useMemo(() => contentProvider.modules(), []);
}
export function useModule(id: string | undefined) {
  return useMemo(() => contentProvider.modules().find((m) => m.id === id), [id]);
}
export function useTopics() {
  return useMemo(() => contentProvider.topics(), []);
}
export function useTopic(id: string | undefined) {
  return useMemo(() => contentProvider.topics().find((t) => t.id === id), [id]);
}
export function useLessons() {
  return useMemo(() => contentProvider.lessons(), []);
}
export function useLesson(id: string | undefined) {
  return useMemo(() => contentProvider.lessons().find((l) => l.id === id), [id]);
}
export function useProjects() {
  return useMemo(() => contentProvider.projects(), []);
}
export function useProject(id: string | undefined) {
  return useMemo(() => contentProvider.projects().find((p) => p.id === id), [id]);
}
export function useQuizzes() {
  return useMemo(() => contentProvider.quizzes(), []);
}
export function useQuiz(id: string | undefined) {
  return useMemo(() => contentProvider.quizzes().find((q) => q.id === id), [id]);
}
export function useFlashcards() {
  return useMemo(() => contentProvider.flashcards(), []);
}
export function useAchievements() {
  return useMemo(() => contentProvider.achievements(), []);
}
export function useBugs() {
  return useMemo(() => contentProvider.bugs(), []);
}
export function useBug(id: string | undefined) {
  return useMemo(() => contentProvider.bugs().find((b) => b.id === id), [id]);
}
export function useInterviewQuestions() {
  return useMemo(() => contentProvider.interviewQuestions(), []);
}
export function useResources() {
  return useMemo(() => contentProvider.resources(), []);
}

// ---------------------------------------------------------------------------
// Canonical Learning Architecture Hooks
// ---------------------------------------------------------------------------

import { canonicalProvider } from "@/lib/curriculum/canonical-provider";

export function useAcademy() {
  return useMemo(() => canonicalProvider.getAcademy(), []);
}

export function useLevels() {
  return useMemo(() => canonicalProvider.getLevels(), []);
}

export function useLevel(id: string | undefined) {
  return useMemo(() => (id ? canonicalProvider.getLevel(id) : undefined), [id]);
}

export function useCanonicalLesson(id: string | undefined) {
  return useMemo(() => (id ? canonicalProvider.getLesson(id) : undefined), [id]);
}

export function useGoldenLessons() {
  return useMemo(() => canonicalProvider.getGoldenLessons(), []);
}

export function useConcepts() {
  return useMemo(() => canonicalProvider.getConcepts(), []);
}

export function useConcept(id: string | undefined) {
  return useMemo(() => (id ? canonicalProvider.getConcept(id) : undefined), [id]);
}

export function useSkills() {
  return useMemo(() => canonicalProvider.getSkills(), []);
}

export function useSkill(id: string | undefined) {
  return useMemo(() => (id ? canonicalProvider.getSkill(id) : undefined), [id]);
}

export function useMisconceptions() {
  return useMemo(() => canonicalProvider.getMisconceptions(), []);
}

export function useMisconception(id: string | undefined) {
  return useMemo(() => (id ? canonicalProvider.getMisconception(id) : undefined), [id]);
}
