import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import type { Lesson, Module, Topic } from "@/lib/types";

interface HeroStudioProps {
  lesson: Lesson;
  module?: Module;
  topic?: Topic;
  moduleLessonsCount?: number;
  currentStepNumber?: number;
  progressPercent?: number;
  isNewLearner?: boolean;
}

export function HeroStudio({
  lesson,
  module,
  topic,
  moduleLessonsCount = 1,
  currentStepNumber = 1,
  progressPercent = 0,
  isNewLearner = false,
}: HeroStudioProps) {
  const moduleNumber = String(module?.order || 1).padStart(2, "0");
  const moduleContext = topic?.title || module?.tags?.[0]?.toUpperCase() || "ORIENTATION";
  const eyebrowLabel = `MODULE ${moduleNumber} · ${moduleContext}`;
  const durationLabel = `${lesson.estimatedMinutes || 20}m practice`;

  return (
    <section aria-label="Current Engineering Challenge" className="w-full">
      <div className="rounded-lg border border-border bg-card p-4 sm:p-5 shadow-2xs transition-colors">
        {/* Eyebrow & Metadata Header */}
        <div className="flex flex-wrap items-center justify-between gap-y-1.5 gap-x-3 text-xs border-b border-border/60 pb-3">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
            <span className="text-foreground font-semibold">{eyebrowLabel}</span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground shrink-0">
            <span className="capitalize px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border/70 font-medium">
              {lesson.difficulty || "Beginner"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {durationLabel}
            </span>
          </div>
        </div>

        {/* Focus Details & Action Row */}
        <div className="mt-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 min-w-0 max-w-2xl">
            <div className="text-[11px] font-mono uppercase tracking-wider text-primary font-medium">
              {isNewLearner ? "Ready to begin" : "Continue Learning"}
            </div>
            <h1 className="text-lg sm:text-xl font-serif font-semibold tracking-tight text-foreground truncate">
              {lesson.title}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
              {lesson.description}
            </p>
          </div>

          {/* Action & Progress Stack */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
            {/* Compact Progress Bar */}
            <div className="flex sm:flex-col justify-between sm:justify-center gap-1 sm:min-w-[110px]">
              <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground gap-2">
                <span>
                  {isNewLearner
                    ? "00 / " + String(moduleLessonsCount).padStart(2, "0")
                    : `${String(currentStepNumber).padStart(2, "0")} / ${String(moduleLessonsCount).padStart(2, "0")}`}
                </span>
                <span className="text-foreground font-medium">{progressPercent}%</span>
              </div>
              <div className="h-1.5 w-24 sm:w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{ width: `${Math.max(isNewLearner ? 0 : 6, progressPercent)}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {module && (
                <Link
                  to="/learn/modules/$moduleId"
                  params={{ moduleId: module.id }}
                  className="hidden lg:inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
                >
                  <BookOpen className="h-3 w-3" />
                  <span>Spec</span>
                </Link>
              )}

              <Link
                to="/lesson/$lessonId"
                params={{ lessonId: lesson.id }}
                search={{ mode: "curriculum" }}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-mono font-medium text-primary hover:text-primary/80 transition-colors py-1 hover:underline"
              >
                <span>{isNewLearner ? "Start first challenge" : "Resume challenge"}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
