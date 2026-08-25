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
    <section aria-label="Curriculum Progression Ladder" className="space-y-3.5 pt-2">
      {/* Section Header */}
      <div className="flex flex-wrap items-baseline justify-between gap-y-1.5 gap-x-3 border-b border-[#E3DDD6] dark:border-border/50 pb-2.5 text-xs font-mono">
        <div className="min-w-0 flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#78746E] dark:text-muted-foreground/80 shrink-0">
            MODULE ROADMAP
          </span>
          <span className="text-[#E3DDD6] dark:text-border/80 shrink-0">·</span>
          <span className="text-xs sm:text-sm font-semibold text-[#2C2A27] dark:text-foreground truncate">
            {module.title}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[#78746E] dark:text-muted-foreground/70 text-[11px] hidden xs:inline">
            {String(completedCount).padStart(2, "0")}/{String(totalCount).padStart(2, "0")}{" "}
            COMPLETED
          </span>
          <Link
            to="/learn/modules/$moduleId"
            params={{ moduleId: module.id }}
            className="text-[#78746E] hover:text-[#2C2A27] dark:text-muted-foreground/60 dark:hover:text-foreground inline-flex items-center gap-1 text-[11px] transition-colors"
          >
            <span>View Full Roadmap</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* The Frameless Sequence Ladder */}
      <div className="divide-y divide-[#E3DDD6] dark:divide-border/40">
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
                className="py-3 px-3.5 sm:px-4 -mx-3.5 sm:-mx-4 rounded-xl border border-[#D35C37] bg-[#FCF1E9] dark:border-primary/30 dark:bg-primary/[0.055] my-1.5 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs text-[#B84B2A] dark:text-primary font-bold w-5 shrink-0 text-left">
                      {formattedStep}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to="/lesson/$lessonId"
                          params={{ lessonId: lesson.id }}
                          search={{ mode: "curriculum" }}
                          className="text-sm sm:text-base font-bold text-[#2C2A27] dark:text-foreground hover:underline truncate"
                        >
                          {lesson.title}
                        </Link>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-[#D35C37]/15 text-[#D35C37] border border-[#D35C37]/30 shrink-0">
                          ACTIVE FRONTIER
                        </span>
                      </div>
                      <p className="text-xs text-[#5C5852] dark:text-muted-foreground/90 line-clamp-1 mt-0.5 max-w-xl hidden sm:block">
                        {lesson.description}
                      </p>
                    </div>
                  </div>

                  <Link
                    to="/lesson/$lessonId"
                    params={{ lessonId: lesson.id }}
                    search={{ mode: "curriculum" }}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#D35C37] hover:bg-[#B84B2A] text-white dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 font-semibold text-xs transition-all shadow-2xs active:scale-[0.98] font-mono"
                  >
                    <span>Resume</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          }

          if (isCompleted) {
            return (
              <div
                key={lesson.id}
                className="py-2.5 sm:py-3 flex items-center justify-between gap-3 group transition-colors px-1"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs text-[#78746E] dark:text-muted-foreground/60 w-5 shrink-0 text-left">
                    {formattedStep}
                  </span>

                  <Link
                    to="/lesson/$lessonId"
                    params={{ lessonId: lesson.id }}
                    search={{ mode: "curriculum" }}
                    className="text-sm text-[#5C5852] hover:text-[#2C2A27] dark:text-foreground/80 dark:hover:text-foreground font-medium truncate"
                  >
                    {lesson.title}
                  </Link>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#1E6E49] dark:text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    VERIFIED
                  </span>
                  <Link
                    to="/lesson/$lessonId"
                    params={{ lessonId: lesson.id }}
                    search={{ mode: "curriculum" }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-[#78746E] hover:text-[#2C2A27] dark:text-muted-foreground dark:hover:text-foreground font-mono hidden sm:inline"
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
            statusLabel = "LAB MILESTONE";
          } else if (isNext) {
            statusLabel = "UP NEXT";
          }

          return (
            <div
              key={lesson.id}
              className="py-2.5 sm:py-3 flex items-center justify-between gap-3 transition-colors group px-1"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-xs text-[#78746E] dark:text-muted-foreground/45 w-5 shrink-0 text-left">
                  {formattedStep}
                </span>

                <Link
                  to="/lesson/$lessonId"
                  params={{ lessonId: lesson.id }}
                  search={{ mode: "curriculum" }}
                  className="text-sm text-[#9A948C] group-hover:text-[#2C2A27] dark:text-muted-foreground/80 dark:group-hover:text-foreground font-medium truncate transition-colors"
                >
                  {lesson.title}
                </Link>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                {statusLabel === "LAB MILESTONE" ? (
                  <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#EFECE6] dark:bg-muted/50 border border-[#E3DDD6] dark:border-border/40 text-[#5C5852] dark:text-foreground/75 font-medium">
                    LAB MILESTONE
                  </span>
                ) : statusLabel === "ASSESSMENT" ? (
                  <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#EFECE6] dark:bg-muted/50 border border-[#E3DDD6] dark:border-border/40 text-[#5C5852] dark:text-foreground/75 font-medium">
                    ASSESSMENT
                  </span>
                ) : statusLabel === "UP NEXT" ? (
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#78746E] dark:text-muted-foreground/75 font-medium">
                    UP NEXT
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-[#9A948C] dark:text-muted-foreground/50">
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
            className="text-xs text-[#78746E] hover:text-[#2C2A27] dark:text-muted-foreground dark:hover:text-foreground font-mono inline-flex items-center gap-1.5 transition-colors"
          >
            <Layers className="h-3.5 w-3.5" />
            Show full module ({totalCount} lessons)
          </button>
        </div>
      )}
    </section>
  );
}
