import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { BookOpen, CheckCircle2, Clock, PlayCircle, ArrowRight } from "lucide-react";
import type { Lesson } from "@/lib/types";

interface RecentLessonsCardProps {
  lessons: Lesson[];
  masteryMap?: Record<string, string>;
}

export function RecentLessonsCard({ lessons, masteryMap = {} }: RecentLessonsCardProps) {
  const recentList = lessons.slice(0, 4);

  return (
    <Card className="border-border/50 bg-card/80 transition duration-200 hover:border-border">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          Recent Lessons
        </CardTitle>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-xs gap-1 text-muted-foreground hover:text-foreground h-8 px-2"
        >
          <Link to="/learn/lessons">
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y divide-border/40">
          {recentList.map((lesson) => {
            const status = masteryMap[lesson.id] || lesson.mastery || "Not Started";
            const isMastered = status === "Mastered";

            return (
              <div
                key={lesson.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 transition-colors duration-150 hover:bg-muted/30"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <DifficultyBadge difficulty={lesson.difficulty} />
                    <span
                      className={`text-xs font-medium inline-flex items-center gap-1 ${
                        isMastered ? "text-emerald-400" : "text-muted-foreground"
                      }`}
                    >
                      {isMastered ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <PlayCircle className="h-3 w-3" />
                      )}
                      {status}
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm text-foreground truncate">{lesson.title}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-1">{lesson.description}</p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/30">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {lesson.estimatedMinutes} min
                  </span>
                  <Button
                    asChild
                    size="sm"
                    variant={isMastered ? "ghost" : "outline"}
                    className="h-8 text-xs gap-1 border-border/60"
                  >
                    <Link to="/lesson/$lessonId" params={{ lessonId: lesson.id }}>
                      {isMastered ? "Review" : "Continue"}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
