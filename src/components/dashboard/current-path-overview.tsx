import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Play, ChevronRight, Clock, MapPin } from "lucide-react";
import type { Module, Lesson } from "@/lib/types";

interface CurrentPathOverviewProps {
  module?: Module;
  moduleLessons: Lesson[];
  completedLessonIds: string[];
  currentLessonId?: string;
}

export function CurrentPathOverview({
  module,
  moduleLessons,
  completedLessonIds,
  currentLessonId,
}: CurrentPathOverviewProps) {
  if (!module) return null;

  const completedCount = moduleLessons.filter((l) => completedLessonIds.includes(l.id)).length;
  const totalCount = moduleLessons.length;
  const moduleProgress = Math.round((completedCount / (totalCount || 1)) * 100);

  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-card/40 p-5 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            Learning Path
          </div>
          <h3 className="text-xl font-bold tracking-tight text-foreground mt-0.5">
            {module.title}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-1 max-w-2xl">
            {module.description}
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <div className="text-xs font-semibold text-foreground">
              {completedCount} of {totalCount} lessons completed
            </div>
            <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
              {moduleProgress}% module progress
            </div>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1 border-border/60"
          >
            <Link to="/learn/modules">
              All Modules <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Module Progress Bar */}
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500 rounded-full"
          style={{ width: `${Math.max(3, moduleProgress)}%` }}
        />
      </div>

      {/* Lesson Sequence Timeline */}
      <div className="space-y-2 pt-2">
        {moduleLessons.slice(0, 5).map((les, index) => {
          const isCompleted = completedLessonIds.includes(les.id);
          const isCurrent = les.id === currentLessonId;

          return (
            <Link
              key={les.id}
              to="/lesson/$lessonId"
              params={{ lessonId: les.id }}
              search={{ mode: "curriculum" }}
              className={`group flex items-center justify-between gap-3 p-3 rounded-lg border transition-all duration-150 ${
                isCurrent
                  ? "bg-primary/10 border-primary/40 shadow-2xs"
                  : isCompleted
                    ? "bg-muted/20 border-border/30 hover:bg-muted/40"
                    : "bg-transparent border-transparent hover:bg-muted/30 hover:border-border/40"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Step indicator */}
                <div className="shrink-0 flex items-center justify-center">
                  {isCompleted ? (
                    <div className="h-6 w-6 rounded-full bg-emerald-500/15 border border-emerald-500/30 grid place-items-center text-emerald-500">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </div>
                  ) : isCurrent ? (
                    <div className="h-6 w-6 rounded-full bg-primary grid place-items-center text-primary-foreground font-bold text-xs">
                      <Play className="h-3 w-3 fill-current ml-0.5" />
                    </div>
                  ) : (
                    <div className="h-6 w-6 rounded-full border border-border/60 grid place-items-center text-[11px] font-mono font-medium text-muted-foreground">
                      {index + 1}
                    </div>
                  )}
                </div>

                {/* Lesson Title & Info */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-semibold truncate ${
                        isCurrent
                          ? "text-foreground font-bold"
                          : isCompleted
                            ? "text-foreground/80"
                            : "text-muted-foreground group-hover:text-foreground"
                      }`}
                    >
                      {les.title}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/15 px-2 py-0.5 rounded-full shrink-0">
                        Up Next
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {les.description}
                  </p>
                </div>
              </div>

              {/* Action/Time metadata */}
              <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[11px]">
                  <Clock className="h-3 w-3" />
                  {les.estimatedMinutes}m
                </span>
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          );
        })}

        {moduleLessons.length > 5 && (
          <div className="pt-2 text-center">
            <Link
              to="/learn/modules/$moduleId"
              params={{ moduleId: module.id }}
              className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium inline-flex items-center gap-1"
            >
              View all {moduleLessons.length} lessons in {module.title} →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
