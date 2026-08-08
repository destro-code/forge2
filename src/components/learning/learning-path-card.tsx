import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { ProgressRing } from "@/components/shared/progress-ring";
import { Clock, ArrowRight, Sparkles, Target, Layers } from "lucide-react";
import type { LearningPath } from "@/lib/types";
import { useModules } from "@/lib/hooks/use-content";
import { useProgress } from "@/lib/hooks/use-progress";
import { getModuleProgress } from "@/lib/hooks/use-curriculum";

interface LearningPathCardProps {
  path: LearningPath;
  onSelectPath?: (pathId: string) => void;
  activePathId?: string;
}

export function LearningPathCard({ path, onSelectPath, activePathId }: LearningPathCardProps) {
  const allModules = useModules();
  const { lessonsCompleted } = useProgress();
  const pathModules = allModules.filter((m) => path.moduleIds.includes(m.id));

  // Calculate aggregate progress for path dynamically
  const avgProgress =
    pathModules.length > 0
      ? Math.round(
          pathModules.reduce((acc, m) => acc + getModuleProgress(m.id, lessonsCompleted), 0) /
            pathModules.length,
        )
      : 0;

  const isSelected = activePathId === path.id;

  return (
    <Card
      className={`group relative overflow-hidden transition-all duration-200 border-border/60 hover:border-primary/50 hover:shadow-glow ${
        isSelected ? "ring-2 ring-primary border-primary bg-primary/5" : ""
      }`}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <DifficultyBadge difficulty={path.difficulty} />
              {path.featured && (
                <Badge
                  variant="secondary"
                  className="gap-1 border-primary/20 bg-primary/10 text-primary text-[10px]"
                >
                  <Sparkles className="h-3 w-3" /> Featured Path
                </Badge>
              )}
            </div>
            <h3 className="text-lg font-semibold tracking-tight group-hover:text-primary transition-colors">
              {path.title}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Target className="h-3.5 w-3.5 text-primary" />
              <span>Target: {path.targetRole}</span>
            </div>
          </div>
          <ProgressRing value={avgProgress / 100} size={54} stroke={4} />
        </div>

        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground leading-relaxed">
          {path.description}
        </p>

        <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-primary/70" />
              {path.moduleIds.length} modules
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-primary/70" />~{path.estimatedHours}h
            </span>
          </div>

          <Button
            variant={isSelected ? "default" : "ghost"}
            size="sm"
            className="h-8 gap-1 text-xs"
            onClick={() => onSelectPath?.(path.id)}
          >
            {isSelected ? "Filtering by path" : "Explore Path"}
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
