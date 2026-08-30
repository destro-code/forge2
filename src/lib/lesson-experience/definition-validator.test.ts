import { describe, expect, it } from "vitest";
import { DEMO_LESSON } from "./demo-lesson";
import {
  assertValidLessonExperienceDefinition,
  InvalidLessonExperienceDefinitionError,
  validateLessonExperienceDefinition,
} from "./definition-validator";
import { createLessonExperienceState } from "./engine";
import type { LessonExperienceDefinition } from "./types";

const hook = (id: string) => ({
  id,
  kind: "hook" as const,
  purpose: "orient",
  title: "A different hook",
  completion: { rule: "acknowledge" as const },
  content: { heading: "Start", body: "A different lesson definition." },
});

describe("lesson experience definition validation", () => {
  it("accepts substantially different content and ordering without controller changes", () => {
    const alternate: LessonExperienceDefinition = {
      lesson: { id: "css-specificity", title: "Specificity", description: "A tiny lesson." },
      experiences: [hook("intro"), hook("practice"), hook("recap")],
    };
    expect(validateLessonExperienceDefinition(alternate)).toEqual([]);
    expect(createLessonExperienceState(alternate).order).toEqual(["intro", "practice", "recap"]);
    assertValidLessonExperienceDefinition(DEMO_LESSON);
  });

  it("rejects empty definitions and duplicate IDs", () => {
    const duplicate = { ...DEMO_LESSON, experiences: [hook("same"), hook("same")] };
    expect(validateLessonExperienceDefinition({ ...DEMO_LESSON, experiences: [] })).toContain(
      "experiences must contain at least one experience",
    );
    expect(validateLessonExperienceDefinition(duplicate)).toContain(
      "duplicate experience id: same",
    );
    expect(() => createLessonExperienceState(duplicate)).toThrow(
      InvalidLessonExperienceDefinitionError,
    );
  });

  it("rejects invalid interaction targets and mismatched completion rules", () => {
    const invalid = {
      ...DEMO_LESSON,
      experiences: [
        {
          ...DEMO_LESSON.experiences[1],
          completion: { rule: "interact-all" as const, targetIds: ["missing"] },
        },
        {
          ...DEMO_LESSON.experiences[0],
          id: "wrong-rule",
          completion: { rule: "run-executed" as const },
        },
      ],
    } as LessonExperienceDefinition;
    const issues = validateLessonExperienceDefinition(invalid);
    expect(issues).toEqual(
      expect.arrayContaining([
        "visual-1: unknown interaction target: missing",
        "wrong-rule: run-executed is only valid for sandbox-experiment",
      ]),
    );
  });
});
