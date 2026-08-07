import learningPathsData from "@/data/learning-paths.json";
import topicsData from "@/data/topics.json";
import lessonsData from "@/data/lessons.json";
import quizzesData from "@/data/quizzes.json";
import type { QuizResultRecord, QuizQuestion, LearningPath } from "@/lib/types";

export interface PathEligibilityResult {
  path: LearningPath | null;
  pathModuleIds: string[];
  pathTopics: typeof topicsData;
  pathLessons: typeof lessonsData;
  pathQuizzes: typeof quizzesData;
  completedLessonsCount: number;
  totalLessonsCount: number;
  passedQuizzesCount: number;
  totalQuizzesCount: number;
  isLessonsComplete: boolean;
  isQuizzesComplete: boolean;
  isEligible: boolean;
  assessmentQuestions: QuizQuestion[];
}

export function checkPathEligibility(
  pathId: string,
  lessonsCompleted: string[] = [],
  quizResults: QuizResultRecord[] = [],
): PathEligibilityResult {
  const path = (learningPathsData as LearningPath[]).find((p) => p.id === pathId) || null;
  if (!path) {
    return {
      path: null,
      pathModuleIds: [],
      pathTopics: [],
      pathLessons: [],
      pathQuizzes: [],
      completedLessonsCount: 0,
      totalLessonsCount: 0,
      passedQuizzesCount: 0,
      totalQuizzesCount: 0,
      isLessonsComplete: false,
      isQuizzesComplete: false,
      isEligible: false,
      assessmentQuestions: [],
    };
  }

  const pathModuleIds = path.moduleIds || [];
  const pathTopics = topicsData.filter((t) => pathModuleIds.includes(t.moduleId));
  const pathTopicIds = new Set(pathTopics.map((t) => t.id));

  const pathLessons = lessonsData.filter(
    (l) => pathModuleIds.includes(l.moduleId) || pathTopicIds.has(l.topicId),
  );

  const pathQuizzes = quizzesData.filter((q) => q.topicId && pathTopicIds.has(q.topicId));

  const completedLessonsCount = pathLessons.filter((l) => lessonsCompleted.includes(l.id)).length;
  const isLessonsComplete =
    pathLessons.length > 0 ? completedLessonsCount === pathLessons.length : true;

  const passedQuizzesCount = pathQuizzes.filter((q) =>
    quizResults.some((r) => (r.quizId === q.id || r.topicId === q.topicId) && r.scorePercent >= 70),
  ).length;

  const isQuizzesComplete =
    pathQuizzes.length > 0 ? passedQuizzesCount === pathQuizzes.length : true;

  const isEligible = isLessonsComplete && isQuizzesComplete;

  const assessmentQuestions = pathQuizzes.flatMap((q) => (q.questions || []) as QuizQuestion[]);

  return {
    path,
    pathModuleIds,
    pathTopics,
    pathLessons,
    pathQuizzes,
    completedLessonsCount,
    totalLessonsCount: pathLessons.length,
    passedQuizzesCount,
    totalQuizzesCount: pathQuizzes.length,
    isLessonsComplete,
    isQuizzesComplete,
    isEligible,
    assessmentQuestions,
  };
}
