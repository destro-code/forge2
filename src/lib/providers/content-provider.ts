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
  learningPaths: () => {
    const raw = learningPathsData as LearningPath[];
    return [...raw].sort((a, b) => {
      const orderA = "order" in a && typeof a.order === "number" ? a.order : 0;
      const orderB = "order" in b && typeof b.order === "number" ? b.order : 0;
      return orderA - orderB;
    });
  },
  modules: () => {
    const rawModules = modulesData as Module[];
    const rawTopics = topicsData as Topic[];
    const rawLessons = lessonsData as Lesson[];

    const processed = rawModules.map((m) => {
      const moduleTopics = rawTopics.filter((t) => t.moduleId === m.id);
      const moduleTopicIds = new Set(moduleTopics.map((t) => t.id));
      const moduleLessons = rawLessons.filter((l) => moduleTopicIds.has(l.topicId));

      const topicCount = moduleTopics.length;
      const lessonCount = moduleLessons.length;
      const totalMinutes = moduleTopics.reduce((acc, t) => acc + (t.estimatedMinutes || 30), 0);
      const estimatedHours = Math.max(1, Math.round((totalMinutes / 60) * 10) / 10);

      return {
        ...m,
        topicCount,
        lessonCount,
        estimatedHours,
      };
    });

    return processed.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  },
  topics: () => {
    const raw = topicsData as Topic[];
    return [...raw].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  },
  lessons: () => {
    const raw = lessonsData as Lesson[];
    return [...raw].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  },
  projects: () => {
    const raw = projectsData as Project[];
    return [...raw].sort((a, b) => {
      const orderA = "order" in a && typeof a.order === "number" ? a.order : 0;
      const orderB = "order" in b && typeof b.order === "number" ? b.order : 0;
      return orderA - orderB;
    });
  },
  quizzes: () => quizzesData as Quiz[],
  flashcards: () => flashcardsData as Flashcard[],
  achievements: () => achievementsData as Achievement[],
  bugs: () => {
    const raw = bugsData as Bug[];
    return [...raw].sort((a, b) => {
      const orderA = "order" in a && typeof a.order === "number" ? a.order : 0;
      const orderB = "order" in b && typeof b.order === "number" ? b.order : 0;
      return orderA - orderB;
    });
  },
  interviewQuestions: () => {
    const raw = interviewData as InterviewQuestion[];
    return [...raw].sort((a, b) => {
      const orderA = "order" in a && typeof a.order === "number" ? a.order : 0;
      const orderB = "order" in b && typeof b.order === "number" ? b.order : 0;
      return orderA - orderB;
    });
  },
  resources: () => resourcesData as Resource[],
};

export const contentProvider: ContentProvider = localContentProvider;
