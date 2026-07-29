import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { ProgressRing } from "@/components/shared/progress-ring";
import { useLearningPaths, useModules } from "@/lib/hooks/use-content";
import { Clock, ArrowRight, Target, Layers, Compass, BookOpen, Sparkles } from "lucide-react";

export const Route = createFileRoute("/learn/paths")({
  head: () => ({
    meta: [
      { title: "Learning Paths · Forge" },
      {
        name: "description",
        content: "Curated, role-based learning paths designed for modern frontend engineers.",
      },
      { property: "og:title", content: "Learning Paths · Forge" },
    ],
  }),
  component: LearningPathsRoute,
});

function LearningPathsRoute() {
  const paths = useLearningPaths();
  const modules = useModules();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Curated Sequences"
        title="Role-Based Learning Paths"
        description="Structured, goal-oriented roadmaps tailored for Staff Engineers, System Architects, and Performance Specialists."
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/learn">Curriculum Overview</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/learn/modules">All Modules</Link>
            </Button>
            <Button asChild>
              <Link to="/learn/lessons">All Lessons</Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        {paths.map((path) => {
          const pathModules = modules.filter((m) => path.moduleIds.includes(m.id));
          const avgProgress =
            pathModules.length > 0
              ? Math.round(
                  (pathModules.reduce((acc, m) => acc + m.progress, 0) / pathModules.length) * 100,
                )
              : 0;

          return (
            <Card
              key={path.id}
              className="group relative flex flex-col justify-between overflow-hidden border-border/60 transition duration-200 hover:border-primary/50 hover:shadow-glow"
            >
              <CardContent className="p-6 space-y-4">
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
                    <h3 className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                      {path.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Target className="h-3.5 w-3.5 text-primary" />
                      <span>
                        Target Role: <strong className="text-foreground">{path.targetRole}</strong>
                      </span>
                    </div>
                  </div>
                  <ProgressRing value={avgProgress / 100} size={58} strokeWidth={4} />
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">{path.description}</p>

                {/* Included Modules preview */}
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Included Modules ({pathModules.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {pathModules.map((m) => (
                      <Badge key={m.id} variant="outline" className="text-[11px] bg-muted/30">
                        {m.title}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between pt-4 border-t border-border/40 text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5 text-primary" />
                      {path.moduleIds.length} Modules
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-primary" />~{path.estimatedHours}h
                    </span>
                  </div>

                  <Button asChild size="sm" className="gap-1.5 shadow-glow">
                    <Link to="/learn/lessons" search={{ pathId: path.id }}>
                      Explore Path <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
