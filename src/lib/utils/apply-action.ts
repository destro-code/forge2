import { LessonExercise, Lesson } from "@/lib/types";

export interface ApplyCtaConfig {
  actionType: "playground" | "quiz" | "debug-lab" | "external";
  label: string;
  to?: string;
  href?: string;
  isExternal?: boolean;
}

export function getApplyActivityCta(
  exercise: LessonExercise,
  lesson?: Lesson,
): ApplyCtaConfig | null {
  let actionType = exercise.applyAction;

  // Fallback to content semantics if applyAction is not explicitly defined
  if (!actionType) {
    const text = `${exercise.title} ${exercise.brief}`.toLowerCase();

    // 1. DevTools / Browser inspection / Network / Console / Sources / DOM inspection
    if (
      /devtools|inspect|elements panel|console panel|console tab|network panel|network tab|sources panel|sources tab|breakpoint|dom position|applied css rule|real webpage|browser devtools|computed styles|open devtools|press f12|right-click|browser tab|browser window|performance panel|application panel|lighthouse|memory panel|browser's devtools|browser console|browser element inspector|in your browser|in the browser|browser extension|f12 developer tools/i.test(
        text,
      )
    ) {
      actionType = "devtools";
    }
    // 2. Explicit Playground intent in text
    else if (
      /\bplayground\b|write code in the editor|build in the playground|try in playground|code in playground/i.test(
        text,
      )
    ) {
      actionType = "playground";
    }
    // 3. Quiz activity intent
    else if (/\bquiz\b/i.test(text) || exercise.quizId) {
      actionType = "quiz";
    }
    // 4. Debug Lab intent
    else if (/\bdebug lab\b|\bdebug drill\b|\bfix the bug\b/i.test(text) || exercise.bugId) {
      actionType = "debug-lab";
    }
    // 5. External link
    else if (exercise.actionUrl && /^https?:\/\//i.test(exercise.actionUrl)) {
      actionType = "external";
    }
    // 6. Reflection / Written / No Action Required
    else {
      actionType = "none";
    }
  }

  // Resolve CTA based on determined actionType
  switch (actionType) {
    case "playground":
      return {
        actionType: "playground",
        label: exercise.actionLabel || "Open Playground",
        to: exercise.actionUrl || `/playground${lesson?.id ? `?lesson=${lesson.id}` : ""}`,
      };

    case "quiz": {
      const targetQuizId = exercise.quizId || lesson?.quiz?.[0]?.id;
      if (!targetQuizId && !exercise.actionUrl) return null;
      return {
        actionType: "quiz",
        label: exercise.actionLabel || "Start Quiz",
        to: exercise.actionUrl || `/quizzes/${targetQuizId}`,
      };
    }

    case "debug-lab":
      return {
        actionType: "debug-lab",
        label: exercise.actionLabel || "Open Debug Lab",
        to: exercise.actionUrl || (exercise.bugId ? `/debug-lab/${exercise.bugId}` : "/debug-lab"),
      };

    case "external":
      if (!exercise.actionUrl) return null;
      return {
        actionType: "external",
        label: exercise.actionLabel || "Open External Tool",
        href: exercise.actionUrl,
        isExternal: true,
      };

    case "devtools":
      // Forge does NOT currently have a dedicated DevTools activity route.
      // Per CTA Rule 2: DO NOT invent a fake route. Show NO CTA.
      return null;

    case "none":
    default:
      // Per CTA Rule 6: No action required / fallback -> NO CTA.
      return null;
  }
}
