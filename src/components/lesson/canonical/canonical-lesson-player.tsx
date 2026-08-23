import { useState, useMemo, useCallback } from "react";
import type { CanonicalLesson, CanonicalActivity } from "@/lib/curriculum/types";
import { CanonicalActivityView } from "./canonical-activity-view";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Award,
  Sparkles,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface CanonicalLessonPlayerProps {
  lesson: CanonicalLesson;
  onComplete?: () => void;
  className?: string;
}

export function CanonicalLessonPlayer({
  lesson,
  onComplete,
  className,
}: CanonicalLessonPlayerProps) {
  const activities = lesson.activities;
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [completedActivityIds, setCompletedActivityIds] = useState<Set<string>>(new Set());

  const currentActivity: CanonicalActivity | undefined =
    activities[currentActivityIndex] || activities[0];

  const totalActivities = activities.length;
  const completedCount = completedActivityIds.size;
  const progressPercent =
    totalActivities > 0 ? Math.round((completedCount / totalActivities) * 100) : 0;

  const handleActivityComplete = useCallback(
    (result?: { isValid: boolean }) => {
      if (!currentActivity) return;

      setCompletedActivityIds((prev) => {
        const next = new Set(prev);
        next.add(currentActivity.id);
        return next;
      });

      // Advance to next activity or finish lesson
      if (currentActivityIndex < totalActivities - 1) {
        setCurrentActivityIndex((prev) => prev + 1);
      } else {
        onComplete?.();
      }
    },
    [currentActivity, currentActivityIndex, totalActivities, onComplete],
  );

  const goToActivity = (index: number) => {
    if (index >= 0 && index < totalActivities) {
      setCurrentActivityIndex(index);
    }
  };

  return (
    <div className={cn("flex flex-col h-full w-full bg-background overflow-hidden", className)}>
      {/* Lesson Header */}
      <header className="flex flex-col border-b border-border/80 bg-card/60 backdrop-blur-xs px-4 sm:px-6 py-3 shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground uppercase">
                  Lesson {lesson.order}
                </span>
                <Badge variant="outline" className="text-[10px] h-4 px-1.5 capitalize">
                  {lesson.difficulty}
                </Badge>
              </div>
              <h1 className="text-sm sm:text-base font-bold text-foreground truncate">
                {lesson.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>{lesson.estimatedMinutes} min</span>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                disabled={currentActivityIndex === 0}
                onClick={() => goToActivity(currentActivityIndex - 1)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                aria-label="Previous activity"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <span className="text-xs font-mono font-medium px-1 text-muted-foreground">
                {currentActivityIndex + 1} / {totalActivities}
              </span>

              <Button
                variant="ghost"
                size="icon"
                disabled={currentActivityIndex === totalActivities - 1}
                onClick={() => goToActivity(currentActivityIndex + 1)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                aria-label="Next activity"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Activity Progress Ribbon */}
        <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-border/40 overflow-x-auto no-scrollbar">
          {activities.map((act, idx) => {
            const isCurrent = idx === currentActivityIndex;
            const isDone = completedActivityIds.has(act.id);

            return (
              <button
                key={act.id}
                type="button"
                onClick={() => goToActivity(idx)}
                aria-label={`Activity ${idx + 1}: ${act.type}`}
                className={cn(
                  "h-1.5 flex-1 min-w-[20px] rounded-full transition-all relative group",
                  isCurrent
                    ? "bg-primary shadow-xs ring-2 ring-primary/30"
                    : isDone
                      ? "bg-emerald-500 hover:bg-emerald-600"
                      : "bg-muted hover:bg-muted-foreground/30",
                )}
              />
            );
          })}
        </div>
      </header>

      {/* Main Activity Viewport */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-start">
        {currentActivity ? (
          <CanonicalActivityView
            key={currentActivity.id}
            activity={currentActivity}
            onComplete={handleActivityComplete}
            className="w-full my-auto"
          />
        ) : (
          <div className="p-12 text-center text-muted-foreground">
            No activities available in this lesson.
          </div>
        )}
      </main>
    </div>
  );
}
