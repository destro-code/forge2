/**
 * Deterministic Authoring Linter Rules for Canonical Lessons
 */

import type { CanonicalLesson, CanonicalActivity, ActivityType } from "../types";
import type { CurriculumContext, CurriculumDiagnostic } from "./types";
import { DIAGNOSTIC_CODES } from "./types";
import { createDiagnostic } from "./diagnostics";

export const CANONICAL_ACTIVITY_TYPES: Set<ActivityType> = new Set([
  "intro",
  "explanation",
  "code-example",
  "visual",
  "multiple-choice",
  "multi-select",
  "fill-blank",
  "ordering",
  "output-prediction",
  "interactive-code",
  "debug",
  "reflection",
  "summary",
  "completion",
]);

export const ASSESSMENT_ACTIVITY_TYPES: Set<ActivityType> = new Set([
  "multiple-choice",
  "multi-select",
  "fill-blank",
  "ordering",
  "output-prediction",
  "interactive-code",
  "debug",
]);

export const PASSIVE_ACTIVITY_TYPES: Set<ActivityType> = new Set([
  "intro",
  "explanation",
  "code-example",
  "visual",
  "summary",
  "completion",
]);

export function checkLessonStructureAndIDs(
  lesson: CanonicalLesson,
  context?: CurriculumContext,
): CurriculumDiagnostic[] {
  const diagnostics: CurriculumDiagnostic[] = [];
  const lessonId = lesson.id;

  if (!lesson.id || typeof lesson.id !== "string" || lesson.id.trim() === "") {
    diagnostics.push(
      createDiagnostic(
        DIAGNOSTIC_CODES.INVALID_ACTIVITY_FIELD,
        "error",
        "Lesson ID must be a non-empty string.",
        "id",
      ),
    );
  }

  // Check top level required arrays
  if (!Array.isArray(lesson.activities) || lesson.activities.length === 0) {
    diagnostics.push(
      createDiagnostic(
        DIAGNOSTIC_CODES.INVALID_ACTIVITY_FIELD,
        "error",
        "Lesson must contain a non-empty 'activities' array.",
        "activities",
        { lessonId },
      ),
    );
    return diagnostics;
  }

  // Check objective IDs uniqueness
  const objectiveIds = new Set<string>();
  if (Array.isArray(lesson.objectives)) {
    lesson.objectives.forEach((obj, idx) => {
      const objPath = `objectives[${idx}]`;
      if (!obj.id || typeof obj.id !== "string") {
        diagnostics.push(
          createDiagnostic(
            DIAGNOSTIC_CODES.INVALID_ACTIVITY_FIELD,
            "error",
            "Objective must have a valid non-empty string ID.",
            objPath,
            { lessonId },
          ),
        );
      } else if (objectiveIds.has(obj.id)) {
        diagnostics.push(
          createDiagnostic(
            DIAGNOSTIC_CODES.DUPLICATE_OBJECTIVE_ID,
            "error",
            `Duplicate objective ID '${obj.id}' found in lesson objectives.`,
            `${objPath}.id`,
            { lessonId, suggestion: "Ensure each objective ID is unique within the lesson." },
          ),
        );
      } else {
        objectiveIds.add(obj.id);
      }
    });
  }

  // Check Context References (topic, concepts, skills)
  if (context) {
    if (context.topics && lesson.topicId) {
      const exists = context.topics.some((t) => t.id === lesson.topicId);
      if (!exists) {
        diagnostics.push(
          createDiagnostic(
            DIAGNOSTIC_CODES.BROKEN_TOPIC_REFERENCE,
            "error",
            `Lesson references unknown topicId '${lesson.topicId}'.`,
            "topicId",
            { lessonId },
          ),
        );
      }
    }

    if (context.concepts && Array.isArray(lesson.conceptIds)) {
      const validConceptIds = new Set(context.concepts.map((c) => c.id));
      lesson.conceptIds.forEach((cId, idx) => {
        if (!validConceptIds.has(cId)) {
          diagnostics.push(
            createDiagnostic(
              DIAGNOSTIC_CODES.BROKEN_CONCEPT_REFERENCE,
              "warning",
              `Lesson references unregistered concept ID '${cId}'.`,
              `conceptIds[${idx}]`,
              { lessonId },
            ),
          );
        }
      });
    }

    if (context.skills && Array.isArray(lesson.skillIds)) {
      const validSkillIds = new Set(context.skills.map((s) => s.id));
      lesson.skillIds.forEach((sId, idx) => {
        if (!validSkillIds.has(sId)) {
          diagnostics.push(
            createDiagnostic(
              DIAGNOSTIC_CODES.BROKEN_SKILL_REFERENCE,
              "warning",
              `Lesson references unregistered skill ID '${sId}'.`,
              `skillIds[${idx}]`,
              { lessonId },
            ),
          );
        }
      });
    }
  }

  // Activity level checks
  const activityIds = new Set<string>();

  lesson.activities.forEach((act, idx) => {
    const actPath = `activities[${idx}]`;
    const actId = act.id;

    // Type validation
    if (!CANONICAL_ACTIVITY_TYPES.has(act.type)) {
      diagnostics.push(
        createDiagnostic(
          DIAGNOSTIC_CODES.UNKNOWN_ACTIVITY_TYPE,
          "error",
          `Activity '${actId || idx}' uses unknown canonical type '${act.type}'.`,
          `${actPath}.type`,
          {
            lessonId,
            activityId: actId,
            suggestion: "Use one of the 14 canonical activity types.",
          },
        ),
      );
    }

    // ID Uniqueness
    if (!actId || typeof actId !== "string" || actId.trim() === "") {
      diagnostics.push(
        createDiagnostic(
          DIAGNOSTIC_CODES.INVALID_ACTIVITY_FIELD,
          "error",
          "Activity must have a valid non-empty string ID.",
          `${actPath}.id`,
          { lessonId },
        ),
      );
    } else if (activityIds.has(actId)) {
      diagnostics.push(
        createDiagnostic(
          DIAGNOSTIC_CODES.DUPLICATE_ACTIVITY_ID,
          "error",
          `Duplicate activity ID '${actId}' found within lesson.`,
          `${actPath}.id`,
          {
            lessonId,
            activityId: actId,
            suggestion: "Ensure activity IDs are unique within the lesson.",
          },
        ),
      );
    } else {
      activityIds.add(actId);
    }

    // Objective references resolution
    if (Array.isArray(act.objectiveIds)) {
      act.objectiveIds.forEach((objRef, oIdx) => {
        if (!objectiveIds.has(objRef)) {
          diagnostics.push(
            createDiagnostic(
              DIAGNOSTIC_CODES.BROKEN_OBJECTIVE_REFERENCE,
              "error",
              `Activity '${actId}' references non-existent objective '${objRef}'.`,
              `${actPath}.objectiveIds[${oIdx}]`,
              {
                lessonId,
                activityId: actId,
                suggestion: "Ensure objectiveId exists in lesson objectives.",
              },
            ),
          );
        }
      });
    }

    // Activity specific field checks
    if (act.type === "multiple-choice" || act.type === "multi-select") {
      const content = act.content as any;
      if (!content || !Array.isArray(content.options)) {
        diagnostics.push(
          createDiagnostic(
            DIAGNOSTIC_CODES.INVALID_ACTIVITY_FIELD,
            "error",
            `Activity '${actId}' must contain an options array.`,
            `${actPath}.content.options`,
            { lessonId, activityId: actId },
          ),
        );
      } else {
        if (content.options.length < 2) {
          diagnostics.push(
            createDiagnostic(
              DIAGNOSTIC_CODES.MULTIPLE_CHOICE_ONE_OPTION,
              "error",
              `Activity '${actId}' of type '${act.type}' must have at least 2 options.`,
              `${actPath}.content.options`,
              { lessonId, activityId: actId, suggestion: "Add at least two options." },
            ),
          );
        }
        const optIds = new Set<string>();
        content.options.forEach((opt: any, oIdx: number) => {
          if (!opt.id || optIds.has(opt.id)) {
            diagnostics.push(
              createDiagnostic(
                DIAGNOSTIC_CODES.DUPLICATE_OPTION_ID,
                "error",
                `Duplicate or missing option ID '${opt.id}' in activity '${actId}'.`,
                `${actPath}.content.options[${oIdx}].id`,
                { lessonId, activityId: actId },
              ),
            );
          } else {
            optIds.add(opt.id);
          }
        });
      }
    } else if (act.type === "fill-blank") {
      const content = act.content as any;
      if (!content || !Array.isArray(content.blanks) || content.blanks.length === 0) {
        diagnostics.push(
          createDiagnostic(
            DIAGNOSTIC_CODES.INVALID_ACTIVITY_FIELD,
            "error",
            `Fill-blank activity '${actId}' must contain at least 1 blank definition.`,
            `${actPath}.content.blanks`,
            { lessonId, activityId: actId },
          ),
        );
      }
    } else if (act.type === "ordering") {
      const content = act.content as any;
      if (!content || !Array.isArray(content.items) || content.items.length < 2) {
        diagnostics.push(
          createDiagnostic(
            DIAGNOSTIC_CODES.INVALID_ACTIVITY_FIELD,
            "error",
            `Ordering activity '${actId}' must contain at least 2 items.`,
            `${actPath}.content.items`,
            { lessonId, activityId: actId },
          ),
        );
      }
    }
  });

  return diagnostics;
}

export function checkActivityValidationRules(lesson: CanonicalLesson): CurriculumDiagnostic[] {
  const diagnostics: CurriculumDiagnostic[] = [];
  const lessonId = lesson.id;

  lesson.activities.forEach((act, idx) => {
    const actPath = `activities[${idx}]`;
    const actId = act.id;
    const isAssessment = ASSESSMENT_ACTIVITY_TYPES.has(act.type);

    if (isAssessment) {
      if (!act.validation) {
        let code = DIAGNOSTIC_CODES.CANONICAL_ACTIVITY_MISSING_VALIDATION;
        if (act.type === "interactive-code") {
          code = DIAGNOSTIC_CODES.INTERACTIVE_CODE_MISSING_VALIDATION;
        } else if (act.type === "debug") {
          code = DIAGNOSTIC_CODES.DEBUG_MISSING_VALIDATION;
        } else if (act.type === "multiple-choice") {
          code = DIAGNOSTIC_CODES.MULTIPLE_CHOICE_MISSING_VALIDATION;
        }

        diagnostics.push(
          createDiagnostic(
            code,
            "error",
            `Activity '${actId}' of type '${act.type}' requires a validation configuration.`,
            `${actPath}.validation`,
            {
              lessonId,
              activityId: actId,
              suggestion:
                "Retrieval and assessment activities must define a validation configuration.",
            },
          ),
        );
      } else {
        // Check validation references
        const content = act.content as any;
        const val = act.validation as any;

        if (act.type === "multiple-choice" && content.options) {
          const optionIds = new Set(content.options.map((o: any) => o.id));
          if (val.type === "exact-match" && !optionIds.has(String(val.expected))) {
            diagnostics.push(
              createDiagnostic(
                DIAGNOSTIC_CODES.INVALID_ACTIVITY_VALIDATION,
                "error",
                `Validation expected option ID '${val.expected}' does not exist in options of activity '${actId}'.`,
                `${actPath}.validation.expected`,
                { lessonId, activityId: actId },
              ),
            );
          } else if (val.type === "one-of" && Array.isArray(val.validOptions)) {
            val.validOptions.forEach((optVal: any) => {
              if (!optionIds.has(String(optVal))) {
                diagnostics.push(
                  createDiagnostic(
                    DIAGNOSTIC_CODES.INVALID_ACTIVITY_VALIDATION,
                    "error",
                    `Validation validOption ID '${optVal}' does not exist in options of activity '${actId}'.`,
                    `${actPath}.validation.validOptions`,
                    { lessonId, activityId: actId },
                  ),
                );
              }
            });
          }
        } else if (act.type === "multi-select" && content.options) {
          const optionIds = new Set(content.options.map((o: any) => o.id));
          if (val.type === "multi-match" && Array.isArray(val.expected)) {
            val.expected.forEach((optVal: string) => {
              if (!optionIds.has(optVal)) {
                diagnostics.push(
                  createDiagnostic(
                    DIAGNOSTIC_CODES.INVALID_ACTIVITY_VALIDATION,
                    "error",
                    `Validation expected option ID '${optVal}' does not exist in options of activity '${actId}'.`,
                    `${actPath}.validation.expected`,
                    { lessonId, activityId: actId },
                  ),
                );
              }
            });
          }
        } else if (act.type === "ordering" && content.items) {
          const itemIds = new Set(content.items.map((i: any) => i.id));
          if (val.type === "ordering" && Array.isArray(val.correctSequence)) {
            val.correctSequence.forEach((itemId: string) => {
              if (!itemIds.has(itemId)) {
                diagnostics.push(
                  createDiagnostic(
                    DIAGNOSTIC_CODES.INVALID_ACTIVITY_VALIDATION,
                    "error",
                    `Ordering validation sequence contains unknown item ID '${itemId}' in activity '${actId}'.`,
                    `${actPath}.validation.correctSequence`,
                    { lessonId, activityId: actId },
                  ),
                );
              }
            });
          }
        }
      }
    }
  });

  return diagnostics;
}

export function checkEvidenceIntegrity(lesson: CanonicalLesson): CurriculumDiagnostic[] {
  const diagnostics: CurriculumDiagnostic[] = [];
  const lessonId = lesson.id;
  const activityMap = new Map<string, CanonicalActivity>(lesson.activities.map((a) => [a.id, a]));
  const lessonObjectiveIds = new Set(lesson.objectives.map((o) => o.id));

  const evidenceReqs = lesson.completion?.evidenceRequirements || [];

  evidenceReqs.forEach((req, idx) => {
    const reqPath = `completion.evidenceRequirements[${idx}]`;

    if (!lessonObjectiveIds.has(req.objectiveId)) {
      diagnostics.push(
        createDiagnostic(
          DIAGNOSTIC_CODES.BROKEN_OBJECTIVE_REFERENCE,
          "error",
          `Evidence requirement references non-existent objective '${req.objectiveId}'.`,
          `${reqPath}.objectiveId`,
          { lessonId },
        ),
      );
    }

    if (Array.isArray(req.activityIds)) {
      req.activityIds.forEach((actId, aIdx) => {
        const act = activityMap.get(actId);
        if (!act) {
          diagnostics.push(
            createDiagnostic(
              DIAGNOSTIC_CODES.EVIDENCE_REQUIREMENT_NONEXISTENT_ACTIVITY,
              "error",
              `Evidence requirement references non-existent activity '${actId}'.`,
              `${reqPath}.activityIds[${aIdx}]`,
              { lessonId, activityId: actId },
            ),
          );
        } else {
          // Check if activity can generate validated evidence when requirement is success or score
          if (
            (req.requirement === "success" || req.requirement === "minimum-score") &&
            !act.validation &&
            !ASSESSMENT_ACTIVITY_TYPES.has(act.type)
          ) {
            diagnostics.push(
              createDiagnostic(
                DIAGNOSTIC_CODES.EVIDENCE_REQUIREMENT_IMPOSSIBLE_ACTIVITY,
                "error",
                `Evidence requirement references activity '${actId}' of type '${act.type}' which cannot generate validated evidence.`,
                `${reqPath}.activityIds[${aIdx}]`,
                {
                  lessonId,
                  activityId: actId,
                  suggestion:
                    "Evidence requirements needing success or score must reference activities with validation.",
                },
              ),
            );
          }
        }
      });
    }
  });

  return diagnostics;
}

export function checkObjectiveIntegrity(lesson: CanonicalLesson): CurriculumDiagnostic[] {
  const diagnostics: CurriculumDiagnostic[] = [];
  const lessonId = lesson.id;

  const satisfiedObjectiveIds = new Set<string>();

  // Objectives covered by activities
  lesson.activities.forEach((act) => {
    if (Array.isArray(act.objectiveIds)) {
      act.objectiveIds.forEach((objId) => satisfiedObjectiveIds.add(objId));
    }
  });

  // Objectives covered by completion evidence requirements
  const evidenceReqs = lesson.completion?.evidenceRequirements || [];
  evidenceReqs.forEach((req) => {
    if (req.objectiveId) {
      satisfiedObjectiveIds.add(req.objectiveId);
    }
  });

  // Find unreferenced objectives
  lesson.objectives.forEach((obj, idx) => {
    if (!satisfiedObjectiveIds.has(obj.id)) {
      diagnostics.push(
        createDiagnostic(
          DIAGNOSTIC_CODES.OBJECTIVE_WITHOUT_EVIDENCE,
          "error",
          `Objective '${obj.id}' (${obj.statement}) has no activity or evidence requirement providing evidence for it.`,
          `objectives[${idx}]`,
          {
            lessonId,
            suggestion:
              "Add a retrieval, prediction, explanation, or applied activity that produces evidence for this objective.",
          },
        ),
      );
    }
  });

  return diagnostics;
}

export function checkSkillIntegrity(lesson: CanonicalLesson): CurriculumDiagnostic[] {
  const diagnostics: CurriculumDiagnostic[] = [];
  const lessonId = lesson.id;

  const evidencedSkillIds = new Set<string>();

  // Collect skills referenced in activities that provide practice/assessment
  lesson.activities.forEach((act) => {
    if (act.evidence?.skillIds) {
      act.evidence.skillIds.forEach((s) => evidencedSkillIds.add(s));
    }
  });

  // Collect skills attached to lesson objectives that are referenced by assessment activities
  const objectiveMap = new Map(lesson.objectives.map((o) => [o.id, o]));
  lesson.activities.forEach((act) => {
    if (ASSESSMENT_ACTIVITY_TYPES.has(act.type) || act.validation) {
      act.objectiveIds?.forEach((objId) => {
        const obj = objectiveMap.get(objId);
        if (obj?.skillIds) {
          obj.skillIds.forEach((s) => evidencedSkillIds.add(s));
        }
      });
    }
  });

  lesson.skillIds.forEach((sId, idx) => {
    if (!evidencedSkillIds.has(sId)) {
      diagnostics.push(
        createDiagnostic(
          DIAGNOSTIC_CODES.SKILL_WITHOUT_EVIDENCE,
          "warning",
          `Skill '${sId}' claimed in lesson is not supported by any practice or assessment activity.`,
          `skillIds[${idx}]`,
          {
            lessonId,
            suggestion:
              "Ensure at least one applied or assessment activity provides evidence for claimed skills.",
          },
        ),
      );
    }
  });

  return diagnostics;
}

export function checkActivitySequenceQuality(lesson: CanonicalLesson): CurriculumDiagnostic[] {
  const diagnostics: CurriculumDiagnostic[] = [];
  const lessonId = lesson.id;
  const activities = lesson.activities;

  if (activities.length === 0) return diagnostics;

  // 1. Lesson begins with application before orientation
  const firstAct = activities[0];
  if (
    ASSESSMENT_ACTIVITY_TYPES.has(firstAct.type) &&
    firstAct.type !== "multiple-choice" &&
    firstAct.type !== "output-prediction"
  ) {
    diagnostics.push(
      createDiagnostic(
        DIAGNOSTIC_CODES.PEDAGOGICAL_SEQUENCE_WARNING,
        "warning",
        `Lesson begins directly with applied activity '${firstAct.id}' (${firstAct.type}) without prior orientation.`,
        "activities[0]",
        {
          lessonId,
          activityId: firstAct.id,
          suggestion: "Start with an intro or orientation activity.",
        },
      ),
    );
  }

  // 2. Debug activity before explanation or code-example
  let explanationSeen = false;
  activities.forEach((act, idx) => {
    if (act.type === "explanation" || act.type === "code-example" || act.type === "intro") {
      explanationSeen = true;
    }
    if (act.type === "debug" && !explanationSeen) {
      diagnostics.push(
        createDiagnostic(
          DIAGNOSTIC_CODES.PEDAGOGICAL_SEQUENCE_WARNING,
          "warning",
          `Debug activity '${act.id}' appears before any explanation or code example in the lesson.`,
          `activities[${idx}]`,
          {
            lessonId,
            activityId: act.id,
            suggestion: "Provide explanation or example before debug task.",
          },
        ),
      );
    }
  });

  // 3. Repeated identical activity types (3 or more)
  for (let i = 0; i <= activities.length - 3; i++) {
    if (
      activities[i].type === activities[i + 1].type &&
      activities[i + 1].type === activities[i + 2].type
    ) {
      diagnostics.push(
        createDiagnostic(
          DIAGNOSTIC_CODES.PEDAGOGICAL_SEQUENCE_WARNING,
          "warning",
          `Three or more consecutive activities share the same type '${activities[i].type}'.`,
          `activities[${i}]`,
          { lessonId, suggestion: "Vary activity types to maintain learner engagement." },
        ),
      );
      break;
    }
  }

  // 4. Missing retrieval activity in practice/assessment lessons
  const requiresRetrieval =
    lesson.lessonType === "practice" ||
    lesson.lessonType === "challenge" ||
    lesson.lessonType === "assessment" ||
    lesson.lessonType === "capstone";

  if (requiresRetrieval) {
    const hasRetrieval = activities.some((a) => ASSESSMENT_ACTIVITY_TYPES.has(a.type));
    if (!hasRetrieval) {
      diagnostics.push(
        createDiagnostic(
          DIAGNOSTIC_CODES.MISSING_RETRIEVAL_WARNING,
          "warning",
          `Lesson of type '${lesson.lessonType}' contains no retrieval or assessment activities.`,
          "activities",
          { lessonId, suggestion: "Include retrieval activities for practice/assessment lessons." },
        ),
      );
    }
  }

  // 5. Missing synthesis / summary near lesson end
  if (activities.length >= 3) {
    const lastTwo = activities.slice(-2);
    const hasSynthesis = lastTwo.some(
      (a) => a.type === "summary" || a.type === "completion" || a.type === "reflection",
    );
    if (!hasSynthesis) {
      diagnostics.push(
        createDiagnostic(
          DIAGNOSTIC_CODES.MISSING_SYNTHESIS_WARNING,
          "warning",
          "Lesson does not end with a summary, reflection, or completion activity.",
          `activities[${activities.length - 1}]`,
          {
            lessonId,
            suggestion: "Add a summary or completion activity at the end of the lesson.",
          },
        ),
      );
    }
  }

  // 6. Excessive consecutive passive activities (4 or more)
  let passiveStreak = 0;
  activities.forEach((act, idx) => {
    if (PASSIVE_ACTIVITY_TYPES.has(act.type)) {
      passiveStreak++;
      if (passiveStreak >= 4) {
        diagnostics.push(
          createDiagnostic(
            DIAGNOSTIC_CODES.PASSIVE_LESSON_WARNING,
            "warning",
            `Found ${passiveStreak} consecutive passive activities without an interactive check.`,
            `activities[${idx}]`,
            {
              lessonId,
              suggestion: "Intersperse active knowledge checks between passive explanations.",
            },
          ),
        );
        passiveStreak = 0; // reset to avoid duplicate warning for same streak
      }
    } else {
      passiveStreak = 0;
    }
  });

  return diagnostics;
}

export function checkHintQuality(lesson: CanonicalLesson): CurriculumDiagnostic[] {
  const diagnostics: CurriculumDiagnostic[] = [];
  const lessonId = lesson.id;

  lesson.activities.forEach((act, idx) => {
    const actPath = `activities[${idx}]`;
    const actId = act.id;

    const hints = act.feedback?.hints || (act.content as any)?.hints;

    if (Array.isArray(hints) && hints.length > 0) {
      if (hints.length > 5) {
        diagnostics.push(
          createDiagnostic(
            DIAGNOSTIC_CODES.MALFORMED_HINTS,
            "warning",
            `Activity '${actId}' has an excessive number of hints (${hints.length}).`,
            `${actPath}.hints`,
            { lessonId, activityId: actId },
          ),
        );
      }

      const hintTexts = new Set<string>();
      let prevLevel = 0;

      hints.forEach((h: any, hIdx: number) => {
        const text = typeof h === "string" ? h : h.content;
        const level = typeof h === "object" ? h.level : hIdx + 1;

        if (!text || typeof text !== "string" || text.trim() === "") {
          diagnostics.push(
            createDiagnostic(
              DIAGNOSTIC_CODES.MALFORMED_HINTS,
              "error",
              `Hint at index ${hIdx} in activity '${actId}' has empty content.`,
              `${actPath}.hints[${hIdx}]`,
              { lessonId, activityId: actId },
            ),
          );
        } else if (hintTexts.has(text.trim())) {
          diagnostics.push(
            createDiagnostic(
              DIAGNOSTIC_CODES.MALFORMED_HINTS,
              "warning",
              `Duplicate hint content in activity '${actId}'.`,
              `${actPath}.hints[${hIdx}]`,
              { lessonId, activityId: actId },
            ),
          );
        } else {
          hintTexts.add(text.trim());
        }

        if (level !== undefined && level < prevLevel) {
          diagnostics.push(
            createDiagnostic(
              DIAGNOSTIC_CODES.MALFORMED_HINTS,
              "warning",
              `Hints in activity '${actId}' are not in ascending level order.`,
              `${actPath}.hints[${hIdx}]`,
              { lessonId, activityId: actId },
            ),
          );
        }
        if (level !== undefined) prevLevel = level;
      });
    }
  });

  return diagnostics;
}

export function checkCompletionRuleIntegrity(lesson: CanonicalLesson): CurriculumDiagnostic[] {
  const diagnostics: CurriculumDiagnostic[] = [];
  const lessonId = lesson.id;
  const activityIds = new Set(lesson.activities.map((a) => a.id));

  const comp = lesson.completion;
  if (!comp) {
    diagnostics.push(
      createDiagnostic(
        DIAGNOSTIC_CODES.INVALID_COMPLETION_RULE,
        "error",
        "Lesson is missing completion configuration.",
        "completion",
        { lessonId },
      ),
    );
    return diagnostics;
  }

  if (Array.isArray(comp.requiredActivityIds)) {
    comp.requiredActivityIds.forEach((reqActId, idx) => {
      if (!activityIds.has(reqActId)) {
        diagnostics.push(
          createDiagnostic(
            DIAGNOSTIC_CODES.COMPLETION_RULE_UNREACHABLE,
            "error",
            `Completion rule requiredActivityId '${reqActId}' does not exist in lesson.`,
            `completion.requiredActivityIds[${idx}]`,
            {
              lessonId,
              suggestion: "Ensure requiredActivityIds reference valid activities in the lesson.",
            },
          ),
        );
      }
    });
  }

  if (comp.minimumScore !== undefined && comp.minimumScore > 0) {
    const hasScoreable = lesson.activities.some(
      (a) => a.validation !== undefined || ASSESSMENT_ACTIVITY_TYPES.has(a.type),
    );
    if (!hasScoreable) {
      diagnostics.push(
        createDiagnostic(
          DIAGNOSTIC_CODES.COMPLETION_RULE_UNREACHABLE,
          "error",
          `Completion rule requires minimumScore (${comp.minimumScore}), but lesson has no scoreable activities.`,
          "completion.minimumScore",
          { lessonId, suggestion: "Add scoreable activities or remove minimumScore requirement." },
        ),
      );
    }
  }

  return diagnostics;
}

export function checkContentQuality(lesson: CanonicalLesson): CurriculumDiagnostic[] {
  const diagnostics: CurriculumDiagnostic[] = [];
  const lessonId = lesson.id;

  const seenPrompts = new Map<string, string>();

  lesson.activities.forEach((act, idx) => {
    const actPath = `activities[${idx}]`;
    const actId = act.id;
    const content = act.content as any;

    if (!content) return;

    // Check explanation length
    if (act.type === "explanation" && typeof content.text === "string") {
      if (content.text.trim().length < 20) {
        diagnostics.push(
          createDiagnostic(
            DIAGNOSTIC_CODES.CONTENT_QUALITY_WARNING,
            "warning",
            `Explanation text in activity '${actId}' is extremely short.`,
            `${actPath}.content.text`,
            { lessonId, activityId: actId },
          ),
        );
      }
    }

    // Check summary takeaways
    if (act.type === "summary" && Array.isArray(content.takeaways)) {
      if (
        content.takeaways.length === 0 ||
        content.takeaways.some((t: string) => !t || t.trim() === "")
      ) {
        diagnostics.push(
          createDiagnostic(
            DIAGNOSTIC_CODES.CONTENT_QUALITY_WARNING,
            "warning",
            `Summary activity '${actId}' has empty takeaways.`,
            `${actPath}.content.takeaways`,
            { lessonId, activityId: actId },
          ),
        );
      }
    }

    // Check duplicate prompt text across activities
    const promptText = content.prompt || content.question || content.hook;
    if (promptText && typeof promptText === "string" && promptText.trim().length > 10) {
      const normalized = promptText.trim().toLowerCase();
      if (seenPrompts.has(normalized)) {
        const prevActId = seenPrompts.get(normalized)!;
        diagnostics.push(
          createDiagnostic(
            DIAGNOSTIC_CODES.DUPLICATE_PROMPT_WARNING,
            "warning",
            `Activity '${actId}' shares identical prompt/question text with activity '${prevActId}'.`,
            `${actPath}.content`,
            {
              lessonId,
              activityId: actId,
              suggestion: "Ensure each activity has a unique prompt.",
            },
          ),
        );
      } else {
        seenPrompts.set(normalized, actId);
      }
    }

    // Check duplicate options in multiple choice / multi select
    if (
      (act.type === "multiple-choice" || act.type === "multi-select") &&
      Array.isArray(content.options)
    ) {
      const optionTexts = new Set<string>();
      content.options.forEach((opt: any, oIdx: number) => {
        if (opt.text) {
          const normOpt = opt.text.trim().toLowerCase();
          if (optionTexts.has(normOpt)) {
            diagnostics.push(
              createDiagnostic(
                DIAGNOSTIC_CODES.CONTENT_QUALITY_WARNING,
                "warning",
                `Duplicate option text '${opt.text}' in activity '${actId}'.`,
                `${actPath}.content.options[${oIdx}]`,
                { lessonId, activityId: actId },
              ),
            );
          } else {
            optionTexts.add(normOpt);
          }
        }
      });
    }

    // Check missing feedback on assessment activities
    if (ASSESSMENT_ACTIVITY_TYPES.has(act.type) && !act.feedback) {
      diagnostics.push(
        createDiagnostic(
          DIAGNOSTIC_CODES.CONTENT_QUALITY_WARNING,
          "warning",
          `Assessment activity '${actId}' is missing feedback configuration.`,
          `${actPath}.feedback`,
          {
            lessonId,
            activityId: actId,
            suggestion: "Provide explanatory feedback for correct and incorrect answers.",
          },
        ),
      );
    }

    // Check missing hints for complex applied activities
    if (
      (act.type === "interactive-code" || act.type === "debug") &&
      (!act.feedback?.hints || act.feedback.hints.length === 0)
    ) {
      diagnostics.push(
        createDiagnostic(
          DIAGNOSTIC_CODES.CONTENT_QUALITY_WARNING,
          "warning",
          `Applied activity '${actId}' (${act.type}) has no hints configured.`,
          `${actPath}`,
          { lessonId, activityId: actId, suggestion: "Add scaffolding hints to assist learners." },
        ),
      );
    }
  });

  return diagnostics;
}
