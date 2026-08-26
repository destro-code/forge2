import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, ChevronRight, ArrowRight, Layers } from "lucide-react";
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
    <section aria-label="Curriculum Progression Ladder" className="flex flex-col gap-4 pt-1">
      {/* Section Header */}
      <div className="flex flex-wrap items-baseline justify-between gap-y-1.5 gap-x-3 border-b border-border pb-2.5 text-xs font-mono">
        <div className="min-w-0 flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
            MODULE ROADMAP
          </span>
          <span className="text-border shrink-0">·</span>
          <span className="text-xs sm:text-sm font-semibold text-foreground truncate">
            {module.title}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-muted-foreground text-[11px] hidden xs:inline">
            {String(completedCount).padStart(2, "0")}/{String(totalCount).padStart(2, "0")}{" "}
            COMPLETED
          </span>
          <Link
            to="/learn/modules/$moduleId"
            params={{ moduleId: module.id }}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-[11px] transition-colors"
          >
            <span>View Full Roadmap</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* The Flush Sequence Ladder */}
      <div className="divide-y divide-border/60">
        {visibleLessons.map((lesson, idx) => {
          const isCompleted = completedLessonIds.includes(lesson.id);
          const isActive = lesson.id === currentLessonId || (!currentLessonId && idx === 0);
          const stepNumber = idx + 1;
          const formattedStep = String(stepNumber).padStart(2, "0");
          const isNext = idx === activeIndex + 1;
          const isLast = idx === moduleLessons.length - 1;
          const isMilestone =
            stepNumber === 5 ||
            lesson.exercises?.some((e) => e.applyAction === "debug-lab") ||
            lesson.title.toLowerCase().includes("lab");
          const isAssessment =
            !isMilestone &&
            isLast &&
            (lesson.title.toLowerCase().includes("synthesis") ||
              lesson.title.toLowerCase().includes("verification") ||
              lesson.title.toLowerCase().includes("assessment") ||
              lesson.title.toLowerCase().includes("capstone"));

          if (isActive) {
            return (
              <div
                key={lesson.id}
                className="py-3 px-3 sm:px-4 rounded-r rounded-l-none border-l-2 border-l-primary border-y border-r border-border bg-card dark:bg-card my-1 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="font-mono text-xs text-primary font-bold w-5 shrink-0 text-left">
                      {formattedStep}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to="/lesson/$lessonId"
                          params={{ lessonId: lesson.id }}
                          search={{ mode: "curriculum" }}
                          className="text-sm sm:text-base font-serif font-semibold text-foreground hover:underline"
                        >
                          {lesson.title}
                        </Link>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 shrink-0">
                          Current lesson
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 max-w-xl hidden sm:block">
                        {lesson.description}
                      </p>
                    </div>
                  </div>

                  <Link
                    to="/lesson/$lessonId"
                    params={{ lessonId: lesson.id }}
                    search={{ mode: "curriculum" }}
                    className="shrink-0 p-1.5 rounded text-primary hover:text-foreground hover:bg-muted transition-colors"
                    title="Resume lesson"
                    aria-label="Resume lesson"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                </div>
              </div>
            );
          }

          if (isCompleted) {
            return (
              <div
                key={lesson.id}
                className="py-2.5 sm:py-3 flex items-center justify-between gap-3 group transition-colors px-2 sm:px-3 rounded hover:bg-muted/30"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="font-mono text-xs text-muted-foreground w-5 shrink-0 text-left">
                    {formattedStep}
                  </span>

                  <Link
                    to="/lesson/$lessonId"
                    params={{ lessonId: lesson.id }}
                    search={{ mode: "curriculum" }}
                    className="text-sm text-foreground/85 hover:text-foreground font-serif font-normal"
                  >
                    {lesson.title}
                  </Link>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-success font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    VERIFIED
                  </span>
                  <Link
                    to="/lesson/$lessonId"
                    params={{ lessonId: lesson.id }}
                    search={{ mode: "curriculum" }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted-foreground hover:text-foreground font-mono hidden sm:inline"
                    title="Review lesson"
                  >
                    Review →
                  </Link>
                </div>
              </div>
            );
          }

          // Upcoming status determining
          let statusLabel = "UPCOMING";
          if (isAssessment) {
            statusLabel = "ASSESSMENT";
          } else if (isMilestone) {
            statusLabel = "Hands-on";
          } else if (isNext) {
            statusLabel = "UP NEXT";
          }

          return (
            <div
              key={lesson.id}
              className="py-2.5 sm:py-3 flex items-center justify-between gap-3 transition-colors group px-2 sm:px-3 rounded hover:bg-muted/20"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="font-mono text-xs text-muted-foreground/60 w-5 shrink-0 text-left">
                  {formattedStep}
                </span>

                <Link
                  to="/lesson/$lessonId"
                  params={{ lessonId: lesson.id }}
                  search={{ mode: "curriculum" }}
                  className="text-sm text-muted-foreground group-hover:text-foreground font-serif font-normal transition-colors"
                >
                  {lesson.title}
                </Link>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                {statusLabel === "Hands-on" ? (
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-muted border border-border text-muted-foreground font-medium">
                    Hands-on // {lesson.estimatedMinutes || 20}m
                  </span>
                ) : statusLabel === "ASSESSMENT" ? (
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-muted border border-border text-muted-foreground font-medium">
                    ASSESSMENT
                  </span>
                ) : statusLabel === "UP NEXT" ? (
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-medium">
                    UP NEXT
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-muted-foreground/70">
                    {lesson.estimatedMinutes}m
                  </span>
                )}
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
