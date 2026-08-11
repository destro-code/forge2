import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/shared/progress-ring";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { useModule, useTopics, useLessons, useCategory } from "@/lib/hooks/use-content";
import { useProgress } from "@/lib/hooks/use-progress";
import { getModuleProgress, getTopicProgress } from "@/lib/hooks/use-curriculum";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock,
  FolderTree,
  GraduationCap,
  Layers,
  Network,
  TrendingUp,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/learn/modules/$moduleId")({
  head: ({ params }) => ({
    meta: [
      { title: `Module Hub · Forge` },
      {
        name: "description",
        content: `Explore topics and chapters in this frontend engineering curriculum module.`,
      },
    ],
  }),
  component: ModuleHubRoute,
});

function ModuleHubRoute() {
  const { moduleId } = Route.useParams();
  const moduleItem = useModule(moduleId);
  const category = useCategory(moduleItem?.categoryId);
  const allTopics = useTopics();
  const allLessons = useLessons();
  const { lessonsCompleted } = useProgress();

  if (!moduleItem) {
    return (
      <div className="space-y-6">
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link to="/learn/modules">
            <ArrowLeft className="h-4 w-4" /> Back to Modules
          </Link>
        </Button>
        <EmptyState
          title="Module Not Found"
          description="The requested curriculum module does not exist or may have been updated."
          action={
            <Button asChild>
              <Link to="/learn/modules">Browse All Modules</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const moduleTopics = allTopics.filter((t) => t.moduleId === moduleItem.id);
  const moduleTopicIds = moduleTopics.map((t) => t.id);
  const moduleLessons = allLessons.filter((l) => moduleTopicIds.includes(l.topicId));
  const completedCount = moduleLessons.filter((l) => lessonsCompleted.includes(l.id)).length;
  const progressPercent = getModuleProgress(moduleItem.id, lessonsCompleted);

  return (
    <div className="space-y-8">
      {/* Visual Hierarchy Navigation Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-mono bg-muted/30 border border-border/50 rounded-lg p-2.5">
        <GraduationCap className="h-4 w-4 text-primary shrink-0" />
        <Link to="/learn" className="hover:text-foreground hover:underline">
          Learning Path
        </Link>
        <span>→</span>
        <Link to="/learn/modules" className="hover:text-foreground hover:underline">
          Modules
        </Link>
        <span>→</span>
        <span className="font-semibold text-primary truncate max-w-[200px]">
          {moduleItem.title}
        </span>
      </div>

      {/* Module Overview Header */}
      <PageHeader
        eyebrow={`Module Hub · ${category?.name || "Frontend Domain"}`}
        title={moduleItem.title}
        description={moduleItem.description}
        actions={
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link to="/learn/modules">
              <ArrowLeft className="h-4 w-4" /> All Modules
            </Link>
          </Button>
        }
      />

      {/* Module Meta Card */}
      <Card className="border-border/60 bg-card/60 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <DifficultyBadge difficulty={moduleItem.difficulty} />
              {category && (
                <Badge variant="outline" className="text-[11px] bg-muted/40 font-mono">
                  {category.name}
                </Badge>
              )}
              <Badge variant="secondary" className="gap-1 text-[11px] font-mono">
                <Clock className="h-3 w-3 text-amber-400" /> ~{moduleItem.estimatedHours} Hours
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono pt-1">
              <span className="flex items-center gap-1.5">
                <FolderTree className="h-4 w-4 text-primary" />
                <strong className="text-foreground">{moduleTopics.length}</strong> Topics
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-emerald-400" />
                <strong className="text-foreground">{completedCount}</strong> /{" "}
                {moduleLessons.length} Lessons Completed
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2">
              {moduleItem.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px]">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-border/40 pt-4 md:pt-0 md:pl-6 shrink-0 w-full md:w-auto justify-between md:justify-start">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Pillar Progress</div>
              <div className="text-lg font-bold">{progressPercent}%</div>
            </div>
            <ProgressRing value={progressPercent / 100} size={56} />
          </div>
        </div>
      </Card>

      {/* Module Topics List Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
              <FolderTree className="h-4 w-4 text-primary" />
              Topics ({moduleTopics.length})
            </h2>
            <p className="text-xs text-muted-foreground">
              Topics inside this module. Select a topic to explore its lessons.
            </p>
          </div>
        </div>

        {moduleTopics.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {moduleTopics.map((topic) => {
              const topicLessons = allLessons.filter((l) => l.topicId === topic.id);
              const topicCompleted = topicLessons.filter((l) =>
                lessonsCompleted.includes(l.id),
              ).length;
              const topicProgressPercent = getTopicProgress(topic.id, lessonsCompleted);

              return (
                <Card
                  key={topic.id}
                  className="group flex flex-col justify-between border-border/60 transition duration-200 hover:border-primary/40 hover:shadow-glow"
                >
                  <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <DifficultyBadge difficulty={topic.difficulty} />
                        <Badge variant="secondary" className="gap-1 text-[10px] shrink-0">
                          <TrendingUp className="h-3 w-3 text-emerald-400" />
                          {topic.interviewFrequency}
                        </Badge>
                      </div>

                      <h3 className="text-base font-bold tracking-tight group-hover:text-primary transition-colors">
                        {topic.title}
                      </h3>
                      <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                        {topic.description}
                      </p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-border/40">
                      <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-amber-400" />
                          {topic.estimatedMinutes}m
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
                          {topicCompleted}/{topicLessons.length} Lessons ({topicProgressPercent}%)
                        </span>
                      </div>

                      <Button
                        asChild
                        className="w-full gap-2 text-xs shadow-xs"
                        variant="default"
                        size="sm"
                      >
                        <Link to="/learn/topics/$topicId" params={{ topicId: topic.id }}>
                          Open Topic <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No topics found"
            description="There are currently no chapter topics assigned to this module."
          />
        )}
      </section>
    </div>
  );
}
