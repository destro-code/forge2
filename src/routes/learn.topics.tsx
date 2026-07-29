import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { useCurriculum } from "@/lib/hooks/use-curriculum";
import { Clock, Network, TrendingUp, Search, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/learn/topics")({
  head: () => ({
    meta: [
      { title: "Topics · Forge" },
      {
        name: "description",
        content:
          "Every topic in the Forge knowledge graph — prerequisites, related concepts, and interview frequency.",
      },
      { property: "og:title", content: "Topics · Forge" },
      { property: "og:description", content: "The full topic knowledge graph." },
    ],
  }),
  component: TopicsRoute,
});

function TopicsRoute() {
  const { topics, allTopics, categories, filter, setFilter, resetFilter, activeFiltersCount } =
    useCurriculum();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Knowledge Graph"
        title="Topic Architecture"
        description="Every concept in the academy curriculum, mapped by interview frequency, prerequisite dependencies, and next steps."
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/learn">Modules</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/learn/paths">Learning Paths</Link>
            </Button>
          </div>
        }
      />

      {/* Filter & Search for Topics */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filter.query || ""}
            onChange={(e) => setFilter({ query: e.target.value })}
            placeholder="Search topics by title or concept..."
            className="h-10 pl-9"
          />
        </div>

        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilter}
            className="gap-1.5 text-xs text-muted-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Filters
          </Button>
        )}
      </div>

      {/* Topics Grid */}
      {topics.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {topics.map((t) => {
            const category = categories.find((c) => c.id === t.categoryId);
            return (
              <Link key={t.id} to="/learn/lessons" search={{ topicId: t.id }} className="group">
                <Card className="h-full border-border/60 transition duration-200 hover:border-primary/40 hover:shadow-glow">
                  <CardContent className="p-5 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <DifficultyBadge difficulty={t.difficulty} />
                          {category && (
                            <Badge variant="outline" className="text-[10px]">
                              {category.name}
                            </Badge>
                          )}
                        </div>
                        <Badge variant="secondary" className="gap-1 text-[10px] shrink-0">
                          <TrendingUp className="h-3 w-3 text-primary" />
                          {t.interviewFrequency}
                        </Badge>
                      </div>

                      <h3 className="text-base font-semibold group-hover:text-primary transition-colors">
                        {t.title}
                      </h3>
                      <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                        {t.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {t.estimatedMinutes}m
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Network className="h-3.5 w-3.5 text-primary" />
                        {t.prerequisites.length} prereqs · {t.next.length} next
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
          title="No topics match your search"
          description="Try searching for a different keyword or topic concept."
          action={
            <Button onClick={resetFilter} variant="outline">
              Clear topic filter
            </Button>
          }
        />
      )}
    </div>
  );
}
