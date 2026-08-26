import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Play, ArrowRight, BookOpen, Clock } from "lucide-react";
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
      <div className="rounded-lg border border-border bg-card p-4 sm:p-5 shadow-xs transition-colors">
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
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate">
              {lesson.title}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
              {lesson.description}
            </p>
          </div>

          {/* Action & Progress Stack */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
            {/* Compact Progress Bar */}
            <div className="flex sm:flex-col justify-between sm:justify-center gap-1 sm:min-w-[120px]">
              <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground gap-2">
                <span>
                  {isNewLearner
                    ? "00 / " + String(moduleLessonsCount).padStart(2, "0")
                    : `${String(currentStepNumber).padStart(2, "0")} / ${String(moduleLessonsCount).padStart(2, "0")}`}
                </span>
                <span className="text-foreground font-medium">{progressPercent}%</span>
              </div>
              <div className="h-1.5 w-28 sm:w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{ width: `${Math.max(isNewLearner ? 0 : 6, progressPercent)}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {module && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="hidden lg:inline-flex min-h-[40px] text-xs font-mono"
                >
                  <Link to="/learn/modules/$moduleId" params={{ moduleId: module.id }}>
                    <BookOpen className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                    Spec
                  </Link>
                </Button>
              )}

              <Button
                asChild
                size="default"
                className="min-h-[44px] px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs sm:text-sm gap-2 rounded shadow-2xs transition-colors shrink-0"
              >
                <Link
                  to="/lesson/$lessonId"
                  params={{ lessonId: lesson.id }}
                  search={{ mode: "curriculum" }}
                >
                  <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                  <span>{isNewLearner ? "Start First Lesson" : "Resume Lesson"}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
