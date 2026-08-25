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
  // Editorial Track & Module Eyebrow
  const trackLabel = module?.tags?.[0]
    ? `${module.tags[0].toUpperCase()} TRACK`
    : "FOUNDATIONS TRACK";
  const moduleLabel = module?.title
    ? `MODULE ${String(module.order || 1).padStart(2, "0")}: ${module.title.toUpperCase()}`
    : "CORE CURRICULUM";
  const durationLabel = `${lesson.estimatedMinutes || 20} min practice`;

  return (
    <section aria-label="Current Engineering Challenge">
      {/* Precision Architectural Studio Surface */}
      <div className="relative rounded-xl sm:rounded-2xl border border-border/75 dark:border-border/40 bg-card/95 dark:bg-card/65 p-6 sm:p-8 lg:p-9 shadow-xs backdrop-blur-[1px]">
        {/* Subtle Precision Top Hairline */}
        <div className="absolute inset-x-6 sm:inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-border/70 dark:via-border/50 to-transparent pointer-events-none" />

        {/* Top Eyebrow Context */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-mono text-[11px] sm:text-xs text-muted-foreground uppercase tracking-[0.06em]">
            <span className="font-semibold text-foreground/90">{trackLabel}</span>
            <span className="text-border/80">·</span>
            <span className="truncate max-w-[280px] sm:max-w-md text-muted-foreground/90 font-medium">
              {moduleLabel}
            </span>
          </div>

          <div className="flex items-center gap-2.5 font-mono text-[11px] sm:text-xs text-muted-foreground">
            <span className="capitalize px-2 py-0.5 rounded-md bg-muted/50 text-[11px] font-mono font-medium text-foreground/80 border border-border/30">
              {lesson.difficulty || "Beginner"}
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground/90">
              <Clock className="h-3 w-3 text-muted-foreground" />
              {durationLabel}
            </span>
          </div>
        </div>

        {/* Dominant Headline & Purpose Description */}
        <div className="mt-5 space-y-2.5">
          <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-bold tracking-tight text-foreground leading-[1.14] max-w-4xl">
            {lesson.title}
          </h1>
          <p className="text-base sm:text-[17px] text-muted-foreground/90 leading-relaxed max-w-3xl">
            {lesson.description}
          </p>
        </div>

        {/* Action Floor */}
        <div className="mt-7 pt-5 sm:pt-6 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          {/* Module Progress Geometry */}
          <div className="space-y-2 min-w-[240px] max-w-sm">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-muted-foreground/90">
                {isNewLearner
                  ? "Module Progress"
                  : `Step ${String(currentStepNumber).padStart(2, "0")} of ${String(moduleLessonsCount).padStart(2, "0")} (${progressPercent}%)`}
              </span>
              <span className="text-foreground font-medium">
                {isNewLearner ? "Ready to start" : `${progressPercent}%`}
              </span>
            </div>
            <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 rounded-full"
                style={{ width: `${Math.max(isNewLearner ? 0 : 6, progressPercent)}%` }}
              />
            </div>
          </div>

          {/* Primary Action Button & Spec Link */}
          <div className="flex flex-wrap items-center gap-3">
            {module && (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hidden md:inline-flex h-11 text-xs text-muted-foreground/90 hover:text-foreground font-medium px-4 hover:bg-muted/40"
              >
                <Link to="/learn/modules/$moduleId" params={{ moduleId: module.id }}>
                  <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                  View Module Spec
                </Link>
              </Button>
            )}

            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.985] font-semibold text-sm sm:text-base px-8 sm:px-10 h-11 sm:h-12 gap-2.5 shadow-xs transition-transform"
            >
              <Link
                to="/lesson/$lessonId"
                params={{ lessonId: lesson.id }}
                search={{ mode: "curriculum" }}
              >
                <Play className="h-4 w-4 fill-current ml-0.5" />
                {isNewLearner ? "Start First Lesson" : "Continue Lesson"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
