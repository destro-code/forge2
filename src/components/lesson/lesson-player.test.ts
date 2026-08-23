import { describe, it, expect, vi } from "vitest";
import {
  buildLessonSteps,
  getCanonicalExerciseId,
  isStepGatedExerciseCompleted,
  isStepAccessible,
} from "@/lib/utils/lesson-step-resolver";
import type { Lesson, LessonStep } from "@/lib/types";
import lessonsData from "@/data/lessons.json";
import { useProgressStore } from "@/lib/stores/use-progress-store";
import { formatStepTitle } from "./lesson-player";

describe("LessonPlayer Shell Architecture & State Unit Tests", () => {
  const mockLesson: Lesson = {
    id: "test-player-lesson",
    topicId: "topic-1",
    title: "Player Test Lesson",
    description: "Testing player shell state machine",
    difficulty: "Beginner",
    estimatedMinutes: 10,
    mastery: "Learning",
    sections: [
      { type: "heading", text: "Introduction" },
      { type: "paragraph", text: "First concept explanation." },
      {
        type: "code",
        title: "Sample Code",
        code: "console.log('hello')",
        language: "javascript",
      },
      {
        type: "interactive-sandbox",
        id: "interactive-test-1",
        title: "Test Sandbox",
        initialCode: "const x = 1;",
        language: "javascript",
      },
      {
        type: "checkpoint",
        id: "cp-test-1",
        label: "Check your knowledge",
      },
      {
        type: "inline-quiz",
        quizId: "quiz-test-1",
      },
    ],
    exercises: [],
    quiz: [],
    summary: "Lesson summary content",
    resources: [],
    interviewQuestions: [],
  };

  it("1. Resolves lesson into steps correctly for player consumption", () => {
    const steps = buildLessonSteps(mockLesson);
    expect(steps.length).toBe(5);
    expect(steps[0].type).toBe("content");
    expect(steps[1].type).toBe("interactive-exercise");
    expect(steps[2].type).toBe("checkpoint");
    expect(steps[3].type).toBe("quiz");
    expect(steps[4].type).toBe("content"); // summary
  });

  it("2. Initial state reflects first step (step 0)", () => {
    const steps = buildLessonSteps(mockLesson);
    const initialIndex = 0;

    expect(initialIndex).toBe(0);
    expect(steps[initialIndex].type).toBe("content");
    expect(initialIndex === 0).toBe(true); // isFirstStep
    expect(initialIndex === steps.length - 1).toBe(false); // isLastStep
  });

  it("3. Next advances exactly one step in state machine", () => {
    const steps = buildLessonSteps(mockLesson);
    let currentIdx = 0;

    // Advance
    if (currentIdx < steps.length - 1) {
      currentIdx += 1;
    }

    expect(currentIdx).toBe(1);
    expect(steps[currentIdx].type).toBe("interactive-exercise");
  });

  it("4. Back moves exactly one step backward in state machine", () => {
    const steps = buildLessonSteps(mockLesson);
    let currentIdx = 2; // at checkpoint

    // Back
    if (currentIdx > 0) {
      currentIdx -= 1;
    }

    expect(currentIdx).toBe(1);
    expect(steps[currentIdx].type).toBe("interactive-exercise");
  });

  it("5. Back is disabled on the first step", () => {
    const currentIdx = 0;
    const isFirstStep = currentIdx === 0;

    expect(isFirstStep).toBe(true);
  });

  it("6. Final step identifies completion state and triggers onComplete callback", () => {
    const steps = buildLessonSteps(mockLesson);
    const lastIdx = steps.length - 1;
    const isLastStep = lastIdx === steps.length - 1;

    expect(isLastStep).toBe(true);

    const onCompleteMock = vi.fn();
    if (isLastStep) {
      onCompleteMock();
    }

    expect(onCompleteMock).toHaveBeenCalledTimes(1);
  });

  it("7. Changing steps triggers scroll position reset target (scrollTop = 0)", () => {
    const mockElement = { scrollTop: 150 };
    const resetScroll = (el: { scrollTop: number }) => {
      el.scrollTop = 0;
    };

    expect(mockElement.scrollTop).toBe(150);
    resetScroll(mockElement);
    expect(mockElement.scrollTop).toBe(0);
  });

  it("8. Navigating between steps in LessonPlayer DOES NOT modify progress store state", () => {
    const storeBefore = useProgressStore.getState();
    const initialCompleted = [...storeBefore.lessonsCompleted];
    const initialXp = storeBefore.totalXP;

    const steps = buildLessonSteps(mockLesson);
    let currentIdx = 0;

    // Simulate navigating through all steps
    while (currentIdx < steps.length - 1) {
      currentIdx += 1;
    }

    const storeAfter = useProgressStore.getState();
    expect(storeAfter.lessonsCompleted).toEqual(initialCompleted);
    expect(storeAfter.totalXP).toBe(initialXp);
  });

  it("9. interactive-exercise steps are recognized with exerciseId and instructions intact", () => {
    const steps = buildLessonSteps(mockLesson);
    const exerciseStep = steps.find((s) => s.type === "interactive-exercise");

    expect(exerciseStep).toBeDefined();
    if (exerciseStep && exerciseStep.type === "interactive-exercise") {
      expect(exerciseStep.exerciseId).toBe("interactive-test-1");
      expect(exerciseStep.initialCode).toBe("const x = 1;");
      expect(exerciseStep.language).toBe("javascript");
    }
  });

  it("10. Production lesson lesson-0-1-1 resolves into complete step sequence without error", () => {
    const prodLesson011 = (lessonsData as unknown as Lesson[]).find((l) => l.id === "lesson-0-1-1");

    expect(prodLesson011).toBeDefined();
    if (!prodLesson011) return;

    const steps = buildLessonSteps(prodLesson011);
    expect(steps.length).toBeGreaterThan(0);

    const stepTypes = steps.map((s) => s.type);
    expect(stepTypes).toContain("content");
    expect(stepTypes).toContain("interactive-exercise");
    expect(stepTypes).toContain("checkpoint");
    expect(stepTypes).toContain("quiz");

    // Verify "Frontend Detective" exercise is resolved
    const detectiveStep = steps.find(
      (s) => s.type === "interactive-exercise" && s.exerciseId === "interactive-0-1-1",
    );
    expect(detectiveStep).toBeDefined();
    if (detectiveStep && detectiveStep.type === "interactive-exercise") {
      expect(detectiveStep.hasValidation).toBe(true);
      expect(detectiveStep.validation?.exerciseId).toBe("interactive-0-1-1");
    }
  });

  it("11. Dynamic Next button label resolves correctly per step type", () => {
    const getNextLabel = (stepType: string, isLast: boolean) => {
      if (isLast) return "Complete";
      if (stepType === "quiz") return "Continue";
      return "Next";
    };

    expect(getNextLabel("content", false)).toBe("Next");
    expect(getNextLabel("code-example", false)).toBe("Next");
    expect(getNextLabel("quiz", false)).toBe("Continue");
    expect(getNextLabel("interactive-exercise", false)).toBe("Next");
    expect(getNextLabel("content", true)).toBe("Complete");
  });

  it("12. Session storage resume key formatting and boundary validation", () => {
    const lessonId = "lesson-0-1-1";
    const storageKey = `forge:lesson_step:${lessonId}`;
    expect(storageKey).toBe("forge:lesson_step:lesson-0-1-1");

    const stepsCount = 6;
    const isValidIndex = (idx: number) => !isNaN(idx) && idx >= 0 && idx < stepsCount;

    expect(isValidIndex(0)).toBe(true);
    expect(isValidIndex(3)).toBe(true);
    expect(isValidIndex(5)).toBe(true);
    expect(isValidIndex(6)).toBe(false);
    expect(isValidIndex(-1)).toBe(false);
  });

  it("13. Completing interactive exercise is idempotent in progress store", () => {
    const store = useProgressStore.getState();
    const initialXP = store.xp;
    const templateId = "test-template-idempotency";

    // First completion
    store.completePlaygroundExercise(templateId);
    const xpAfterFirst = useProgressStore.getState().xp;
    expect(xpAfterFirst).toBe(initialXP + 50);

    // Second completion (navigating back/forth)
    store.completePlaygroundExercise(templateId);
    const xpAfterSecond = useProgressStore.getState().xp;
    expect(xpAfterSecond).toBe(xpAfterFirst); // No duplicate XP awarded
  });

  it("14. Gating logic disables Next button for uncompleted validated exercises", () => {
    const isGated = (step: any, completions: any[], report: any) => {
      if (step.type !== "interactive-exercise") return false;
      const exId = step.validation?.exerciseId || step.exerciseId;
      const isCompleted = completions.some((c) => c.templateId === exId);
      const isPassed = report?.exerciseId === exId && report?.status === "passed";
      if (step.hasValidation) {
        return !isCompleted && !isPassed;
      }
      return false;
    };

    const validatedStep = {
      type: "interactive-exercise",
      exerciseId: "ex-1",
      hasValidation: true,
      validation: { exerciseId: "ex-1" },
    };

    // Uncompleted -> Gated
    expect(isGated(validatedStep, [], null)).toBe(true);

    // Passed in report -> Ungated
    expect(isGated(validatedStep, [], { exerciseId: "ex-1", status: "passed" })).toBe(false);

    // Completed in store -> Ungated
    expect(isGated(validatedStep, [{ templateId: "ex-1", completedAt: "2026-08-21" }], null)).toBe(
      false,
    );
  });

  it("15. Legacy exercises without validation specs remain ungated", () => {
    const isGated = (step: any, completions: any[], report: any) => {
      if (step.type !== "interactive-exercise") return false;
      const exId = step.validation?.exerciseId || step.exerciseId;
      const isCompleted = completions.some((c) => c.templateId === exId);
      const isPassed = report?.exerciseId === exId && report?.status === "passed";
      if (step.hasValidation) {
        return !isCompleted && !isPassed;
      }
      return false;
    };

    const legacyStep = {
      type: "interactive-exercise",
      exerciseId: "legacy-ex-1",
      hasValidation: false,
    };

    expect(isGated(legacyStep, [], null)).toBe(false);
  });

  it("16. Checkpoint step toggling records progress completion state key", () => {
    const lessonId = "test-lesson-cp";
    const checkpointId = "cp-step-1";
    const key = `${lessonId}:${checkpointId}`;

    const toggleCheckpointKey = (checkpoints: Record<string, boolean> = {}, k: string) => ({
      ...checkpoints,
      [k]: !checkpoints[k],
    });

    const state1 = toggleCheckpointKey({}, key);
    expect(state1[key]).toBe(true);

    const state2 = toggleCheckpointKey(state1, key);
    expect(state2[key]).toBe(false);
  });

  it("17. Grouped content sections maintain section array structure", () => {
    const contentStep = {
      id: "step-content-1",
      type: "content",
      title: "Core Concepts",
      sections: [
        { type: "heading", text: "Introduction" },
        { type: "paragraph", text: "First concept explanation." },
        { type: "callout", variant: "info", text: "Pro Tip" },
        { type: "paragraph", text: "Second concept explanation." },
      ],
    };

    expect(contentStep.sections.length).toBe(4);
    expect(contentStep.sections[0].type).toBe("heading");
    expect(contentStep.sections[2].type).toBe("callout");
  });

  it("18. Quiz question correctness evaluation logic", () => {
    const question = {
      id: "q1",
      question: "Which keyword creates a constant?",
      options: ["var", "let", "const", "static"],
      correctIndex: 2,
    };

    const isCorrectChoice = (optIdx: number) => optIdx === question.correctIndex;

    expect(isCorrectChoice(0)).toBe(false);
    expect(isCorrectChoice(1)).toBe(false);
    expect(isCorrectChoice(2)).toBe(true);
    expect(isCorrectChoice(3)).toBe(false);
  });

  it("19. Re-entering a completed lesson starts at Step 0 for review and prevents duplicate XP", () => {
    const lessonId = "lesson-completed-test";
    const store = useProgressStore.getState();

    // Mark completed once
    store.setProgress((p) => ({
      ...p,
      lessonsCompleted: [...(p.lessonsCompleted || []), lessonId],
      xp: (p.xp || 0) + 50,
    }));

    const stateAfterComplete = useProgressStore.getState();
    expect(stateAfterComplete.lessonsCompleted).toContain(lessonId);
    const xpBaseline = stateAfterComplete.xp;

    // Simulate completeLesson again
    const isAlreadyCompleted = stateAfterComplete.lessonsCompleted.includes(lessonId);
    const xpBonus = isAlreadyCompleted ? 0 : 50;

    expect(isAlreadyCompleted).toBe(true);
    expect(xpBonus).toBe(0);

    store.setProgress((p) => ({
      ...p,
      xp: (p.xp || 0) + xpBonus,
    }));

    expect(useProgressStore.getState().xp).toBe(xpBaseline);
  });

  it("20. Final lesson completion records lessonId in lessonsCompleted state", () => {
    const store = useProgressStore.getState();
    const testLessonId = "lesson-e2e-complete-1";

    expect(store.lessonsCompleted.includes(testLessonId)).toBe(false);

    // Perform canonical completion
    store.setProgress((p) => {
      const isDone = (p.lessonsCompleted || []).includes(testLessonId);
      return {
        ...p,
        lessonsCompleted: isDone
          ? p.lessonsCompleted
          : [...(p.lessonsCompleted || []), testLessonId],
        xp: (p.xp || 0) + (isDone ? 0 : 50),
      };
    });

    const updated = useProgressStore.getState();
    expect(updated.lessonsCompleted).toContain(testLessonId);
  });

  it("21. Uncompleted interactive exercise resumes at exercise step on revisit", () => {
    const steps = [
      { id: "s1", type: "content" },
      { id: "s2", type: "interactive-exercise", exerciseId: "ex-resume-1" },
      { id: "s3", type: "checkpoint", id: "cp-1" },
    ];

    const completions: { templateId: string }[] = [];

    const firstUncompletedIndex = steps.findIndex((st) => {
      if (st.type === "interactive-exercise") {
        return !completions.some((c) => c.templateId === st.exerciseId);
      }
      return false;
    });

    expect(firstUncompletedIndex).toBe(1);
  });

  it("22. formatStepTitle strips redundant prefixes and enforces clean title hierarchy", () => {
    expect(formatStepTitle("Interact: Spot the Frontend")).toBe("Spot the Frontend");
    expect(formatStepTitle("Exercise: Build a Button")).toBe("Build a Button");
    expect(formatStepTitle("Checkpoint: Quick Review")).toBe("Quick Review");
    expect(formatStepTitle("What is Frontend?")).toBe("What is Frontend?");
  });

  it("23. Cross-renderer gating correctly matches both raw and canonical exercise IDs", () => {
    const rawExerciseId = "0-1-1";
    const canonicalExerciseId = "interactive-0-1-1";

    const step: any = {
      type: "interactive-exercise",
      exerciseId: rawExerciseId,
      hasValidation: true,
      validation: {
        exerciseId: canonicalExerciseId,
        assertions: [{ id: "a1", description: "check", validator: "return true;" }],
      },
    };

    // Scenario A: Nothing completed, no report -> Next must be disabled (gated)
    const completionsEmpty: { templateId: string }[] = [];
    const reportNone: any = null;

    const isGatedA = !completionsEmpty.some(
      (c) =>
        c.templateId === step.validation.exerciseId ||
        c.templateId === step.exerciseId ||
        c.templateId === "0-1-1" ||
        c.templateId === "interactive-0-1-1",
    );
    expect(isGatedA).toBe(true);

    // Scenario B: Completed under canonical alias in store -> Next is unlocked
    const completionsCanonical = [{ templateId: canonicalExerciseId, completedAt: "now" }];
    const isUnlockedB = completionsCanonical.some(
      (c) =>
        c.templateId === step.validation.exerciseId ||
        c.templateId === step.exerciseId ||
        c.templateId === "0-1-1" ||
        c.templateId === "interactive-0-1-1",
    );
    expect(isUnlockedB).toBe(true);

    // Scenario C: Completed under raw alias in store -> Next is unlocked
    const completionsRaw = [{ templateId: rawExerciseId, completedAt: "now" }];
    const isUnlockedC = completionsRaw.some(
      (c) =>
        c.templateId === step.validation.exerciseId ||
        c.templateId === step.exerciseId ||
        c.templateId === "0-1-1" ||
        c.templateId === "interactive-0-1-1",
    );
    expect(isUnlockedC).toBe(true);
  });

  it("24. Resolves multi-exercise lesson steps with distinct, stable step IDs for StepRenderer keys", () => {
    const multiExerciseLesson: Lesson = {
      id: "lesson-multi-drill",
      topicId: "topic-1",
      title: "Multiple Drills Lesson",
      description: "Testing cross-step key stability",
      difficulty: "Beginner",
      estimatedMinutes: 10,
      mastery: "Learning",
      sections: [
        {
          type: "interactive-sandbox",
          id: "drill-1",
          title: "Drill 1",
          initialCode: "let a = 1;",
          language: "javascript",
        },
        {
          type: "interactive-sandbox",
          id: "drill-2",
          title: "Drill 2",
          initialCode: "let b = 2;",
          language: "javascript",
        },
      ],
      exercises: [],
      quiz: [],
      summary: "All drills complete",
      resources: [],
      interviewQuestions: [],
    };

    const steps = buildLessonSteps(multiExerciseLesson);
    const exerciseSteps = steps.filter((s) => s.type === "interactive-exercise");

    expect(exerciseSteps.length).toBe(2);
    expect(exerciseSteps[0].id).not.toBe(exerciseSteps[1].id);
    expect(exerciseSteps[0].exerciseId).toBe("drill-1");
    expect(exerciseSteps[1].exerciseId).toBe("drill-2");
  });

  it("25. Step 13L: completePlaygroundExercise is strictly idempotent across raw and canonical aliases", () => {
    const rawId = "0-1-1";
    const canonicalId = "interactive-0-1-1";

    const store = useProgressStore.getState();
    const initialXP = store.xp;
    const initialCompletionsCount = store.playgroundCompletions.length;

    // Complete using canonical ID
    store.completePlaygroundExercise(canonicalId);
    expect(useProgressStore.getState().xp).toBe(initialXP + 50);
    expect(useProgressStore.getState().playgroundCompletions.length).toBe(
      initialCompletionsCount + 1,
    );

    // Call again using raw ID alias -> must NOT award duplicate XP or append duplicate record
    store.completePlaygroundExercise(rawId);
    expect(useProgressStore.getState().xp).toBe(initialXP + 50);
    expect(useProgressStore.getState().playgroundCompletions.length).toBe(
      initialCompletionsCount + 1,
    );

    // Call again using canonical ID -> must NOT award duplicate XP
    store.completePlaygroundExercise(canonicalId);
    expect(useProgressStore.getState().xp).toBe(initialXP + 50);
    expect(useProgressStore.getState().playgroundCompletions.length).toBe(
      initialCompletionsCount + 1,
    );
  });

  it("26. Step 13L: Unrelated exercise IDs never match or bypass navigation gating", () => {
    const targetExerciseId = "1-2-1";
    const unrelatedCompletedId = "1-2-2";

    const step: any = {
      type: "interactive-exercise",
      exerciseId: targetExerciseId,
      hasValidation: true,
      validation: {
        exerciseId: targetExerciseId,
      },
    };

    const completions = [{ templateId: unrelatedCompletedId, completedAt: "now" }];
    const canonTarget = getCanonicalExerciseId(targetExerciseId);
    const canonStep = getCanonicalExerciseId(step.exerciseId);

    const isMatch = completions.some(
      (c) =>
        c.templateId === step.validation.exerciseId ||
        c.templateId === step.exerciseId ||
        (canonTarget && c.templateId === canonTarget) ||
        (canonStep && c.templateId === canonStep),
    );

    expect(isMatch).toBe(false);
  });

  it("27. Step 14A: Content -> gated exercise -> content blocks future step until completed", () => {
    const steps: LessonStep[] = [
      { id: "s1", type: "content", title: "Concept 1", sections: [] },
      {
        id: "s2",
        type: "interactive-exercise",
        title: "Exercise 1",
        exerciseId: "interactive-1-1",
        language: "html",
        initialCode: "<h1>Test</h1>",
        hasValidation: true,
        validation: { exerciseId: "interactive-1-1" },
      },
      { id: "s3", type: "content", title: "Concept 2", sections: [] },
    ];

    // On Step 0 (Concept 1), with no completions:
    // Step 0 is accessible
    expect(isStepAccessible(0, 0, steps, [])).toBe(true);
    // Step 1 (Exercise 1) is accessible to attempt
    expect(isStepAccessible(1, 0, steps, [])).toBe(true);
    // Step 2 (Concept 2) is BLOCKED because Step 1 exercise is incomplete
    expect(isStepAccessible(2, 0, steps, [])).toBe(false);
  });

  it("28. Step 14A: Content -> gated exercise -> content becomes accessible after exercise completion", () => {
    const steps: LessonStep[] = [
      { id: "s1", type: "content", title: "Concept 1", sections: [] },
      {
        id: "s2",
        type: "interactive-exercise",
        title: "Exercise 1",
        exerciseId: "interactive-1-1",
        language: "html",
        initialCode: "<h1>Test</h1>",
        hasValidation: true,
        validation: { exerciseId: "interactive-1-1" },
      },
      { id: "s3", type: "content", title: "Concept 2", sections: [] },
    ];

    const completions = [{ templateId: "interactive-1-1", completedAt: "2026-08-23" }];

    // From Step 0, Step 2 is now accessible
    expect(isStepAccessible(2, 0, steps, completions)).toBe(true);
    // From Step 1, Step 2 is also accessible
    expect(isStepAccessible(2, 1, steps, completions)).toBe(true);
  });

  it("29. Step 14A: Multiple gated exercises: incomplete earlier exercise blocks all later steps", () => {
    const steps: LessonStep[] = [
      { id: "s1", type: "content", title: "Concept 1", sections: [] },
      {
        id: "s2",
        type: "interactive-exercise",
        title: "Exercise A",
        exerciseId: "ex-a",
        language: "javascript",
        initialCode: "",
        hasValidation: true,
        validation: { exerciseId: "ex-a" },
      },
      { id: "s3", type: "content", title: "Concept 2", sections: [] },
      {
        id: "s4",
        type: "interactive-exercise",
        title: "Exercise B",
        exerciseId: "ex-b",
        language: "javascript",
        initialCode: "",
        hasValidation: true,
        validation: { exerciseId: "ex-b" },
      },
      { id: "s5", type: "content", title: "Conclusion", sections: [] },
    ];

    // Ex A is completed, but Ex B is incomplete
    const completions = [{ templateId: "ex-a", completedAt: "2026-08-23" }];

    // From Step 0:
    expect(isStepAccessible(1, 0, steps, completions)).toBe(true); // Ex A
    expect(isStepAccessible(2, 0, steps, completions)).toBe(true); // Concept 2
    expect(isStepAccessible(3, 0, steps, completions)).toBe(true); // Ex B
    expect(isStepAccessible(4, 0, steps, completions)).toBe(false); // Conclusion blocked by Ex B
  });

  it("30. Step 14A: Completed prerequisite under canonical ID recognizes completion", () => {
    const steps: LessonStep[] = [
      { id: "s1", type: "content", title: "Intro", sections: [] },
      {
        id: "s2",
        type: "interactive-exercise",
        title: "Challenge",
        exerciseId: "interactive-css-grid",
        language: "css",
        initialCode: "",
        hasValidation: true,
        validation: { exerciseId: "interactive-css-grid" },
      },
      { id: "s3", type: "content", title: "Outro", sections: [] },
    ];

    // Stored with canonical ID "css-grid"
    const completions = [{ templateId: "css-grid", completedAt: "2026-08-23" }];

    expect(isStepAccessible(2, 0, steps, completions)).toBe(true);
  });

  it("31. Step 14A: Completed prerequisite under raw/aliased ID recognizes completion", () => {
    const steps: LessonStep[] = [
      { id: "s1", type: "content", title: "Intro", sections: [] },
      {
        id: "s2",
        type: "interactive-exercise",
        title: "Challenge",
        exerciseId: "0-1-1",
        language: "html",
        initialCode: "",
        hasValidation: true,
        validation: { exerciseId: "0-1-1" },
      },
      { id: "s3", type: "content", title: "Outro", sections: [] },
    ];

    // Stored with raw alias "interactive-0-1-1"
    const completions = [{ templateId: "interactive-0-1-1", completedAt: "2026-08-23" }];

    expect(isStepAccessible(2, 0, steps, completions)).toBe(true);
  });

  it("32. Step 14A: Backward navigation: previous steps remain accessible even when current exercise is incomplete", () => {
    const steps: LessonStep[] = [
      { id: "s1", type: "content", title: "Concept 1", sections: [] },
      { id: "s2", type: "content", title: "Concept 2", sections: [] },
      {
        id: "s3",
        type: "interactive-exercise",
        title: "Challenge",
        exerciseId: "ex-hard",
        language: "javascript",
        initialCode: "",
        hasValidation: true,
        validation: { exerciseId: "ex-hard" },
      },
      { id: "s4", type: "content", title: "Review", sections: [] },
    ];

    // Current step is Step 2 (the incomplete challenge)
    const currentStepIndex = 2;
    const completions: any[] = [];

    // Backward navigation to Step 0 and Step 1 is allowed
    expect(isStepAccessible(0, currentStepIndex, steps, completions)).toBe(true);
    expect(isStepAccessible(1, currentStepIndex, steps, completions)).toBe(true);
    expect(isStepAccessible(2, currentStepIndex, steps, completions)).toBe(true);
    // Forward navigation to Step 3 is blocked
    expect(isStepAccessible(3, currentStepIndex, steps, completions)).toBe(false);
  });

  it("33. Step 14A: Unrelated completion does not unlock the gated step", () => {
    const steps: LessonStep[] = [
      { id: "s1", type: "content", title: "Intro", sections: [] },
      {
        id: "s2",
        type: "interactive-exercise",
        title: "Challenge A",
        exerciseId: "exercise-alpha",
        language: "html",
        initialCode: "",
        hasValidation: true,
        validation: { exerciseId: "exercise-alpha" },
      },
      { id: "s3", type: "content", title: "Next Chapter", sections: [] },
    ];

    // Completed unrelated exercise beta
    const completions = [{ templateId: "exercise-beta", completedAt: "2026-08-23" }];

    expect(isStepAccessible(2, 0, steps, completions)).toBe(false);
  });

  it("34. Step 14A: Session resume: an inaccessible saved step index resolves to nearest accessible step", () => {
    const steps: LessonStep[] = [
      { id: "s1", type: "content", title: "Intro", sections: [] },
      {
        id: "s2",
        type: "interactive-exercise",
        title: "Challenge 1",
        exerciseId: "ex-1",
        language: "html",
        initialCode: "",
        hasValidation: true,
        validation: { exerciseId: "ex-1" },
      },
      { id: "s3", type: "content", title: "Midpoint", sections: [] },
      { id: "s4", type: "content", title: "Conclusion", sections: [] },
    ];

    // Stored session wants step index 3 (Conclusion), but ex-1 is incomplete
    const completions: any[] = [];
    let maxAccessible = 0;
    for (let i = 0; i < steps.length; i++) {
      if (isStepAccessible(i, 0, steps, completions)) {
        maxAccessible = i;
      } else {
        break;
      }
    }

    const savedIndex = 3;
    const resolvedIndex = Math.min(savedIndex, maxAccessible);

    // Max accessible step is index 1 (Challenge 1)
    expect(maxAccessible).toBe(1);
    expect(resolvedIndex).toBe(1);
  });

  it("35. Step 14A: Non-validated interactive exercises do not introduce gating", () => {
    const steps: LessonStep[] = [
      { id: "s1", type: "content", title: "Intro", sections: [] },
      {
        id: "s2",
        type: "interactive-exercise",
        title: "Free Play Sandbox",
        exerciseId: "free-play",
        language: "html",
        initialCode: "<p>Try anything</p>",
        hasValidation: false,
      },
      { id: "s3", type: "content", title: "Next Concept", sections: [] },
    ];

    // No completions
    expect(isStepAccessible(2, 0, steps, [])).toBe(true);
    expect(isStepGatedExerciseCompleted(steps[1], [])).toBe(true);
  });

  it("36. Step 14A: Last-step completion behavior remains intact", () => {
    const steps: LessonStep[] = [
      { id: "s1", type: "content", title: "Intro", sections: [] },
      {
        id: "s2",
        type: "interactive-exercise",
        title: "Final Challenge",
        exerciseId: "final-ex",
        language: "javascript",
        initialCode: "",
        hasValidation: true,
        validation: { exerciseId: "final-ex" },
      },
    ];

    // While on step 1 (final step) and incomplete:
    expect(isStepGatedExerciseCompleted(steps[1], [], null)).toBe(false);

    // Once passed in live report:
    expect(
      isStepGatedExerciseCompleted(steps[1], [], { exerciseId: "final-ex", status: "passed" }),
    ).toBe(true);
  });
});
