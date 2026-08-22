import { describe, it, expect } from "vitest";
import { buildLessonSteps } from "./lesson-step-resolver";
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
});
