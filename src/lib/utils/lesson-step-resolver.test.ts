import { describe, it, expect } from "vitest";
import { buildLessonSteps, getCanonicalExerciseId } from "./lesson-step-resolver";
import type { Lesson, ExerciseValidationSpec } from "../types";
import lessonsData from "../../data/lessons.json";

describe("buildLessonSteps - Presentation Model & Step Resolver", () => {
  it("1. Resolves a normal content section correctly", () => {
    const mockLesson: Lesson = {
      id: "test-lesson-1",
      topicId: "test-topic",
      title: "Test Lesson",
      description: "Test description",
      difficulty: "Beginner",
      estimatedMinutes: 10,
      mastery: "Learning",
      sections: [
        { type: "heading", text: "Introduction to HTML", id: "heading-intro" },
        { type: "paragraph", text: "HTML is the standard markup language." },
        { type: "callout", variant: "info", text: "Remember to close your tags!" },
      ],
      exercises: [],
      quiz: [],
      summary: "",
      resources: [],
      interviewQuestions: [],
    };

    const steps = buildLessonSteps(mockLesson);
    expect(steps.length).toBe(1);

    const step = steps[0];
    expect(step.type).toBe("content");
    expect(step.title).toBe("Introduction to HTML");
    expect(step.lessonId).toBe("test-lesson-1");
    if (step.type === "content") {
      expect(step.sections.length).toBe(3);
      expect(step.sectionId).toBe("heading-intro");
    }
  });

  it("2. Resolves code examples (code, jsx, javascript) correctly", () => {
    const mockLesson: Lesson = {
      id: "test-lesson-2",
      topicId: "test-topic",
      title: "Code Lesson",
      description: "Test description",
      difficulty: "Beginner",
      estimatedMinutes: 10,
      mastery: "Learning",
      sections: [
        {
          type: "code",
          id: "code-sec-1",
          language: "html",
          title: "Basic HTML Button",
          code: "<button>Click me</button>",
        },
        {
          type: "jsx",
          id: "jsx-sec-1",
          title: "React Component",
          code: "function App() { return <button>React</button>; }",
        },
        {
          type: "javascript",
          id: "js-sec-1",
          title: "DOM Script",
          code: "console.log('hello');",
        },
      ],
      exercises: [],
      quiz: [],
      summary: "",
      resources: [],
      interviewQuestions: [],
    };

    const steps = buildLessonSteps(mockLesson);
    expect(steps.length).toBe(3);

    expect(steps[0].type).toBe("code-example");
    if (steps[0].type === "code-example") {
      expect(steps[0].language).toBe("html");
      expect(steps[0].code).toBe("<button>Click me</button>");
      expect(steps[0].sectionId).toBe("code-sec-1");
    }

    expect(steps[1].type).toBe("code-example");
    if (steps[1].type === "code-example") {
      expect(steps[1].language).toBe("jsx");
      expect(steps[1].sectionId).toBe("jsx-sec-1");
    }

    expect(steps[2].type).toBe("code-example");
    if (steps[2].type === "code-example") {
      expect(steps[2].language).toBe("javascript");
      expect(steps[2].sectionId).toBe("js-sec-1");
    }
  });

  it("3. Resolves a validated interactive exercise correctly", () => {
    const mockValidationSpec: ExerciseValidationSpec = {
      exerciseId: "interactive-0-1-1",
      runtime: "html-css",
      assertions: [
        {
          id: "test-assertion",
          description: "Check container exists",
          strategy: "dom_query",
          target: "#container",
          expected: { exists: true },
        },
      ],
    };

    const mockLesson: Lesson = {
      id: "test-lesson-3",
      topicId: "test-topic",
      title: "Interactive Lesson",
      description: "Test description",
      difficulty: "Beginner",
      estimatedMinutes: 10,
      mastery: "Learning",
      sections: [
        {
          type: "interactive-sandbox",
          id: "interactive-0-1-1",
          title: "Frontend Detective",
          instructions: "Investigate the DOM",
          initialCode: "<div>Test</div>",
          language: "html",
          validation: mockValidationSpec,
        },
      ],
      exercises: [],
      quiz: [],
      summary: "",
      resources: [],
      interviewQuestions: [],
    };

    const steps = buildLessonSteps(mockLesson);
    expect(steps.length).toBe(1);

    const step = steps[0];
    expect(step.type).toBe("interactive-exercise");
    if (step.type === "interactive-exercise") {
      expect(step.exerciseId).toBe("interactive-0-1-1");
      expect(step.sectionId).toBe("interactive-0-1-1");
      expect(step.hasValidation).toBe(true);
      expect(step.validation).toEqual(mockValidationSpec);
      expect(step.initialCode).toBe("<div>Test</div>");
      expect(step.instructions).toBe("Investigate the DOM");
    }
  });

  it("4. Resolves a legacy interactive exercise without validationSpec correctly", () => {
    const mockLesson: Lesson = {
      id: "test-lesson-4",
      topicId: "test-topic",
      title: "Legacy Exercise Lesson",
      description: "Test description",
      difficulty: "Beginner",
      estimatedMinutes: 10,
      mastery: "Learning",
      sections: [],
      exercises: [
        {
          id: "exercise-legacy-101",
          title: "Legacy Practice Task",
          brief: "Build a responsive card without validation suite",
          playgroundCode: "/* Legacy Starter */",
          playgroundLanguage: "css",
        },
      ],
      quiz: [],
      summary: "",
      resources: [],
      interviewQuestions: [],
    };

    const steps = buildLessonSteps(mockLesson);
    expect(steps.length).toBe(1);

    const step = steps[0];
    expect(step.type).toBe("interactive-exercise");
    if (step.type === "interactive-exercise") {
      expect(step.exerciseId).toBe("exercise-legacy-101");
      expect(step.hasValidation).toBe(false);
      expect(step.validation).toBeUndefined();
      expect(step.instructions).toBe("Build a responsive card without validation suite");
    }
  });

  it("5. Resolves a quiz correctly when represented in the lesson schema", () => {
    const mockLesson: Lesson = {
      id: "test-lesson-5",
      topicId: "test-topic",
      title: "Quiz Lesson",
      description: "Test description",
      difficulty: "Beginner",
      estimatedMinutes: 10,
      mastery: "Learning",
      sections: [],
      exercises: [],
      quiz: [
        {
          id: "quiz-5-1",
          type: "mcq",
          question: "What is HTML?",
          options: ["Language", "Database", "Browser"],
          correctIndex: 0,
          explanation: "HTML is a markup language.",
        },
      ],
      summary: "",
      resources: [],
      interviewQuestions: [],
    };

    const steps = buildLessonSteps(mockLesson);
    expect(steps.length).toBe(1);

    const step = steps[0];
    expect(step.type).toBe("quiz");
    if (step.type === "quiz") {
      expect(step.quizId).toBe("test-lesson-5-quiz");
      expect(step.questions.length).toBe(1);
      expect(step.questions[0].id).toBe("quiz-5-1");
    }
  });

  it("6. Resolves a checkpoint correctly when represented in the lesson schema", () => {
    const mockLesson: Lesson = {
      id: "test-lesson-6",
      topicId: "test-topic",
      title: "Checkpoint Lesson",
      description: "Test description",
      difficulty: "Beginner",
      estimatedMinutes: 10,
      mastery: "Learning",
      sections: [
        {
          type: "checkpoint",
          id: "cp-react-state",
          label: "Verify understanding of React state updates",
          hint: "Remember state setter functions",
          assessment: {
            type: "multiple-choice",
            prompt: "How should you update state?",
            options: [
              { id: "1", label: "setState(val)" },
              { id: "2", label: "state = val" },
            ],
            correctAnswer: "1",
            explanation: "Always use state setter",
          },
        },
      ],
      exercises: [],
      quiz: [],
      summary: "",
      resources: [],
      interviewQuestions: [],
    };

    const steps = buildLessonSteps(mockLesson);
    expect(steps.length).toBe(1);

    const step = steps[0];
    expect(step.type).toBe("checkpoint");
    if (step.type === "checkpoint") {
      expect(step.checkpointId).toBe("cp-react-state");
      expect(step.sectionId).toBe("cp-react-state");
      expect(step.label).toBe("Verify understanding of React state updates");
      expect(step.assessment?.type).toBe("multiple-choice");
    }
  });

  it("7. Preserves original section IDs accurately", () => {
    const mockLesson: Lesson = {
      id: "test-lesson-7",
      topicId: "test-topic",
      title: "Section ID Test",
      description: "Test description",
      difficulty: "Beginner",
      estimatedMinutes: 10,
      mastery: "Learning",
      sections: [
        { type: "heading", id: "custom-heading-id-999", text: "Special Section" },
        { type: "paragraph", text: "Paragraph text under special section." },
      ],
      exercises: [],
      quiz: [],
      summary: "",
      resources: [],
      interviewQuestions: [],
    };

    const steps = buildLessonSteps(mockLesson);
    expect(steps.length).toBe(1);
    expect(steps[0].sectionId).toBe("custom-heading-id-999");
  });

  it("8. Preserves exercise IDs accurately", () => {
    const mockLesson: Lesson = {
      id: "test-lesson-8",
      topicId: "test-topic",
      title: "Exercise ID Test",
      description: "Test description",
      difficulty: "Beginner",
      estimatedMinutes: 10,
      mastery: "Learning",
      sections: [
        {
          type: "interactive-sandbox",
          id: "sandbox-canonical-42",
          title: "Sandbox 42",
          initialCode: "console.log(42)",
        },
      ],
      exercises: [
        {
          id: "exercise-canonical-99",
          title: "Apply Exercise 99",
          brief: "Brief 99",
        },
      ],
      quiz: [],
      summary: "",
      resources: [],
      interviewQuestions: [],
    };

    const steps = buildLessonSteps(mockLesson);
    expect(steps.length).toBe(2);

    if (steps[0].type === "interactive-exercise") {
      expect(steps[0].exerciseId).toBe("sandbox-canonical-42");
    }
    if (steps[1].type === "interactive-exercise") {
      expect(steps[1].exerciseId).toBe("exercise-canonical-99");
    }
  });

  it("9. Ordering and step generation is strictly deterministic", () => {
    const mockLesson = lessonsData[0] as unknown as Lesson;

    const run1 = buildLessonSteps(mockLesson);
    const run2 = buildLessonSteps(mockLesson);

    expect(run1).toEqual(run2);
    expect(run1.map((s) => s.id)).toEqual(run2.map((s) => s.id));
    expect(run1.map((s) => s.type)).toEqual(run2.map((s) => s.type));
  });

  it("10. Successfully resolves real production lessons from lessons.json", () => {
    const allLessons = lessonsData as unknown as Lesson[];
    expect(allLessons.length).toBeGreaterThan(0);

    for (const prodLesson of allLessons) {
      const steps = buildLessonSteps(prodLesson);
      expect(steps.length).toBeGreaterThan(0);

      // Verify each step has valid presentation semantics and parent lesson reference
      for (const step of steps) {
        expect(step.lessonId).toBe(prodLesson.id);
        expect(["content", "code-example", "interactive-exercise", "quiz", "checkpoint"]).toContain(
          step.type,
        );

        if (step.type === "interactive-exercise") {
          expect(step.exerciseId).toBeDefined();
          expect(typeof step.hasValidation).toBe("boolean");
        } else if (step.type === "checkpoint") {
          expect(step.checkpointId).toBeDefined();
        } else if (step.type === "quiz") {
          expect(step.quizId).toBeDefined();
        }
      }
    }
  });

  describe("Deduplication of Interactive Exercises (Step 11)", () => {
    it("helper: getCanonicalExerciseId strips prefixes correctly", () => {
      expect(getCanonicalExerciseId("interactive-1-2-2-1")).toBe("1-2-2-1");
      expect(getCanonicalExerciseId("exercise-1-2-2-1")).toBe("1-2-2-1");
      expect(getCanonicalExerciseId("1-2-2-1")).toBe("1-2-2-1");
      expect(getCanonicalExerciseId(undefined)).toBe("");
    });

    it("1. Section-only interactive exercise produces exactly one step", () => {
      const mockLesson: Lesson = {
        id: "dedup-test-1",
        topicId: "t1",
        title: "Section Only",
        description: "d",
        difficulty: "Beginner",
        estimatedMinutes: 5,
        mastery: "Learning",
        sections: [
          {
            type: "interactive-sandbox",
            id: "interactive-101",
            title: "Sandbox 101",
            initialCode: "code",
          },
        ],
        exercises: [],
        quiz: [],
        summary: "",
        resources: [],
        interviewQuestions: [],
      };

      const steps = buildLessonSteps(mockLesson);
      const exSteps = steps.filter((s) => s.type === "interactive-exercise");
      expect(exSteps.length).toBe(1);
      expect((exSteps[0] as any).exerciseId).toBe("interactive-101");
    });

    it("2. lesson.exercises[]-only exercise produces exactly one step", () => {
      const mockLesson: Lesson = {
        id: "dedup-test-2",
        topicId: "t1",
        title: "Exercises Array Only",
        description: "d",
        difficulty: "Beginner",
        estimatedMinutes: 5,
        mastery: "Learning",
        sections: [{ type: "paragraph", text: "Just explanation" }],
        exercises: [
          {
            id: "exercise-202",
            title: "Standalone Exercise",
            brief: "Brief text",
            playgroundCode: "code",
          },
        ],
        quiz: [],
        summary: "",
        resources: [],
        interviewQuestions: [],
      };

      const steps = buildLessonSteps(mockLesson);
      const exSteps = steps.filter((s) => s.type === "interactive-exercise");
      expect(exSteps.length).toBe(1);
      expect((exSteps[0] as any).exerciseId).toBe("exercise-202");
    });

    it("3. Same canonical exercise ID in both sections[] and exercises[] produces exactly one step", () => {
      const mockValidationSpec: ExerciseValidationSpec = {
        exerciseId: "interactive-1-2-2-1",
        runtime: "html-css",
        assertions: [],
      };

      const mockLesson: Lesson = {
        id: "dedup-test-3",
        topicId: "t1",
        title: "Duplicate Exercise",
        description: "d",
        difficulty: "Beginner",
        estimatedMinutes: 5,
        mastery: "Learning",
        sections: [
          {
            type: "interactive-sandbox",
            id: "interactive-1-2-2-1",
            title: "Selector Lab",
            initialCode: "h1 {}",
            validation: mockValidationSpec,
          },
        ],
        exercises: [
          {
            id: "exercise-1-2-2-1",
            title: "Selector Matching",
            brief: "Appended duplicate exercise",
          },
        ],
        quiz: [],
        summary: "",
        resources: [],
        interviewQuestions: [],
      };

      const steps = buildLessonSteps(mockLesson);
      const exSteps = steps.filter((s) => s.type === "interactive-exercise");
      expect(exSteps.length).toBe(1);
      expect((exSteps[0] as any).exerciseId).toBe("interactive-1-2-2-1");
    });

    it("4. Different exercise IDs in sections[] and exercises[] remain as separate steps", () => {
      const mockLesson: Lesson = {
        id: "dedup-test-4",
        topicId: "t1",
        title: "Distinct Exercises",
        description: "d",
        difficulty: "Beginner",
        estimatedMinutes: 5,
        mastery: "Learning",
        sections: [
          {
            type: "interactive-sandbox",
            id: "interactive-301",
            title: "First Exercise",
            initialCode: "code1",
          },
        ],
        exercises: [
          {
            id: "exercise-302",
            title: "Second Exercise",
            brief: "Brief 302",
          },
        ],
        quiz: [],
        summary: "",
        resources: [],
        interviewQuestions: [],
      };

      const steps = buildLessonSteps(mockLesson);
      const exSteps = steps.filter((s) => s.type === "interactive-exercise");
      expect(exSteps.length).toBe(2);
      expect((exSteps[0] as any).exerciseId).toBe("interactive-301");
      expect((exSteps[1] as any).exerciseId).toBe("exercise-302");
    });

    it("5. Duplicate exercise IDs within exercises[] do not cause duplicate presentation steps", () => {
      const mockLesson: Lesson = {
        id: "dedup-test-5",
        topicId: "t1",
        title: "Repeated Array Items",
        description: "d",
        difficulty: "Beginner",
        estimatedMinutes: 5,
        mastery: "Learning",
        sections: [],
        exercises: [
          { id: "exercise-404", title: "Exercise A", brief: "A" },
          { id: "exercise-404", title: "Exercise A Duplicate", brief: "A" },
        ],
        quiz: [],
        summary: "",
        resources: [],
        interviewQuestions: [],
      };

      const steps = buildLessonSteps(mockLesson);
      const exSteps = steps.filter((s) => s.type === "interactive-exercise");
      expect(exSteps.length).toBe(1);
      expect((exSteps[0] as any).exerciseId).toBe("exercise-404");
    });

    it("6. The first section-based occurrence preserves its original position in the lesson", () => {
      const mockLesson: Lesson = {
        id: "dedup-test-6",
        topicId: "t1",
        title: "Position Test",
        description: "d",
        difficulty: "Beginner",
        estimatedMinutes: 5,
        mastery: "Learning",
        sections: [
          { type: "paragraph", text: "Intro paragraph" },
          {
            type: "interactive-sandbox",
            id: "interactive-505",
            title: "Inline Sandbox",
            initialCode: "code",
          },
          { type: "checkpoint", id: "cp-1", label: "Check progress" },
        ],
        exercises: [{ id: "exercise-505", title: "Appended Duplicate", brief: "b" }],
        quiz: [],
        summary: "Takeaways",
        resources: [],
        interviewQuestions: [],
      };

      const steps = buildLessonSteps(mockLesson);
      expect(steps.map((s) => s.type)).toEqual([
        "content",
        "interactive-exercise",
        "checkpoint",
        "content",
      ]);
      expect((steps[1] as any).exerciseId).toBe("interactive-505");
    });

    it("7. validationSpec remains unchanged for the retained section-based exercise", () => {
      const spec: ExerciseValidationSpec = {
        exerciseId: "interactive-606",
        runtime: "react",
        assertions: [
          {
            id: "a1",
            description: "check text",
            strategy: "dom_query",
            target: "div",
            expected: { exists: true },
          },
        ],
      };

      const mockLesson: Lesson = {
        id: "dedup-test-7",
        topicId: "t1",
        title: "Validation Preservation",
        description: "d",
        difficulty: "Beginner",
        estimatedMinutes: 5,
        mastery: "Learning",
        sections: [
          {
            type: "interactive-sandbox",
            id: "interactive-606",
            title: "Validated Sandbox",
            initialCode: "code",
            validation: spec,
          },
        ],
        exercises: [{ id: "exercise-606", title: "Overriding Meta Title", brief: "b" }],
        quiz: [],
        summary: "",
        resources: [],
        interviewQuestions: [],
      };

      const steps = buildLessonSteps(mockLesson);
      expect(steps.length).toBe(1);
      const exStep = steps[0] as any;
      expect(exStep.validation).toEqual(spec);
      expect(exStep.hasValidation).toBe(true);
    });

    it("8. Canonical exerciseId remains unchanged on resolved step", () => {
      const mockLesson: Lesson = {
        id: "dedup-test-8",
        topicId: "t1",
        title: "Canonical ID Check",
        description: "d",
        difficulty: "Beginner",
        estimatedMinutes: 5,
        mastery: "Learning",
        sections: [
          {
            type: "interactive-sandbox",
            id: "interactive-707",
            title: "Sandbox 707",
            initialCode: "code",
          },
        ],
        exercises: [{ id: "exercise-707", title: "Appended 707", brief: "b" }],
        quiz: [],
        summary: "",
        resources: [],
        interviewQuestions: [],
      };

      const steps = buildLessonSteps(mockLesson);
      expect(steps.length).toBe(1);
      expect((steps[0] as any).exerciseId).toBe("interactive-707");
    });
  });
});
