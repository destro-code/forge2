import { getMasteryLabelFromConfidence } from "./mastery";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  unlocked?: boolean;
  progress?: number;
  current?: number;
  target?: number;
  unlockedAt?: string;
  condition?: {
    type: string;
    threshold?: number;
    moduleId?: string;
  };
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
        // Safely aggregate answered question counts from the actual interview session result schema
        current = interviewResults.reduce(
          (acc: number, r: any) =>
            acc + (r && typeof r.questionsAnswered === "number" ? r.questionsAnswered : 1),
          0,
        );
        break;

      case "moduleLessonsCompleted": {
        const moduleLessons = lessons.filter((l) => l.moduleId === a.condition?.moduleId);
        target = moduleLessons.length || 1;
        current = moduleLessons.filter((l) => lessonsCompleted.includes(l.id)).length;
        break;
      }

      case "projectsCompleted":
        current = completedProjects.length;
        break;

      case "flashcardReviews":
        // Unique lifetime history: Sum of repetitions across all card states to avoid treating daily metrics as lifetime review history
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
          return state === "Mastered";
        }).length;
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
