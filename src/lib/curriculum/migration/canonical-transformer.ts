import type { NormalizedLegacyLesson } from "./legacy-adapter";
import type {
  CanonicalLesson,
  CanonicalActivity,
  Objective,
  ActivityType,
  ActivityIntent,
} from "../types";
import type { MigrationDiagnostic } from "./types";

/**
 * Transforms a NormalizedLegacyLesson into a structured CanonicalLesson.
 * Collects warning and error diagnostics where structural information is missing
 * or requires manual remediation.
 */
export function transformToCanonical(normalized: NormalizedLegacyLesson): {
  canonical: CanonicalLesson;
  diagnostics: MigrationDiagnostic[];
} {
  const diagnostics: MigrationDiagnostic[] = [];
  const activities: CanonicalActivity[] = [];
  const objectives: Objective[] = [];

  const lessonId = normalized.id;

  // 1. Objectives Mapping
  normalized.learningObjectives.forEach((objText, idx) => {
    const objId = `obj-${lessonId}-${idx + 1}`;
    objectives.push({
      id: objId,
      statement: objText,
      conceptIds: [], // Do not fabricate - leave empty to represent real state
      skillIds: [], // Do not fabricate - leave empty
      priority: idx === 0 ? "primary" : "secondary",
    });

    diagnostics.push({
      code: "AMBIGUOUS_OBJECTIVE_MAPPING",
      severity: "warning",
      message: `Learning objective '${objId}' lacks structured concept/skill ID mappings.`,
      legacyLessonId: lessonId,
      suggestion:
        "Link this objective to specific granular skills and concepts in the canonical registry.",
    });
  });

  const primaryObjectiveId = objectives[0]?.id || `obj-${lessonId}-primary`;

  // 2. Map Intro Activity
  activities.push({
    id: `act-${lessonId}-intro`,
    type: "intro",
    intent: "orientation",
    objectiveIds: [primaryObjectiveId],
    content: {
      title: normalized.title,
      hook: normalized.description,
      context: normalized.mastery || undefined,
      goals: normalized.learningObjectives,
    },
  });

  // 3. Map Sections sequentially
  let currentExplanationTexts: string[] = [];
  let currentTitle: string | undefined;

  const flushExplanation = () => {
    if (currentExplanationTexts.length > 0) {
      const actId = `act-${lessonId}-exp-${activities.length + 1}`;
      activities.push({
        id: actId,
        type: "explanation",
        intent: "understanding",
        objectiveIds: [primaryObjectiveId],
        content: {
          title: currentTitle,
          text: currentExplanationTexts.join("\n\n"),
        },
      });
      currentExplanationTexts = [];
      currentTitle = undefined;
    }
  };

  normalized.sections.forEach((sec, idx) => {
    const path = `sections[${idx}]`;

    switch (sec.type) {
      case "heading":
        flushExplanation();
        currentTitle = sec.text;
        break;

      case "paragraph":
        currentExplanationTexts.push(sec.text);
        break;

      case "callout": {
        flushExplanation();
        const calloutId = `act-${lessonId}-callout-${activities.length + 1}`;
        activities.push({
          id: calloutId,
          type: "explanation",
          intent: "understanding",
          objectiveIds: [primaryObjectiveId],
          content: {
            text: sec.text,
            callout: {
              variant: sec.variant,
              text: sec.text,
            },
          },
        });
        break;
      }

      case "code": {
        flushExplanation();
        const codeId = `act-${lessonId}-code-${activities.length + 1}`;
        activities.push({
          id: codeId,
          type: "code-example",
          intent: "understanding",
          objectiveIds: [primaryObjectiveId],
          content: {
            title: sec.title || "Code Example",
            code: sec.code,
            language: sec.language || "javascript",
            highlightedLines: sec.highlightLines,
          },
        });
        break;
      }

      case "diagram": {
        flushExplanation();
        const diagId = `act-${lessonId}-diag-${activities.length + 1}`;
        activities.push({
          id: diagId,
          type: "visual",
          intent: "recognition",
          objectiveIds: [primaryObjectiveId],
          content: {
            title: sec.title || "Architecture Diagram",
            visualType: "diagram",
            description: sec.description || "",
          },
        });
        break;
      }

      case "interactive-sandbox": {
        flushExplanation();
        const sandboxId = sec.id || `act-${lessonId}-sandbox-${activities.length + 1}`;

        // Check validation presence
        const sandboxValidation = sec.validation
          ? {
              type: "code-output" as const,
              expectedOutput: "success", // a generic expectation
            }
          : undefined;

        if (!sec.validation) {
          diagnostics.push({
            code: "INTERACTIVE_CODE_MISSING_VALIDATION",
            severity: "warning",
            message: `Interactive Sandbox activity '${sandboxId}' does not define any automated validation tests in the legacy source.`,
            legacyLessonId: lessonId,
            sourceActivityId: sandboxId,
            suggestion: "Author an assertion test suite for this sandbox.",
          });
        }

        activities.push({
          id: sandboxId,
          type: "interactive-code",
          intent: "application",
          objectiveIds: [primaryObjectiveId],
          content: {
            title: sec.title || "Coding Practice",
            prompt: sec.instructions || "Implement the requested solution.",
            language: sec.language || "html",
            starterCode: sec.initialCode || "",
          },
          validation: sandboxValidation,
        });
        break;
      }

      case "checkpoint": {
        flushExplanation();
        const checkpointId = sec.id || `act-${lessonId}-checkpoint-${activities.length + 1}`;

        // Handle inline assessment converting
        if (sec.assessment) {
          if (sec.assessment.type === "open-reflection") {
            activities.push({
              id: checkpointId,
              type: "reflection",
              intent: "reflection",
              objectiveIds: [primaryObjectiveId],
              content: {
                prompt: sec.assessment.prompt || "Reflect on this checkpoint's core concept.",
                minCharacters: 30,
              },
            });
          } else if (sec.assessment.type === "multiple-choice" && sec.assessment.options) {
            const options = sec.assessment.options.map((opt: any, oIdx: number) => ({
              id: opt.id || `opt-${oIdx}`,
              text: opt.label || "",
            }));

            activities.push({
              id: checkpointId,
              type: "multiple-choice",
              intent: "assessment",
              objectiveIds: [primaryObjectiveId],
              content: {
                question: sec.assessment.prompt || "Answer the checkpoint question.",
                options,
                explanation: sec.assessment.explanation || "",
              },
              validation: {
                type: "exact-match",
                expected: String(sec.assessment.correctAnswer || "opt-0"),
              },
            });
          } else {
            // Complex assessment modes that cannot be parsed automatically
            diagnostics.push({
              code: "COMPLEX_CHECKPOINT_CONSTRUCT",
              severity: "warning",
              message: `Checkpoint '${checkpointId}' contains a complex assessment type '${sec.assessment.type}' that cannot be safely converted mechanically. Demoted to a standard reflection text template.`,
              legacyLessonId: lessonId,
              sourceActivityId: checkpointId,
              suggestion: "Manually convert to ordering, debug, or fill-blank formats.",
            });

            activities.push({
              id: checkpointId,
              type: "reflection",
              intent: "reflection",
              objectiveIds: [primaryObjectiveId],
              content: {
                prompt: sec.assessment.prompt || sec.label || "Reflect on your learnings so far.",
              },
            });
          }
        } else {
          // Standard text checkpoint
          activities.push({
            id: checkpointId,
            type: "reflection",
            intent: "reflection",
            objectiveIds: [primaryObjectiveId],
            content: {
              prompt: sec.label || "Provide your takeaways for this section.",
            },
          });
        }
        break;
      }

      case "walkthrough": {
        flushExplanation();
        const walkId = `act-${lessonId}-walkthrough-${activities.length + 1}`;
        diagnostics.push({
          code: "UNSUPPORTED_WALKTHROUGH_CONSTRUCT",
          severity: "warning",
          message: `Walkthrough inside section index ${idx} is flattened into a simplified description.`,
          legacyLessonId: lessonId,
        });

        // Flatten to explanations
        if (sec.steps && Array.isArray(sec.steps)) {
          const joinedSteps = sec.steps
            .map((st: any) => `**${st.title}**\n${st.description}`)
            .join("\n\n");
          activities.push({
            id: walkId,
            type: "explanation",
            intent: "understanding",
            objectiveIds: [primaryObjectiveId],
            content: {
              title: sec.title || "Step-by-Step Walkthrough",
              text: joinedSteps,
            },
          });
        }
        break;
      }

      case "collapsible": {
        flushExplanation();
        const collId = `act-${lessonId}-collapsible-${activities.length + 1}`;
        diagnostics.push({
          code: "UNSUPPORTED_COLLAPSIBLE_CONSTRUCT",
          severity: "warning",
          message: `Collapsible element '${sec.title}' flattened to standard text explanation. Accordion triggers removed.`,
          legacyLessonId: lessonId,
        });
        activities.push({
          id: collId,
          type: "explanation",
          intent: "understanding",
          objectiveIds: [primaryObjectiveId],
          content: {
            title: sec.title,
            text: sec.content || "",
          },
        });
        break;
      }

      case "inline-quiz":
        flushExplanation();
        diagnostics.push({
          code: "UNSUPPORTED_INLINE_QUIZ",
          severity: "error",
          message: `External inline-quiz reference '${sec.quizId}' cannot be resolved statically. Lesson migration blocked.`,
          legacyLessonId: lessonId,
        });
        break;

      default:
        // Skip unknown section type or handle gracefully
        break;
    }
  });

  flushExplanation();

  // 4. Map Legacy Exercises
  normalized.exercises.forEach((ex, idx) => {
    const actId = ex.id || `act-${lessonId}-ex-${idx + 1}`;

    if (ex.bugId) {
      if (!ex.validation) {
        diagnostics.push({
          code: "DEBUG_MISSING_VALIDATION",
          severity: "warning",
          message: `Debugging activity '${actId}' lacks validation rules in the legacy source.`,
          legacyLessonId: lessonId,
          sourceActivityId: actId,
          suggestion: "Add unit test assertions to verify bug is resolved.",
        });
      }

      activities.push({
        id: actId,
        type: "debug",
        intent: "debugging",
        objectiveIds: [primaryObjectiveId],
        content: {
          title: ex.title || "Debug Challenge",
          prompt: ex.brief,
          buggyCode: ex.playgroundCode || "",
          language: ex.playgroundLanguage || "javascript",
          bugDescription: ex.brief,
        },
        validation: ex.validation
          ? {
              type: "tests",
              testCases: [
                {
                  id: `${actId}-test-1`,
                  description: "Verify that the bug has been fixed",
                  testCode: "",
                },
              ],
            }
          : undefined,
      });
    } else {
      if (!ex.validation) {
        diagnostics.push({
          code: "INTERACTIVE_CODE_MISSING_VALIDATION",
          severity: "warning",
          message: `Interactive exercise '${actId}' lacks validation rules.`,
          legacyLessonId: lessonId,
          sourceActivityId: actId,
          suggestion: "Add test cases.",
        });
      }

      activities.push({
        id: actId,
        type: "interactive-code",
        intent: "application",
        objectiveIds: [primaryObjectiveId],
        content: {
          title: ex.title || "Coding Challenge",
          prompt: ex.brief,
          starterCode: ex.playgroundCode || "",
          language: ex.playgroundLanguage || "javascript",
        },
        validation: ex.validation
          ? {
              type: "code-output",
              expectedOutput: "success",
            }
          : undefined,
      });
    }
  });

  // 5. Map Legacy Quizzes
  normalized.quiz.forEach((q, idx) => {
    const actId = q.id || `act-${lessonId}-quiz-${idx + 1}`;
    const options = q.options.map((optText, oIdx) => ({
      id: `opt-${oIdx}`,
      text: optText,
    }));
    const expectedOptId = `opt-${q.correctIndex}`;

    activities.push({
      id: actId,
      type: "multiple-choice",
      intent: "assessment",
      objectiveIds: [primaryObjectiveId],
      content: {
        question: q.question,
        options,
        explanation: q.explanation,
      },
      validation: {
        type: "exact-match",
        expected: expectedOptId,
      },
      feedback: {
        correct: "Correct!",
        incorrect: "Incorrect. Read the explanation and try again.",
        explanation: q.explanation,
      },
    });
  });

  // 6. Map Summary takeaway activity
  if (normalized.summary) {
    activities.push({
      id: `act-${lessonId}-summary`,
      type: "summary",
      intent: "reflection",
      objectiveIds: [primaryObjectiveId],
      content: {
        title: "Lesson Takeaways",
        takeaways: [normalized.summary],
      },
    });
  }

  // 7. Track evidence-integrity checks (warnings if missing)
  const learningEvidenceProblems = activities.every((a) => !a.evidence);
  if (learningEvidenceProblems) {
    diagnostics.push({
      code: "MISSING_EVIDENCE_SPEC",
      severity: "warning",
      message:
        "This lesson has no source evidence requirement. Activities do not have defined evidence schemas.",
      legacyLessonId: lessonId,
      suggestion: "Define evidence capabilities with granular demonstrated skill levels.",
    });
  }

  // 8. Map completion rules
  const scoreableActivities = activities.filter(
    (a) =>
      a.type === "multiple-choice" ||
      a.type === "multi-select" ||
      a.type === "fill-blank" ||
      a.type === "ordering" ||
      a.type === "interactive-code" ||
      a.type === "debug",
  );
  const minimumScore = scoreableActivities.length > 0 ? 100 : 0;

  const requiredActivityIds = activities
    .filter(
      (a) =>
        a.validation ||
        a.type === "reflection" ||
        a.type === "multiple-choice" ||
        a.type === "interactive-code",
    )
    .map((a) => a.id);

  const canonical: CanonicalLesson = {
    id: lessonId,
    schemaVersion: "1.0.0",
    topicId: normalized.topicId,
    title: normalized.title,
    description: normalized.description,
    lessonType: "instruction",
    difficulty: normalized.difficulty,
    estimatedMinutes: normalized.estimatedMinutes,
    conceptIds: [`concept-${normalized.topicId}`],
    skillIds: [`skill-${normalized.topicId}`],
    objectives,
    prerequisites: {
      lessonIds: normalized.prerequisites,
      conceptIds: [],
      skillIds: [],
    },
    activities,
    completion: {
      requiredActivityIds,
      minimumScore,
    },
    metadata: {
      moduleId: normalized.moduleId,
      order: normalized.order,
      resources: normalized.resources,
      interviewQuestions: normalized.interviewQuestions,
    },
  };

  return { canonical, diagnostics };
}
