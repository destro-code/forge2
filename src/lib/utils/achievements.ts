import { getMasteryLabelFromConfidence } from "./mastery";

export interface AchievementCondition {
  type: string;
  threshold?: number;
  moduleId?: string;
  subtype?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  category?: string;
  unlocked?: boolean;
  progress?: number;
  current?: number;
  target?: number;
  unlockedAt?: string;
  condition?: AchievementCondition;
}

export function evaluateAchievements(
  rawAchievements: Achievement[],
  progress: any,
  lessons: any[],
): (Achievement & { unlocked: boolean; progress: number; current: number; target: number })[] {
  // Safe legacy fallback defaults
  const lessonsCompleted = progress?.lessonsCompleted ?? [];
  const streakDays = progress?.streakDays ?? 0;
  const solvedBugs = progress?.solvedBugs ?? [];
  const completedProjects = progress?.completedProjects ?? [];
  const certificates = progress?.certificates ?? [];
  const topicMasteryRecords = progress?.topicMasteryRecords ?? {};
  const flashcardReviews = progress?.flashcardReviews ?? {};
  const interviewResults = progress?.interviewResults ?? [];
  const completedQuizzes = progress?.completedQuizzes ?? [];
  const quizResults = progress?.quizResults ?? [];
  const playgroundCompletions = progress?.playgroundCompletions ?? [];

  const safeLessons = Array.isArray(lessons) ? lessons : [];
  const totalLessons = safeLessons.length > 0 ? safeLessons.length : 1;

  // Helper to calculate module lesson completion
  const getModuleLessonCounts = (modId: string) => {
    const modLessons = safeLessons.filter((l) => l.moduleId === modId);
    const target = modLessons.length || 1;
    const current = modLessons.filter((l) => lessonsCompleted.includes(l.id)).length;
    return { current, target, isComplete: current >= target && modLessons.length > 0 };
  };

  // Pre-calculate completed modules count across all unique moduleIds in lessons
  const allModuleIds = Array.from(new Set(safeLessons.map((l) => l.moduleId).filter(Boolean)));
  const completedModulesCount = allModuleIds.filter(
    (mId) => getModuleLessonCounts(mId).isComplete,
  ).length;

  // Pre-calculate perfect quizzes count (unique quizzes with a 100% score result)
  const perfectQuizIds = new Set(
    (quizResults || [])
      .filter((r: any) => r && (r.scorePercent === 100 || r.score === 100))
      .map((r: any) => r.quizId)
      .filter(Boolean),
  );
  const perfectQuizzesCount = perfectQuizIds.size;

  // Interview questions answered sum
  const interviewQuestionsCount = (interviewResults || []).reduce(
    (acc: number, r: any) =>
      acc + (r && typeof r.questionsAnswered === "number" ? r.questionsAnswered : 1),
    0,
  );

  return rawAchievements.map((a) => {
    if (!a.condition) {
      const isUnlocked = a.unlocked ?? false;
      return {
        ...a,
        unlocked: isUnlocked,
        progress: isUnlocked ? 1 : 0,
        current: isUnlocked ? 1 : 0,
        target: 1,
      };
    }

    let current = 0;
    let target = a.condition.threshold ?? 1;

    switch (a.condition.type) {
      case "lessonsCompleted":
        current = lessonsCompleted.length;
        break;

      case "streakDays":
        current = streakDays;
        break;

      case "solvedBugs":
        current = solvedBugs.length;
        break;

      case "interviewQuestions":
        current = interviewQuestionsCount;
        break;

      case "quizzesCompleted":
        current = completedQuizzes.length;
        break;

      case "perfectQuizzesCount":
        current = perfectQuizzesCount;
        break;

      case "playgroundCompletions":
        current = playgroundCompletions.length;
        break;

      case "curriculumPercent": {
        const percent = Math.round((lessonsCompleted.length / totalLessons) * 100);
        current = percent;
        target = a.condition.threshold ?? 100;
        break;
      }

      case "completedModulesCount":
        current = completedModulesCount;
        break;

      case "moduleLessonsCompleted": {
        if (a.condition.moduleId) {
          const mod = getModuleLessonCounts(a.condition.moduleId);
          current = mod.current;
          target = mod.target;
        } else {
          current = completedModulesCount;
        }
        break;
      }

      case "projectsCompleted":
        current = completedProjects.length;
        break;

      case "flashcardReviews":
        current = Object.values(flashcardReviews).reduce(
          (acc: number, review: any) =>
            acc + (review && typeof review.repetitions === "number" ? review.repetitions : 0),
          0,
        );
        break;

      case "certificatesEarned":
        current = certificates.length;
        break;

      case "masteryCount": {
        const records = Object.values(topicMasteryRecords);
        current = records.filter((r: any) => {
          if (!r) return false;
          const state =
            r.mastery ||
            (typeof r.confidence === "number"
              ? getMasteryLabelFromConfidence(r.confidence)
              : undefined);
          return state === "Mastered" || (typeof r.confidence === "number" && r.confidence >= 80);
        }).length;
        break;
      }

      case "combined": {
        const subtype = a.condition.subtype;
        if (subtype === "tripleThreat") {
          target = 3;
          let metCount = 0;
          if (lessonsCompleted.length >= 5) metCount++;
          if (completedQuizzes.length >= 3) metCount++;
          if (solvedBugs.length >= 3) metCount++;
          current = metCount;
        } else if (subtype === "fullStackLearner") {
          target = 3;
          let metCount = 0;
          if (lessonsCompleted.length >= 25) metCount++;
          if (completedQuizzes.length >= 10) metCount++;
          if (solvedBugs.length >= 5) metCount++;
          current = metCount;
        } else if (subtype === "forgeRegular") {
          target = 4;
          let metCount = 0;
          if (streakDays >= 7) metCount++;
          if (lessonsCompleted.length >= 15) metCount++;
          if (completedQuizzes.length >= 5) metCount++;
          if (solvedBugs.length >= 5) metCount++;
          current = metCount;
        } else if (subtype === "completeDeveloper") {
          target = 4;
          let metCount = 0;
          if (lessonsCompleted.length >= 50) metCount++;
          if (completedQuizzes.length >= 20) metCount++;
          if (solvedBugs.length >= 15) metCount++;
          if (interviewQuestionsCount >= 10) metCount++;
          current = metCount;
        }
        break;
      }

      default:
        current = 0;
        break;
    }

    const isUnlocked = current >= target;
    const progressRatio = target > 0 ? Math.min(1, Math.max(0, current / target)) : 0;

    return {
      ...a,
      unlocked: isUnlocked,
      progress: progressRatio,
      current,
      target,
      unlockedAt: isUnlocked ? a.unlockedAt || "Unlocked" : undefined,
    };
  });
}
