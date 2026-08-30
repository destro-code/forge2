import { describe, expect, it } from "vitest";
import { DEMO_LESSON } from "./demo-lesson";
import {
  applyValidationResult,
  completeCurrentExperience,
  createLessonExperienceState,
  getCurrentExperience,
  getProgress,
  goToExperience,
  goToNextExperience,
  goToPreviousExperience,
  isExperienceComplete,
  isLessonComplete,
  recordInteraction,
  recordRunExecuted,
  respondToExperience,
  retryExperience,
} from "./engine";

describe("createLessonExperienceState", () => {
  it("initializes with the first experience engaged and visited", () => {
    const state = createLessonExperienceState(DEMO_LESSON, 1000);
    expect(state.currentIndex).toBe(0);
    expect(state.status).toBe("in-progress");
    expect(state.visitedIds).toEqual(["hook-1"]);
    expect(state.experienceState["hook-1"].status).toBe("engaged");
    expect(state.experienceState["visual-1"].status).toBe("idle");
  });

  it("preserves declared experience order from the definition", () => {
    const state = createLessonExperienceState(DEMO_LESSON);
    expect(state.order).toEqual(DEMO_LESSON.experiences.map((experience) => experience.id));
  });
});

describe("hook experience (acknowledge rule)", () => {
  it("is complete immediately, with no response required", () => {
    const state = createLessonExperienceState(DEMO_LESSON);
    const hook = getCurrentExperience(DEMO_LESSON, state)!;
    expect(isExperienceComplete(hook, state.experienceState[hook.id])).toBe(true);
  });

  it("advances to the visual experience on next", () => {
    const state = createLessonExperienceState(DEMO_LESSON);
    const next = goToNextExperience(DEMO_LESSON, state);
    expect(next.currentIndex).toBe(1);
    expect(next.completedIds).toContain("hook-1");
    expect(next.visitedIds).toContain("visual-1");
    expect(next.experienceState["visual-1"].status).toBe("engaged");
  });
});

describe("visual experience (interact-all rule)", () => {
  function advanceToVisual() {
    return goToNextExperience(DEMO_LESSON, createLessonExperienceState(DEMO_LESSON));
  }

  it("blocks advancement until every declared target is interacted with", () => {
    let state = advanceToVisual();
    const visual = getCurrentExperience(DEMO_LESSON, state)!;
    expect(isExperienceComplete(visual, state.experienceState[visual.id])).toBe(false);

    state = recordInteraction(state, "visual-1", "frame-1");
    state = recordInteraction(state, "visual-1", "frame-2");
    expect(isExperienceComplete(visual, state.experienceState[visual.id])).toBe(false);

    const blockedAdvance = goToNextExperience(DEMO_LESSON, state);
    expect(blockedAdvance.currentIndex).toBe(1);

    state = recordInteraction(state, "visual-1", "frame-3");
    expect(isExperienceComplete(visual, state.experienceState[visual.id])).toBe(true);

    const advanced = goToNextExperience(DEMO_LESSON, state);
    expect(advanced.currentIndex).toBe(2);
  });

  it("does not duplicate an interaction target that is recorded twice", () => {
    let state = advanceToVisual();
    state = recordInteraction(state, "visual-1", "frame-1");
    state = recordInteraction(state, "visual-1", "frame-1");
    expect(state.experienceState["visual-1"].interactedTargetIds).toEqual(["frame-1"]);
  });
});

describe("prediction experience (correct-response rule)", () => {
  function advanceToPrediction() {
    let state = createLessonExperienceState(DEMO_LESSON);
    state = goToNextExperience(DEMO_LESSON, state);
    state = recordInteraction(state, "visual-1", "frame-1");
    state = recordInteraction(state, "visual-1", "frame-2");
    state = recordInteraction(state, "visual-1", "frame-3");
    return goToNextExperience(DEMO_LESSON, state);
  }

  it("blocks advancement on an incorrect response and allows retry", () => {
    let state = advanceToPrediction();
    state = respondToExperience(state, "prediction-1", "opt-3");
    state = applyValidationResult(state, "prediction-1", { isValid: false, message: "Not quite." });
    expect(state.experienceState["prediction-1"].status).toBe("failed");

    const blocked = goToNextExperience(DEMO_LESSON, state);
    expect(blocked.currentIndex).toBe(2);

    state = retryExperience(state, "prediction-1");
    expect(state.experienceState["prediction-1"].status).toBe("engaged");
    expect(state.experienceState["prediction-1"].validation).toBeUndefined();

    state = respondToExperience(state, "prediction-1", "opt-10");
    state = applyValidationResult(state, "prediction-1", { isValid: true });
    const advanced = goToNextExperience(DEMO_LESSON, state);
    expect(advanced.currentIndex).toBe(3);
    expect(advanced.completedIds).toContain("prediction-1");
  });

  it("counts every validation attempt, including failed ones", () => {
    let state = advanceToPrediction();
    state = applyValidationResult(state, "prediction-1", { isValid: false });
    state = applyValidationResult(state, "prediction-1", { isValid: true });
    expect(state.experienceState["prediction-1"].attempts).toBe(2);
  });
});

describe("sandbox-experiment experience (run-executed rule)", () => {
  it("requires at least one recorded run before advancing", () => {
    let state = createLessonExperienceState(DEMO_LESSON);
    for (let i = 0; i < 3; i += 1) state = goToNextExperience(DEMO_LESSON, state);
    // Fast-forward through visual + prediction completion for this isolated check.
    state = { ...state, currentIndex: 3 };

    const experiment = getCurrentExperience(DEMO_LESSON, state)!;
    expect(experiment.id).toBe("sandbox-experiment-1");
    expect(isExperienceComplete(experiment, state.experienceState[experiment.id])).toBe(false);

    state = recordRunExecuted(state, "sandbox-experiment-1");
    expect(isExperienceComplete(experiment, state.experienceState[experiment.id])).toBe(true);
    expect(state.experienceState["sandbox-experiment-1"].attempts).toBe(1);
  });
});

describe("challenge experience (validation-passed rule)", () => {
  it("only completes once a passing validation result is applied", () => {
    let state = createLessonExperienceState(DEMO_LESSON);
    state = { ...state, currentIndex: 4 };
    const challenge = getCurrentExperience(DEMO_LESSON, state)!;
    expect(challenge.id).toBe("challenge-1");

    state = applyValidationResult(state, "challenge-1", {
      isValid: false,
      message: "score is not 42",
    });
    expect(isExperienceComplete(challenge, state.experienceState[challenge.id])).toBe(false);

    state = applyValidationResult(state, "challenge-1", { isValid: true });
    expect(isExperienceComplete(challenge, state.experienceState[challenge.id])).toBe(true);
  });
});

describe("full lesson progression", () => {
  it("marks the lesson completed only after the final experience completes", () => {
    let state = createLessonExperienceState(DEMO_LESSON);

    state = goToNextExperience(DEMO_LESSON, state); // hook -> visual
    state = recordInteraction(state, "visual-1", "frame-1");
    state = recordInteraction(state, "visual-1", "frame-2");
    state = recordInteraction(state, "visual-1", "frame-3");
    state = goToNextExperience(DEMO_LESSON, state); // visual -> prediction

    state = applyValidationResult(state, "prediction-1", { isValid: true });
    state = goToNextExperience(DEMO_LESSON, state); // prediction -> sandbox-experiment

    state = recordRunExecuted(state, "sandbox-experiment-1");
    state = goToNextExperience(DEMO_LESSON, state); // sandbox-experiment -> challenge

    state = applyValidationResult(state, "challenge-1", { isValid: true });
    state = goToNextExperience(DEMO_LESSON, state); // challenge -> explanation

    state = goToNextExperience(DEMO_LESSON, state); // explanation -> mastery-check
    expect(isLessonComplete(state)).toBe(false);
    expect(state.currentIndex).toBe(6);

    state = applyValidationResult(state, "mastery-check-1", { isValid: true });
    state = completeCurrentExperience(DEMO_LESSON, state);
    expect(isLessonComplete(state)).toBe(true);
    expect(state.completedIds).toHaveLength(7);
    expect(getProgress(state)).toEqual({ completed: 7, total: 7 });
  });

  it("never advances past the final experience", () => {
    let state = createLessonExperienceState(DEMO_LESSON);
    state = { ...state, currentIndex: state.order.length - 1 };
    state = applyValidationResult(state, "mastery-check-1", { isValid: true });
    const attempt = goToNextExperience(DEMO_LESSON, state);
    expect(attempt.currentIndex).toBe(state.order.length - 1);
  });
});

describe("navigation", () => {
  it("allows moving to any previously visited experience via goToExperience", () => {
    let state = createLessonExperienceState(DEMO_LESSON);
    state = goToNextExperience(DEMO_LESSON, state);
    const jumped = goToExperience(state, "hook-1");
    expect(jumped.currentIndex).toBe(0);
  });

  it("refuses to jump to an experience that has not been visited yet", () => {
    const state = createLessonExperienceState(DEMO_LESSON);
    const jumped = goToExperience(state, "challenge-1");
    expect(jumped.currentIndex).toBe(0);
  });

  it("goToPreviousExperience never regresses recorded progress", () => {
    let state = createLessonExperienceState(DEMO_LESSON);
    state = goToNextExperience(DEMO_LESSON, state);
    const completedBefore = state.completedIds;
    const back = goToPreviousExperience(state);
    expect(back.currentIndex).toBe(0);
    expect(back.completedIds).toEqual(completedBefore);
  });
});
