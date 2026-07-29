import categoriesData from "@/data/categories.json";
import learningPathsData from "@/data/learning-paths.json";
import modulesData from "@/data/modules.json";
import topicsData from "@/data/topics.json";
import lessonsData from "@/data/lessons.json";
import projectsData from "@/data/projects.json";
import quizzesData from "@/data/quizzes.json";
import flashcardsData from "@/data/flashcards.json";
import achievementsData from "@/data/achievements.json";
import bugsData from "@/data/bugs.json";
import interviewData from "@/data/interview-questions.json";
import resourcesData from "@/data/resources.json";
import type {
  Category,
  LearningPath,
  Module,
  Topic,
  Lesson,
  Project,
  Quiz,
  Flashcard,
  Achievement,
  Bug,
  InterviewQuestion,
  Resource,
} from "../types";

/**
 * ContentProvider — abstracts where lesson data comes from.
 * Today: local JSON. Tomorrow: a fetch to any CMS or AI-generated content.
 * Components should read via hooks (see hooks/use-content.ts).
 */
export interface ContentProvider {
  categories(): Category[];
  learningPaths(): LearningPath[];
  modules(): Module[];
  topics(): Topic[];
  lessons(): Lesson[];
  projects(): Project[];
  quizzes(): Quiz[];
  flashcards(): Flashcard[];
  achievements(): Achievement[];
  bugs(): Bug[];
  interviewQuestions(): InterviewQuestion[];
  resources(): Resource[];
}

export const localContentProvider: ContentProvider = {
  categories: () => categoriesData as Category[],
  learningPaths: () => learningPathsData as LearningPath[],
  modules: () => modulesData as Module[],
  topics: () => topicsData as Topic[],
  lessons: () => lessonsData as Lesson[],
  projects: () => projectsData as Project[],
  quizzes: () => quizzesData as Quiz[],
  flashcards: () => flashcardsData as Flashcard[],
  achievements: () => achievementsData as Achievement[],
  bugs: () => bugsData as Bug[],
  interviewQuestions: () => interviewData as InterviewQuestion[],
  resources: () => resourcesData as Resource[],
};

export const contentProvider: ContentProvider = localContentProvider;
