import { createContext, useContext } from "react";

export interface LessonLayoutContextValue {
  /**
   * When true, the lesson shell owns the content measure and activity
   * containers must not apply their own max-width. This keeps the frame a
   * fixed width across every activity instead of resizing on each advance.
   */
  shellManagedWidth: boolean;
  /**
   * When true, the lesson shell renders the single authoritative feedback
   * region just above its sticky action bar. Inline feedback rendered deep
   * inside a renderer suppresses itself so diagnostics can never land in
   * unreachable space below the fold.
   *
   * Renderers stay unchanged and still render their own feedback when used
   * outside the shell, where this defaults to false.
   */
  shellManagedFeedback: boolean;
}

const LessonLayoutContext = createContext<LessonLayoutContextValue>({
  shellManagedWidth: false,
  shellManagedFeedback: false,
});

export const LessonLayoutProvider = LessonLayoutContext.Provider;

export function useLessonLayout(): LessonLayoutContextValue {
  return useContext(LessonLayoutContext);
}
