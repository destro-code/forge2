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
  getCategory(id: string): Category | undefined;
  learningPaths(): LearningPath[];
  getLearningPath(id: string): LearningPath | undefined;
  modules(): Module[];
  getModule(id: string): Module | undefined;
  topics(): Topic[];
  getTopic(id: string): Topic | undefined;
  lessons(): Lesson[];
  getLesson(id: string): Lesson | undefined;
  projects(): Project[];
  getProject(id: string): Project | undefined;
  quizzes(): Quiz[];
  getQuiz(id: string): Quiz | undefined;
  flashcards(): Flashcard[];
  achievements(): Achievement[];
  bugs(): Bug[];
  getBug(id: string): Bug | undefined;
  interviewQuestions(): InterviewQuestion[];
  resources(): Resource[];
}

export const localContentProvider: ContentProvider = {
  categories: () => categoriesData as Category[],
  getCategory: (id: string) => (categoriesData as Category[]).find((c) => c.id === id),
  learningPaths: () => {
    const raw = learningPathsData as LearningPath[];
    return [...raw].sort((a, b) => {
      const orderA = "order" in a && typeof a.order === "number" ? a.order : 0;
      const orderB = "order" in b && typeof b.order === "number" ? b.order : 0;
      return orderA - orderB;
    });
  },
  getLearningPath: (id: string) => (learningPathsData as LearningPath[]).find((p) => p.id === id),
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
  getModule: (id: string) => localContentProvider.modules().find((m) => m.id === id),
  topics: () => {
    const raw = topicsData as Topic[];
    return [...raw].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  },
  getTopic: (id: string) => (topicsData as Topic[]).find((t) => t.id === id),
  lessons: () => {
    const raw = lessonsData as Lesson[];
    return [...raw].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  },
  getLesson: (id: string) => (lessonsData as Lesson[]).find((l) => l.id === id),
  projects: () => {
    const raw = projectsData as Project[];
    return [...raw].sort((a, b) => {
      const orderA = "order" in a && typeof a.order === "number" ? a.order : 0;
      const orderB = "order" in b && typeof b.order === "number" ? b.order : 0;
      return orderA - orderB;
    });
  },
  getProject: (id: string) => (projectsData as Project[]).find((p) => p.id === id),
  quizzes: () => quizzesData as Quiz[],
  getQuiz: (id: string) => (quizzesData as Quiz[]).find((q) => q.id === id),
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
  getBug: (id: string) => (bugsData as Bug[]).find((b) => b.id === id),
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

export { canonicalProvider } from "../curriculum/canonical-provider";
