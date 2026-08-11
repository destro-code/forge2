import type { ProgressState, Lesson } from "@/lib/types";
import { getReadinessAnalytics, getPillarRadarAnalytics } from "../analytics/progress-analytics";
import { getMasteryLabelFromConfidence } from "./mastery";
import { evaluateAchievements } from "./achievements";

export interface CompactMentorContext {
  readiness: {
    score: number;
    tier: string;
  };
  pillars: {
    name: string;
    score: number;
  }[];
  mastery: {
    totalTrackedTopics: number;
    interviewReadyCount: number;
    masteredCount: number;
    weakestTopics: {
      topicId: string;
      confidence: number;
      mastery: string;
    }[];
  };
  learning: {
    lessonsCompleted: number;
    solvedBugs: number;
    completedProjects: number;
    streakDays: number;
    xp: number;
  };
  quizzes: {
    attempts: number;
    averageScore: number;
    recentScores: { quizId: string; scorePercent: number; completedAt: string }[];
  };
  interviews: {
    completed: number;
    averageScore: number;
  };
  achievements: {
    unlockedCount: number;
    totalCount: number;
    inProgress: {
      title: string;
      progressPercent: number;
      current: number;
      target: number;
    }[];
  };
  recentActivity: {
    type: string;
    id: string;
    timestamp: string;
    title?: string;
    details?: any;
  }[];
  currentContext: {
    lastActiveLessonId?: string;
    currentMode: string;
  };
}

export function buildMentorContext(
  progress: ProgressState,
  lessons: Lesson[],
  rawAchievements: any[],
  currentMode: string,
): CompactMentorContext {
  // Safe legacy fallback defaults
  const topicMasteryRecords = progress?.topicMasteryRecords ?? {};
  const lessonsCompleted = progress?.lessonsCompleted ?? [];
  const solvedBugs = progress?.solvedBugs ?? [];
  const completedProjects = progress?.completedProjects ?? [];
  const streakDays = progress?.streakDays ?? 0;
  const xp = progress?.xp ?? 0;
  const quizResults = progress?.quizResults ?? [];
  const interviewResults = progress?.interviewResults ?? [];
  const whiteboardSnapshots = progress?.whiteboardSnapshots ?? [];
  const playgroundCompletions = progress?.playgroundCompletions ?? [];
  const certificates = progress?.certificates ?? [];
  const flashcardReviews = progress?.flashcardReviews ?? {};

  // 1. Readiness & Pillars
  const readinessAnalytics = getReadinessAnalytics(progress);
  const radarAnalytics = getPillarRadarAnalytics(progress);

  const pillars = radarAnalytics.pillars.map((p) => ({
    name: p.name,
    score: p.score,
  }));

  // 2. Mastery details
  const masteredCount = Object.values(topicMasteryRecords).filter((r: any) => {
    if (!r) return false;
    const state =
      r.mastery ||
      (typeof r.confidence === "number" ? getMasteryLabelFromConfidence(r.confidence) : undefined);
    return state === "Mastered";
  }).length;

  const records = Object.entries(topicMasteryRecords);
  const sortedRecords = records
    .filter(([_, r]: any) => r && typeof r.confidence === "number")
    .sort((a: any, b: any) => {
      const diff = a[1].confidence - b[1].confidence;
      if (diff !== 0) return diff;
      return a[0].localeCompare(b[0]);
    });

  const weakestTopics = sortedRecords.slice(0, 4).map(([topicId, r]: any) => ({
    topicId,
    confidence: r.confidence,
    mastery: r.mastery || getMasteryLabelFromConfidence(r.confidence),
  }));

  // 3. Quiz statistics
  const quizTotalScore = quizResults.reduce((acc, q) => acc + (q.scorePercent ?? 0), 0);
  const quizAvgScore = quizResults.length > 0 ? Math.round(quizTotalScore / quizResults.length) : 0;
  const recentQuizScores = [...quizResults]
    .filter((q) => q.completedAt)
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .slice(0, 3)
    .map((q) => ({
      quizId: q.quizId,
      scorePercent: q.scorePercent,
      completedAt: q.completedAt,
    }));

  // 4. Interview statistics
  const interviewTotalScore = interviewResults.reduce((acc, i) => acc + (i.scorePercent ?? 0), 0);
  const interviewAvgScore =
    interviewResults.length > 0 ? Math.round(interviewTotalScore / interviewResults.length) : 0;

  // 5. Achievements
  const achievementsList = evaluateAchievements(rawAchievements, progress, lessons);
  const unlockedAchievementsCount = achievementsList.filter((a) => a.unlocked).length;
  const inProgressAchievements = achievementsList
    .filter((a) => !a.unlocked)
    .slice(0, 3)
    .map((a) => ({
      title: a.title,
      progressPercent: Math.round((a.progress ?? 0) * 100),
      current: a.current ?? 0,
      target: a.target ?? 1,
    }));

  // 6. Recent Activity Streams with strictly authoritative timestamps only
  const activities: any[] = [];

  quizResults.forEach((q) => {
    if (q.completedAt) {
      activities.push({
        type: "quiz",
        id: q.quizId,
        timestamp: q.completedAt,
        details: { score: q.scorePercent },
      });
    }
  });

  if (Array.isArray(progress?.journalEntries)) {
    progress.journalEntries.forEach((j) => {
      if (j.createdAt) {
        activities.push({
          type: "journal",
          id: j.id,
          title: j.title,
          timestamp: j.createdAt,
        });
      }
    });
  }

  interviewResults.forEach((i) => {
    if (i.completedAt) {
      activities.push({
        type: "interview",
        id: i.questionId || i.id,
        timestamp: i.completedAt,
        details: { score: i.scorePercent },
      });
    }
  });

  playgroundCompletions.forEach((p) => {
    if (p.completedAt) {
      activities.push({
        type: "playground",
        id: p.templateId || p.id,
        timestamp: p.completedAt,
      });
    }
  });

  whiteboardSnapshots.forEach((w) => {
    const ts = w.updatedAt || w.updatedAt; // use actual string
    if (ts) {
      activities.push({
        type: "whiteboard",
        id: w.id,
        title: w.title,
        timestamp: ts,
      });
    }
  });

  certificates.forEach((c) => {
    if (c.issuedAt) {
      activities.push({
        type: "certificate",
        id: c.id,
        title: c.pathTitle,
        timestamp: c.issuedAt,
      });
    }
  });

  Object.entries(flashcardReviews).forEach(([cardId, review]: any) => {
    if (review && review.lastReviewedAt) {
      activities.push({
        type: "flashcard",
        id: cardId,
        timestamp: review.lastReviewedAt,
        details: { rating: review.lastRating },
      });
    }
  });

  const recentActivity = activities
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 6);

  return {
    readiness: {
      score: readinessAnalytics.overallReadinessPercent,
      tier: readinessAnalytics.tier,
    },
    pillars,
    mastery: {
      totalTrackedTopics: readinessAnalytics.totalTrackedTopics,
      interviewReadyCount: readinessAnalytics.interviewReadyCount,
      masteredCount,
      weakestTopics,
    },
    learning: {
      lessonsCompleted: lessonsCompleted.length,
      solvedBugs: solvedBugs.length,
      completedProjects: completedProjects.length,
      streakDays,
      xp,
    },
    quizzes: {
      attempts: quizResults.length,
      averageScore: quizAvgScore,
      recentScores: recentQuizScores,
    },
    interviews: {
      completed: interviewResults.length,
      averageScore: interviewAvgScore,
    },
    achievements: {
      unlockedCount: unlockedAchievementsCount,
      totalCount: achievementsList.length,
      inProgress: inProgressAchievements,
    },
    recentActivity,
    currentContext: {
      lastActiveLessonId: progress?.lastActiveLessonId,
      currentMode,
    },
  };
}
