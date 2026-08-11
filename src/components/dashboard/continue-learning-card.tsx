import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/shared/progress-ring";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { ArrowRight, Bot, BookOpen, Sparkles, Clock } from "lucide-react";
import type { Lesson } from "@/lib/types";

interface ContinueLearningCardProps {
  lesson: Lesson;
  progressPercent?: number;
}

export function ContinueLearningCard({ lesson, progressPercent = 65 }: ContinueLearningCardProps) {
  return (
    <Card className="relative overflow-hidden border-border/50 bg-card/80 transition duration-200 hover:border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="gap-1 bg-primary/10 text-primary border-0 text-xs font-medium"
              >
                <Sparkles className="h-3 w-3" />
                In Progress
              </Badge>
              <DifficultyBadge difficulty={lesson.difficulty} />
            </div>
            <CardTitle className="text-xl font-bold tracking-tight text-foreground">
              {lesson.title}
            </CardTitle>
          </div>
          <ProgressRing value={progressPercent / 100} size={54} stroke={4} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {lesson.description}
        </p>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-md bg-muted/40 px-2.5 py-1">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            {lesson.estimatedMinutes} mins remaining
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-muted/40 px-2.5 py-1">
            Mastery · {lesson.mastery || "Practicing"}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-muted/40 px-2.5 py-1">
            {lesson.exercises?.length || 1} exercises
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button asChild size="sm" className="gap-1.5">
            <Link to="/lesson/$lessonId" params={{ lessonId: lesson.id }}>
              Resume Lesson
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
