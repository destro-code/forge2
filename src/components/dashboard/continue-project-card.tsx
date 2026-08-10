import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { FolderGit2, CheckCircle2, Circle, ArrowRight, Clock } from "lucide-react";
import type { Project } from "@/lib/types";

interface ContinueProjectCardProps {
  project?: Project;
}

export function ContinueProjectCard({ project }: ContinueProjectCardProps) {
  if (!project) return null;

  const completedMilestones = project.milestones.filter((m) => m.done).length;
  const totalMilestones = project.milestones.length;
  const progressPercent =
    totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  return (
    <Card className="border-border/50 bg-card/80 transition duration-200 hover:border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-primary">
            <FolderGit2 className="h-4 w-4" />
            Active Project
          </div>
          <DifficultyBadge difficulty={project.difficulty} />
        </div>
        <CardTitle className="text-lg font-bold mt-1">{project.title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {project.description}
        </p>

        {/* Milestone Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Milestones</span>
            <span className="font-semibold text-foreground">
              {completedMilestones}/{totalMilestones} ({progressPercent}%)
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Next Uncompleted Milestone preview */}
        <div className="space-y-1.5 rounded-lg bg-muted/30 p-3 text-xs">
          <span className="text-xs font-medium text-muted-foreground block">
            Milestone Checklist
          </span>
          {project.milestones.map((m) => (
            <div key={m.id} className="flex items-center gap-2">
              {m.done ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
              <span
                className={
                  m.done ? "line-through text-muted-foreground" : "font-medium text-foreground"
                }
              >
                {m.title}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-border/40 pt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span>~{project.estimatedHours}h total</span>
          </div>
          <Button asChild size="sm" variant="outline" className="gap-1 h-8 text-xs border-border/60">
            <Link to="/projects">
              Resume Project
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
