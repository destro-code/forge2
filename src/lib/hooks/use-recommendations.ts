import type { Topic, Lesson, ProgressState } from "@/lib/types";

export interface RecommendationResult {
  topics: Topic[];
  allMastered: boolean;
  isNewUser: boolean;
}

/**
 * Pure, deterministic recommendation calculation engine.
 * Ranks topics based on:
 * 1. Overdue Spaced Review (+100)
 * 2. Weak Quiz Performance (+80)
 * 3. Needs Review (+60)
 * 4. Low Confidence (Dynamic score 100 - confidence)
 * 5. Active Curriculum Sequence (+40)
 * 6. Interview Frequency (+10 for High, +20 for Very High)
 */
export function getAdaptiveRecommendations(
  topics: Topic[] = [],
  progress?: Partial<ProgressState> | null,
  lessons: Lesson[] = [],
): RecommendationResult {
  if (!topics || topics.length === 0) {
    return { topics: [], allMastered: false, isNewUser: true };
  }

  const p = progress || {};
  const lessonsCompleted = p.lessonsCompleted || [];
  const masteryRecords = p.topicMasteryRecords || {};
  const quizResults = p.quizResults || [];

  const isNewUser =
    lessonsCompleted.length === 0 &&
    Object.keys(masteryRecords).length === 0 &&
    quizResults.length === 0;

  if (isNewUser) {
    return {
      topics: topics.slice(0, 3),
      allMastered: false,
      isNewUser: true,
    };
  }

  const now = new Date();

  // Find active sequence topic (first topic with uncompleted lessons)
  const activeTopic = topics.find((t) => {
    const tLessons = lessons.filter(
      (l) => l.topicId === t.id || (t.topicId && l.topicId === t.topicId),
    );
    if (tLessons.length === 0) return false;
    return tLessons.some((l) => !lessonsCompleted.includes(l.id));
  });
  const activeTopicId = activeTopic?.id;

  // Score each topic
  const scored = topics.map((t) => {
    const record = masteryRecords[t.id] || (t.topicId ? masteryRecords[t.topicId] : undefined);
    const confidence = record?.confidence ?? 0;
    const mastery = record?.mastery ?? "Not Started";
    const isMastered = confidence >= 90 || mastery === "Mastered";

    const nextReviewAt = record?.nextReviewAt ? new Date(record.nextReviewAt) : null;
    const isOverdue = nextReviewAt ? nextReviewAt <= now : false;

    // Exclude mastered topics unless explicitly overdue for review
    if (isMastered && !isOverdue) {
      return { topic: t, score: -1, isMastered: true, isOverdue: false };
    }

    let score = 0;

    // 1. Overdue Spaced Review (+100)
    if (isOverdue) {
      score += 100;
    }

    // 2. Weak Quiz Performance (+80)
    const latestQuiz = quizResults.find(
      (q) => q.topicId === t.id || (t.topicId && q.topicId === t.topicId),
    );
    if (latestQuiz && latestQuiz.scorePercent < 70) {
      score += 80;
    }

    // 3. Needs Review (+60)
    if (mastery === "Needs Review" || (confidence > 0 && confidence < 50)) {
      score += 60;
    }

    // 4. Low Confidence (dynamic score: 100 - confidence)
    if (!isMastered) {
      score += 100 - confidence;
    }

    // 5. Active Curriculum Sequence (+40)
    if (activeTopicId && t.id === activeTopicId) {
      score += 40;
    }

    // 6. Interview Frequency (+10 / +20)
    if (t.interviewFrequency === "Very High") {
      score += 20;
    } else if (t.interviewFrequency === "High") {
      score += 10;
    }

    return { topic: t, score, isMastered, isOverdue };
  });

  const eligible = scored.filter((item) => item.score >= 0);

  if (eligible.length === 0) {
    // All topics mastered and none overdue
    const refreshList = [...topics]
      .sort((a, b) => {
        const scoreA =
          a.interviewFrequency === "Very High" ? 20 : a.interviewFrequency === "High" ? 10 : 0;
        const scoreB =
          b.interviewFrequency === "Very High" ? 20 : b.interviewFrequency === "High" ? 10 : 0;
        return scoreB - scoreA;
      })
      .slice(0, 3);

    return {
      topics: refreshList,
      allMastered: true,
      isNewUser: false,
    };
  }

  // Sort eligible by score descending
  eligible.sort((a, b) => b.score - a.score);

  return {
    topics: eligible.slice(0, 3).map((e) => e.topic),
    allMastered: false,
    isNewUser: false,
  };
}
