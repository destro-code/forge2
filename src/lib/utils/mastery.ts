import type { MasteryState, TopicMasteryRecord, Topic } from "@/lib/types";
import topicsData from "@/data/topics.json";

export function getMasteryLabelFromConfidence(confidence: number): MasteryState {
  if (confidence >= 90) return "Mastered";
  if (confidence >= 80) return "Interview Ready";
  if (confidence >= 60) return "Practicing";
  if (confidence >= 40) return "Learning";
  return "Not Started";
}

export function updateTopicMasteryRecord(
  existingRecords: Record<string, TopicMasteryRecord>,
  topicId: string,
  updates: {
    confidence?: number;
    quizScorePercent?: number;
    mastery?: MasteryState;
    intervalDays?: number;
    lastReviewedAt?: string;
    nextReviewAt?: string;
    reviewCountDelta?: number;
  },
): Record<string, TopicMasteryRecord> {
  const existing = existingRecords[topicId];
  const nowIso = new Date().toISOString();

  if (existing) {
    const newConfidence =
      updates.confidence !== undefined
        ? Math.min(100, Math.max(0, Math.round(updates.confidence)))
        : existing.confidence;

    const derivedMastery = updates.mastery ?? getMasteryLabelFromConfidence(newConfidence);

    const updatedRecord: TopicMasteryRecord = {
      ...existing,
      confidence: newConfidence,
      mastery: derivedMastery,
      quizScorePercent:
        updates.quizScorePercent !== undefined
          ? updates.quizScorePercent
          : existing.quizScorePercent,
      intervalDays: updates.intervalDays ?? existing.intervalDays,
      lastReviewedAt: updates.lastReviewedAt ?? existing.lastReviewedAt,
      nextReviewAt: updates.nextReviewAt ?? existing.nextReviewAt,
      reviewCount: (existing.reviewCount || 0) + (updates.reviewCountDelta ?? 0),
    };

    return {
      ...existingRecords,
      [topicId]: updatedRecord,
    };
  }

  const topic = (topicsData as Topic[]).find(
    (t) => t.id === topicId || (t.topicId && (t.topicId as string) === topicId),
  );
  const topicObj = topic as Record<string, unknown> | undefined;
  const categoryId = (topicObj?.categoryId || topicObj?.moduleId) as string | undefined;
  const category =
    categoryId === "core-web" || categoryId === "html-css-foundations"
      ? "HTML/CSS"
      : categoryId === "language-mastery" || categoryId === "js-foundation"
        ? "JavaScript"
        : categoryId === "framework-mastery" ||
            categoryId === "react-deep-dive" ||
            categoryId === "react-professional"
          ? "React"
          : "Architecture";

  const confidence =
    updates.confidence !== undefined
      ? Math.min(100, Math.max(0, Math.round(updates.confidence)))
      : 50;

  const derivedMastery = updates.mastery ?? getMasteryLabelFromConfidence(confidence);

  const newRecord: TopicMasteryRecord = {
    topicId,
    topicTitle: topic ? topic.title : topicId,
    category,
    confidence,
    mastery: derivedMastery,
    lastReviewedAt: updates.lastReviewedAt ?? nowIso,
    nextReviewAt: updates.nextReviewAt ?? new Date(Date.now() + 3 * 86400000).toISOString(),
    intervalDays: updates.intervalDays ?? 3,
    reviewCount: updates.reviewCountDelta ?? 1,
    quizScorePercent: updates.quizScorePercent ?? 0,
  };

  return {
    ...existingRecords,
    [topicId]: newRecord,
  };
}
