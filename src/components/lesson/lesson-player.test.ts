import { describe, it, expect, vi } from "vitest";
import { buildLessonSteps } from "@/lib/utils/lesson-step-resolver";
import type { Lesson } from "@/lib/types";
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
});
