import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/shared/progress-ring";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { CurriculumFilterBar } from "@/components/learning/curriculum-filter-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { useCurriculum } from "@/lib/hooks/use-curriculum";
import { ArrowRight, Layers, BookOpen } from "lucide-react";

export const Route = createFileRoute("/learn/modules")({
  head: () => ({
    meta: [
      { title: "Modules · Forge" },
      {
        name: "description",
        content:
          "Every module in Forge's frontend curriculum, organized by category, path, and difficulty level.",
      },
      { property: "og:title", content: "Modules · Forge" },
      { property: "og:description", content: "The complete module library." },
    ],
  }),
  component: ModulesRoute,
});

function ModulesRoute() {
  const { categories, learningPaths, modules, filter, setFilter, resetFilter, activeFiltersCount } =
    useCurriculum();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Module Architecture"
        title="All Modules"
        description="Core modules grouped by skill domains and topic depth, fully structured for self-paced progress."
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/learn/paths">Learning Paths</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/learn/topics">Knowledge Graph</Link>
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((m) => {
            const category = categories.find((c) => c.id === m.categoryId);
            return (
              <Link key={m.id} to="/learn/lessons" search={{ moduleId: m.id }} className="group">
                <Card className="h-full border-border/60 transition duration-200 hover:border-primary/40 hover:shadow-glow">
                  <CardContent className="p-5 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <DifficultyBadge difficulty={m.difficulty} />
                            {category && (
                              <Badge variant="outline" className="text-[10px]">
                                {category.name}
                              </Badge>
                            )}
                          </div>
                          <h3 className="text-base font-semibold group-hover:text-primary transition-colors">
                            {m.title}
                          </h3>
                        </div>
                        <ProgressRing value={m.progress} size={48} />
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {m.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex flex-wrap gap-1">
                        {m.tags.map((t) => (
                          <Badge key={t} variant="secondary" className="text-[10px]">
                            {t}
                          </Badge>
                        ))}
                      </div>
                      <span className="inline-flex items-center gap-1 text-primary font-medium shrink-0">
                        {m.lessonCount} lessons <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
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
