import type { ProgressState, QuizResultRecord, Quiz, Topic, Category, Lesson } from "@/lib/types";

export interface ResolvedQuizAttempt {
  id: string;
  quizId: string;
  quizName: string;
  category: string;
  score: number;
  date: string;
  completedAt: string;
}

export interface QuizScoreDistribution {
  range: string;
  count: number;
  fill: string;
}

export interface QuizAnalyticsResult {
  hasQuizData: boolean;
  totalQuizzesTaken: number;
  avgQuizAccuracy: number | null;
  quizHistory: ResolvedQuizAttempt[];
  scoreDistribution: QuizScoreDistribution[];
}

export interface CategoryAccuracyItem {
  category: string;
  accuracy: number;
  totalAttempts: number;
}

export interface CategoryAccuracyResult {
  hasCategoryData: boolean;
  categories: CategoryAccuracyItem[];
}

export interface CategoryTimePieItem {
  name: string;
  value: number;
  count: number;
  color: string;
}

export interface CategoryActivityResult {
  hasActivityData: boolean;
  categoryPie: CategoryTimePieItem[];
}

export interface MonthlyActivityPoint {
  month: string;
  JavaScript: number;
  React: number;
  CSS: number;
  TypeScript: number;
  Performance: number;
  total: number;
}

export interface MonthlyActivityTrendResult {
  hasTrendData: boolean;
  monthlyTrend: MonthlyActivityPoint[];
}

export interface WeeklyAccuracyPoint {
  week: string;
  quizAccuracy: number;
  bugFixAccuracy?: number;
  overall: number;
}

export interface WeeklyAccuracyTrendResult {
  hasTrendData: boolean;
  trend: WeeklyAccuracyPoint[];
}

export interface ReadinessAnalyticsResult {
  overallReadinessPercent: number;
  interviewReadyCount: number;
  totalTrackedTopics: number;
  tier: string;
}

export interface PillarRadarItem {
  pillar: string;
  name: string;
  score: number;
  fullMark: number;
}

export interface PillarRadarResult {
  hasRadarData: boolean;
  pillars: PillarRadarItem[];
}

// Category color map matching design tokens
const CATEGORY_COLORS: Record<string, string> = {
  JavaScript: "var(--color-chart-1, #3b82f6)",
  React: "var(--color-chart-2, #06b6d4)",
  CSS: "var(--color-chart-3, #10b981)",
  "CSS Layout": "var(--color-chart-3, #10b981)",
  TypeScript: "var(--color-chart-4, #8b5cf6)",
  Performance: "var(--color-chart-5, #f59e0b)",
  "System Design": "var(--color-chart-6, #ec4899)",
  Other: "var(--color-chart-muted, #6b7280)",
};

/**
 * Normalizes a raw category name or categoryId to one of the standard short category names.
 */
export function normalizeCategoryName(catNameOrId?: string): string {
  if (!catNameOrId) return "Other";
  const lower = catNameOrId.toLowerCase();
  if (
    lower.includes("javascript") ||
    lower.includes("js") ||
    lower === "language-mastery" ||
    lower.includes("language systems")
  ) {
    return "JavaScript";
  }
  if (lower.includes("react") || lower.includes("framework") || lower.includes("atom")) {
    return "React";
  }
  if (
    lower.includes("css") ||
    lower.includes("style") ||
    lower === "core-web" ||
    lower.includes("core web foundations")
  ) {
    return "CSS Layout";
  }
  if (lower.includes("typescript") || lower.includes("ts")) {
    return "TypeScript";
  }
  if (
    lower.includes("performance") ||
    lower.includes("speed") ||
    lower === "quality-perf" ||
    lower.includes("quality, testing & performance")
  ) {
    return "Performance";
  }
  if (lower.includes("system") || lower.includes("architecture") || lower === "architecture") {
    return "System Design";
  }
  return "Other";
}

/**
 * Safe date formatter for quiz/activity logs (e.g., "Jul 24" or "2026-07-24").
 */
function formatDateLabel(isoString?: string): string {
  if (!isoString) return "N/A";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return isoString;
  }
}

/**
 * Calculates quiz analytics from progress.quizResults.
 */
export function getQuizAnalytics(
  progress: ProgressState,
  quizzes: Quiz[] = [],
  topics: Topic[] = [],
): QuizAnalyticsResult {
  const quizResults: QuizResultRecord[] = progress.quizResults || [];

  if (quizResults.length === 0) {
    return {
      hasQuizData: false,
      totalQuizzesTaken: 0,
      avgQuizAccuracy: null,
      quizHistory: [],
      scoreDistribution: [
        { range: "90-100%", count: 0, fill: "#10b981" },
        { range: "80-89%", count: 0, fill: "#3b82f6" },
        { range: "70-79%", count: 0, fill: "#f59e0b" },
        { range: "< 70%", count: 0, fill: "#f43f5e" },
      ],
    };
  }

  // Calculate average accuracy
  const totalScore = quizResults.reduce((acc, q) => acc + (q.scorePercent || 0), 0);
  const avgQuizAccuracy = Math.round(totalScore / quizResults.length);

  // Map quiz attempts with resolved metadata
  const quizHistory: ResolvedQuizAttempt[] = quizResults
    .map((r) => {
      const quizObj = quizzes.find((q) => q.id === r.quizId);
      const topicObj = topics.find((t) => t.id === r.topicId || t.id === quizObj?.topicId);

      let quizName = quizObj?.title;
      if (!quizName && topicObj?.title) {
        quizName = `${topicObj.title} Quiz`;
      }
      if (!quizName) {
        // Fallback: format quiz ID cleanly without fabricating mock names
        const cleanId = r.quizId.replace(/^quiz-/, "").replace(/[-_]/g, " ");
        quizName = cleanId.charAt(0).toUpperCase() + cleanId.slice(1) + " Quiz";
      }

      const rawCat = quizObj?.category || topicObj?.categoryId || "Other";
      const category = normalizeCategoryName(rawCat);

      return {
        id: r.id,
        quizId: r.quizId,
        quizName,
        category,
        score: Math.round(r.scorePercent || 0),
        date: formatDateLabel(r.completedAt),
        completedAt: r.completedAt || "",
      };
    })
    .sort((a, b) => (b.completedAt > a.completedAt ? 1 : -1));

  // Score distribution brackets
  let count90Plus = 0;
  let count80To89 = 0;
  let count70To79 = 0;
  let countUnder70 = 0;

  for (const item of quizResults) {
    const s = item.scorePercent || 0;
    if (s >= 90) count90Plus++;
    else if (s >= 80) count80To89++;
    else if (s >= 70) count70To79++;
    else countUnder70++;
  }

  const scoreDistribution: QuizScoreDistribution[] = [
    { range: "90-100%", count: count90Plus, fill: "#10b981" },
    { range: "80-89%", count: count80To89, fill: "#3b82f6" },
    { range: "70-79%", count: count70To79, fill: "#f59e0b" },
    { range: "< 70%", count: countUnder70, fill: "#f43f5e" },
  ];

  return {
    hasQuizData: true,
    totalQuizzesTaken: quizResults.length,
    avgQuizAccuracy,
    quizHistory,
    scoreDistribution,
  };
}

/**
 * Group actual quiz results by category and compute category accuracy.
 */
export function getCategoryAccuracyAnalytics(
  progress: ProgressState,
  quizzes: Quiz[] = [],
  topics: Topic[] = [],
): CategoryAccuracyResult {
  const quizResults = progress.quizResults || [];
  if (quizResults.length === 0) {
    return {
      hasCategoryData: false,
      categories: [],
    };
  }

  const catMap: Record<string, { totalScore: number; count: number }> = {};

  for (const r of quizResults) {
    const quizObj = quizzes.find((q) => q.id === r.quizId);
    const topicObj = topics.find((t) => t.id === r.topicId || t.id === quizObj?.topicId);
    const rawCat = quizObj?.category || topicObj?.categoryId || "Other";
    const catName = normalizeCategoryName(rawCat);

    if (!catMap[catName]) {
      catMap[catName] = { totalScore: 0, count: 0 };
    }
    catMap[catName].totalScore += r.scorePercent || 0;
    catMap[catName].count += 1;
  }

  const categories: CategoryAccuracyItem[] = Object.entries(catMap).map(([category, data]) => ({
    category,
    accuracy: Math.round(data.totalScore / data.count),
    totalAttempts: data.count,
  }));

  // Sort by highest accuracy
  categories.sort((a, b) => b.accuracy - a.accuracy);

  return {
    hasCategoryData: categories.length > 0,
    categories,
  };
}

/**
 * Calculates time/activity distribution per category based on completed lessons,
 * solved bugs, and topic mastery records.
 */
export function getCategoryActivityAnalytics(
  progress: ProgressState,
  topics: Topic[] = [],
  lessons: Lesson[] = [],
): CategoryActivityResult {
  const masteryRecords = Object.values(progress.topicMasteryRecords || {});
  const completedLessonIds = progress.lessonsCompleted || [];
  const solvedBugIds = progress.solvedBugs || [];
  const quizResults = progress.quizResults || [];

  const counts: Record<string, number> = {};
  let totalActivityCount = 0;

  // 1. Count topic mastery records
  for (const rec of masteryRecords) {
    if (rec.confidence > 0 || rec.mastery !== "Not Started") {
      const cat = normalizeCategoryName(rec.category);
      counts[cat] = (counts[cat] || 0) + 1;
      totalActivityCount++;
    }
  }

  // 2. Count completed lessons
  for (const lessonId of completedLessonIds) {
    const lesson = lessons.find((l) => l.id === lessonId);
    const topic = topics.find((t) => t.id === lesson?.topicId);
    if (topic) {
      const cat = normalizeCategoryName(topic.categoryId);
      counts[cat] = (counts[cat] || 0) + 1;
      totalActivityCount++;
    }
  }

  // 3. Count quiz attempts
  for (const q of quizResults) {
    const topic = topics.find((t) => t.id === q.topicId);
    const cat = normalizeCategoryName(topic?.categoryId || "Other");
    counts[cat] = (counts[cat] || 0) + 1;
    totalActivityCount++;
  }

  if (totalActivityCount === 0) {
    return {
      hasActivityData: false,
      categoryPie: [],
    };
  }

  const categoryPie: CategoryTimePieItem[] = Object.entries(counts).map(([name, count]) => {
    const percent = Math.round((count / totalActivityCount) * 100);
    return {
      name,
      value: percent,
      count,
      color: CATEGORY_COLORS[name] || CATEGORY_COLORS.Other,
    };
  });

  categoryPie.sort((a, b) => b.value - a.value);

  return {
    hasActivityData: true,
    categoryPie,
  };
}

/**
 * Derives monthly learning activity points from dated records.
 */
export function getMonthlyActivityAnalytics(
  progress: ProgressState,
  topics: Topic[] = [],
): MonthlyActivityTrendResult {
  const quizResults = progress.quizResults || [];
  const journalEntries = progress.journalEntries || [];
  const playgroundCompletions = progress.playgroundCompletions || [];
  const interviewResults = progress.interviewResults || [];

  // Group activity timestamps by month label (e.g. "Jan", "Feb", "Mar")
  const monthMap: Record<string, Record<string, number>> = {};

  const recordEvent = (isoDate: string, rawCat?: string) => {
    if (!isoDate) return;
    try {
      const d = new Date(isoDate);
      if (isNaN(d.getTime())) return;
      const monthLabel = d.toLocaleDateString("en-US", { month: "short" });
      const cat = normalizeCategoryName(rawCat);
      const mappedCat = cat === "CSS Layout" ? "CSS" : cat;

      if (!monthMap[monthLabel]) {
        monthMap[monthLabel] = {
          JavaScript: 0,
          React: 0,
          CSS: 0,
          TypeScript: 0,
          Performance: 0,
          total: 0,
        };
      }
      if (mappedCat in monthMap[monthLabel]) {
        monthMap[monthLabel][mappedCat] += 1;
      }
      monthMap[monthLabel].total += 1;
    } catch {
      // safe fallback
    }
  };

  // Process dated events
  for (const q of quizResults) {
    const topic = topics.find((t) => t.id === q.topicId);
    recordEvent(q.completedAt, topic?.categoryId);
  }

  for (const j of journalEntries) {
    recordEvent(j.createdAt, j.category);
  }

  for (const p of playgroundCompletions) {
    recordEvent(p.completedAt);
  }

  for (const i of interviewResults) {
    recordEvent(i.completedAt);
  }

  const months = Object.keys(monthMap);
  if (months.length === 0) {
    return {
      hasTrendData: false,
      monthlyTrend: [],
    };
  }

  const monthlyTrend: MonthlyActivityPoint[] = months.map((month) => {
    const data = monthMap[month];
    return {
      month,
      JavaScript: data.JavaScript || 0,
      React: data.React || 0,
      CSS: data.CSS || 0,
      TypeScript: data.TypeScript || 0,
      Performance: data.Performance || 0,
      total: data.total || 0,
    };
  });

  return {
    hasTrendData: monthlyTrend.length > 0,
    monthlyTrend,
  };
}

/**
 * Derives weekly accuracy progression from dated quiz attempts.
 */
export function getWeeklyAccuracyTrend(progress: ProgressState): WeeklyAccuracyTrendResult {
  const quizResults = progress.quizResults || [];
  if (quizResults.length === 0) {
    return {
      hasTrendData: false,
      trend: [],
    };
  }

  // Sort quiz results by completedAt ascending
  const sorted = [...quizResults]
    .filter((q) => Boolean(q.completedAt))
    .sort((a, b) => (a.completedAt > b.completedAt ? 1 : -1));

  if (sorted.length === 0) {
    return {
      hasTrendData: false,
      trend: [],
    };
  }

  // Group into weekly buckets (W1, W2...) or date-range labels
  const weekMap: Record<string, { totalScore: number; count: number }> = {};

  sorted.forEach((q, idx) => {
    // Group into week numbers based on sequence or date
    const weekNum = Math.floor(idx / 3) + 1;
    const label = `W${weekNum}`;
    if (!weekMap[label]) {
      weekMap[label] = { totalScore: 0, count: 0 };
    }
    weekMap[label].totalScore += q.scorePercent || 0;
    weekMap[label].count += 1;
  });

  const trend: WeeklyAccuracyPoint[] = Object.entries(weekMap).map(([week, data]) => {
    const quizAccuracy = Math.round(data.totalScore / data.count);
    return {
      week,
      quizAccuracy,
      overall: quizAccuracy,
    };
  });

  return {
    hasTrendData: trend.length > 0,
    trend,
  };
}

/**
 * Calculates scores for the six canonical pillars from topicMasteryRecords.
 * Real, actual confidence scores only, mapped consistently.
 */
export function getPillarScores(progress: ProgressState): Record<string, number> {
  const recordsMap = progress.topicMasteryRecords || {};
  const recordsList = Object.values(recordsMap);
  const pillars = [
    "JavaScript",
    "React",
    "CSS Layout",
    "TypeScript",
    "Performance",
    "System Design",
  ];

  const totals: Record<string, { totalConfidence: number; count: number }> = {};
  pillars.forEach((p) => {
    totals[p] = { totalConfidence: 0, count: 0 };
  });

  for (const rec of recordsList) {
    const rawCat = rec.category || "Other";
    const pillarName = normalizeCategoryName(rawCat);
    if (totals[pillarName] !== undefined) {
      totals[pillarName].totalConfidence += rec.confidence || 0;
      totals[pillarName].count += 1;
    }
  }

  const scores: Record<string, number> = {};
  pillars.forEach((p) => {
    const data = totals[p];
    scores[p] = data.count > 0 ? Math.round(data.totalConfidence / data.count) : 0;
  });

  return scores;
}

/**
 * Computes Interview Readiness metrics from topic mastery records.
 * Uses exact canonical formula: 60% Domain Confidence + 40% Mock Interview Performance.
 */
export function getReadinessAnalytics(progress: ProgressState): ReadinessAnalyticsResult {
  const recordsMap = progress.topicMasteryRecords || {};
  const recordsList = Object.values(recordsMap);

  if (recordsList.length === 0) {
    return {
      overallReadinessPercent: 0,
      interviewReadyCount: 0,
      totalTrackedTopics: 0,
      tier: "Junior Front-End Ready",
    };
  }

  const scores = getPillarScores(progress);
  const pillars = [
    "JavaScript",
    "React",
    "CSS Layout",
    "TypeScript",
    "Performance",
    "System Design",
  ];
  const totalPillarScore = pillars.reduce((sum, p) => sum + scores[p], 0);
  const domainConfidence = totalPillarScore / pillars.length;

  const completedInterviews = progress.interviewResults || [];
  let overallScore = 0;

  if (completedInterviews.length === 0) {
    overallScore = Math.round(domainConfidence);
  } else {
    const mockInterviewPerformance =
      completedInterviews.reduce((acc, curr) => acc + curr.scorePercent, 0) /
      completedInterviews.length;
    overallScore = Math.round(domainConfidence * 0.6 + mockInterviewPerformance * 0.4);
  }

  const clampedScore = Math.min(100, Math.max(0, overallScore));

  let tier = "Junior Front-End Ready";
  if (clampedScore >= 90) tier = "Staff / Principal Ready";
  else if (clampedScore >= 80) tier = "Senior Front-End Ready";
  else if (clampedScore >= 65) tier = "Mid-Level Engineer Ready";

  const interviewReadyCount = recordsList.filter(
    (r) => r.confidence >= 80 || r.mastery === "Mastered" || r.mastery === "Interview Ready",
  ).length;

  return {
    overallReadinessPercent: clampedScore,
    interviewReadyCount,
    totalTrackedTopics: recordsList.length,
    tier,
  };
}

/**
 * Computes Skill Pillar Radar data from topic mastery records grouped by domain.
 */
export function getPillarRadarAnalytics(progress: ProgressState): PillarRadarResult {
  const scores = getPillarScores(progress);
  const pillars = [
    "JavaScript",
    "React",
    "CSS Layout",
    "TypeScript",
    "Performance",
    "System Design",
  ];
  const recordsList = Object.values(progress.topicMasteryRecords || {});
  const hasRadarData = recordsList.length > 0;

  const pillarItems: PillarRadarItem[] = pillars.map((pillar) => {
    return {
      pillar,
      name: pillar,
      score: scores[pillar],
      fullMark: 100,
    };
  });

  return {
    hasRadarData,
    pillars: pillarItems,
  };
}
