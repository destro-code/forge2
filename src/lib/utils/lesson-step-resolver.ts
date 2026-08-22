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
 * Normalizes an exercise identifier to its canonical string form
 * by stripping leading "interactive-" or "exercise-" prefixes.
 */
export function getCanonicalExerciseId(rawId: string | undefined): string {
  if (!rawId) return "";
  return rawId.trim().replace(/^(interactive|exercise)-/, "");
}

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
  const resolvedExerciseIds = new Set<string>();

  let currentGroup: LessonSection[] = [];
  let currentHeadingTitle: string | undefined = undefined;
  let currentSectionId: string | undefined = undefined;

  const flushGroup = (nextType?: string): string | undefined => {
    if (currentGroup.length === 0) return undefined;

    const nonHeading = currentGroup.filter((s) => s.type !== "heading");

    // Prevent creating an isolated, empty heading step right before interactive/assessment boundaries
    if (
      nonHeading.length === 0 &&
      nextType &&
      ["interactive-sandbox", "checkpoint", "inline-quiz", "code", "jsx", "javascript"].includes(
        nextType,
      )
    ) {
      const headingSec = currentGroup.find((s) => s.type === "heading");
      const headingText = headingSec && "text" in headingSec ? headingSec.text : undefined;
      currentGroup = [];
      return headingText;
    }

    const firstSection = currentGroup[0];
    const headingSection = currentGroup.find((s) => s.type === "heading");

    const sectionId =
      currentSectionId ||
      ("id" in firstSection && firstSection.id ? firstSection.id : undefined) ||
      (headingSection && "id" in headingSection ? headingSection.id : undefined);

    const stepTitle =
      headingSection && "text" in headingSection && headingSection.text
        ? headingSection.text
        : currentHeadingTitle || lesson.title;

    const hasCode = nonHeading.some((s) => ["code", "jsx", "javascript"].includes(s.type));
    const hasExplanatory = nonHeading.some((s) =>
      ["paragraph", "callout", "diagram", "walkthrough", "collapsible"].includes(s.type),
    );

    // Standalone code example without surrounding explanatory content
    if (hasCode && !hasExplanatory && nonHeading.length === 1) {
      const codeSec = nonHeading[0] as LessonSection & {
        type: "code" | "jsx" | "javascript";
        code: string;
        title?: string;
        language?: string;
      };
      const codeLang =
        codeSec.language ||
        (codeSec.type === "jsx"
          ? "jsx"
          : codeSec.type === "javascript"
            ? "javascript"
            : "typescript");
      const codeTitle = codeSec.title || stepTitle || "Code Example";

      steps.push({
        id: `${lesson.id}-step-${stepCounter++}-code`,
        type: "code-example",
        title: codeTitle,
        lessonId: lesson.id,
        sectionId: ("id" in codeSec && codeSec.id) || sectionId,
        section: codeSec,
        code: codeSec.code || "",
        language: codeLang,
        codeTitle: codeSec.title,
      });
    } else {
      steps.push({
        id: `${lesson.id}-step-${stepCounter++}-content`,
        type: "content",
        title: stepTitle,
        lessonId: lesson.id,
        sectionId,
        section: currentGroup.length === 1 ? currentGroup[0] : undefined,
        sections: [...currentGroup],
      });
    }

    currentGroup = [];
    currentSectionId = undefined;
    return undefined;
  };

  const sections = lesson.sections || [];

  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];

    switch (s.type) {
      case "heading": {
        flushGroup(s.type);
        currentGroup.push(s);
        currentHeadingTitle = s.text;
        currentSectionId = s.id;
        break;
      }

      case "paragraph":
      case "callout":
      case "diagram":
      case "walkthrough":
      case "collapsible": {
        currentGroup.push(s);
        if (!currentSectionId && "id" in s && s.id) {
          currentSectionId = s.id;
        }
        break;
      }

      case "code":
      case "jsx":
      case "javascript": {
        const hasExplanatory = currentGroup.some((sec) =>
          ["paragraph", "callout", "diagram", "walkthrough", "collapsible"].includes(sec.type),
        );

        if (hasExplanatory) {
          currentGroup.push(s);
          if (!currentSectionId && "id" in s && s.id) {
            currentSectionId = s.id;
          }
        } else {
          const adoptedTitle = flushGroup(s.type);
          const codeSec = s as LessonSection & {
            type: "code" | "jsx" | "javascript";
            code: string;
            title?: string;
            language?: string;
          };
          const codeLang =
            codeSec.language ||
            (s.type === "jsx" ? "jsx" : s.type === "javascript" ? "javascript" : "typescript");
          const codeTitle = codeSec.title || adoptedTitle || currentHeadingTitle || "Code Example";

          steps.push({
            id: `${lesson.id}-step-${stepCounter++}-code`,
            type: "code-example",
            title: codeTitle,
            lessonId: lesson.id,
            sectionId: ("id" in s && s.id ? s.id : undefined) || currentSectionId,
            section: codeSec,
            code: codeSec.code || "",
            language: codeLang,
            codeTitle: codeSec.title,
          });
        }
        break;
      }

      case "interactive-sandbox": {
        const adoptedTitle = flushGroup(s.type);
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

        if (exerciseId) {
          resolvedExerciseIds.add(exerciseId);
          const canonId = getCanonicalExerciseId(exerciseId);
          if (canonId) resolvedExerciseIds.add(canonId);
        }
        if (sandboxSection.validation?.exerciseId) {
          resolvedExerciseIds.add(sandboxSection.validation.exerciseId);
          const canonValId = getCanonicalExerciseId(sandboxSection.validation.exerciseId);
          if (canonValId) resolvedExerciseIds.add(canonValId);
        }

        steps.push({
          id: `${lesson.id}-step-${stepCounter++}-interactive-${exerciseId}`,
          type: "interactive-exercise",
          title: sandboxSection.title || adoptedTitle || "Interactive Exercise",
          lessonId: lesson.id,
          exerciseId,
          sectionId,
          section: sandboxSection,
          initialCode: sandboxSection.initialCode,
          instructions: sandboxSection.instructions,
          language: sandboxSection.language || "javascript",
          hasValidation: Boolean(sandboxSection.validation),
          validation: sandboxSection.validation,
        });
        break;
      }

      case "checkpoint": {
        const adoptedTitle = flushGroup(s.type);
        const checkpointSection = s as LessonSection & {
          type: "checkpoint";
          id: string;
          label: string;
          hint?: string;
          assessment?: any;
        };

        steps.push({
          id: `${lesson.id}-step-${stepCounter++}-checkpoint-${checkpointSection.id}`,
          type: "checkpoint",
          title: adoptedTitle || checkpointSection.label || "Checkpoint",
          lessonId: lesson.id,
          checkpointId: checkpointSection.id,
          sectionId: checkpointSection.id,
          section: checkpointSection,
          label: checkpointSection.label,
          hint: checkpointSection.hint,
          assessment: checkpointSection.assessment,
        });
        break;
      }

      case "inline-quiz": {
        const adoptedTitle = flushGroup(s.type);
        const inlineQuizSection = s as LessonSection & {
          type: "inline-quiz";
          quizId: string;
        };
        const sectionId = "id" in s && s.id ? s.id : undefined;

        steps.push({
          id: `${lesson.id}-step-${stepCounter++}-quiz-${inlineQuizSection.quizId}`,
          type: "quiz",
          title: adoptedTitle || "Inline Quiz",
          lessonId: lesson.id,
          quizId: inlineQuizSection.quizId,
          sectionId,
          section: inlineQuizSection,
          questions: [],
        });
        break;
      }

      default: {
        currentGroup.push(s);
        break;
      }
    }
  }

  flushGroup();

  // Process lesson-level exercises (from lesson.exercises[])
  if (lesson.exercises && lesson.exercises.length > 0) {
    for (const ex of lesson.exercises) {
      const rawId = ex.id;
      const canonId = getCanonicalExerciseId(rawId);
      const valId = ex.validation?.exerciseId;
      const canonValId = getCanonicalExerciseId(valId);

      const alreadyIncluded =
        (Boolean(rawId) && resolvedExerciseIds.has(rawId)) ||
        (Boolean(canonId) && resolvedExerciseIds.has(canonId)) ||
        (Boolean(valId) && resolvedExerciseIds.has(valId)) ||
        (Boolean(canonValId) && resolvedExerciseIds.has(canonValId));

      if (!alreadyIncluded) {
        if (rawId) {
          resolvedExerciseIds.add(rawId);
          if (canonId) resolvedExerciseIds.add(canonId);
        }
        if (valId) {
          resolvedExerciseIds.add(valId);
          if (canonValId) resolvedExerciseIds.add(canonValId);
        }

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
