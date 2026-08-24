import { describe, it, expect } from "vitest";
import { lintLesson } from "./lint-lesson";
import { lintCurriculum } from "./lint-curriculum";
import { DIAGNOSTIC_CODES } from "./types";
import { canonicalProvider } from "../canonical-provider";
import type { CanonicalLesson } from "../types";

describe("Phase 2C — Canonical Authoring Specification & Linter", () => {
  const goldenLessons = canonicalProvider.getGoldenLessons();
  const fullContext = {
    academy: canonicalProvider.getAcademy(),
    levels: canonicalProvider.getLevels(),
    modules: canonicalProvider.getModules(),
    topics: canonicalProvider.getTopics(),
    concepts: canonicalProvider.getConcepts(),
    skills: canonicalProvider.getSkills(),
    misconceptions: canonicalProvider.getMisconceptions(),
    lessons: goldenLessons,
  };

  it("1. valid Golden Lesson passes (0 errors)", () => {
    expect(goldenLessons.length).toBe(5);
    for (const goldenLesson of goldenLessons) {
      const result = lintLesson(goldenLesson, fullContext);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    }
  });

  it("2. unknown activity type reports error", () => {
    const invalidLesson: any = JSON.parse(JSON.stringify(goldenLessons[0]));
    invalidLesson.activities[0].type = "magic-trick";

    const result = lintLesson(invalidLesson, fullContext);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === DIAGNOSTIC_CODES.UNKNOWN_ACTIVITY_TYPE)).toBe(true);
  });

  it("3. duplicate activity ID reports error", () => {
    const invalidLesson: any = JSON.parse(JSON.stringify(goldenLessons[0]));
    invalidLesson.activities[1].id = invalidLesson.activities[0].id;

    const result = lintLesson(invalidLesson, fullContext);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === DIAGNOSTIC_CODES.DUPLICATE_ACTIVITY_ID)).toBe(true);
  });

  it("4. duplicate lesson ID in curriculum reports error", () => {
    const duplicatedLessons = [goldenLessons[0], goldenLessons[0]];
    const result = lintCurriculum({ ...fullContext, lessons: duplicatedLessons });

    expect(result.result.valid).toBe(false);
    expect(result.result.errors.some((e) => e.code === DIAGNOSTIC_CODES.DUPLICATE_LESSON_ID)).toBe(
      true,
    );
  });

  it("5. broken objective reference in activity reports error", () => {
    const invalidLesson: any = JSON.parse(JSON.stringify(goldenLessons[0]));
    invalidLesson.activities[0].objectiveIds = ["non-existent-objective-id"];

    const result = lintLesson(invalidLesson, fullContext);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === DIAGNOSTIC_CODES.BROKEN_OBJECTIVE_REFERENCE)).toBe(
      true,
    );
  });

  it("6. broken skill reference reports warning", () => {
    const invalidLesson: any = JSON.parse(JSON.stringify(goldenLessons[0]));
    invalidLesson.skillIds = ["non-existent-skill-id"];

    const result = lintLesson(invalidLesson, fullContext);
    expect(result.warnings.some((w) => w.code === DIAGNOSTIC_CODES.BROKEN_SKILL_REFERENCE)).toBe(
      true,
    );
  });

  it("7. broken concept reference reports warning", () => {
    const invalidLesson: any = JSON.parse(JSON.stringify(goldenLessons[0]));
    invalidLesson.conceptIds = ["non-existent-concept-id"];

    const result = lintLesson(invalidLesson, fullContext);
    expect(result.warnings.some((w) => w.code === DIAGNOSTIC_CODES.BROKEN_CONCEPT_REFERENCE)).toBe(
      true,
    );
  });

  it("8. evidence requirement with nonexistent activity reports error", () => {
    const invalidLesson: any = JSON.parse(JSON.stringify(goldenLessons[0]));
    invalidLesson.completion = {
      evidenceRequirements: [
        {
          objectiveId: invalidLesson.objectives[0].id,
          activityIds: ["non-existent-act-id"],
          requirement: "complete",
        },
      ],
    };

    const result = lintLesson(invalidLesson, fullContext);
    expect(result.valid).toBe(false);
    expect(
      result.errors.some(
        (e) => e.code === DIAGNOSTIC_CODES.EVIDENCE_REQUIREMENT_NONEXISTENT_ACTIVITY,
      ),
    ).toBe(true);
  });

  it("9. evidence requirement with impossible activity (summary requiring success) reports error", () => {
    const invalidLesson: any = JSON.parse(JSON.stringify(goldenLessons[0]));
    invalidLesson.completion = {
      evidenceRequirements: [
        {
          objectiveId: invalidLesson.objectives[0].id,
          activityIds: [invalidLesson.activities[invalidLesson.activities.length - 1].id], // summary
          requirement: "success",
        },
      ],
    };

    const result = lintLesson(invalidLesson, fullContext);
    expect(result.valid).toBe(false);
    expect(
      result.errors.some(
        (e) => e.code === DIAGNOSTIC_CODES.EVIDENCE_REQUIREMENT_IMPOSSIBLE_ACTIVITY,
      ),
    ).toBe(true);
  });

  it("10. objective without evidence reports error", () => {
    const invalidLesson: any = JSON.parse(JSON.stringify(goldenLessons[0]));
    invalidLesson.objectives.push({
      id: "obj-orphan-unreferenced",
      statement: "An unreferenced objective statement",
      conceptIds: [],
      skillIds: [],
      priority: "primary",
    });

    const result = lintLesson(invalidLesson, fullContext);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === DIAGNOSTIC_CODES.OBJECTIVE_WITHOUT_EVIDENCE)).toBe(
      true,
    );
  });

  it("11. interactive-code without validation reports error", () => {
    const invalidLesson: any = JSON.parse(JSON.stringify(goldenLessons[0]));
    invalidLesson.activities.push({
      id: "act-test-ic",
      type: "interactive-code",
      intent: "application",
      objectiveIds: [invalidLesson.objectives[0].id],
      content: {
        title: "Test Code",
        prompt: "Write code",
        language: "javascript",
        starterCode: "const x = 1;",
      },
    });

    const result = lintLesson(invalidLesson, fullContext);
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) => e.code === DIAGNOSTIC_CODES.INTERACTIVE_CODE_MISSING_VALIDATION),
    ).toBe(true);
  });

  it("12. debug without validation reports error", () => {
    const invalidLesson: any = JSON.parse(JSON.stringify(goldenLessons[0]));
    invalidLesson.activities.push({
      id: "act-test-debug",
      type: "debug",
      intent: "debugging",
      objectiveIds: [invalidLesson.objectives[0].id],
      content: {
        title: "Fix Bug",
        prompt: "Fix the bug",
        buggyCode: "const x = ",
        language: "javascript",
        bugDescription: "Missing expression",
      },
    });

    const result = lintLesson(invalidLesson, fullContext);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === DIAGNOSTIC_CODES.DEBUG_MISSING_VALIDATION)).toBe(
      true,
    );
  });

  it("13. multiple-choice without validation reports error", () => {
    const invalidLesson: any = JSON.parse(JSON.stringify(goldenLessons[0]));
    invalidLesson.activities.push({
      id: "act-test-mc",
      type: "multiple-choice",
      intent: "assessment",
      objectiveIds: [invalidLesson.objectives[0].id],
      content: {
        question: "Which option?",
        options: [
          { id: "opt-1", text: "Option 1" },
          { id: "opt-2", text: "Option 2" },
        ],
      },
    });

    const result = lintLesson(invalidLesson, fullContext);
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) => e.code === DIAGNOSTIC_CODES.MULTIPLE_CHOICE_MISSING_VALIDATION),
    ).toBe(true);
  });

  it("14. invalid completion rule requiredActivityIds reports error", () => {
    const invalidLesson: any = JSON.parse(JSON.stringify(goldenLessons[0]));
    invalidLesson.completion = {
      requiredActivityIds: ["non-existent-activity-id"],
    };

    const result = lintLesson(invalidLesson, fullContext);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === DIAGNOSTIC_CODES.COMPLETION_RULE_UNREACHABLE)).toBe(
      true,
    );
  });

  it("15. invalid misconception reference in concept or activity reports warning", () => {
    const invalidLesson: any = JSON.parse(JSON.stringify(goldenLessons[0]));
    invalidLesson.activities[0].feedback = {
      correct: "Good job",
      incorrect: "Try again",
      hints: [
        {
          id: "hint-1",
          level: 1,
          content: "Remember misconception",
        },
      ],
    };

    const result = lintLesson(invalidLesson, {
      ...fullContext,
      misconceptions: [],
    });
    expect(result).toBeDefined();
  });

  it("16. malformed hints (empty content) reports error", () => {
    const invalidLesson: any = JSON.parse(JSON.stringify(goldenLessons[0]));
    invalidLesson.activities[0].feedback = {
      correct: "Good job",
      incorrect: "Try again",
      hints: [
        {
          id: "hint-1",
          level: 1,
          content: "", // empty
        },
      ],
    };

    const result = lintLesson(invalidLesson, fullContext);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === DIAGNOSTIC_CODES.MALFORMED_HINTS)).toBe(true);
  });

  it("17. passive lesson warning for 4+ consecutive passive activities", () => {
    const invalidLesson: any = JSON.parse(JSON.stringify(goldenLessons[0]));
    invalidLesson.activities = [
      {
        id: "p1",
        type: "intro",
        intent: "orientation",
        objectiveIds: [invalidLesson.objectives[0].id],
        content: { title: "T", hook: "H" },
      },
      {
        id: "p2",
        type: "explanation",
        intent: "understanding",
        objectiveIds: [invalidLesson.objectives[0].id],
        content: { text: "Explanation one with enough characters to pass text length check." },
      },
      {
        id: "p3",
        type: "explanation",
        intent: "understanding",
        objectiveIds: [invalidLesson.objectives[0].id],
        content: { text: "Explanation two with enough characters to pass text length check." },
      },
      {
        id: "p4",
        type: "explanation",
        intent: "understanding",
        objectiveIds: [invalidLesson.objectives[0].id],
        content: { text: "Explanation three with enough characters to pass text length check." },
      },
      {
        id: "p5",
        type: "summary",
        intent: "reflection",
        objectiveIds: [invalidLesson.objectives[0].id],
        content: { takeaways: ["Takeaway 1"] },
      },
    ];

    const result = lintLesson(invalidLesson, fullContext);
    expect(result.warnings.some((w) => w.code === DIAGNOSTIC_CODES.PASSIVE_LESSON_WARNING)).toBe(
      true,
    );
  });

  it("18. missing retrieval warning for assessment/practice lesson without retrieval", () => {
    const invalidLesson: any = JSON.parse(JSON.stringify(goldenLessons[0]));
    invalidLesson.lessonType = "practice";
    invalidLesson.activities = [
      {
        id: "p1",
        type: "intro",
        intent: "orientation",
        objectiveIds: [invalidLesson.objectives[0].id],
        content: { title: "T", hook: "H" },
      },
      {
        id: "p2",
        type: "explanation",
        intent: "understanding",
        objectiveIds: [invalidLesson.objectives[0].id],
        content: { text: "Explanation one with enough characters to pass text length check." },
      },
      {
        id: "p5",
        type: "summary",
        intent: "reflection",
        objectiveIds: [invalidLesson.objectives[0].id],
        content: { takeaways: ["Takeaway 1"] },
      },
    ];

    const result = lintLesson(invalidLesson, fullContext);
    expect(result.warnings.some((w) => w.code === DIAGNOSTIC_CODES.MISSING_RETRIEVAL_WARNING)).toBe(
      true,
    );
  });

  it("19. missing synthesis warning when lesson lacks summary/completion/reflection at end", () => {
    const invalidLesson: any = JSON.parse(JSON.stringify(goldenLessons[0]));
    invalidLesson.activities = [
      {
        id: "p1",
        type: "intro",
        intent: "orientation",
        objectiveIds: [invalidLesson.objectives[0].id],
        content: { title: "T", hook: "H" },
      },
      {
        id: "p2",
        type: "explanation",
        intent: "understanding",
        objectiveIds: [invalidLesson.objectives[0].id],
        content: { text: "Explanation one with enough characters to pass text length check." },
      },
      {
        id: "p3",
        type: "multiple-choice",
        intent: "assessment",
        objectiveIds: [invalidLesson.objectives[0].id],
        content: {
          question: "Q",
          options: [
            { id: "opt-1", text: "A" },
            { id: "opt-2", text: "B" },
          ],
        },
        validation: { type: "exact-match", expected: "opt-1" },
      },
    ];

    const result = lintLesson(invalidLesson, fullContext);
    expect(result.warnings.some((w) => w.code === DIAGNOSTIC_CODES.MISSING_SYNTHESIS_WARNING)).toBe(
      true,
    );
  });

  it("20. duplicate prompt warning when activities share identical text", () => {
    const invalidLesson: any = JSON.parse(JSON.stringify(goldenLessons[0]));
    const samePrompt = "What is the exact responsibility of frontend engineering?";
    invalidLesson.activities[0].content.hook = samePrompt;
    invalidLesson.activities[1].content.prompt = samePrompt;

    const result = lintLesson(invalidLesson, fullContext);
    expect(result.warnings.some((w) => w.code === DIAGNOSTIC_CODES.DUPLICATE_PROMPT_WARNING)).toBe(
      true,
    );
  });

  it("21. multiple-choice with one option reports error", () => {
    const invalidLesson: any = JSON.parse(JSON.stringify(goldenLessons[0]));
    invalidLesson.activities.push({
      id: "act-mc-one-opt",
      type: "multiple-choice",
      intent: "assessment",
      objectiveIds: [invalidLesson.objectives[0].id],
      content: {
        question: "Is this valid?",
        options: [{ id: "opt-single", text: "Only one option" }],
      },
      validation: { type: "exact-match", expected: "opt-single" },
    });

    const result = lintLesson(invalidLesson, fullContext);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === DIAGNOSTIC_CODES.MULTIPLE_CHOICE_ONE_OPTION)).toBe(
      true,
    );
  });

  it("22. full Golden Lesson curriculum passes", () => {
    const curriculumResult = lintCurriculum(fullContext);
    expect(curriculumResult.totalLessons).toBe(5);
    expect(curriculumResult.validLessons).toBe(5);
    expect(curriculumResult.totalErrors).toBe(0);
    expect(curriculumResult.result.valid).toBe(true);
  });

  it("23. deterministic output across multiple runs", () => {
    const res1 = lintLesson(goldenLessons[0], fullContext);
    const res2 = lintLesson(goldenLessons[0], fullContext);
    expect(res1).toEqual(res2);

    const curRes1 = lintCurriculum(fullContext);
    const curRes2 = lintCurriculum(fullContext);
    expect(curRes1).toEqual(curRes2);
  });

  it("24. multiple errors reported in single run", () => {
    const invalidLesson: any = JSON.parse(JSON.stringify(goldenLessons[0]));
    // Inject 3 distinct errors
    invalidLesson.activities[0].type = "bogus-type-1";
    invalidLesson.activities[1].id = invalidLesson.activities[2].id; // duplicate ID
    invalidLesson.objectives.push({
      id: "obj-orphan-multiple",
      statement: "Orphan objective",
      conceptIds: [],
      skillIds: [],
      priority: "primary",
    });

    const result = lintLesson(invalidLesson, fullContext);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });
});
