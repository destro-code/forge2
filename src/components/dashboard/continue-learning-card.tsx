import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Clock, Sparkles, BookOpen } from "lucide-react";
import type { Lesson } from "@/lib/types";

interface ContinueLearningCardProps {
  lesson: Lesson;
  progressPercent?: number;
  moduleTitle?: string;
  topicTitle?: string;
  isNewLearner?: boolean;
}

export function ContinueLearningCard({
  lesson,
  progressPercent = 0,
  moduleTitle,
  topicTitle,
  isNewLearner = false,
}: ContinueLearningCardProps) {
  const pathwayLabel = moduleTitle
    ? `${moduleTitle}${topicTitle ? ` · ${topicTitle}` : ""}`
    : topicTitle || "Frontend Engineering Academy";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-6 sm:p-8 lg:p-10 shadow-xs transition-all duration-200">
      {/* Top subtle structural accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-primary/80" />

      {/* Pathway Eyebrow */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground font-medium">
          <span className="inline-flex items-center gap-1.5 font-semibold text-primary uppercase tracking-wider text-[11px]">
            {isNewLearner ? (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Start Your Journey
              </>
            ) : (
              <>
                <BookOpen className="h-3.5 w-3.5" />
                Current Lesson
              </>
            )}
          </span>
          <span className="text-border">/</span>
          <span className="truncate max-w-[240px] sm:max-w-md text-foreground font-medium">
            {pathwayLabel}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
          <span className="capitalize px-2 py-0.5 rounded-md bg-muted/60 text-[11px] font-mono font-medium">
            {lesson.difficulty || "Beginner"}
          </span>
          <span className="inline-flex items-center gap-1 font-mono text-[11px]">
            <Clock className="h-3.5 w-3.5 text-primary" />
            {lesson.estimatedMinutes} min
          </span>
        </div>
      </div>

      {/* Main Title & Context */}
      <div className="mt-5 space-y-3">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground leading-tight">
          {lesson.title}
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-3xl">
          {lesson.description}
        </p>
      </div>

      {/* Bottom Action Footer */}
      <div className="mt-8 pt-6 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        {/* Module Completion Progress */}
        <div className="space-y-1.5 min-w-[220px]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">
              {isNewLearner ? "Course Progress" : "Module Progress"}
            </span>
            <span className="text-foreground font-semibold font-mono">
              {isNewLearner ? "0% (Ready to start)" : `${progressPercent}%`}
            </span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 rounded-full"
              style={{ width: `${Math.max(isNewLearner ? 0 : 4, progressPercent)}%` }}
            />
          </div>
        </div>

        {/* Primary Action Control */}
        <div className="flex items-center gap-3">
          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-sm sm:text-base px-8 h-12 gap-2.5 shadow-sm"
          >
            <Link
              to="/lesson/$lessonId"
              params={{ lessonId: lesson.id }}
              search={{ mode: "curriculum" }}
            >
              <Play className="h-4 w-4 fill-current" />
              {isNewLearner ? "Begin First Lesson" : "Continue Lesson"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
