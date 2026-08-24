import type { Skill } from "@/lib/curriculum/types";
import type { LearningEvidenceToken, SkillMasteryLevel, SkillMasteryRecord } from "./types";

/**
 * Constant thresholds governing the deterministic skill mastery progression model.
 */
export const MASTERY_THRESHOLDS = {
  NOVICE: {
    minTokens: 1,
    minAverageConfidence: 0.1,
  },
  COMPETENT: {
    minTokens: 2,
    minUniqueActivities: 2,
    minAverageConfidence: 0.7,
  },
  PROFICIENT: {
    minTokens: 3,
    minUniqueActivities: 3,
    minUniqueLessons: 2,
    minHighConfidenceTokens: 2,
    minAverageConfidence: 0.8,
  },
} as const;

const MASTERY_RANK: Record<SkillMasteryLevel, number> = {
  none: 0,
  novice: 1,
  competent: 2,
  proficient: 3,
};

/**
 * Aggregates learning evidence tokens to determine the mastery level for a specific skill.
 *
 * Distinct from activity completion:
 * - A single completed activity yields at most "novice".
 * - "competent" requires multi-activity demonstration with solid confidence.
 * - "proficient" requires repeated demonstration across multiple lessons with high confidence.
 */
export function aggregateSkillMastery(
  skillId: string,
  tokens: LearningEvidenceToken[],
  skillDefinition?: Skill,
): SkillMasteryRecord {
  const matchingTokens = (tokens || []).filter((t) => t.skillId === skillId);

  if (matchingTokens.length === 0) {
    return {
      skillId,
      skillTitle: skillDefinition?.title,
      level: "none",
      evidenceCount: 0,
      averageConfidence: 0,
      lessonsDemonstrated: [],
      activitiesDemonstrated: [],
      objectivesDemonstrated: [],
      highConfidenceEvidenceCount: 0,
      summary: "No learning evidence recorded yet for this skill.",
    };
  }

  const uniqueLessons = Array.from(new Set(matchingTokens.map((t) => t.lessonId)));
  const uniqueActivities = Array.from(new Set(matchingTokens.map((t) => t.activityId)));
  const uniqueObjectives = Array.from(new Set(matchingTokens.map((t) => t.objectiveId)));

  const totalConfidence = matchingTokens.reduce((sum, t) => sum + (t.confidenceScore || 0), 0);
  const averageConfidence = Math.round((totalConfidence / matchingTokens.length) * 10000) / 10000;

  const highConfidenceTokens = matchingTokens.filter((t) => (t.confidenceScore || 0) >= 0.8);
  const latestTimestamp = Math.max(...matchingTokens.map((t) => t.timestamp || 0));

  let level: SkillMasteryLevel = "none";
  let summary = "";

  const meetsProficient =
    matchingTokens.length >= MASTERY_THRESHOLDS.PROFICIENT.minTokens &&
    uniqueActivities.length >= MASTERY_THRESHOLDS.PROFICIENT.minUniqueActivities &&
    uniqueLessons.length >= MASTERY_THRESHOLDS.PROFICIENT.minUniqueLessons &&
    highConfidenceTokens.length >= MASTERY_THRESHOLDS.PROFICIENT.minHighConfidenceTokens &&
    averageConfidence >= MASTERY_THRESHOLDS.PROFICIENT.minAverageConfidence;

  const meetsCompetent =
    matchingTokens.length >= MASTERY_THRESHOLDS.COMPETENT.minTokens &&
    uniqueActivities.length >= MASTERY_THRESHOLDS.COMPETENT.minUniqueActivities &&
    averageConfidence >= MASTERY_THRESHOLDS.COMPETENT.minAverageConfidence;

  const meetsNovice =
    matchingTokens.length >= MASTERY_THRESHOLDS.NOVICE.minTokens &&
    averageConfidence >= MASTERY_THRESHOLDS.NOVICE.minAverageConfidence;

  if (meetsProficient) {
    level = "proficient";
    summary = `Proficient: Demonstrated across ${uniqueLessons.length} lessons and ${uniqueActivities.length} activities with ${Math.round(averageConfidence * 100)}% average confidence.`;
  } else if (meetsCompetent) {
    level = "competent";
    summary = `Competent: Demonstrated across ${uniqueActivities.length} activities with ${Math.round(averageConfidence * 100)}% average confidence.`;
  } else if (meetsNovice) {
    level = "novice";
    summary = `Novice: Demonstrated in ${uniqueActivities.length} activity (${Math.round(averageConfidence * 100)}% confidence). Further practice needed across different contexts.`;
  } else {
    level = "none";
    summary = "Insufficient valid evidence to establish skill mastery.";
  }

  return {
    skillId,
    skillTitle: skillDefinition?.title,
    level,
    evidenceCount: matchingTokens.length,
    averageConfidence,
    lessonsDemonstrated: uniqueLessons,
    activitiesDemonstrated: uniqueActivities,
    objectivesDemonstrated: uniqueObjectives,
    highConfidenceEvidenceCount: highConfidenceTokens.length,
    lastDemonstratedAt: latestTimestamp > 0 ? latestTimestamp : undefined,
    summary,
  };
}

/**
 * Aggregates mastery records across a collection of skills.
 */
export function aggregateAllSkillsMastery(
  skills: Skill[],
  tokens: LearningEvidenceToken[],
): Record<string, SkillMasteryRecord> {
  const result: Record<string, SkillMasteryRecord> = {};

  for (const skill of skills) {
    result[skill.id] = aggregateSkillMastery(skill.id, tokens, skill);
  }

  return result;
}

/**
 * Compares two SkillMasteryRecords for deterministic ordering (rank DESC, then confidence DESC).
 */
export function compareSkillMastery(a: SkillMasteryRecord, b: SkillMasteryRecord): number {
  const rankDiff = (MASTERY_RANK[b.level] || 0) - (MASTERY_RANK[a.level] || 0);
  if (rankDiff !== 0) return rankDiff;
  return (b.averageConfidence || 0) - (a.averageConfidence || 0);
}
