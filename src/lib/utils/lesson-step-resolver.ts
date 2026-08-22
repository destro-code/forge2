import type {
  Lesson,
  LessonSection,
  LessonExercise,
  LessonStep,
  ContentLessonStep,
  CodeExampleLessonStep,
  InteractiveExerciseLessonStep,
  QuizLessonStep,
  CheckpointLessonStep,
} from "../types";

/**
 * Resolves a canonical Lesson object into an ordered array of presentation-layer LessonStep items.
 *
 * This resolver maps existing LessonSection[], Lesson.exercises[], and Lesson.quiz[]
 * into presentation semantics ("content", "code-example", "interactive-exercise", "quiz", "checkpoint")
 * while preserving all original domain entity IDs (sectionId, exerciseId, checkpointId, quizId, lessonId).
 *
 * @param lesson The canonical Lesson data model
 * @returns Ordered, deterministic LessonStep[]
 */
export function buildLessonSteps(lesson: Lesson): LessonStep[] {
  if (!lesson) return [];

  const steps: LessonStep[] = [];
  let stepCounter = 0;

  let pendingContentSections: LessonSection[] = [];
  let currentHeadingTitle: string | undefined = undefined;
  let currentSectionId: string | undefined = undefined;

  const flushPendingContent = () => {
    if (pendingContentSections.length === 0) return;

    const firstSection = pendingContentSections[0];
    const sectionId =
      currentSectionId || ("id" in firstSection && firstSection.id ? firstSection.id : undefined);

    const headingSection = pendingContentSections.find((s) => s.type === "heading");
    const stepTitle =
      headingSection && "text" in headingSection && headingSection.text
        ? headingSection.text
        : currentHeadingTitle || lesson.title;

    const stepId = `${lesson.id}-step-${stepCounter++}-content`;

    const contentStep: ContentLessonStep = {
      id: stepId,
      type: "content",
      title: stepTitle,
      lessonId: lesson.id,
      sectionId,
      section: pendingContentSections.length === 1 ? pendingContentSections[0] : undefined,
      sections: [...pendingContentSections],
    };

    steps.push(contentStep);

    pendingContentSections = [];
    currentSectionId = undefined;
  };

  const sections = lesson.sections || [];

  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];

    switch (s.type) {
      case "heading": {
        flushPendingContent();
        pendingContentSections.push(s);
        currentHeadingTitle = s.text;
        currentSectionId = s.id;
        break;
      }

      case "paragraph":
      case "callout":
      case "diagram":
      case "walkthrough":
      case "collapsible": {
        pendingContentSections.push(s);
        if (!currentSectionId && "id" in s && s.id) {
          currentSectionId = s.id;
        }
        break;
      }

      case "code":
      case "jsx":
      case "javascript": {
        flushPendingContent();
        const codeSection = s as LessonSection & {
          type: "code" | "jsx" | "javascript";
          code: string;
          title?: string;
          language?: string;
        };
        const sectionId = "id" in s && s.id ? s.id : undefined;
        const codeLang =
          codeSection.language ||
          (s.type === "jsx" ? "jsx" : s.type === "javascript" ? "javascript" : "typescript");
        const codeTitle = codeSection.title || "Code Example";

        const codeStep: CodeExampleLessonStep = {
          id: `${lesson.id}-step-${stepCounter++}-code`,
          type: "code-example",
          title: codeTitle,
          lessonId: lesson.id,
          sectionId,
          section: codeSection,
          code: codeSection.code || "",
          language: codeLang,
          codeTitle: codeSection.title,
        };

        steps.push(codeStep);
        break;
      }

      case "interactive-sandbox": {
        flushPendingContent();
        const sandboxSection = s as LessonSection & {
          type: "interactive-sandbox";
          id?: string;
          title?: string;
          initialCode: string;
          language?: string;
          instructions?: string;
          validation?: any;
        };

        const exerciseId =
          sandboxSection.id || sandboxSection.validation?.exerciseId || `${lesson.id}-sandbox-${i}`;
        const sectionId = sandboxSection.id;

        const interactiveStep: InteractiveExerciseLessonStep = {
          id: `${lesson.id}-step-${stepCounter++}-interactive-${exerciseId}`,
          type: "interactive-exercise",
          title: sandboxSection.title || "Interactive Exercise",
          lessonId: lesson.id,
          exerciseId,
          sectionId,
          section: sandboxSection,
          initialCode: sandboxSection.initialCode,
          instructions: sandboxSection.instructions,
          language: sandboxSection.language || "javascript",
          hasValidation: Boolean(sandboxSection.validation),
          validation: sandboxSection.validation,
        };

        steps.push(interactiveStep);
        break;
      }

      case "checkpoint": {
        flushPendingContent();
        const checkpointSection = s as LessonSection & {
          type: "checkpoint";
          id: string;
          label: string;
          hint?: string;
          assessment?: any;
        };

        const checkpointStep: CheckpointLessonStep = {
          id: `${lesson.id}-step-${stepCounter++}-checkpoint-${checkpointSection.id}`,
          type: "checkpoint",
          title: checkpointSection.label || "Checkpoint",
          lessonId: lesson.id,
          checkpointId: checkpointSection.id,
          sectionId: checkpointSection.id,
          section: checkpointSection,
          label: checkpointSection.label,
          hint: checkpointSection.hint,
          assessment: checkpointSection.assessment,
        };

        steps.push(checkpointStep);
        break;
      }

      case "inline-quiz": {
        flushPendingContent();
        const inlineQuizSection = s as LessonSection & {
          type: "inline-quiz";
          quizId: string;
        };
        const sectionId = "id" in s && s.id ? s.id : undefined;

        const quizStep: QuizLessonStep = {
          id: `${lesson.id}-step-${stepCounter++}-quiz-${inlineQuizSection.quizId}`,
          type: "quiz",
          title: "Inline Quiz",
          lessonId: lesson.id,
          quizId: inlineQuizSection.quizId,
          sectionId,
          section: inlineQuizSection,
          questions: [],
        };

        steps.push(quizStep);
        break;
      }

      default: {
        pendingContentSections.push(s);
        break;
      }
    }
  }

  flushPendingContent();

  // Process lesson-level exercises (from lesson.exercises[])
  if (lesson.exercises && lesson.exercises.length > 0) {
    for (const ex of lesson.exercises) {
      const alreadyIncluded = steps.some(
        (st) => st.type === "interactive-exercise" && st.exerciseId === ex.id,
      );

      if (!alreadyIncluded) {
        const interactiveStep: InteractiveExerciseLessonStep = {
          id: `${lesson.id}-step-${stepCounter++}-exercise-${ex.id}`,
          type: "interactive-exercise",
          title: ex.title || "Exercise",
          lessonId: lesson.id,
          exerciseId: ex.id,
          exercise: ex,
          initialCode: ex.playgroundCode,
          instructions: ex.brief,
          language: ex.playgroundLanguage || "javascript",
          hasValidation: Boolean(ex.validation),
          validation: ex.validation,
        };

        steps.push(interactiveStep);
      }
    }
  }

  // Process lesson-level quiz (from lesson.quiz[])
  if (lesson.quiz && lesson.quiz.length > 0) {
    const quizId = `${lesson.id}-quiz`;
    const alreadyIncluded = steps.some(
      (st) => st.type === "quiz" && (st.quizId === quizId || st.quizId === lesson.id),
    );

    if (!alreadyIncluded) {
      const quizStep: QuizLessonStep = {
        id: `${lesson.id}-step-${stepCounter++}-quiz`,
        type: "quiz",
        title: "Check Your Understanding",
        lessonId: lesson.id,
        quizId,
        questions: lesson.quiz,
      };

      steps.push(quizStep);
    }
  }

  // Process summary & interview questions (Phase 06 MASTER) if present
  if (lesson.summary || (lesson.interviewQuestions && lesson.interviewQuestions.length > 0)) {
    const summarySections: LessonSection[] = [];
    if (lesson.summary) {
      summarySections.push({
        type: "heading",
        text: "Key Takeaway",
      });
      summarySections.push({
        type: "paragraph",
        text: lesson.summary,
      });
    }

    const summaryStep: ContentLessonStep = {
      id: `${lesson.id}-step-${stepCounter++}-summary`,
      type: "content",
      title: "Key Takeaway & Summary",
      lessonId: lesson.id,
      sections: summarySections,
    };

    steps.push(summaryStep);
  }

  return steps;
}
