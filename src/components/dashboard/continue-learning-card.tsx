import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Clock, Sparkles } from "lucide-react";
import type { Lesson } from "@/lib/types";

interface ContinueLearningCardProps {
  lesson: Lesson;
  progressPercent?: number;
  moduleTitle?: string;
  topicTitle?: string;
}

export function ContinueLearningCard({
  lesson,
  progressPercent = 0,
  moduleTitle,
  topicTitle,
}: ContinueLearningCardProps) {
  const pathwayLabel = moduleTitle
    ? `${moduleTitle}${topicTitle ? ` — ${topicTitle}` : ""}`
    : topicTitle || "Frontend Engineering Academy";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-6 sm:p-8 lg:p-10 shadow-card transition-all duration-200">
      {/* Top subtle structural accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent" />

      {/* Pathway Eyebrow */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground font-medium">
          <span className="inline-flex items-center gap-1.5 font-semibold text-primary uppercase tracking-wider text-[11px]">
            <Sparkles className="h-3.5 w-3.5" />
            Resume Journey
          </span>
          <span className="text-border">/</span>
          <span className="truncate max-w-[240px] sm:max-w-md text-foreground font-medium">
            {pathwayLabel}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium font-mono">
          <Clock className="h-3.5 w-3.5" />
          <span>{lesson.estimatedMinutes} min practice</span>
        </div>
      </div>

      {/* Main Title & Context */}
      <div className="mt-5 space-y-3">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground leading-tight">
          {lesson.title}
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
          {lesson.description}
        </p>
      </div>

      {/* Bottom Action Footer */}
      <div className="mt-8 pt-6 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        {/* Module Completion Progress */}
        <div className="space-y-1.5 min-w-[200px]">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-muted-foreground font-medium">Module Progress</span>
            <span className="text-foreground font-semibold">{progressPercent}%</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 rounded-full"
              style={{ width: `${Math.max(4, progressPercent)}%` }}
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-sm px-7 h-11 gap-2.5 shadow-xs"
          >
            <Link
              to="/lesson/$lessonId"
              params={{ lessonId: lesson.id }}
              search={{ mode: "curriculum" }}
            >
              <Play className="h-4 w-4 fill-current" />
              Continue Lesson
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
