import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/shared/progress-ring";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { CurriculumOverviewCard } from "@/components/learning/curriculum-overview-card";
import { CurriculumFilterBar } from "@/components/learning/curriculum-filter-bar";
import { LearningPathCard } from "@/components/learning/learning-path-card";
import { useCurriculum } from "@/lib/hooks/use-curriculum";
import { useLessons, useTopics, useLearningPaths } from "@/lib/hooks/use-content";
import { getExploreTarget } from "@/lib/utils/explore-target";
import { ArrowRight, BookOpen, Compass, Layers, Network, Sparkles } from "lucide-react";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "Curriculum · Forge" },
      {
        name: "description",
        content:
          "Browse Forge's comprehensive frontend engineering curriculum — structured modules, learning paths, knowledge graph topics, and hands-on lessons.",
      },
      { property: "og:title", content: "Curriculum · Forge" },
      {
        property: "og:description",
        content: "Modules, learning paths, topics and lessons for the modern frontend engineer.",
      },
    ],
  }),
  component: LearnRoute,
});

function LearnRoute() {
  const {
    categories,
    learningPaths,
    modules,
    allModules,
    filter,
    setFilter,
    resetFilter,
    stats,
    activeFiltersCount,
  } = useCurriculum();

  const lessons = useLessons();
  const topics = useTopics();
  const paths = useLearningPaths();

  const featuredPaths = learningPaths.filter((p) => p.featured);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        eyebrow="Academy Curriculum"
        title="Engineering Learning Engine"
        description="Eight core modules, curated learning paths, and a complete knowledge graph — sequenced to build staff-level frontend proficiency."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to="/learn/paths" className="gap-1.5">
                <Compass className="h-4 w-4 text-primary" />
                Learning Paths
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/learn/topics" className="gap-1.5">
                <Network className="h-4 w-4 text-primary" />
                Knowledge Graph
              </Link>
            </Button>
            <Button asChild>
              <Link to="/learn/lessons" className="gap-1.5">
                <BookOpen className="h-4 w-4" />
                All Lessons
              </Link>
            </Button>
          </div>
        }
      />

      {/* Curriculum Overview Bar */}
      <CurriculumOverviewCard stats={stats} />

      {/* Featured Learning Paths Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
              <Compass className="h-4 w-4 text-primary" />
              Role-Based Learning Paths
            </h2>
            <p className="text-xs text-muted-foreground">
              Structured sequences engineered for specific roles and milestones.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm" className="gap-1 text-xs text-primary">
            <Link to="/learn/paths">
              View All Paths ({learningPaths.length}) <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {featuredPaths.map((path) => (
            <LearningPathCard
              key={path.id}
              path={path}
              onSelectPath={(pathId) => {
                setFilter({ pathId: filter.pathId === pathId ? "all" : pathId });
              }}
              activePathId={filter.pathId}
            />
          ))}
        </div>
      </section>

      {/* Interactive Module Search & Filter Bar */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            Curriculum Modules ({modules.length} of {allModules.length})
          </h2>
        </div>

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

        {/* Modules Grid */}
        {modules.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {modules.map((m) => {
              const category = categories.find((c) => c.id === m.categoryId);
              const target = getExploreTarget(lessons, topics, modules, paths, { moduleId: m.id });
              return (
                <Card
                  key={m.id}
                  className="group relative flex flex-col justify-between overflow-hidden border-border/60 transition duration-200 hover:border-primary/40 hover:shadow-glow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <DifficultyBadge difficulty={m.difficulty} />
                          {category && (
                            <Badge variant="outline" className="text-[10px] bg-muted/30">
                              {category.name}
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold tracking-tight group-hover:text-primary transition-colors">
                          {m.title}
                        </h3>
                      </div>
                      <ProgressRing value={m.progress} size={52} />
                    </div>

                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                      {m.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {m.tags.map((t) => (
                        <Badge key={t} variant="secondary" className="text-[10px]">
                          {t}
                        </Badge>
                      ))}
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-border/50 pt-4 text-xs text-muted-foreground">
                      <span>
                        {m.topicCount} topics · {m.lessonCount} lessons · ~{m.estimatedHours}h
                      </span>
                      <Link
                        to={target.to}
                        search={target.search}
                        className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                      >
                        Explore <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No modules match your filter"
            description="Try clearing your search query or adjusting your category and difficulty filters."
            action={
              <Button onClick={resetFilter} variant="outline">
                Clear all filters
              </Button>
            }
          />
        )}
      </section>
    </div>
  );
}
