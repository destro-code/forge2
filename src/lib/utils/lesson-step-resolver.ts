import type {
  Lesson,
  LessonSection,
  LessonExercise,
  LessonStep,
  ContentLessonStep,
  CodeExampleLessonStep,
  InteractiveExerciseLessonStep,
  InteractiveExerciseMode,
  CodeChallengeSize,
  CodeChallengePreviewType,
  QuizLessonStep,
  CheckpointLessonStep,
  ExerciseLeadIn,
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
 * Evaluates whether a preceding content section group is a small lead-in
 * that should be absorbed into an immediately following interactive exercise step.
 */
export function isExerciseLeadIn(group: LessonSection[]): boolean {
  if (!group || group.length === 0) return false;

  const hasHeavySection = group.some((s) =>
    ["code", "jsx", "javascript", "diagram", "walkthrough", "collapsible"].includes(s.type),
  );
  if (hasHeavySection) return false;

  const headings = group.filter((s) => s.type === "heading");
  const nonHeadings = group.filter((s) => s.type !== "heading");

  if (nonHeadings.length > 2) return false;

  const headingText = headings.length > 0 && "text" in headings[0] ? headings[0].text || "" : "";
  const firstNonHeadingText =
    nonHeadings.length > 0 && "text" in nonHeadings[0] ? (nonHeadings[0] as any).text || "" : "";

  const LEAD_IN_KEYWORD_REGEX =
    /\b(exercise|practice|drill|try\s+it|try\s+this|interact|challenge|predict|before\s+you\s+code|your\s+turn|lab)\b/i;

  const LEAD_IN_PREFIX_REGEX =
    /^(try|practice|read|inspect|predict|write|in this exercise|your task|before touching|take the)\b/i;

  const hasStrongTitle = LEAD_IN_KEYWORD_REGEX.test(headingText);
  const hasStrongPrefix = LEAD_IN_PREFIX_REGEX.test(firstNonHeadingText.trim());

  const totalText = nonHeadings.map((s) => ("text" in s ? s.text || "" : "")).join(" ");
  const totalWords = totalText.trim().split(/\s+/).filter(Boolean).length;

  if (nonHeadings.length === 0) {
    return true;
  }

  if (nonHeadings.length === 1) {
    if (totalWords <= 65 || totalText.length <= 420) return true;
    if ((hasStrongTitle || hasStrongPrefix) && totalWords <= 95) return true;
    return false;
  }

  if (nonHeadings.length === 2) {
    if ((hasStrongTitle || hasStrongPrefix) && totalWords <= 75) return true;
    if (totalWords <= 45) return true;
    return false;
  }

  return false;
}

export interface InferExerciseModeParams {
  id?: string;
  title?: string;
  instructions?: string;
  initialCode?: string;
  language?: string;
  hasValidation?: boolean;
  validation?: any;
  source: "section" | "lesson-exercise";
}

export interface InferredExerciseModeResult {
  mode: InteractiveExerciseMode;
  editorRequired: boolean;
  challengeSize?: CodeChallengeSize;
  showPreview?: boolean;
  previewType?: CodeChallengePreviewType;
}

/**
 * Extracts executable JavaScript from a starter code snippet that might be wrapped in an HTML/DOM test harness.
 * Returns null if no <script> tag is present or if the content is empty.
 */
export function extractEditableJavaScript(code: string): string | null {
  if (!code) return null;
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  const matches: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = scriptRegex.exec(code)) !== null) {
    if (m[1] && m[1].trim().length > 0) {
      matches.push(m[1].trim());
    }
  }
  if (matches.length > 0) {
    return matches.join("\n\n");
  }
  return null;
}

/**
 * Derives sizing classification (compact vs standard vs project) and preview visibility / type
 * for code exercises based on starter code size, language, complexity, and explicit tasks.
 */
export function inferChallengeSizeAndPreview(
  params: InferExerciseModeParams,
  mode: InteractiveExerciseMode,
  editorRequired: boolean,
): {
  challengeSize: CodeChallengeSize;
  showPreview: boolean;
  previewType: CodeChallengePreviewType;
} {
  if (!editorRequired) {
    return { challengeSize: "compact", showPreview: false, previewType: "none" };
  }

  if (mode === "project") {
    return { challengeSize: "project", showPreview: true, previewType: "browser" };
  }

  const code = (params.initialCode || "").trim();
  const lang = (params.language || "").toLowerCase();
  const title = (params.title || "").toLowerCase();
  const inst = (params.instructions || "").toLowerCase();

  // 1. React / JSX / complex imports are standard or project
  const isReact =
    lang === "jsx" ||
    lang === "tsx" ||
    code.includes("import React") ||
    code.includes("useState(") ||
    code.includes("useEffect(") ||
    code.includes("export default function");

  if (isReact) {
    return { challengeSize: "standard", showPreview: true, previewType: "browser" };
  }

  // 2. Capstone or full project titles
  if (
    title.includes("mini project") ||
    title.includes("capstone") ||
    inst.includes("mini project") ||
    inst.includes("capstone") ||
    title.includes("portfolio") ||
    inst.includes("portfolio")
  ) {
    return { challengeSize: "project", showPreview: true, previewType: "browser" };
  }

  // Exclude multi-step/complex debugger exercises
  const isComplexDebugger =
    title.includes("promise chain debugger") ||
    title.includes("missing await debugger") ||
    title.includes("promise error path") ||
    title.includes("event loop visualizer") ||
    inst.includes("debugger panel");

  // 3. Focused drills: targeted 1-file edits, attribute additions, tag fixes, small rules, JS logic drills
  const isFocusedTask =
    /\b(add|fix|repair|change|write|create|turn|connect|replace|move|select|structure|adjust|style|build|map|filter|grade|cascade|typography|spacing|debug|loop|condition|contract)\b/i.test(
      title,
    ) ||
    /\b(add a|add an|fix the|closing tag|attribute|single rule|change the|href|src|alt|color|font-size|margin|padding|h1|h2|p>|filter|map|getdisplayname|grade|loop|return statement|off-by-one)\b/i.test(
      inst,
    );

  const lineCount = code.split("\n").length;
  const isDirectSmallCode = (code.length <= 480 && lineCount <= 20) || code.length < 250;

  // 4. JavaScript-aware size analysis (when embedded in HTML test harness)
  const scriptContent = extractEditableJavaScript(code);
  let isScriptSmall = false;
  if (scriptContent) {
    const scriptLen = scriptContent.length;
    const scriptLines = scriptContent.split("\n").length;
    isScriptSmall = scriptLen <= 900 && scriptLines <= 25;
  }

  const isCompact =
    !isComplexDebugger &&
    (isDirectSmallCode || isScriptSmall) &&
    (isFocusedTask || code.length < 250 || (Boolean(scriptContent) && isScriptSmall));

  // Determine preview type & visibility
  const isPureJs =
    lang === "javascript" ||
    lang === "js" ||
    (!code.includes("<html") &&
      !code.includes("<div") &&
      !code.includes("<style>") &&
      !code.includes("<body") &&
      (code.includes("function") || code.includes("const ") || code.includes("let ")));

  const isHtmlCss =
    lang === "html" ||
    lang === "css" ||
    code.includes("<html") ||
    code.includes("<div") ||
    code.includes("<p") ||
    code.includes("<h1") ||
    code.includes("<style>") ||
    code.includes("<body");

  const isJsLogicDrill =
    lang === "javascript" ||
    lang === "js" ||
    (scriptContent !== null &&
      (title.includes("function") ||
        title.includes("loop") ||
        title.includes("grade") ||
        title.includes("map") ||
        title.includes("filter") ||
        title.includes("property access") ||
        title.includes("json.parse") ||
        inst.includes("console.log") ||
        inst.includes("return statement") ||
        title.includes("off-by-one")));

  let previewType: CodeChallengePreviewType = "browser";
  let showPreview = true;

  if (isPureJs) {
    previewType = "console";
    showPreview = true;
  } else if (isJsLogicDrill && !code.includes("<svg") && !code.includes("<canvas")) {
    previewType = "console";
    showPreview = true;
  } else if (!isHtmlCss) {
    previewType = "none";
    showPreview = false;
  }

  return {
    challengeSize: isCompact ? "compact" : "standard",
    showPreview,
    previewType,
  };
}

/**
 * Deterministically infers the appropriate presentation mode and whether a code editor is required
 * for an interactive exercise based on instructional language, structural metadata, and starter code.
 */
export function inferExerciseMode(params: InferExerciseModeParams): InferredExerciseModeResult {
  const title = (params.title || "").trim();
  const instructions = (params.instructions || "").trim();
  const code = (params.initialCode || "").trim();
  const lowerTitle = title.toLowerCase();

  const isHtmlScenarioWidget =
    code.includes("scenarios =") ||
    (code.includes("<script>") && code.includes("addEventListener") && code.includes("answer-box"));

  let mode: InteractiveExerciseMode = "code-completion";
  let editorRequired = true;

  // 1. Multiple Choice / Matching / Scenario Selection
  if (
    isHtmlScenarioWidget ||
    /^(request or response|frontend detective|client or server|http method matcher|match the|which role|choose the right|choose the input type)/i.test(
      title,
    ) ||
    /\b(choose which role|decide whether it describes|select the correct option|match each role|read each scenario and choose|read each scenario and decide)\b/i.test(
      instructions,
    )
  ) {
    mode = "multiple-choice";
    editorRequired = false;
  }
  // 2. Prediction
  else if (
    /^(css rule detective|selector matching lab|specificity showdown|follow the values|predict the chain|predict the interaction|what does this do|guess the output)/i.test(
      title,
    ) ||
    lowerTitle.startsWith("predict") ||
    /\b(before revealing the answer, explain|predict what will happen|predict the result before|predict where each path resolves)\b/i.test(
      instructions,
    )
  ) {
    const requiresCodeEditing =
      /\b(modify the code below|change the selector and write|edit the style rule to fix)\b/i.test(
        instructions,
      );
    mode = "prediction";
    editorRequired = requiresCodeEditing;
  }
  // 3. Reveal / Interactive Lab / Conceptual Reflection
  else if (
    /^(async \/ await live lab|error handling live lab|event loop visualizer|promise state playground|rebuild the web journey|build the right habit|explain the forge loop|trace the conversation|trace a link|split a feature)/i.test(
      title,
    ) ||
    lowerTitle.startsWith("reveal") ||
    lowerTitle.startsWith("explain ") ||
    lowerTitle.startsWith("describe ") ||
    lowerTitle.startsWith("trace ") ||
    /\b(toggle await in a live example|observe the difference|observe how|reveal the answer|explain learn \/ practice \/ grow|explain in your own words)\b/i.test(
      instructions,
    )
  ) {
    mode = "reveal";
    editorRequired = false;
  }
  // If from lesson.exercises and code is empty and instructions ask to explain/reflect/describe:
  else if (params.source === "lesson-exercise" && (!code || code.length === 0)) {
    if (
      /\b(explain|describe|trace|in your own words|identify what|reproduce the|separate the|reflect)\b/i.test(
        instructions,
      ) ||
      /^(explain|trace|describe|split|read|understand|compare)/i.test(title)
    ) {
      mode = "reveal";
      editorRequired = false;
    } else {
      mode = "reveal";
      editorRequired = false;
    }
  }
  // 4. Project / Capstone
  else if (
    /^(capstone|mini project|full project|final build|react mini project|javascript mini project|project stage)/i.test(
      title,
    ) ||
    /\b(capstone project|mini project|complete the full lesson tracker)\b/i.test(instructions)
  ) {
    mode = "project";
    editorRequired = true;
  }
  // 5. Code Fix / Debugging
  else if (
    /^(fix|debug|repair|diagnose|find the bug|cascade debug challenge|specificity bug|inheritance detective|promise chain debugger|promise error path|debug the broken paths)/i.test(
      title,
    ) ||
    /\b(fix the|find and fix|debug the|repair the|broken|diagnose the|correct the bug|fix a deliberately broken|diagnose and fix|close in the wrong order)\b/i.test(
      instructions,
    )
  ) {
    mode = "code-fix";
    editorRequired = true;
  }
  // 6. Code Completion / Active Authoring
  else if (
    /^(write|create|implement|build|add|make|style|convert|transform|format|render|turn the outline|structure the|connect the|replace the|center the|grade the|lesson status router)/i.test(
      title,
    ) ||
    /\b(write a|create a|implement a|build a|add a|change the|style the|update the|convert|mark up|construct|define a|write your)\b/i.test(
      instructions,
    ) ||
    (params.source === "section" && code.length > 0)
  ) {
    mode = "code-completion";
    editorRequired = true;
  }
  // Fallback for remaining exercises
  else if (code.length > 0 || params.hasValidation) {
    mode = "code-completion";
    editorRequired = true;
  } else {
    mode = "reveal";
    editorRequired = false;
  }

  const { challengeSize, showPreview, previewType } = inferChallengeSizeAndPreview(
    params,
    mode,
    editorRequired,
  );

  return {
    mode,
    editorRequired,
    challengeSize,
    showPreview,
    previewType,
  };
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
      const codeTitle = codeSec.title || currentHeadingTitle || "Code Example";

      steps.push({
        id: `${lesson.id}-step-${stepCounter++}-code`,
        type: "code-example",
        title: codeTitle,
        lessonId: lesson.id,
        sectionId: ("id" in codeSec && codeSec.id) || sectionId,
        origin: "section",
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
        origin: "section",
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
            origin: "section",
            section: codeSec,
            code: codeSec.code || "",
            language: codeLang,
            codeTitle: codeSec.title,
          });
        }
        break;
      }

      case "interactive-sandbox": {
        let leadIn: ExerciseLeadIn | undefined = undefined;
        let adoptedTitle: string | undefined = undefined;

        if (isExerciseLeadIn(currentGroup)) {
          const headingSec = currentGroup.find((sec) => sec.type === "heading");
          const headingText = headingSec && "text" in headingSec ? headingSec.text : undefined;

          const nonHeadingSecs = currentGroup.filter((sec) => sec.type !== "heading");
          const leadInText = nonHeadingSecs
            .map((sec) => ("text" in sec ? sec.text || "" : ""))
            .filter(Boolean)
            .join("\n\n");

          leadIn = {
            title: headingText,
            text: leadInText || undefined,
            sections: [...currentGroup],
          };

          currentGroup = [];
          currentSectionId = undefined;
        } else {
          adoptedTitle = flushGroup(s.type);
        }

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

        const stepTitle =
          sandboxSection.title || leadIn?.title || adoptedTitle || "Interactive Exercise";

        const { mode, editorRequired, challengeSize, showPreview, previewType } = inferExerciseMode(
          {
            id: exerciseId,
            title: stepTitle,
            instructions: sandboxSection.instructions,
            initialCode: sandboxSection.initialCode,
            language: sandboxSection.language,
            hasValidation: Boolean(sandboxSection.validation),
            validation: sandboxSection.validation,
            source: "section",
          },
        );

        steps.push({
          id: `${lesson.id}-step-${stepCounter++}-interactive-${exerciseId}`,
          type: "interactive-exercise",
          title: stepTitle,
          lessonId: lesson.id,
          exerciseId,
          sectionId,
          origin: "section",
          section: sandboxSection,
          initialCode: sandboxSection.initialCode,
          instructions: sandboxSection.instructions,
          language: sandboxSection.language || "javascript",
          hasValidation: Boolean(sandboxSection.validation),
          validation: sandboxSection.validation,
          leadIn:
            leadIn &&
            (leadIn.title || leadIn.text || (leadIn.sections && leadIn.sections.length > 0))
              ? leadIn
              : undefined,
          mode,
          editorRequired,
          challengeSize,
          showPreview,
          previewType,
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
          origin: "section",
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
          origin: "section",
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

        const { mode, editorRequired, challengeSize, showPreview, previewType } = inferExerciseMode(
          {
            id: ex.id,
            title: ex.title,
            instructions: ex.brief || ex.instructions,
            initialCode: ex.playgroundCode || ex.initialCode,
            language: ex.playgroundLanguage || ex.language,
            hasValidation: Boolean(ex.validation),
            validation: ex.validation,
            source: "lesson-exercise",
          },
        );

        const interactiveStep: InteractiveExerciseLessonStep = {
          id: `${lesson.id}-step-${stepCounter++}-exercise-${ex.id}`,
          type: "interactive-exercise",
          title: ex.title || "Exercise",
          lessonId: lesson.id,
          exerciseId: ex.id,
          origin: "lesson-exercise",
          exercise: ex,
          initialCode: ex.playgroundCode,
          instructions: ex.brief,
          language: ex.playgroundLanguage || "javascript",
          hasValidation: Boolean(ex.validation),
          validation: ex.validation,
          mode,
          editorRequired,
          challengeSize,
          showPreview,
          previewType,
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
        origin: "quiz",
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
      origin: "summary",
      sections: summarySections,
    };

    steps.push(summaryStep);
  }

  return reorderPedagogicalSteps(steps);
}

/**
 * Evaluates whether a lesson step represents an interview or reflection section.
 */
export function isInterviewOrReflectionStep(step: LessonStep): boolean {
  if (step.type !== "content") return false;
  const title = (step.title || "").trim();
  return /^(interview(\s+mode|\s+prep|\s+preparation|\s+practice)?|reflection|reflect|module\s+reflection|project\s+reflection|root-cause\s+reflection|what\s+would\s+you\s+say\??|explain\s+it\s+yourself)$/i.test(
    title,
  );
}

/**
 * Evaluates whether a lesson step represents a final takeaway, summary, or conclusion section.
 */
export function isTakeawayOrSummaryStep(step: LessonStep): boolean {
  if (step.type !== "content") return false;
  if (step.origin === "summary") return true;
  const title = (step.title || "").trim();
  return /^(key\s+takeaway(\s*&\s*summary)?|key\s+takeaways|what\s+you\s+should\s+take\s+away|lesson\s+summary|summary|conclusion|wrap\s+up|recap|final\s+thoughts)$/i.test(
    title,
  );
}

/**
 * Evaluates whether a lesson step is part of an end-of-lesson closing sequence
 * (interview, reflection, takeaway, summary, conclusion).
 */
export function isConclusionSequenceStep(step: LessonStep): boolean {
  return isInterviewOrReflectionStep(step) || isTakeawayOrSummaryStep(step);
}

/**
 * Reorders resolved lesson steps so that exercises and quizzes appear before
 * closing interview, reflection, takeaway, and summary sections.
 *
 * This enforces the pedagogical progression:
 * Concept -> Examples -> Practice/Exercises -> Checkpoints -> Quiz -> Interview/Reflection -> Final Summary
 * without modifying the underlying canonical lesson curriculum data.
 */
export function reorderPedagogicalSteps(steps: LessonStep[]): LessonStep[] {
  if (!steps || steps.length === 0) return [];

  const firstClosingIdx = steps.findIndex((s) => isConclusionSequenceStep(s));
  if (firstClosingIdx === -1) return steps;

  const tail = steps.slice(firstClosingIdx);
  const hasExerciseAfter = tail.some((s) => s.type === "interactive-exercise");
  const hasQuizAfter = tail.some((s) => s.type === "quiz");

  if (!hasExerciseAfter && !hasQuizAfter) {
    return steps;
  }

  const head = steps.slice(0, firstClosingIdx);

  const exercises: LessonStep[] = [];
  const quizzes: LessonStep[] = [];
  const checkpoints: LessonStep[] = [];
  const interviewReflection: LessonStep[] = [];
  const takeaways: LessonStep[] = [];
  const otherContent: LessonStep[] = [];

  for (const s of tail) {
    if (s.type === "interactive-exercise") {
      exercises.push(s);
    } else if (s.type === "quiz") {
      quizzes.push(s);
    } else if (s.type === "checkpoint") {
      checkpoints.push(s);
    } else if (isInterviewOrReflectionStep(s)) {
      interviewReflection.push(s);
    } else if (isTakeawayOrSummaryStep(s)) {
      takeaways.push(s);
    } else {
      otherContent.push(s);
    }
  }

  const reorderedTail = [
    ...otherContent,
    ...checkpoints,
    ...exercises,
    ...quizzes,
    ...interviewReflection,
    ...takeaways,
  ];

  return [...head, ...reorderedTail];
}
