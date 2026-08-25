import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { BookOpen, CheckCircle2, Clock, Play, ArrowRight } from "lucide-react";
import type { Lesson } from "@/lib/types";

interface RecentLessonsCardProps {
  lessons: Lesson[];
  masteryMap?: Record<string, string>;
}

export function RecentLessonsCard({ lessons, masteryMap = {} }: RecentLessonsCardProps) {
  const recentList = lessons.slice(0, 4);

  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Recent Lessons</h3>
        </div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-xs gap-1 text-muted-foreground hover:text-foreground h-7 px-2"
        >
          <Link to="/learn/lessons">
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <div className="divide-y divide-border/40">
        {recentList.map((lesson) => {
          const status = masteryMap[lesson.id] || lesson.mastery || "Not Started";
          const isMastered = status === "Mastered";

          return (
            <div
              key={lesson.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 transition-colors duration-150"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <DifficultyBadge difficulty={lesson.difficulty} />
                  <span
                    className={`text-[11px] font-medium inline-flex items-center gap-1 ${
                      isMastered ? "text-emerald-500" : "text-muted-foreground"
                    }`}
                  >
                    {isMastered ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <Play className="h-3 w-3 text-primary" />
                    )}
                    {status}
                  </span>
                </div>
                <h4 className="font-semibold text-sm text-foreground truncate">{lesson.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-1">{lesson.description}</p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0">
                <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                  <Clock className="h-3.5 w-3.5" />
                  {lesson.estimatedMinutes}m
                </span>
                <Button
                  asChild
                  size="sm"
                  variant={isMastered ? "ghost" : "outline"}
                  className="h-8 text-xs gap-1 border-border/60"
                >
                  <Link to="/lesson/$lessonId" params={{ lessonId: lesson.id }}>
                    {isMastered ? "Review" : "Start"}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
