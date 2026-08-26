import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Activity, Code2, Lock, Play, X, Zap } from "lucide-react";
import type { Lesson } from "@/lib/types";

interface CurrentFocusProps {
  lesson: Lesson;
  nextLesson?: Lesson;
  isNewLearner?: boolean;
}

export function CurrentFocus({ lesson, nextLesson, isNewLearner = false }: CurrentFocusProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const minutes = lesson.estimatedMinutes || 18;
  const difficulty = lesson.difficulty || "Intermediate";

  return (
    <section
      aria-label="Current focus"
      className="focus-field relative overflow-hidden rounded-lg border px-5 py-6 sm:px-6"
      style={{ background: "var(--focus-surface)", borderColor: "var(--focus-border)" }}
    >
      <div className="relative flex items-start justify-between">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
          Current focus
        </span>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
          aria-label="Dismiss current focus"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="relative mt-5 flex h-11 w-11 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
        <Code2 className="h-5 w-5" aria-hidden="true" />
      </div>

      <h2 className="relative mt-5 max-w-md text-balance font-serif text-3xl font-medium leading-[1.1] tracking-tight text-primary sm:text-4xl">
        {lesson.title}
      </h2>

      <p className="relative mt-3 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
        {lesson.description}
      </p>

      <div className="relative mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          {minutes} min
        </span>
        <span className="inline-flex items-center gap-1.5 capitalize">
          <Activity className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          {difficulty}
        </span>
      </div>

      <Link
        to="/lesson/$lessonId"
        params={{ lessonId: lesson.id }}
        search={{ mode: "curriculum" }}
        className="relative mt-6 flex w-full items-center justify-between gap-3 rounded-md bg-primary px-5 py-3.5 font-mono text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <span>{isNewLearner ? "Start challenge" : "Continue challenge"}</span>
        <Play className="h-4 w-4 fill-current" aria-hidden="true" />
      </Link>

      {nextLesson && (
        <div className="relative mt-5 flex items-center justify-between gap-3 border-t border-border/60 pt-4">
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <span className="shrink-0 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Next up
            </span>
            <span className="truncate font-medium text-foreground">{nextLesson.title}</span>
          </div>
          <Lock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </div>
      )}
    </section>
  );
}
