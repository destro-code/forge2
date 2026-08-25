import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Play, ChevronRight, Clock, ArrowRight, Layers } from "lucide-react";
import type { Module, Lesson } from "@/lib/types";

interface LearningLadderProps {
  module?: Module;
  moduleLessons: Lesson[];
  completedLessonIds: string[];
  currentLessonId?: string;
}

export function LearningLadder({
  module,
  moduleLessons,
  completedLessonIds,
  currentLessonId,
}: LearningLadderProps) {
  const [showAllLessons, setShowAllLessons] = useState(false);

  if (!module || moduleLessons.length === 0) return null;

  const completedCount = moduleLessons.filter((l) => completedLessonIds.includes(l.id)).length;
  const totalCount = moduleLessons.length;
  const currentIndex = moduleLessons.findIndex((l) => l.id === currentLessonId);
  const activeIndex = currentIndex !== -1 ? currentIndex : 0;

  // On mobile or compact mode, by default show completed + active + next 2 upcoming, with option to expand
  const shouldTruncate = moduleLessons.length > 5 && !showAllLessons;
  const visibleLessons = shouldTruncate
    ? moduleLessons.slice(0, Math.max(5, activeIndex + 3))
    : moduleLessons;

  return (
    <section aria-label="Curriculum Progression Ladder" className="space-y-4 pt-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-border/50 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
            MODULE ROADMAP
          </span>
          <span className="text-border">·</span>
          <span className="text-sm font-semibold text-foreground truncate">{module.title}</span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="text-muted-foreground font-mono">
            {completedCount} of {totalCount} completed
          </span>
          <Link
            to="/learn/modules/$moduleId"
            params={{ moduleId: module.id }}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-medium transition-colors"
          >
            All Modules <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* The Frameless Sequence Ladder */}
      <div className="divide-y divide-border/40">
        {visibleLessons.map((lesson, idx) => {
          const isCompleted = completedLessonIds.includes(lesson.id);
          const isActive = lesson.id === currentLessonId || (!currentLessonId && idx === 0);
          const stepNumber = idx + 1;
          const isMilestone =
            lesson.exercises?.some((e) => e.applyAction === "debug-lab") ||
            idx === moduleLessons.length - 1;

          if (isActive) {
            return (
              <div
                key={lesson.id}
                className="py-3 sm:py-3.5 px-3 sm:px-4 -mx-3 sm:-mx-4 rounded-xl border border-primary/35 bg-card/75 shadow-2xs my-1"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="h-7 w-7 rounded-full bg-primary grid place-items-center text-primary-foreground shrink-0 shadow-2xs">
                      <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono text-xs text-primary font-semibold">
                          Step {stepNumber}
                        </span>
                        <Link
                          to="/lesson/$lessonId"
                          params={{ lessonId: lesson.id }}
                          search={{ mode: "curriculum" }}
                          className="text-sm sm:text-base font-bold text-foreground hover:underline truncate"
                        >
                          {lesson.title}
                        </Link>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider bg-primary/15 text-primary border border-primary/20 shrink-0">
                          Active Step · {lesson.estimatedMinutes}m
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 max-w-2xl">
                        {lesson.description}
                      </p>
                    </div>
                  </div>

                  <Link
                    to="/lesson/$lessonId"
                    params={{ lessonId: lesson.id }}
                    search={{ mode: "curriculum" }}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors shadow-2xs"
                  >
                    Resume <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          }

          if (isCompleted) {
            return (
              <div
                key={lesson.id}
                className="py-2.5 sm:py-3 flex items-center justify-between gap-3 group transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="h-6 w-6 rounded-full bg-emerald-500/15 border border-emerald-500/30 grid place-items-center text-emerald-500 shrink-0">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>

                  <div className="min-w-0 flex items-baseline gap-2">
                    <span className="font-mono text-xs text-muted-foreground/80">
                      {stepNumber}.
                    </span>
                    <Link
                      to="/lesson/$lessonId"
                      params={{ lessonId: lesson.id }}
                      search={{ mode: "curriculum" }}
                      className="text-sm text-foreground/85 hover:text-foreground font-medium truncate"
                    >
                      {lesson.title}
                    </Link>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                  <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                    Verified
                  </span>
                  <Link
                    to="/lesson/$lessonId"
                    params={{ lessonId: lesson.id }}
                    search={{ mode: "curriculum" }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted-foreground hover:text-foreground"
                    title="Review lesson"
                  >
                    Review →
                  </Link>
                </div>
              </div>
            );
          }

          // Upcoming state
          return (
            <div
              key={lesson.id}
              className="py-2.5 sm:py-3 flex items-center justify-between gap-3 text-muted-foreground/90 transition-colors group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="h-6 w-6 rounded-full border border-border/70 grid place-items-center text-[11px] font-mono text-muted-foreground shrink-0">
                  {stepNumber}
                </div>

                <div className="min-w-0 flex items-baseline gap-2">
                  <span className="font-mono text-xs text-muted-foreground/60">{stepNumber}.</span>
                  <Link
                    to="/lesson/$lessonId"
                    params={{ lessonId: lesson.id }}
                    search={{ mode: "curriculum" }}
                    className="text-sm text-muted-foreground group-hover:text-foreground font-medium truncate transition-colors"
                  >
                    {lesson.title}
                  </Link>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                {isMilestone ? (
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-muted/60 border border-border/50 text-foreground/80 font-medium">
                    Milestone
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                    <Clock className="h-3 w-3" />
                    {lesson.estimatedMinutes}m
                  </span>
                )}
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-foreground transition-colors" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Expand/Collapse Toggle if module is long */}
      {shouldTruncate && (
        <div className="pt-2 text-center">
          <button
            onClick={() => setShowAllLessons(true)}
            className="text-xs text-muted-foreground hover:text-foreground font-mono inline-flex items-center gap-1.5 transition-colors"
          >
            <Layers className="h-3.5 w-3.5" />
            Show full module ({totalCount} lessons)
          </button>
        </div>
      )}
    </section>
  );
}
