import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { useCurriculum, getTopicProgress } from "@/lib/hooks/use-curriculum";
import { useProgress } from "@/lib/hooks/use-progress";
import { useLessons, useModules, useLearningPaths } from "@/lib/hooks/use-content";
import {
  Clock,
  Network,
  TrendingUp,
  Search,
  RotateCcw,
  GraduationCap,
  Layers,
  BookOpen,
  ArrowRight,
  Filter,
} from "lucide-react";

export const Route = createFileRoute("/learn/topics")({
  validateSearch: (search: Record<string, unknown>): { query?: string; moduleId?: string } => ({
    query: (search.query as string) || undefined,
    moduleId: (search.moduleId as string) || undefined,
  }),
  head: () => ({
    meta: [
      { title: "Topics · Forge" },
      {
        name: "description",
        content:
          "Topics — key concept topics inside learning modules with prerequisite links and interview weightings.",
      },
      { property: "og:title", content: "Topics · Forge" },
      { property: "og:description", content: "Curriculum topics index." },
    ],
  }),
  component: TopicsRoute,
});

function TopicsRoute() {
  const searchParams = Route.useSearch();
  const navigate = Route.useNavigate();
  const { topics, categories } = useCurriculum();
  const { lessonsCompleted } = useProgress();
  const lessons = useLessons();
  const modules = useModules();
  const learningPaths = useLearningPaths();

  const query = searchParams.query || "";
  const selectedModuleId = searchParams.moduleId || "all";

  const handleModuleSelect = (modId: string) => {
    navigate({
      search: (prev) => ({
        ...prev,
        moduleId: modId,
      }),
      replace: true,
    });
  };

  const resetFilters = () => {
    navigate({
      search: {
        query: "",
        moduleId: "all",
      },
      replace: true,
    });
  };

  const filteredTopics = topics.filter((t) => {
    if (selectedModuleId !== "all" && t.moduleId !== selectedModuleId) return false;
    if (query) {
      const q = query.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    return true;
  });

  const activeModule = modules.find((m) => m.id === selectedModuleId);

  return (
    <div className="space-y-8">
      {/* Visual Hierarchy Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono bg-muted/30 border border-border/50 rounded-lg p-2.5">
        <GraduationCap className="h-4 w-4 text-primary" />
        <Link to="/learn" className="hover:text-foreground hover:underline">
          Learning Path
        </Link>
        <span>→</span>
        <Link to="/learn/modules" className="hover:text-foreground hover:underline">
          Modules
        </Link>
        <span>→</span>
        <span className="font-semibold text-primary">Topics</span>
        <span>→</span>
        <Link to="/learn/lessons" className="hover:text-foreground hover:underline">
          Lessons
        </Link>
      </div>

      <PageHeader
        eyebrow="Curriculum Topics"
        title="Topics"
        description="Core concepts organized into focused topics within learning modules — complete with prerequisites and interview frequency weights."
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/learn/modules" className="gap-1.5">
                <Layers className="h-4 w-4 text-primary" />
                Modules
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/learn/lessons" className="gap-1.5">
                <BookOpen className="h-4 w-4 text-primary" />
                Lesson Catalog
              </Link>
            </Button>
          </div>
        }
      />

      {/* Module Scope & Search Filter Bar */}
      <div className="space-y-3 bg-card/60 border border-border/60 p-4 rounded-xl">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) =>
                navigate({
                  search: (prev) => ({ ...prev, query: e.target.value }),
                  replace: true,
                })
              }
              placeholder="Search chapters by concept name or keyword..."
              className="h-9 pl-9 text-xs"
            />
          </div>

          {(query || selectedModuleId !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="gap-1.5 text-xs text-muted-foreground shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Topic Filter
            </Button>
          )}
        </div>

        {/* Quick Module Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-border/40 text-xs">
          <span className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="h-3 w-3 text-primary" /> Module Filter:
          </span>
          <Button
            size="sm"
            variant={selectedModuleId === "all" ? "default" : "outline"}
            className="h-7 px-2.5 text-[11px]"
            onClick={() => handleModuleSelect("all")}
          >
            All Modules ({topics.length})
          </Button>
          {modules.map((m) => {
            const count = topics.filter((t) => t.moduleId === m.id).length;
            return (
              <Button
                key={m.id}
                size="sm"
                variant={selectedModuleId === m.id ? "default" : "outline"}
                className="h-7 px-2.5 text-[11px]"
                onClick={() => handleModuleSelect(m.id)}
              >
                {m.title} ({count})
              </Button>
            );
          })}
        </div>
      </div>

      {activeModule && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground flex items-center justify-between">
          <span>
            Filtering chapters inside module:{" "}
            <strong className="text-primary">{activeModule.title}</strong>
          </span>
          <Badge variant="outline" className="text-[10px]">
            {filteredTopics.length} chapters found
          </Badge>
        </div>
      )}

      {/* Topics Grid */}
      {filteredTopics.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTopics.map((t) => {
            const category = categories.find((c) => c.id === t.categoryId);
            const parentModule = modules.find((m) => m.id === t.moduleId);
            const topicLessons = lessons.filter((l) => l.topicId === t.id);
            const topicLessonsCount = topicLessons.length;
            const topicCompletedCount = topicLessons.filter((l) =>
              lessonsCompleted.includes(l.id),
            ).length;
            const topicProgressPercent = getTopicProgress(t.id, lessonsCompleted);

            return (
              <Card
                key={t.id}
                className="group flex flex-col justify-between border-border/60 transition duration-200 hover:border-primary/40 hover:shadow-glow"
              >
                <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <DifficultyBadge difficulty={t.difficulty} />
                        {parentModule && (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-muted/40 font-mono text-primary border-primary/30"
                          >
                            {parentModule.title}
                          </Badge>
                        )}
                      </div>
                      <Badge variant="secondary" className="gap-1 text-[10px] shrink-0">
                        <TrendingUp className="h-3 w-3 text-emerald-400" />
                        {t.interviewFrequency}
                      </Badge>
                    </div>

                    <h3 className="text-base font-bold tracking-tight group-hover:text-primary transition-colors">
                      {t.title}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                      {t.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-border/40">
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-amber-400" />
                        {t.estimatedMinutes}m read
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
                        {topicCompletedCount}/{topicLessonsCount} Lessons ({topicProgressPercent}%)
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Network className="h-3.5 w-3.5 text-primary" />
                        {t.prerequisites.length} prereqs
                      </span>
                    </div>

                    <Button asChild className="w-full gap-2 text-xs" variant="secondary" size="sm">
                      <Link to="/learn/topics/$topicId" params={{ topicId: t.id }}>
                        Open Chapter Topic <ArrowRight className="h-3.5 w-3.5" />
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
          title="No topics match your search"
          description="Try searching for a different keyword or resetting the module filter."
          action={
            <Button onClick={resetFilters} variant="outline">
              Clear topic filter
            </Button>
          }
        />
      )}
    </div>
  );
}
