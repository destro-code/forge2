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
    <Card className="relative overflow-hidden border-border/60 shadow-elegant transition duration-200 hover:border-primary/40">
      <div className="ember-glow absolute inset-0 opacity-60 pointer-events-none" />
      <CardHeader className="relative pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="gap-1 bg-primary/10 text-primary border-primary/20 text-[10px]"
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
          <ProgressRing value={progressPercent / 100} size={58} strokeWidth={4} />
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {lesson.description}
        </p>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="outline" className="gap-1 bg-background/50">
            <Clock className="h-3 w-3 text-muted-foreground" />
            {lesson.estimatedMinutes} mins remaining
          </Badge>
          <Badge variant="outline" className="bg-background/50">
            Mastery · {lesson.mastery || "Practicing"}
          </Badge>
          <Badge variant="outline" className="bg-background/50">
            {lesson.exercises?.length || 1} exercises
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button asChild className="gap-1.5 shadow-glow">
            <Link to={`/lesson/${lesson.id}`}>
              Resume Lesson
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>

          <Button asChild variant="outline" className="gap-1.5 bg-background/60">
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
