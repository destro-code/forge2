import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/shared/progress-ring";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { CurriculumFilterBar } from "@/components/learning/curriculum-filter-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { useCurriculum, getModuleProgress } from "@/lib/hooks/use-curriculum";
import { useProgress } from "@/lib/hooks/use-progress";
import { useTopics, useLearningPaths, useLessons } from "@/lib/hooks/use-content";
import { ArrowRight, Layers, GraduationCap, FolderTree, BookOpen, Clock } from "lucide-react";

export const Route = createFileRoute("/learn/modules/")({
  head: () => ({
    meta: [
      { title: "Modules · Forge" },
      {
        name: "description",
        content:
          "Learning Modules — major engineering domains containing focused topics and lessons.",
      },
      { property: "og:title", content: "Modules · Forge" },
      { property: "og:description", content: "Learning modules index." },
    ],
  }),
  component: ModulesRoute,
});

function ModulesRoute() {
  const { categories, learningPaths, modules, filter, setFilter, resetFilter, activeFiltersCount } =
    useCurriculum();
  const { lessonsCompleted } = useProgress();
  const lessons = useLessons();
  const topics = useTopics();

  return (
    <div className="space-y-8">
      {/* Visual Hierarchy Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono bg-muted/30 border border-border/50 rounded-lg p-2.5">
        <GraduationCap className="h-4 w-4 text-primary" />
        <Link to="/learn" className="hover:text-foreground hover:underline">
          Learning Path
        </Link>
        <span>→</span>
        <span className="font-semibold text-primary">Modules</span>
        <span>→</span>
        <Link to="/learn/topics" className="hover:text-foreground hover:underline">
          Topics
        </Link>
        <span>→</span>
        <Link to="/learn/lessons" className="hover:text-foreground hover:underline">
          Lessons
        </Link>
      </div>

      <PageHeader
        eyebrow="Modules Hub"
        title="Modules"
        description="Major engineering domains structured into self-contained modules. Select a module to explore its topics and lessons."
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/learn/topics" className="gap-1.5">
                <FolderTree className="h-4 w-4 text-primary" />
                Explore Topics
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

      <CurriculumFilterBar
        query={filter.query || ""}
        onQueryChange={(q) => setFilter({ query: q })}
        categoryId={filter.categoryId || "all"}
        onCategoryChange={(catId) => setFilter({ categoryId: catId })}
        difficulty={filter.difficulty || "All"}
        onDifficultyChange={(diff) => setFilter({ difficulty: diff })}
        pathId={filter.pathId || "all"}
        onPathChange={(pId) => setFilter({ pathId: pId })}
        categories={categories}
        learningPaths={learningPaths}
        activeCount={activeFiltersCount}
        onReset={resetFilter}
      />

      {modules.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => {
            const category = categories.find((c) => c.id === m.categoryId);
            const actualTopics = topics.filter((topic) => topic.moduleId === m.id);
            const actualLessons = lessons.filter((lesson) => lesson.moduleId === m.id);
            const moduleProgressPercent = getModuleProgress(m.id, lessonsCompleted);

            return (
              <Card
                key={m.id}
                className="group flex flex-col justify-between border-border/60 transition duration-200 hover:border-primary/40 hover:shadow-glow overflow-hidden"
              >
                <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <DifficultyBadge difficulty={m.difficulty} />
                          {category && (
                            <Badge variant="outline" className="text-[10px] bg-muted/40 font-mono">
                              {category.name}
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-lg font-bold tracking-tight group-hover:text-primary transition-colors">
                          {m.title}
                        </h3>
                      </div>
                      <ProgressRing value={moduleProgressPercent / 100} size={48} />
                    </div>

                    <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                      {m.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-border/40">
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                      <span className="flex items-center gap-1">
                        <FolderTree className="h-3.5 w-3.5 text-primary" />
                        {actualTopics.length} Chapters
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
                        {actualLessons.length} Lessons
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-amber-400" />~{m.estimatedHours}h
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {m.tags.map((t) => (
                        <Badge key={t} variant="secondary" className="text-[10px]">
                          {t}
                        </Badge>
                      ))}
                    </div>

                    <Button
                      asChild
                      className="w-full gap-2 mt-2 shadow-xs"
                      variant="default"
                      size="sm"
                    >
                      <Link to="/learn/modules/$moduleId" params={{ moduleId: m.id }}>
                        Open Module Hub <ArrowRight className="h-3.5 w-3.5" />
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
          title="No modules found"
          description="No modules matched your current filter setup."
          action={
            <Button onClick={resetFilter} variant="outline">
              Reset filters
            </Button>
          }
        />
      )}
    </div>
  );
}
