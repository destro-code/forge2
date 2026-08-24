import { describe, it, expect } from "vitest";
import {
  aggregateSkillMastery,
  aggregateAllSkillsMastery,
  compareSkillMastery,
} from "./mastery-aggregator";
import type { LearningEvidenceToken, SkillMasteryRecord } from "./types";
import type { Skill } from "@/lib/curriculum/types";
import canonicalSkills from "@/data/canonical/skills.json";

describe("Skill Mastery Aggregator — Golden Tests", () => {
  const skills = canonicalSkills as Skill[];
  const targetSkill = skills.find(
    (s) => s.id === "skill-distinguish-web-responsibilities",
  ) as Skill;

  describe("Test 11: Single Successful Activity Produces Novice", () => {
    it("assigns 'none' when no tokens are present", () => {
      const record = aggregateSkillMastery(targetSkill.id, [], targetSkill);
      expect(record.level).toBe("none");
      expect(record.evidenceCount).toBe(0);
      expect(record.averageConfidence).toBe(0);
    });

    it("assigns 'novice' (and NOT 'competent' or 'proficient') for a single perfect activity token", () => {
      const singleToken: LearningEvidenceToken = {
        evidenceId: "ev_1",
        requirementId: "req_1",
        lessonId: "lesson-0-1-1",
        activityId: "act-011-quiz-boundary",
        objectiveId: "obj-frontend-def",
        skillId: targetSkill.id,
        timestamp: 1000,
        attemptsCount: 1,
        hintsUsedCount: 0,
        confidenceScore: 1.0,
        demonstratedLevel: "mastered",
      };

      const record = aggregateSkillMastery(targetSkill.id, [singleToken], targetSkill);

      expect(record.level).toBe("novice");
      expect(record.evidenceCount).toBe(1);
      expect(record.averageConfidence).toBe(1.0);
      expect(record.activitiesDemonstrated).toEqual(["act-011-quiz-boundary"]);
      expect(record.lessonsDemonstrated).toEqual(["lesson-0-1-1"]);
      expect(record.summary).toContain("Novice");
    });
  });

  describe("Competent Level Criteria", () => {
    it("advances to 'competent' when multiple activities demonstrate skill with solid confidence", () => {
      const tokens: LearningEvidenceToken[] = [
        {
          evidenceId: "ev_1",
          requirementId: "req_1",
          lessonId: "lesson-0-1-1",
          activityId: "act-011-quiz-1",
          objectiveId: "obj-frontend-def",
          skillId: targetSkill.id,
          timestamp: 1000,
          attemptsCount: 1,
          hintsUsedCount: 0,
          confidenceScore: 0.85,
        },
        {
          evidenceId: "ev_2",
          requirementId: "req_2",
          lessonId: "lesson-0-1-1",
          activityId: "act-011-quiz-2",
          objectiveId: "obj-frontend-def",
          skillId: targetSkill.id,
          timestamp: 2000,
          attemptsCount: 2,
          hintsUsedCount: 0,
          confidenceScore: 0.75,
        },
      ];

      const record = aggregateSkillMastery(targetSkill.id, tokens, targetSkill);

      expect(record.level).toBe("competent");
      expect(record.evidenceCount).toBe(2);
      expect(record.averageConfidence).toBe(0.8);
      expect(record.activitiesDemonstrated.length).toBe(2);
      expect(record.summary).toContain("Competent");
    });
  });

  describe("Test 12: Multi-Lesson Evidence Produces Proficient", () => {
    it("advances to 'proficient' when demonstrated across 2+ lessons with 3+ activities and high confidence", () => {
      const multiLessonTokens: LearningEvidenceToken[] = [
        {
          evidenceId: "ev_1",
          requirementId: "req_1",
          lessonId: "lesson-0-1-1",
          activityId: "act-011-quiz",
          objectiveId: "obj-1",
          skillId: targetSkill.id,
          timestamp: 1000,
          attemptsCount: 1,
          hintsUsedCount: 0,
          confidenceScore: 1.0,
        },
        {
          evidenceId: "ev_2",
          requirementId: "req_2",
          lessonId: "lesson-0-1-1",
          activityId: "act-011-exercise",
          objectiveId: "obj-1",
          skillId: targetSkill.id,
          timestamp: 2000,
          attemptsCount: 1,
          hintsUsedCount: 1,
          confidenceScore: 0.9,
        },
        {
          evidenceId: "ev_3",
          requirementId: "req_3",
          lessonId: "lesson-1-1-2",
          activityId: "act-112-challenge",
          objectiveId: "obj-2",
          skillId: targetSkill.id,
          timestamp: 3000,
          attemptsCount: 1,
          hintsUsedCount: 0,
          confidenceScore: 0.95,
        },
      ];

      const record = aggregateSkillMastery(targetSkill.id, multiLessonTokens, targetSkill);

      expect(record.level).toBe("proficient");
      expect(record.evidenceCount).toBe(3);
      expect(record.lessonsDemonstrated).toEqual(["lesson-0-1-1", "lesson-1-1-2"]);
      expect(record.activitiesDemonstrated.length).toBe(3);
      expect(record.averageConfidence).toBeGreaterThanOrEqual(0.8);
      expect(record.summary).toContain("Proficient");
    });
  });

  describe("Multi-Skill Aggregation & Comparison", () => {
    it("aggregates mastery across all skills in curriculum", () => {
      const tokens: LearningEvidenceToken[] = [
        {
          evidenceId: "ev_1",
          requirementId: "req_1",
          lessonId: "lesson-0-1-1",
          activityId: "act-1",
          objectiveId: "obj-1",
          skillId: skills[0].id,
          timestamp: 1000,
          attemptsCount: 1,
          hintsUsedCount: 0,
          confidenceScore: 1.0,
        },
      ];

      const allRecords = aggregateAllSkillsMastery(skills, tokens);

      expect(Object.keys(allRecords).length).toBe(skills.length);
      expect(allRecords[skills[0].id].level).toBe("novice");
      expect(allRecords[skills[1].id].level).toBe("none");
    });

    it("deterministically compares mastery records by level then confidence", () => {
      const recProficient: SkillMasteryRecord = {
        skillId: "s1",
        level: "proficient",
        evidenceCount: 3,
        averageConfidence: 0.85,
        lessonsDemonstrated: ["l1", "l2"],
        activitiesDemonstrated: ["a1", "a2", "a3"],
        objectivesDemonstrated: ["o1"],
        highConfidenceEvidenceCount: 2,
        summary: "Proficient",
      };

      const recCompetent: SkillMasteryRecord = {
        skillId: "s2",
        level: "competent",
        evidenceCount: 2,
        averageConfidence: 0.95,
        lessonsDemonstrated: ["l1"],
        activitiesDemonstrated: ["a1", "a2"],
        objectivesDemonstrated: ["o1"],
        highConfidenceEvidenceCount: 2,
        summary: "Competent",
      };

      // Proficient should rank before Competent despite lower confidence
      expect(compareSkillMastery(recProficient, recCompetent)).toBeLessThan(0);
      expect(compareSkillMastery(recCompetent, recProficient)).toBeGreaterThan(0);
    });
  });
});
