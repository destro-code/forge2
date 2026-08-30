import type { LearningExperience, LessonExperienceDefinition } from "./types";

export class InvalidLessonExperienceDefinitionError extends Error {
  constructor(public readonly issues: string[]) {
    super(`Invalid lesson experience definition: ${issues.join("; ")}`);
    this.name = "InvalidLessonExperienceDefinitionError";
  }
}

function pushUnique(issues: string[], seen: Set<string>, issue: string) {
  if (!seen.has(issue)) {
    seen.add(issue);
    issues.push(issue);
  }
}

export function validateLessonExperienceDefinition(
  definition: LessonExperienceDefinition,
): string[] {
  const issues: string[] = [];
  const seen = new Set<string>();
  if (!definition.lesson?.id?.trim()) pushUnique(issues, seen, "lesson.id is required");
  if (!Array.isArray(definition.experiences) || definition.experiences.length === 0) {
    pushUnique(issues, seen, "experiences must contain at least one experience");
    return issues;
  }

  const ids = new Set<string>();
  for (const experience of definition.experiences) {
    if (!experience.id?.trim()) pushUnique(issues, seen, "experience.id is required");
    if (ids.has(experience.id))
      pushUnique(issues, seen, `duplicate experience id: ${experience.id}`);
    ids.add(experience.id);
    validateCompletion(experience, ids, issues, seen);
  }
  return issues;
}

function validateCompletion(
  experience: LearningExperience,
  ids: Set<string>,
  issues: string[],
  seen: Set<string>,
) {
  if (experience.completion.rule === "interact-all") {
    const targetIds = experience.completion.targetIds;
    if (targetIds.length === 0)
      pushUnique(issues, seen, `${experience.id}: interact-all requires targets`);
    const contentTargetIds =
      experience.kind === "visual"
        ? new Set(experience.content.frames.map((frame) => frame.id))
        : new Set<string>();
    for (const targetId of targetIds) {
      if (contentTargetIds.size > 0 && !contentTargetIds.has(targetId)) {
        pushUnique(issues, seen, `${experience.id}: unknown interaction target: ${targetId}`);
      }
    }
  }
  if (
    experience.completion.rule === "correct-response" ||
    experience.completion.rule === "validation-passed"
  ) {
    if (
      experience.kind !== "prediction" &&
      experience.kind !== "mastery-check" &&
      experience.kind !== "challenge"
    ) {
      pushUnique(issues, seen, `${experience.id}: completion rule does not match experience kind`);
    }
  }
  if (experience.completion.rule === "run-executed" && experience.kind !== "sandbox-experiment") {
    pushUnique(issues, seen, `${experience.id}: run-executed is only valid for sandbox-experiment`);
  }
  if (experience.completion.rule === "validation-passed" && experience.kind !== "challenge") {
    pushUnique(issues, seen, `${experience.id}: validation-passed is only valid for challenge`);
  }
  void ids;
}

export function assertValidLessonExperienceDefinition(
  definition: LessonExperienceDefinition,
): void {
  const issues = validateLessonExperienceDefinition(definition);
  if (issues.length > 0) throw new InvalidLessonExperienceDefinitionError(issues);
}
