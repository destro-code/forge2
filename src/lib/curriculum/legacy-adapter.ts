import type {
  Lesson as LegacyLesson,
  LessonSection,
  LessonExercise,
  LessonStep,
  ContentLessonStep,
  CodeExampleLessonStep,
  InteractiveExerciseLessonStep,
  QuizLessonStep,
  CheckpointLessonStep,
} from "../types";
import type {
  CanonicalLesson,
  CanonicalActivity,
  IntroActivity,
  ExplanationActivity,
  CodeExampleActivity,
  VisualActivity,
  MultipleChoiceActivity,
  MultiSelectActivity,
  FillBlankActivity,
  OrderingActivity,
  OutputPredictionActivity,
  InteractiveCodeActivity,
  DebugActivity,
  ReflectionActivity,
  SummaryActivity,
  CompletionActivity,
  Objective,
} from "./types";

/**
 * Transforms a Legacy Lesson into the Canonical Lesson schema format.
 */
export function adaptLegacyLessonToCanonical(legacy: LegacyLesson): CanonicalLesson {
  const activities: CanonicalActivity[] = [];
  const objectives: Objective[] = [];

  // Map learning objectives
  if (legacy.learningObjectives && legacy.learningObjectives.length > 0) {
    legacy.learningObjectives.forEach((objText, idx) => {
      objectives.push({
        id: `obj-${legacy.id}-${idx + 1}`,
        statement: objText,
        conceptIds: [`concept-${legacy.topicId || "general"}`],
        skillIds: [`skill-${legacy.topicId || "general"}`],
        priority: idx === 0 ? "primary" : "secondary",
      });
    });
  } else {
    objectives.push({
      id: `obj-${legacy.id}-primary`,
      statement: legacy.title,
      conceptIds: [`concept-${legacy.topicId || "general"}`],
      skillIds: [`skill-${legacy.topicId || "general"}`],
      priority: "primary",
    });
  }

  // 1. Intro Activity
  activities.push({
    id: `act-${legacy.id}-intro`,
    type: "intro",
    intent: "orientation",
    objectiveIds: [objectives[0].id],
    content: {
      title: legacy.title,
      hook: legacy.description,
      context: typeof legacy.mastery === "string" ? legacy.mastery : undefined,
      goals: legacy.learningObjectives,
    },
  });

  // 2. Sections mapping
  if (legacy.sections && legacy.sections.length > 0) {
    let currentExplanationTexts: string[] = [];
    let currentTitle: string | undefined;

    const flushExplanation = () => {
      if (currentExplanationTexts.length > 0) {
        activities.push({
          id: `act-${legacy.id}-exp-${activities.length + 1}`,
          type: "explanation",
          intent: "understanding",
          objectiveIds: [objectives[0].id],
          content: {
            title: currentTitle,
            text: currentExplanationTexts.join("\n\n"),
          },
        });
        currentExplanationTexts = [];
        currentTitle = undefined;
      }
    };

    for (let i = 0; i < legacy.sections.length; i++) {
      const sec = legacy.sections[i];

      if (sec.type === "heading") {
        flushExplanation();
        currentTitle = sec.text;
      } else if (sec.type === "paragraph") {
        const pText = (sec.text || "").replace(/\s+•\s+/g, "\n• ");
        if (pText.trim()) {
          currentExplanationTexts.push(pText);
        }
      } else if (sec.type === "callout") {
        const calloutText = sec.text?.trim();
        // Keep a short callout with the explanation it qualifies. Splitting
        // every note into its own screen was the main source of legacy pacing
        // inflation and also produced empty NOTE panels.
        if (!calloutText) continue;
        if (currentExplanationTexts.length > 0 || currentTitle) {
          currentExplanationTexts.push(`> ${calloutText}`);
          continue;
        }
        activities.push({
          id: `act-${legacy.id}-callout-${activities.length + 1}`,
          type: "explanation",
          intent: "understanding",
          objectiveIds: [objectives[0].id],
          content: {
            title: sec.title || undefined,
            text: calloutText,
            callout: {
              variant: sec.variant || sec.callout || "info",
              text: calloutText,
            },
          },
        });
      } else if (sec.type === "code") {
        flushExplanation();
        activities.push({
          id: `act-${legacy.id}-code-${activities.length + 1}`,
          type: "code-example",
          intent: "understanding",
          objectiveIds: [objectives[0].id],
          content: {
            title: sec.title,
            code: sec.code,
            language: sec.language || "html",
            highlightedLines: sec.highlightLines,
          },
        });
      } else if (sec.type === "diagram") {
        flushExplanation();
        activities.push({
          id: `act-${legacy.id}-diag-${activities.length + 1}`,
          type: "visual",
          intent: "recognition",
          objectiveIds: [objectives[0].id],
          content: {
            title: sec.title,
            visualType: "diagram",
            description: sec.description,
          },
        });
      } else if (sec.type === "interactive-sandbox") {
        flushExplanation();
        activities.push({
          id: sec.id || `act-${legacy.id}-sandbox-${activities.length + 1}`,
          type: "interactive-code",
          intent: "application",
          objectiveIds: [objectives[0].id],
          content: {
            title: sec.title || "Interactive Sandbox",
            prompt: sec.instructions || (sec as any).prompt || "Complete the sandbox exercise.",
            instructions:
              sec.instructions || (sec as any).prompt || "Complete the sandbox exercise.",
            language: sec.language || "html",
            starterCode: sec.initialCode,
          },
        });
      }
    }
    flushExplanation();
  }

  // 3. Exercises mapping
  if (legacy.exercises && legacy.exercises.length > 0) {
    legacy.exercises.forEach((ex, idx) => {
      activities.push({
        id: ex.id || `act-${legacy.id}-ex-${idx + 1}`,
        type: ex.bugId ? "debug" : "interactive-code",
        intent: ex.bugId ? "debugging" : "application",
        objectiveIds: [objectives[0].id],
        content: ex.bugId
          ? {
              title: ex.title,
              prompt: ex.brief,
              instructions: (ex as any).instructions || ex.brief,
              buggyCode: ex.playgroundCode || "",
              language: ex.playgroundLanguage || "html",
              bugDescription: ex.brief,
            }
          : {
              title: ex.title,
              prompt: ex.brief,
              instructions: (ex as any).instructions || ex.brief,
              starterCode: ex.playgroundCode || "",
              language: ex.playgroundLanguage || "html",
            },
      });
    });
  }

  // 4. Quiz mapping
  if (legacy.quiz && legacy.quiz.length > 0) {
    legacy.quiz.forEach((q, idx) => {
      const options = q.options.map((optText, optIdx) => ({
        id: `opt-${optIdx}`,
        text: optText,
      }));
      const expectedOptId = `opt-${q.correctIndex}`;

      activities.push({
        id: q.id || `act-${legacy.id}-quiz-${idx + 1}`,
        type: "multiple-choice",
        intent: "assessment",
        objectiveIds: [objectives[0].id],
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
          incorrect: "Incorrect. Try reviewing the lesson material.",
          explanation: q.explanation,
        },
      });
    });
  }

  // 5. Summary mapping
  if (legacy.summary) {
    activities.push({
      id: `act-${legacy.id}-summary`,
      type: "summary",
      intent: "reflection",
      objectiveIds: [objectives[0].id],
      content: {
        title: "Lesson Summary",
        takeaways: [legacy.summary],
      },
    });
  }

  return {
    id: legacy.id,
    schemaVersion: "1.0.0",
    topicId: legacy.topicId || "general",
    title: legacy.title,
    description: legacy.description,
    lessonType: "instruction",
    difficulty: legacy.difficulty,
    estimatedMinutes: legacy.estimatedMinutes || 15,
    conceptIds: [`concept-${legacy.topicId || "general"}`],
    skillIds: [`skill-${legacy.topicId || "general"}`],
    objectives,
    prerequisites: {
      lessonIds: legacy.prerequisites || [],
      conceptIds: [],
      skillIds: [],
    },
    activities,
    completion: {
      requiredActivityIds: activities.filter((a) => a.validation).map((a) => a.id),
      minimumScore: 100,
    },
    metadata: {
      moduleId: legacy.moduleId,
      order: legacy.order,
      resources: legacy.resources,
      interviewQuestions: legacy.interviewQuestions,
    },
  };
}

/**
 * Transforms a Canonical Lesson into a Legacy Lesson structure for compatibility
 * with legacy viewports and rendering pipelines.
 */
export function adaptCanonicalLessonToLegacy(canonical: CanonicalLesson): LegacyLesson {
  const sections: LessonSection[] = [];
  const exercises: LessonExercise[] = [];
  const quiz: {
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[] = [];

  let summaryText = "";

  for (const act of canonical.activities) {
    switch (act.type) {
      case "intro":
        if (act.content.title) {
          sections.push({ type: "heading", text: act.content.title });
        }
        if (act.content.hook) {
          sections.push({ type: "paragraph", text: act.content.hook });
        }
        if (act.content.context) {
          sections.push({ type: "paragraph", text: act.content.context });
        }
        break;

      case "explanation":
        if (act.content.title) {
          sections.push({ type: "heading", text: act.content.title });
        }
        if (act.content.text) {
          sections.push({ type: "paragraph", text: act.content.text });
        }
        if (act.content.callout) {
          sections.push({
            type: "callout",
            variant: act.content.callout.variant,
            text: act.content.callout.text,
          });
        }
        break;

      case "code-example":
        if (act.content.title) {
          sections.push({ type: "heading", text: act.content.title });
        }
        if (act.content.description) {
          sections.push({ type: "paragraph", text: act.content.description });
        }
        sections.push({
          type: "code",
          title: act.content.title,
          language: act.content.language,
          code: act.content.code,
          highlightLines: act.content.highlightedLines,
        });
        break;

      case "visual":
        sections.push({
          type: "diagram",
          title: act.content.title,
          description: act.content.description,
          diagramType: "custom",
        });
        break;

      case "multiple-choice": {
        const options = act.content.options.map((o) => o.text);
        let correctIndex = 0;
        if (act.validation && act.validation.type === "exact-match") {
          const expectedId = act.validation.expected;
          const foundIdx = act.content.options.findIndex(
            (o) => o.id === expectedId || o.text === expectedId,
          );
          if (foundIdx >= 0) correctIndex = foundIdx;
        }
        quiz.push({
          id: act.id,
          question: act.content.question,
          options,
          correctIndex,
          explanation: act.content.explanation || act.feedback?.explanation || "",
        });
        break;
      }

      case "interactive-code":
        exercises.push({
          id: act.id,
          title: act.content.title,
          brief: act.content.prompt,
          playgroundLanguage: act.content.language,
          playgroundCode: act.content.starterCode,
        });
        break;

      case "debug":
        exercises.push({
          id: act.id,
          title: act.content.title,
          brief: act.content.prompt,
          bugId: act.id,
          playgroundLanguage: act.content.language,
          playgroundCode: act.content.buggyCode,
        });
        break;

      case "summary":
        if (act.content.takeaways && act.content.takeaways.length > 0) {
          summaryText = act.content.takeaways.join(" ");
        }
        break;

      default:
        break;
    }
  }

  const moduleId = (canonical.metadata?.moduleId as string) || `module-${canonical.topicId}`;
  const order = (canonical.metadata?.order as number) || 1;

  return {
    id: canonical.id,
    topicId: canonical.topicId,
    moduleId,
    order,
    title: canonical.title,
    description: canonical.description,
    difficulty: canonical.difficulty,
    estimatedMinutes: canonical.estimatedMinutes,
    mastery: "Mastery achieved when all canonical activities and objectives are verified.",
    learningObjectives: canonical.objectives.map((o) => o.statement),
    prerequisites: canonical.prerequisites.lessonIds || [],
    previousLessonId: null,
    nextLessonId: null,
    sections,
    exercises,
    quiz,
    summary: summaryText || canonical.description,
    resources: (canonical.metadata?.resources as { label: string; url: string }[]) || [],
    interviewQuestions: (canonical.metadata?.interviewQuestions as string[]) || [],
  };
}

/**
 * Transforms Canonical Activities directly into Presentation LessonSteps
 * for the LessonPlayer shell.
 */
export function adaptCanonicalLessonToSteps(canonical: CanonicalLesson): LessonStep[] {
  const steps: LessonStep[] = [];

  canonical.activities.forEach((act, idx) => {
    switch (act.type) {
      case "intro":
      case "explanation": {
        const sections: LessonSection[] = [];
        if (act.content.title) {
          sections.push({ type: "heading", text: act.content.title });
        }
        if ("hook" in act.content && act.content.hook) {
          sections.push({ type: "paragraph", text: act.content.hook });
        }
        if ("text" in act.content && act.content.text) {
          sections.push({ type: "paragraph", text: act.content.text });
        }
        if ("callout" in act.content && act.content.callout) {
          sections.push({
            type: "callout",
            variant: act.content.callout.variant,
            text: act.content.callout.text,
          });
        }
        const contentStep: ContentLessonStep = {
          id: act.id,
          title: act.content.title || `Concept Step ${idx + 1}`,
          type: "content",
          sections,
          estimatedMinutes: 3,
        };
        steps.push(contentStep);
        break;
      }

      case "code-example": {
        const codeStep: CodeExampleLessonStep = {
          id: act.id,
          title: act.content.title || `Code Example ${idx + 1}`,
          type: "code-example",
          code: act.content.code,
          language: act.content.language,
          explanation: act.content.description,
          highlightLines: act.content.highlightedLines,
          estimatedMinutes: 4,
        };
        steps.push(codeStep);
        break;
      }

      case "visual": {
        const visualStep: ContentLessonStep = {
          id: act.id,
          title: act.content.title || `Visual Architecture ${idx + 1}`,
          type: "content",
          sections: [
            { type: "heading", text: act.content.title },
            {
              type: "diagram",
              title: act.content.title,
              description: act.content.description,
              diagramType: "custom",
            },
          ],
          estimatedMinutes: 3,
        };
        steps.push(visualStep);
        break;
      }

      case "multiple-choice":
      case "multi-select":
      case "fill-blank":
      case "ordering":
      case "output-prediction": {
        const options =
          "options" in act.content && Array.isArray(act.content.options)
            ? act.content.options.map((o: any) => (typeof o === "string" ? o : o.text))
            : [];

        let correctIndex = 0;
        if (act.validation && act.validation.type === "exact-match") {
          const expectedVal = act.validation.expected;
          if (options.includes(String(expectedVal))) {
            correctIndex = options.indexOf(String(expectedVal));
          }
        }

        const quizStep: QuizLessonStep = {
          id: act.id,
          title: `Knowledge Check: ${act.type}`,
          type: "quiz",
          quizId: act.id,
          question:
            "question" in act.content
              ? (act.content as any).question
              : "prompt" in act.content
                ? (act.content as any).prompt
                : "Question",
          options: options.length > 0 ? options : ["Option 1", "Option 2"],
          correctIndex,
          explanation:
            ("explanation" in act.content ? (act.content as any).explanation : "") ||
            act.feedback?.explanation ||
            "Review the step materials.",
          estimatedMinutes: 3,
        };
        steps.push(quizStep);
        break;
      }

      case "interactive-code":
      case "debug": {
        const interactiveStep: InteractiveExerciseLessonStep = {
          id: act.id,
          title: act.content.title,
          type: "interactive-exercise",
          exerciseId: act.id,
          interactiveMode: "compact-challenge",
          editorRequired: true,
          initialCode:
            "starterCode" in act.content ? act.content.starterCode : (act.content as any).buggyCode,
          language: act.content.language,
          instructions: act.content.prompt,
          estimatedMinutes: 8,
        };
        steps.push(interactiveStep);
        break;
      }

      case "reflection":
      case "summary":
      case "completion": {
        const checkpointStep: CheckpointLessonStep = {
          id: act.id,
          title:
            "title" in act.content && act.content.title ? act.content.title : "Lesson Checkpoint",
          type: "checkpoint",
          checkpointId: act.id,
          label:
            "title" in act.content && act.content.title ? act.content.title : "Lesson Completed",
          estimatedMinutes: 2,
        };
        steps.push(checkpointStep);
        break;
      }

      default:
        break;
    }
  });

  return steps;
}
