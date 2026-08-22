import { describe, it, expect } from "vitest";
import {
  buildLessonSteps,
  getCanonicalExerciseId,
  inferExerciseMode,
} from "./lesson-step-resolver";
import type { Lesson, ExerciseValidationSpec, InteractiveExerciseLessonStep } from "../types";
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
          { type: "heading", text: "Conceptual Overview of State Management" },
          {
            type: "paragraph",
            text: "This is a detailed conceptual explanation of React state lifecycle methods, render loops, dependency arrays, and pure functions in functional components. Understanding these principles helps prevent unexpected re-renders, infinite loops, and state synchronization bugs across large scale software architectures.",
          },
          {
            type: "paragraph",
            text: "When managing state in complex forms or deeply nested component trees, prefer lifted state or context providers over prop drilling.",
          },
          {
            type: "paragraph",
            text: "Review the rules of hooks carefully before proceeding to the code exercise.",
          },
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

  describe("Absorb Tiny Exercise Lead-In Steps (Step 12)", () => {
    it("1. Absorbs heading + short paragraph preceding an interactive exercise", () => {
      const mockLesson: Lesson = {
        id: "leadin-test-1",
        topicId: "t1",
        title: "Lead-In Test",
        description: "d",
        difficulty: "Beginner",
        estimatedMinutes: 5,
        mastery: "Learning",
        sections: [
          { type: "heading", text: "Practice: Write Your First CSS Rule" },
          { type: "paragraph", text: "Try writing a CSS rule before opening the exercise." },
          {
            type: "interactive-sandbox",
            id: "interactive-css-1",
            title: "Write a CSS Rule",
            initialCode: "p {}",
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
      expect(steps[0].type).toBe("interactive-exercise");
      if (steps[0].type === "interactive-exercise") {
        expect(steps[0].leadIn).toBeDefined();
        expect(steps[0].leadIn?.title).toBe("Practice: Write Your First CSS Rule");
        expect(steps[0].leadIn?.text).toBe("Try writing a CSS rule before opening the exercise.");
      }
    });

    it("2. Absorbs heading-only preceding an interactive exercise", () => {
      const mockLesson: Lesson = {
        id: "leadin-test-2",
        topicId: "t1",
        title: "Heading Only Lead-In",
        description: "d",
        difficulty: "Beginner",
        estimatedMinutes: 5,
        mastery: "Learning",
        sections: [
          { type: "heading", text: "Practice Drill 1: Which Elements Match?" },
          {
            type: "interactive-sandbox",
            id: "interactive-selector-lab",
            title: "Selector Matching Lab",
            initialCode: "p {}",
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
      expect(steps[0].type).toBe("interactive-exercise");
      if (steps[0].type === "interactive-exercise") {
        expect(steps[0].leadIn).toBeDefined();
        expect(steps[0].leadIn?.title).toBe("Practice Drill 1: Which Elements Match?");
      }
    });

    it("3. Absorbs single short paragraph preceding an interactive exercise", () => {
      const mockLesson: Lesson = {
        id: "leadin-test-3",
        topicId: "t1",
        title: "Paragraph Only Lead-In",
        description: "d",
        difficulty: "Beginner",
        estimatedMinutes: 5,
        mastery: "Learning",
        sections: [
          { type: "paragraph", text: "Try writing a CSS rule before opening the exercise." },
          {
            type: "interactive-sandbox",
            id: "interactive-css-2",
            title: "Write a CSS Rule",
            initialCode: "p {}",
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
      expect(steps[0].type).toBe("interactive-exercise");
      if (steps[0].type === "interactive-exercise") {
        expect(steps[0].leadIn).toBeDefined();
        expect(steps[0].leadIn?.text).toBe("Try writing a CSS rule before opening the exercise.");
      }
    });

    it("4. Does NOT absorb substantial conceptual content section before an exercise", () => {
      const longText =
        "Specificity is the set of rules browsers use to determine which CSS property values are most relevant to an element and, therefore, will be applied. Specificity is calculated based on the matching rules which are composed of different types of CSS selectors. Understanding specificity is crucial for writing clean, predictable CSS and debugging selector conflicts in large codebases.";
      const mockLesson: Lesson = {
        id: "leadin-test-4",
        topicId: "t1",
        title: "Substantial Concept",
        description: "d",
        difficulty: "Beginner",
        estimatedMinutes: 5,
        mastery: "Learning",
        sections: [
          { type: "heading", text: "Understanding Specificity Rules" },
          { type: "paragraph", text: longText },
          {
            type: "paragraph",
            text: "Paragraph two explaining more details about inline styles vs ID selectors vs classes.",
          },
          {
            type: "paragraph",
            text: "Paragraph three detailing universal selectors and inheritance rules in depth.",
          },
          {
            type: "interactive-sandbox",
            id: "interactive-css-3",
            title: "Specificity Challenge",
            initialCode: "p {}",
          },
        ],
        exercises: [],
        quiz: [],
        summary: "",
        resources: [],
        interviewQuestions: [],
      };

      const steps = buildLessonSteps(mockLesson);
      expect(steps.length).toBe(2);
      expect(steps[0].type).toBe("content");
      expect(steps[1].type).toBe("interactive-exercise");
      if (steps[1].type === "interactive-exercise") {
        expect(steps[1].leadIn).toBeUndefined();
      }
    });

    it("5. Does NOT absorb content containing code or heavy elements before an exercise", () => {
      const mockLesson: Lesson = {
        id: "leadin-test-5",
        topicId: "t1",
        title: "Heavy Lead-In",
        description: "d",
        difficulty: "Beginner",
        estimatedMinutes: 5,
        mastery: "Learning",
        sections: [
          { type: "heading", text: "Look at this example first" },
          { type: "code", language: "html", code: "<div class='card'>Test</div>" },
          {
            type: "interactive-sandbox",
            id: "interactive-css-4",
            title: "Style the Card",
            initialCode: ".card {}",
          },
        ],
        exercises: [],
        quiz: [],
        summary: "",
        resources: [],
        interviewQuestions: [],
      };

      const steps = buildLessonSteps(mockLesson);
      expect(steps.length).toBe(2);
      expect(steps[0].type).toBe("code-example");
      expect(steps[1].type).toBe("interactive-exercise");
    });
  });

  describe("Step 13: Pedagogical Step Ordering", () => {
    it("1. Moves appended exercises and quizzes before interview and reflection sections", () => {
      const mockLesson: Lesson = {
        id: "ordering-test-1",
        topicId: "t1",
        title: "Ordering Test",
        description: "d",
        difficulty: "Beginner",
        estimatedMinutes: 10,
        mastery: "Learning",
        sections: [
          { type: "heading", text: "Core Concept", id: "sec-1" },
          { type: "paragraph", text: "Here is the main concept explanation." },
          { type: "heading", text: "Interview Mode", id: "sec-2" },
          { type: "paragraph", text: "How would you explain this in an interview?" },
          { type: "heading", text: "Reflect", id: "sec-3" },
          { type: "paragraph", text: "Think about how you would apply this." },
        ],
        exercises: [
          {
            id: "ex-1",
            title: "Build the Feature",
            brief: "Complete the practice exercise.",
            playgroundCode: "const a = 1;",
          },
        ],
        quiz: [
          {
            id: "q-1",
            question: "What is the answer?",
            options: ["A", "B"],
            correctIndex: 0,
          },
        ],
        summary: "This is the final summary of what you learned.",
        resources: [],
        interviewQuestions: [],
      };

      const steps = buildLessonSteps(mockLesson);

      // Expected progression:
      // 0: Core Concept (content)
      // 1: Build the Feature (interactive-exercise)
      // 2: Check Your Understanding (quiz)
      // 3: Interview Mode (content)
      // 4: Reflect (content)
      // 5: Key Takeaway & Summary (content)
      expect(steps.map((s) => ({ type: s.type, title: s.title }))).toEqual([
        { type: "content", title: "Core Concept" },
        { type: "interactive-exercise", title: "Build the Feature" },
        { type: "quiz", title: "Check Your Understanding" },
        { type: "content", title: "Interview Mode" },
        { type: "content", title: "Reflect" },
        { type: "content", title: "Key Takeaway & Summary" },
      ]);
    });

    it("2. Preserves inline exercises right beside their corresponding concepts", () => {
      const mockLesson: Lesson = {
        id: "ordering-test-2",
        topicId: "t1",
        title: "Inline Exercises Ordering",
        description: "d",
        difficulty: "Beginner",
        estimatedMinutes: 10,
        mastery: "Learning",
        sections: [
          { type: "heading", text: "Concept One" },
          {
            type: "paragraph",
            text: "Concept one is a comprehensive structural foundation that describes the primary architectural system in full detail across multiple sentences to establish deep understanding of the domain and its operational principles.",
          },
          {
            type: "paragraph",
            text: "This section explores the core mechanics and behavioral lifecycles in depth, demonstrating how each part interacts with surrounding modules.",
          },
          {
            type: "paragraph",
            text: "Understanding these boundaries allows engineers to construct reliable, scalable architectures that resist common degradation patterns over time.",
          },
          {
            type: "interactive-sandbox",
            id: "sandbox-1",
            title: "Exercise One",
            initialCode: "// one",
          },
          { type: "heading", text: "Concept Two" },
          {
            type: "paragraph",
            text: "Concept two is an advanced conceptual layer that builds directly upon the previous foundation, introducing specialized behaviors, operational patterns, and detailed mechanisms needed for complete mastery.",
          },
          {
            type: "paragraph",
            text: "Engineers should pay careful attention to the data flow patterns between upstream providers and downstream consumers.",
          },
          {
            type: "paragraph",
            text: "Applying these principles ensures high predictability and minimizes runtime side effects across complex applications.",
          },
          {
            type: "interactive-sandbox",
            id: "sandbox-2",
            title: "Exercise Two",
            initialCode: "// two",
          },
          { type: "heading", text: "Interview Prep" },
          { type: "paragraph", text: "Interview questions." },
          { type: "heading", text: "Wrap Up" },
          { type: "paragraph", text: "Summary points." },
        ],
        exercises: [],
        quiz: [
          {
            id: "q-1",
            question: "Check understanding?",
            options: ["Yes", "No"],
            correctIndex: 0,
          },
        ],
        summary: "",
        resources: [],
        interviewQuestions: [],
      };

      const steps = buildLessonSteps(mockLesson);

      // Expected progression:
      // 0: Concept One
      // 1: Exercise One (inline)
      // 2: Concept Two
      // 3: Exercise Two (inline)
      // 4: Check Your Understanding (quiz moved before interview/wrap-up)
      // 5: Interview Prep
      // 6: Wrap Up
      expect(steps.map((s) => ({ type: s.type, title: s.title }))).toEqual([
        { type: "content", title: "Concept One" },
        { type: "interactive-exercise", title: "Exercise One" },
        { type: "content", title: "Concept Two" },
        { type: "interactive-exercise", title: "Exercise Two" },
        { type: "quiz", title: "Check Your Understanding" },
        { type: "content", title: "Interview Prep" },
        { type: "content", title: "Wrap Up" },
      ]);
    });

    it("3. Leaves lessons that are already in correct pedagogical order unchanged", () => {
      const mockLesson: Lesson = {
        id: "ordering-test-3",
        topicId: "t1",
        title: "Already Ordered Lesson",
        description: "d",
        difficulty: "Beginner",
        estimatedMinutes: 10,
        mastery: "Learning",
        sections: [
          { type: "heading", text: "Intro Concept" },
          {
            type: "paragraph",
            text: "Introductory concepts provide learners with the necessary mental model, domain glossary, and conceptual framework required to solve subsequent technical challenges effectively.",
          },
          {
            type: "paragraph",
            text: "Take time to study the anatomy of the structures presented before proceeding to active coding exercises.",
          },
          {
            type: "paragraph",
            text: "Each concept directly translates to patterns encountered in modern frontend software development workflows.",
          },
          {
            type: "interactive-sandbox",
            id: "sandbox-1",
            title: "Hands-on Practice",
            initialCode: "// practice",
          },
          {
            type: "checkpoint",
            id: "cp-1",
            label: "Can you do this?",
          },
          { type: "heading", text: "Interview Mode" },
          { type: "paragraph", text: "Interview question." },
          { type: "heading", text: "Lesson Summary" },
          { type: "paragraph", text: "Final summary notes." },
        ],
        exercises: [],
        quiz: [],
        summary: "",
        resources: [],
        interviewQuestions: [],
      };

      const steps = buildLessonSteps(mockLesson);

      expect(steps.map((s) => ({ type: s.type, title: s.title }))).toEqual([
        { type: "content", title: "Intro Concept" },
        { type: "interactive-exercise", title: "Hands-on Practice" },
        { type: "checkpoint", title: "Can you do this?" },
        { type: "content", title: "Interview Mode" },
        { type: "content", title: "Lesson Summary" },
      ]);
    });

    it("4. Conservative matching: does not treat non-conclusion headings as conclusions", () => {
      const mockLesson: Lesson = {
        id: "ordering-test-4",
        topicId: "t1",
        title: "Important Notes Lesson",
        description: "d",
        difficulty: "Beginner",
        estimatedMinutes: 10,
        mastery: "Learning",
        sections: [
          { type: "heading", text: "Important Architectural Details" },
          { type: "paragraph", text: "Remember to consider state management." },
          { type: "heading", text: "Think About Performance" },
          { type: "paragraph", text: "Performance is critical." },
        ],
        exercises: [
          {
            id: "ex-bench",
            title: "Benchmark Exercise",
            brief: "Benchmark the algorithm.",
            playgroundCode: "// bench",
          },
        ],
        quiz: [],
        summary: "",
        resources: [],
        interviewQuestions: [],
      };

      const steps = buildLessonSteps(mockLesson);

      // Since none of the sections are conclusion sections, the appended exercise simply comes at the end
      expect(steps.map((s) => ({ type: s.type, title: s.title }))).toEqual([
        { type: "content", title: "Important Architectural Details" },
        { type: "content", title: "Think About Performance" },
        { type: "interactive-exercise", title: "Benchmark Exercise" },
      ]);
    });

    it("5. Multiple appended exercises maintain their original sequential order", () => {
      const mockLesson: Lesson = {
        id: "ordering-test-5",
        topicId: "t1",
        title: "Multi Exercise Lesson",
        description: "d",
        difficulty: "Beginner",
        estimatedMinutes: 10,
        mastery: "Learning",
        sections: [
          { type: "heading", text: "Theory" },
          { type: "paragraph", text: "Explanation." },
          { type: "heading", text: "Explain It Yourself" },
          { type: "paragraph", text: "Self explanation." },
          { type: "heading", text: "Key Takeaways" },
          { type: "paragraph", text: "Takeaways." },
        ],
        exercises: [
          { id: "ex-a", title: "Exercise Alpha", brief: "Alpha", playgroundCode: "a;" },
          { id: "ex-b", title: "Exercise Beta", brief: "Beta", playgroundCode: "b;" },
          { id: "ex-c", title: "Exercise Gamma", brief: "Gamma", playgroundCode: "c;" },
        ],
        quiz: [{ id: "q1", question: "Quiz?", options: ["1", "2"] }],
        summary: "Summary text",
        resources: [],
        interviewQuestions: [],
      };

      const steps = buildLessonSteps(mockLesson);

      expect(steps.map((s) => ({ type: s.type, title: s.title }))).toEqual([
        { type: "content", title: "Theory" },
        { type: "interactive-exercise", title: "Exercise Alpha" },
        { type: "interactive-exercise", title: "Exercise Beta" },
        { type: "interactive-exercise", title: "Exercise Gamma" },
        { type: "quiz", title: "Check Your Understanding" },
        { type: "content", title: "Explain It Yourself" },
        { type: "content", title: "Key Takeaways" },
        { type: "content", title: "Key Takeaway & Summary" },
      ]);
    });

    it("6. Real production curriculum audit: lesson-1-2-1 follows complete pedagogical progression", () => {
      const lesson121 = (lessonsData as Lesson[]).find((l) => l.id === "lesson-1-2-1");
      expect(lesson121).toBeDefined();
      if (!lesson121) return;

      const steps = buildLessonSteps(lesson121);
      const types = steps.map((s) => s.type);

      // Verify the final steps are Quiz -> Interview -> Reflection -> Takeaways -> Summary
      const lastFive = steps.slice(-5);
      expect(lastFive.map((s) => ({ type: s.type, title: s.title }))).toEqual([
        { type: "quiz", title: "Check Your Understanding" },
        { type: "content", title: "Interview Mode" },
        { type: "content", title: "Reflect" },
        { type: "content", title: "What You Should Take Away" },
        { type: "content", title: "Key Takeaway & Summary" },
      ]);

      // Verify that no interactive exercises appear after the quiz or interview
      const quizIdx = steps.findIndex((s) => s.type === "quiz");
      const exercisesAfterQuiz = steps
        .slice(quizIdx + 1)
        .filter((s) => s.type === "interactive-exercise");
      expect(exercisesAfterQuiz.length).toBe(0);
    });

    it("7. Real production curriculum audit: lesson-3-1-8 (Capstones and multi-exercise lessons)", () => {
      const lesson318 = (lessonsData as Lesson[]).find((l) => l.id === "lesson-3-1-8");
      expect(lesson318).toBeDefined();
      if (!lesson318) return;

      const steps = buildLessonSteps(lesson318);

      // The last 6 steps should be Quiz -> Root-Cause Reflection -> Interview Mode -> Reflect -> What You Should Take Away -> Key Takeaway & Summary
      const lastSix = steps.slice(-6);
      expect(lastSix.map((s) => ({ type: s.type, title: s.title }))).toEqual([
        { type: "quiz", title: "Check Your Understanding" },
        { type: "content", title: "Root-Cause Reflection" },
        { type: "content", title: "Interview Mode" },
        { type: "content", title: "Reflect" },
        { type: "content", title: "What You Should Take Away" },
        { type: "content", title: "Key Takeaway & Summary" },
      ]);

      // All 3 capstone build exercises should precede the quiz
      const quizIdx = steps.findIndex((s) => s.type === "quiz");
      const precedingExercises = steps
        .slice(0, quizIdx)
        .filter((s) => s.type === "interactive-exercise");
      expect(precedingExercises.length).toBeGreaterThanOrEqual(3);
    });

    it("8. Curriculum-wide consistency: no lesson has interactive exercises or quizzes after closing sections", () => {
      for (const lesson of lessonsData as Lesson[]) {
        const steps = buildLessonSteps(lesson);
        const firstClosingIdx = steps.findIndex(
          (s) =>
            s.type === "content" &&
            (/^(interview|reflection|reflect|module\s+reflection|project\s+reflection|root-cause\s+reflection|what\s+would\s+you\s+say|explain\s+it\s+yourself)/i.test(
              s.title || "",
            ) ||
              s.origin === "summary" ||
              /^(key\s+takeaway|what\s+you\s+should\s+take\s+away|lesson\s+summary|summary|conclusion|wrap\s+up|recap|final\s+thoughts)/i.test(
                s.title || "",
              )),
        );

        if (firstClosingIdx !== -1) {
          const tail = steps.slice(firstClosingIdx);
          const exercisesAfterClosing = tail.filter((s) => s.type === "interactive-exercise");
          const quizzesAfterClosing = tail.filter((s) => s.type === "quiz");

          expect(exercisesAfterClosing.length).toBe(0);
          expect(quizzesAfterClosing.length).toBe(0);
        }
      }
    });
  });

  describe("Phase 6 Step 13B - Interactive Exercise Presentation Classification & Modes", () => {
    it("1. Correctly classifies Prototype A (interactive-0-1-1: Multiple Choice)", () => {
      const lesson = (lessonsData as Lesson[]).find((l) => l.id === "lesson-0-1-1");
      expect(lesson).toBeDefined();
      if (!lesson) return;

      const steps = buildLessonSteps(lesson);
      const exStep = steps.find(
        (s) => s.type === "interactive-exercise" && s.exerciseId === "interactive-0-1-1",
      ) as InteractiveExerciseLessonStep;

      expect(exStep).toBeDefined();
      expect(exStep.mode).toBe("multiple-choice");
      expect(exStep.editorRequired).toBe(false);
    });

    it("2. Correctly classifies Prototype B (interactive-1-2-1: Prediction / CSS Detective)", () => {
      const lesson = (lessonsData as Lesson[]).find((l) => l.id === "lesson-1-2-1");
      expect(lesson).toBeDefined();
      if (!lesson) return;

      const steps = buildLessonSteps(lesson);
      const exStep = steps.find(
        (s) => s.type === "interactive-exercise" && s.exerciseId === "interactive-1-2-1",
      ) as InteractiveExerciseLessonStep;

      expect(exStep).toBeDefined();
      expect(exStep.mode).toBe("prediction");
      expect(exStep.editorRequired).toBe(false);
    });

    it("3. Correctly classifies Prototype C (interactive-2-2-8-1: Reveal / Async Lab)", () => {
      const lesson = (lessonsData as Lesson[]).find((l) => l.id === "lesson-2-2-8");
      expect(lesson).toBeDefined();
      if (!lesson) return;

      const steps = buildLessonSteps(lesson);
      const exStep = steps.find(
        (s) =>
          s.type === "interactive-exercise" &&
          (s.exerciseId === "interactive-2-2-8-1" ||
            s.exerciseId === "exercise-2-2-8-1" ||
            s.exerciseId === "2-2-8-1"),
      ) as InteractiveExerciseLessonStep;

      expect(exStep).toBeDefined();
      expect(exStep.mode).toBe("reveal");
      expect(exStep.editorRequired).toBe(false);
    });

    it("4. Correctly classifies Prototype D (interactive-1-1-2: Code Fix / Debugging)", () => {
      const lesson = (lessonsData as Lesson[]).find((l) => l.id === "lesson-1-1-2");
      expect(lesson).toBeDefined();
      if (!lesson) return;

      const steps = buildLessonSteps(lesson);
      const exStep = steps.find(
        (s) => s.type === "interactive-exercise" && s.exerciseId === "interactive-1-1-2",
      ) as InteractiveExerciseLessonStep;

      expect(exStep).toBeDefined();
      expect(exStep.mode).toBe("code-fix");
      expect(exStep.editorRequired).toBe(true);
    });

    it("5. Correctly classifies Prototype E (interactive-1-1-1-2: Code Completion / Authoring)", () => {
      const lesson = (lessonsData as Lesson[]).find((l) => l.id === "lesson-1-1-1");
      expect(lesson).toBeDefined();
      if (!lesson) return;

      const steps = buildLessonSteps(lesson);
      const exStep = steps.find(
        (s) => s.type === "interactive-exercise" && s.exerciseId === "interactive-1-1-1-2",
      ) as InteractiveExerciseLessonStep;

      expect(exStep).toBeDefined();
      expect(exStep.mode).toBe("code-completion");
      expect(exStep.editorRequired).toBe(true);
    });

    it("6. Correctly classifies Prototype F (exercise-0-1-5-1: Conceptual Reflection / Forge Loop)", () => {
      const lesson = (lessonsData as Lesson[]).find((l) => l.id === "lesson-0-1-5");
      expect(lesson).toBeDefined();
      if (!lesson) return;

      const steps = buildLessonSteps(lesson);
      const exStep = steps.find(
        (s) =>
          s.type === "interactive-exercise" &&
          (s.exerciseId === "exercise-0-1-5-1" || s.exerciseId === "0-1-5-1"),
      ) as InteractiveExerciseLessonStep;

      expect(exStep).toBeDefined();
      expect(exStep.mode).toBe("reveal");
      expect(exStep.editorRequired).toBe(false);
    });

    it("7. Directly validates inferExerciseMode standalone unit tests", () => {
      const mcResult = inferExerciseMode({
        id: "mc-1",
        title: "Frontend Detective",
        instructions: "Choose which role is responsible for each task.",
        initialCode: "const scenarios = [{ task: 'Design buttons', answer: 'Design' }];",
        source: "section",
      });
      expect(mcResult.mode).toBe("multiple-choice");
      expect(mcResult.editorRequired).toBe(false);

      const predResult = inferExerciseMode({
        id: "pred-1",
        title: "CSS Rule Detective",
        instructions: "Before revealing the answer, predict what will happen.",
        initialCode: "<style>#demo { color: red; }</style>",
        source: "section",
      });
      expect(predResult.mode).toBe("prediction");
      expect(predResult.editorRequired).toBe(false);

      const fixResult = inferExerciseMode({
        id: "fix-1",
        title: "Fix the Broken Layout",
        instructions: "Debug and repair the broken styles below.",
        initialCode: ".box { display: flex; }",
        source: "section",
      });
      expect(fixResult.mode).toBe("code-fix");
      expect(fixResult.editorRequired).toBe(true);
    });

    it("8. Validates compact code challenge sizing and preview inference", () => {
      // 1. Small HTML attribute fix -> compact + showPreview: true
      const compactHtml = inferExerciseMode({
        id: "ex-attr",
        title: "Add Attributes",
        instructions: "Add href and target attributes to the link.",
        initialCode: "<a >Click here</a>",
        language: "html",
        source: "section",
      });
      expect(compactHtml.challengeSize).toBe("compact");
      expect(compactHtml.showPreview).toBe(true);

      // 2. React component -> standard
      const reactEx = inferExerciseMode({
        id: "ex-react",
        title: "Build a Counter",
        instructions: "Implement useState to update the count.",
        initialCode:
          "import React, { useState } from 'react';\nexport default function Counter() { return null; }",
        language: "jsx",
        source: "section",
      });
      expect(reactEx.challengeSize).toBe("standard");
      expect(reactEx.showPreview).toBe(true);

      // 3. Mini Project / Capstone -> project
      const projEx = inferExerciseMode({
        id: "ex-proj",
        title: "Mini Project: Lesson Tracker",
        instructions: "Build the complete interactive dashboard.",
        initialCode: "function run() {}",
        source: "section",
      });
      expect(projEx.challengeSize).toBe("project");

      // 4. Canonical lesson-1-1-1 interactive exercise is resolved as compact
      const lesson = (lessonsData as Lesson[]).find((l) => l.id === "lesson-1-1-1");
      expect(lesson).toBeDefined();
      if (!lesson) return;

      const steps = buildLessonSteps(lesson);
      const movePara = steps.find(
        (s) => s.type === "interactive-exercise" && s.exerciseId === "interactive-1-1-1",
      ) as InteractiveExerciseLessonStep;

      expect(movePara).toBeDefined();
      expect(movePara.challengeSize).toBe("compact");
      expect(movePara.showPreview).toBe(true);
    });
  });
});
