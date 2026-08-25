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
  // Concise Technical Eyebrow (e.g. MODULE 01 · ORIENTATION)
  const moduleNumber = String(module?.order || 1).padStart(2, "0");
  const moduleContext = module?.tags?.[0]?.toUpperCase() || "ORIENTATION";
  const eyebrowLabel = `MODULE ${moduleNumber} · ${moduleContext}`;
  const durationLabel = `${lesson.estimatedMinutes || 20} min practice`;

  return (
    <section aria-label="Current Engineering Challenge">
      {/* Precision Architectural Studio Surface */}
      <div className="relative rounded-lg border border-[#E7E2DA] dark:border-border/40 bg-[#FCFBF9] dark:bg-card/65 p-5 sm:p-8 lg:p-9 shadow-2xs backdrop-blur-[1px]">
        {/* Subtle Precision Top Hairline */}
        <div className="absolute inset-x-5 sm:inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#E7E2DA] dark:via-border/50 to-transparent pointer-events-none" />

        {/* Top Eyebrow Context */}
        <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-3 text-xs">
          <div className="flex items-center gap-2 font-mono text-[11px] sm:text-xs uppercase tracking-[0.06em]">
            <span className="font-semibold text-[#2C2A27] dark:text-foreground/90">
              {eyebrowLabel}
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] sm:text-xs text-[#78746E] dark:text-muted-foreground shrink-0">
            <span className="capitalize px-2 py-0.5 rounded-[3px] bg-[#EFECE6] dark:bg-muted/50 text-[11px] font-mono font-medium text-[#5C5852] dark:text-foreground/80 border border-[#E3DDD6] dark:border-border/30">
              {lesson.difficulty || "Beginner"}
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#78746E] dark:text-muted-foreground/80">
              <Clock className="h-3 w-3 text-[#78746E] dark:text-muted-foreground" />
              {durationLabel}
            </span>
          </div>
        </div>

        {/* Dominant Headline & Purpose Description */}
        <div className="mt-4 sm:mt-5 space-y-2 sm:space-y-2.5">
          <h1 className="text-2xl sm:text-4xl lg:text-[40px] font-bold tracking-tight text-[#2C2A27] dark:text-foreground leading-[1.18] sm:leading-[1.14] max-w-4xl">
            {lesson.title}
          </h1>
          <p className="text-sm sm:text-[17px] text-[#5C5852] dark:text-muted-foreground/90 leading-relaxed max-w-3xl">
            {lesson.description}
          </p>
        </div>

        {/* Action Floor */}
        <div className="mt-6 sm:mt-7 pt-4 sm:pt-6 border-t border-[#E3DDD6] dark:border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-5">
          {/* Module Progress Geometry */}
          <div className="space-y-1.5 sm:space-y-2 min-w-[220px] max-w-sm">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#78746E] dark:text-muted-foreground/80">
                {isNewLearner
                  ? "Module Progress"
                  : `Step ${String(currentStepNumber).padStart(2, "0")} of ${String(moduleLessonsCount).padStart(2, "0")} (${progressPercent}%)`}
              </span>
              <span className="text-[#2C2A27] dark:text-foreground font-medium">
                {isNewLearner ? "Ready to start" : `${progressPercent}%`}
              </span>
            </div>
            <div className="h-1.5 w-full bg-[#EFECE6] dark:bg-muted/60 rounded-[2px] overflow-hidden">
              <div
                className="h-full bg-[#D35C37] dark:bg-primary transition-all duration-500 rounded-[2px]"
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
                className="hidden md:inline-flex h-11 text-xs text-[#5C5852] hover:text-[#2C2A27] dark:text-muted-foreground/90 dark:hover:text-foreground font-medium px-4 hover:bg-[#EFECE6] dark:hover:bg-muted/40 font-mono rounded-[4px]"
              >
                <Link to="/learn/modules/$moduleId" params={{ moduleId: module.id }}>
                  <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                  Module Spec
                </Link>
              </Button>
            )}

            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto bg-[#D35C37] hover:bg-[#B84B2A] text-white active:scale-[0.985] font-semibold text-sm sm:text-base px-6 sm:px-9 h-11 sm:h-12 gap-2.5 rounded-[4px] shadow-2xs transition-all"
            >
              <Link
                to="/lesson/$lessonId"
                params={{ lessonId: lesson.id }}
                search={{ mode: "curriculum" }}
              >
                <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
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
