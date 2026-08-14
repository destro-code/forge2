import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { ArrowRight, Bot, Sparkles, Clock, PlayCircle, BookOpen } from "lucide-react";
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
  return (
    <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-r from-primary/10 via-card to-card transition-all duration-200 hover:border-primary/50 shadow-xs">
      {/* Subtle Progress Bar Overlay along bottom */}
      <div
        className="absolute bottom-0 left-0 h-1 bg-primary transition-all duration-500"
        style={{ width: `${progressPercent}%` }}
      />

      <CardContent className="p-5 sm:p-6 space-y-4">
        {/* Header & Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className="gap-1 bg-primary/15 text-primary border-primary/20 text-xs font-semibold px-2.5 py-0.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              In Progress
            </Badge>
            {(moduleTitle || topicTitle) && (
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                {moduleTitle ? moduleTitle : topicTitle}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <DifficultyBadge difficulty={lesson.difficulty} />
            <span className="text-xs text-muted-foreground font-mono font-medium">
              {progressPercent}% Complete
            </span>
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-snug">
            {lesson.title}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {lesson.description}
          </p>
        </div>

        {/* Metadata Badges */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2.5 py-1 font-medium">
            <Clock className="h-3.5 w-3.5 text-primary" />
            {lesson.estimatedMinutes} mins remaining
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2.5 py-1 font-medium">
            Mastery · {lesson.mastery || "Practicing"}
          </span>
          {lesson.exercises && lesson.exercises.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2.5 py-1 font-medium">
              {lesson.exercises.length} practice exercises
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Button
            asChild
            size="default"
            className="gap-2 shadow-glow px-5 py-2.5 h-10 text-sm font-semibold"
          >
            <Link
              to="/lesson/$lessonId"
              params={{ lessonId: lesson.id }}
              search={{ mode: "curriculum" }}
            >
              <PlayCircle className="h-4 w-4" />
              Continue Lesson
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>

          <Button asChild variant="outline" size="sm" className="gap-1.5 border-border/60">
            <Link to="/mentor">
              <Bot className="h-4 w-4 text-primary" />
              Ask AI Mentor
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
