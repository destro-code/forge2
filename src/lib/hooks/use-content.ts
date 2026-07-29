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
