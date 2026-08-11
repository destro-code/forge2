import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { useTopic, useModule, useLessons, useTopics } from "@/lib/hooks/use-content";
import { useProgress } from "@/lib/hooks/use-progress";
import { getTopicProgress } from "@/lib/hooks/use-curriculum";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  FolderTree,
  GraduationCap,
  Layers,
  Network,
  PlayCircle,
  TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/learn/topics/$topicId")({
  head: () => ({
    meta: [
      { title: `Topic Hub · Forge` },
      {
        name: "description",
        content: `Explore chapter lessons and exercises for this topic.`,
      },
    ],
  }),
  component: TopicHubRoute,
});

function TopicHubRoute() {
  const { topicId } = Route.useParams();
  const topic = useTopic(topicId);
  const parentModule = useModule(topic?.moduleId);
  const allLessons = useLessons();
  const allTopics = useTopics();
  const { lessonsCompleted } = useProgress();

  if (!topic) {
    return (
      <div className="space-y-6">
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link to="/learn/topics">
            <ArrowLeft className="h-4 w-4" /> Back to Topics
          </Link>
        </Button>
        <EmptyState
          title="Topic Not Found"
          description="The requested chapter topic does not exist or may have been updated."
          action={
            <Button asChild>
              <Link to="/learn/topics">Browse All Topics</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const topicLessons = allLessons.filter((l) => l.topicId === topic.id);
  const completedCount = topicLessons.filter((l) => lessonsCompleted.includes(l.id)).length;
  const topicProgressPercent = getTopicProgress(topic.id, lessonsCompleted);

  const prereqTopics = allTopics.filter((t) => topic.prerequisites.includes(t.id));

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
        {parentModule && (
          <>
            <span>→</span>
            <Link
              to="/learn/modules/$moduleId"
              params={{ moduleId: parentModule.id }}
              className="hover:text-foreground hover:underline truncate max-w-[150px]"
            >
              {parentModule.title}
            </Link>
          </>
        )}
        <span>→</span>
        <span className="font-semibold text-primary truncate max-w-[200px]">{topic.title}</span>
      </div>

      {/* Topic Overview Header */}
      <PageHeader
        eyebrow={`Topic Hub · ${parentModule ? parentModule.title : "Modules"}`}
        title={topic.title}
        description={topic.description}
        actions={
          <div className="flex gap-2">
            {parentModule && (
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <Link to="/learn/modules/$moduleId" params={{ moduleId: parentModule.id }}>
                  <ArrowLeft className="h-4 w-4" /> {parentModule.title}
                </Link>
              </Button>
            )}
            <Button asChild variant="ghost" size="sm" className="gap-1.5">
              <Link to="/learn/topics">All Topics</Link>
            </Button>
          </div>
        }
      />

      {/* Topic Meta Card */}
      <Card className="border-border/60 bg-card/60 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <DifficultyBadge difficulty={topic.difficulty} />
              <Badge variant="secondary" className="gap-1 text-[11px] font-mono">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                Interview Weight: {topic.interviewFrequency}
              </Badge>
              <Badge variant="outline" className="gap-1 text-[11px] font-mono">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                {topic.estimatedMinutes}m Read Time
              </Badge>
            </div>

            {prereqTopics.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 flex-wrap">
                <span className="font-semibold text-foreground flex items-center gap-1">
                  <Network className="h-3.5 w-3.5 text-primary" /> Prerequisites:
                </span>
                {prereqTopics.map((p) => (
                  <Badge key={p.id} variant="outline" className="text-[10px]">
                    {p.title}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="border-t md:border-t-0 md:border-l border-border/40 pt-4 md:pt-0 md:pl-6 shrink-0 w-full md:w-auto text-left md:text-right">
            <div className="text-xs text-muted-foreground">Topic Completion</div>
            <div className="text-2xl font-bold text-foreground">
              {completedCount} / {topicLessons.length}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                Lessons ({topicProgressPercent}%)
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Topic Lessons Catalog */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-emerald-400" />
              Chapter Lessons ({topicLessons.length})
            </h2>
            <p className="text-xs text-muted-foreground">
              Lessons inside this topic. Select a lesson to enter the interactive reader.
            </p>
          </div>
        </div>

        {topicLessons.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {topicLessons.map((lesson) => {
              const isDone = lessonsCompleted.includes(lesson.id);

              return (
                <Card
                  key={lesson.id}
                  className={`group flex flex-col justify-between border-border/60 transition duration-200 hover:border-primary/40 hover:shadow-glow ${
                    isDone ? "bg-emerald-950/10 border-emerald-500/30" : "bg-card"
                  }`}
                >
                  <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <DifficultyBadge difficulty={lesson.difficulty} />
                        {isDone ? (
                          <Badge
                            variant="outline"
                            className="border-emerald-500/40 text-emerald-400 text-[10px] gap-1"
                          >
                            <CheckCircle2 className="h-3 w-3" /> Completed
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">
                            {lesson.difficulty}
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-base font-bold tracking-tight group-hover:text-primary transition-colors">
                        {lesson.title}
                      </h3>
                      <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                        {lesson.description}
                      </p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-border/40">
                      <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-amber-400" />
                          {lesson.estimatedMinutes} mins
                        </span>
                        <span>{lesson.difficulty}</span>
                      </div>

                      <Button
                        asChild
                        className="w-full gap-2 text-xs shadow-xs"
                        variant={isDone ? "outline" : "default"}
                        size="sm"
                      >
                        <Link to="/lesson/$lessonId" params={{ lessonId: lesson.id }}>
                          <PlayCircle className="h-3.5 w-3.5 fill-current" /> Open Lesson Reader
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
            title="No lessons in this topic"
            description="Lessons for this topic will be available soon."
          />
        )}
      </section>
    </div>
  );
}
