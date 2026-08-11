import { Link } from "@tanstack/react-router";
import { ArrowRight, PlayCircle, Clock, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Lesson } from "@/lib/types";

interface QuickResumeBarProps {
  lesson: Lesson;
  progressPercent: number;
}

export function QuickResumeBar({ lesson, progressPercent }: QuickResumeBarProps) {
  return (
    <Card className="border-primary/25 bg-gradient-to-r from-primary/10 via-card to-card flex flex-col md:flex-row items-center justify-between gap-3.5 sm:gap-4 p-4 sm:p-5 rounded-xl relative overflow-hidden group">
      {/* Subtle Progress Overlay */}
      <div
        className="absolute left-0 top-0 bottom-0 bg-primary/5 transition-all duration-1000 ease-out z-0 pointer-events-none"
        style={{ width: `${progressPercent}%` }}
      />

      <div className="flex items-center gap-4 z-10 w-full md:w-auto min-w-0">
        <div className="h-11 w-11 shrink-0 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
          <BookOpen className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant="outline"
              className="text-xs font-medium bg-primary/10 border-primary/30 text-primary gap-1 px-2 py-0.5"
            >
              <Sparkles className="h-3 w-3" />
              Up Next
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> {lesson.estimatedMinutes} mins
            </span>
          </div>
          <h3 className="font-semibold text-foreground text-base truncate">{lesson.title}</h3>
        </div>
      </div>

      <div className="flex items-center gap-5 z-10 w-full md:w-auto shrink-0 justify-between md:justify-end">
        <div className="hidden md:flex flex-col items-end gap-1">
          <span className="text-xs text-muted-foreground font-medium">Module Progress</span>
          <div className="flex items-center gap-2">
            <div className="w-28 h-1.5 bg-muted/60 rounded-full overflow-hidden border border-border/40">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-mono font-medium text-foreground">
              {progressPercent}%
            </span>
          </div>
        </div>

        <Button
          asChild
          className="w-full md:w-auto shadow-glow gap-2 px-5 py-2 h-10 text-sm font-medium"
          size="default"
        >
          <Link to="/lesson/$lessonId" params={{ lessonId: lesson.id }}>
            <PlayCircle className="h-4 w-4" />
            Resume Lesson
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
