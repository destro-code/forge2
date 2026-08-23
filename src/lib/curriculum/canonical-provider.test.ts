import { describe, it, expect } from "vitest";
import { canonicalProvider } from "./canonical-provider";
import {
  adaptLegacyLessonToCanonical,
  adaptCanonicalLessonToLegacy,
  adaptCanonicalLessonToSteps,
} from "./legacy-adapter";
import type { Lesson as LegacyLesson } from "../types";

describe("Canonical Provider & Legacy Adapter", () => {
  describe("Canonical Provider Entity Access", () => {
    it("returns Academy with levels", () => {
      const academy = canonicalProvider.getAcademy();
      expect(academy.id).toBe("forge-academy");
      expect(academy.levels.length).toBe(6);
    });

    it("returns all 6 Levels and finds by ID", () => {
      const levels = canonicalProvider.getLevels();
      expect(levels.length).toBe(6);

      const level0 = canonicalProvider.getLevel("level-0");
      expect(level0).toBeDefined();
      expect(level0?.title).toContain("Level 0");
    });

    it("returns Modules and finds by ID", () => {
      const modules = canonicalProvider.getModules();
      expect(modules.length).toBeGreaterThan(0);

      const mod01 = canonicalProvider.getModule("module-0-1");
      expect(mod01).toBeDefined();
      expect(mod01?.levelId).toBe("level-0");
    });

    it("returns Topics and finds by ID", () => {
      const topics = canonicalProvider.getTopics();
      expect(topics.length).toBeGreaterThan(0);

      const topic = canonicalProvider.getTopic("what-is-frontend-development");
      expect(topic).toBeDefined();
      expect(topic?.moduleId).toBe("module-0-1");
    });

    it("returns Concepts, Skills, and Misconceptions", () => {
      const concepts = canonicalProvider.getConcepts();
      expect(concepts.length).toBeGreaterThanOrEqual(5);

      const concept = canonicalProvider.getConcept("concept-frontend-definition");
      expect(concept).toBeDefined();
      expect(concept?.title).toContain("Frontend vs Backend");

      const skill = canonicalProvider.getSkill("skill-write-valid-html-markup");
      expect(skill).toBeDefined();

      const misc = canonicalProvider.getMisconception("misc-padding-vs-margin");
      expect(misc).toBeDefined();
    });
  });

  describe("Lesson Retrieval & Golden Fixtures", () => {
    it("returns all 5 Golden Lessons", () => {
      const golden = canonicalProvider.getGoldenLessons();
      expect(golden.length).toBe(5);
    });

    it("retrieves golden lessons by ID", () => {
      const lesson1 = canonicalProvider.getLesson("lesson-0-1-1");
      expect(lesson1).toBeDefined();
      expect(lesson1?.id).toBe("lesson-0-1-1");
      expect(lesson1?.title).toBe("What Is Frontend Development?");

      const lesson2 = canonicalProvider.getLesson("lesson-1-1-2");
      expect(lesson2).toBeDefined();
      expect(lesson2?.title).toBe("Elements, Tags & Attributes");
    });

    it("seamlessly adapts legacy lesson from lessons.json if not a golden fixture", () => {
      const legacyAdapted = canonicalProvider.getLesson("lesson-0-1-2");
      expect(legacyAdapted).toBeDefined();
      expect(legacyAdapted?.id).toBe("lesson-0-1-2");
      expect(legacyAdapted?.activities.length).toBeGreaterThan(0);
    });

    it("returns lessons for a topic and for a module", () => {
      const topicLessons = canonicalProvider.getLessonsForTopic("what-is-frontend-development");
      expect(topicLessons.length).toBeGreaterThan(0);

      const modLessons = canonicalProvider.getLessonsForModule("module-0-1");
      expect(modLessons.length).toBeGreaterThan(0);
    });

    it("resolves next and previous lessons in curriculum sequence", () => {
      const next = canonicalProvider.getNextLesson("lesson-0-1-1");
      expect(next).toBeDefined();
      expect(next?.id).toBe("lesson-0-1-2");

      const prev = canonicalProvider.getPreviousLesson("lesson-0-1-2");
      expect(prev).toBeDefined();
      expect(prev?.id).toBe("lesson-0-1-1");
    });

    it("validates entire curriculum dataset integrity", () => {
      const report = canonicalProvider.validateAllContent();
      expect(report.valid).toBe(true);
      expect(report.errors).toEqual([]);
    });
  });

  describe("Legacy Adapter Bidirectional & Step Transformation", () => {
    const mockLegacyLesson: LegacyLesson = {
      id: "mock-lesson-1",
      topicId: "mock-topic",
      moduleId: "mock-module",
      order: 1,
      title: "Mock Lesson Title",
      description: "Mock description text.",
      difficulty: "Beginner",
      estimatedMinutes: 20,
      mastery: "Can write mock code.",
      learningObjectives: ["Understand mock concepts", "Apply mock skills"],
      prerequisites: [],
      previousLessonId: null,
      nextLessonId: "mock-lesson-2",
      sections: [
        { type: "heading", text: "Introduction Heading" },
        { type: "paragraph", text: "Paragraph explanation text." },
        { type: "code", language: "javascript", code: "const a = 1;", title: "Code sample" },
        { type: "callout", variant: "tip", text: "A handy tip." },
      ],
      exercises: [
        {
          id: "ex-1",
          title: "Try Coding",
          brief: "Write code to pass",
          playgroundLanguage: "javascript",
          playgroundCode: "function test() {}",
        },
      ],
      quiz: [
        {
          id: "q-1",
          question: "What is 1 + 1?",
          options: ["1", "2", "3"],
          correctIndex: 1,
          explanation: "1 + 1 = 2",
        },
      ],
      summary: "This is the summary of what we learned.",
      resources: [{ label: "Docs", url: "https://example.com" }],
      interviewQuestions: ["Explain mock code"],
    };

    it("adapts legacy lesson into valid canonical lesson structure", () => {
      const canonical = adaptLegacyLessonToCanonical(mockLegacyLesson);
      expect(canonical.id).toBe("mock-lesson-1");
      expect(canonical.title).toBe("Mock Lesson Title");
      expect(canonical.objectives.length).toBe(2);
      expect(canonical.activities.some((a) => a.type === "intro")).toBe(true);
      expect(canonical.activities.some((a) => a.type === "explanation")).toBe(true);
      expect(canonical.activities.some((a) => a.type === "code-example")).toBe(true);
      expect(canonical.activities.some((a) => a.type === "interactive-code")).toBe(true);
      expect(canonical.activities.some((a) => a.type === "multiple-choice")).toBe(true);
      expect(canonical.activities.some((a) => a.type === "summary")).toBe(true);
    });

    it("adapts canonical lesson back to legacy lesson format", () => {
      const canonical = adaptLegacyLessonToCanonical(mockLegacyLesson);
      const legacyRoundtrip = adaptCanonicalLessonToLegacy(canonical);

      expect(legacyRoundtrip.id).toBe(mockLegacyLesson.id);
      expect(legacyRoundtrip.title).toBe(mockLegacyLesson.title);
      expect(legacyRoundtrip.sections.length).toBeGreaterThan(0);
      expect(legacyRoundtrip.exercises.length).toBe(1);
      expect(legacyRoundtrip.quiz.length).toBe(1);
    });

    it("adapts canonical lesson directly to presentation LessonStep array for LessonPlayer", () => {
      const goldenLesson = canonicalProvider.getLesson("lesson-0-1-1")!;
      const steps = adaptCanonicalLessonToSteps(goldenLesson);

      expect(steps.length).toBeGreaterThanOrEqual(4);
      expect(steps.some((s) => s.type === "content")).toBe(true);
      expect(steps.some((s) => s.type === "code-example")).toBe(true);
      expect(steps.some((s) => s.type === "quiz")).toBe(true);
    });
  });
});
