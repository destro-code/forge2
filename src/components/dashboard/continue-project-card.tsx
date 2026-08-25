import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
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
    <div className="rounded-xl border border-border/60 bg-card/60 p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <FolderGit2 className="h-4 w-4" />
          Active Portfolio Project
        </div>
        <DifficultyBadge difficulty={project.difficulty} />
      </div>

      <div>
        <h3 className="text-base font-bold text-foreground">{project.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
          {project.description}
        </p>
      </div>

      {/* Milestone Progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium">Milestones</span>
          <span className="font-semibold text-foreground">
            {completedMilestones}/{totalMilestones} ({progressPercent}%)
          </span>
        </div>
        <Progress value={progressPercent} className="h-1.5" />
      </div>

      {/* Milestone List preview */}
      <div className="space-y-1.5 rounded-lg bg-muted/20 p-3 text-xs border border-border/30">
        {project.milestones.slice(0, 3).map((m) => (
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
        <span className="flex items-center gap-1 font-mono">
          <Clock className="h-3.5 w-3.5" />~{project.estimatedHours}h estimated
        </span>
        <Button asChild size="sm" variant="outline" className="gap-1 h-8 text-xs border-border/60">
          <Link to="/projects">
            Resume Project
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
