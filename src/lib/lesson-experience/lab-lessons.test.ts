import { describe, expect, it } from "vitest";
import {
  applyValidationResult,
  completeCurrentExperience,
  createLessonExperienceState,
  goToNextExperience,
  isExperienceComplete,
  recordInteraction,
  retryExperience,
} from "./engine";
import { LAB_LESSONS } from "./lab-lessons";

describe("lesson experience lab definitions", () => {
  it("keeps three distinct synthetic structures", () => {
    expect(LAB_LESSONS).toHaveLength(3);
    expect(
      LAB_LESSONS.map((lesson) => lesson.experiences.map((experience) => experience.kind)),
    ).toEqual([
      ["hook", "visual", "prediction", "explanation", "mastery-check"],
      ["hook", "prediction", "sandbox-experiment", "explanation", "challenge", "mastery-check"],
      ["hook", "visual", "prediction", "explanation", "challenge", "mastery-check"],
    ]);
  });

  it("progresses a prediction-heavy lesson without controller content branches", () => {
    const lesson = LAB_LESSONS[0];
    let state = createLessonExperienceState(lesson);
    state = completeCurrentExperience(lesson, state);
    state = goToNextExperience(lesson, state);
    state = recordInteraction(state, "model", "start");
    state = recordInteraction(state, "model", "handoff");
    state = recordInteraction(state, "model", "change");
    expect(state.currentIndex).toBe(1);
    expect(state.completedIds).toContain("hook");
  });

  it("keeps failed challenge local and successful retry advances", () => {
    const challenge = LAB_LESSONS[1].experiences.find(
      (experience) => experience.kind === "challenge",
    )!;
    const lesson = {
      lesson: { id: "lab-challenge-only", title: "Challenge", description: "Test" },
      experiences: [challenge],
    };
    let state = createLessonExperienceState(lesson);
    state = applyValidationResult(state, challenge.id, {
      isValid: false,
      message: "Try changing the initializer.",
    });
    expect(isExperienceComplete(challenge, state.experienceState[challenge.id])).toBe(false);
    state = retryExperience(state, challenge.id);
    state = applyValidationResult(state, challenge.id, { isValid: true });
    expect(isExperienceComplete(challenge, state.experienceState[challenge.id])).toBe(true);
  });
});
