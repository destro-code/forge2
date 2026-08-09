import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { useLessons, useModules, useTopics, useLearningPaths } from "@/lib/hooks/use-content";
import { useProgress } from "@/lib/hooks/use-progress";
import {
  Clock,
  ArrowRight,
  Search,
  RotateCcw,
  CheckCircle2,
  Bookmark,
  BookOpen,
  Filter,
  GraduationCap,
  Layers,
  FolderTree,
} from "lucide-react";

export const Route = createFileRoute("/learn/lessons")({
  validateSearch: (search: Record<string, unknown>): { query?: string, moduleId?: string, topicId?: string, pathId?: string, difficulty?: string, status?: string } => ({

    query: (search.query as string) || undefined,
    moduleId: (search.moduleId as string) || undefined,
    topicId: (search.topicId as string) || undefined,
    pathId: (search.pathId as string) || undefined,
    difficulty: typeof search.difficulty === "string" ? search.difficulty : "All",
    status: (search.status as string) || undefined,
  }),
  head: () => ({
    meta: [
      { title: "Lesson Catalog · Forge" },
      {
        name: "description",
        content:
          "Lesson Catalog — searchable, filterable reading and practice units with code sandboxes and interview exercises.",
      },
      { property: "og:title", content: "Lesson Catalog · Forge" },
      { property: "og:description", content: "The full lesson library catalog." },
    ],
  }),
  component: Lessons,
});

function Lessons() {
  const searchParams = Route.useSearch();
  const navigate = Route.useNavigate();
  const lessons = useLessons();
  const modules = useModules();
  const topics = useTopics();
  const paths = useLearningPaths();
  const { lessonsCompleted, bookmarks } = useProgress();

  const query = searchParams.query || "";
  const selectedModule = searchParams.moduleId || "all";
  const selectedTopic = searchParams.topicId || "all";
  const selectedPath = searchParams.pathId || "all";
  const selectedDifficulty = searchParams.difficulty || "All";
  const selectedStatus = searchParams.status || "all";

  const updateFilter = (params: Record<string, string>, replace = false) => {
    navigate({
      search: (prev) => ({
        ...prev,
        ...params,
      }),
      replace,
    });
  };

  const resetFilters = () => {
    navigate({
      search: {
        query: "",
        moduleId: "all",
        topicId: "all",
        pathId: "all",
        difficulty: "All",
        status: "all",
      },
      replace: true,
    });
  };

  const activeFiltersCount =
    (query ? 1 : 0) +
    (selectedModule !== "all" ? 1 : 0) +
    (selectedTopic !== "all" ? 1 : 0) +
    (selectedPath !== "all" ? 1 : 0) +
    (selectedDifficulty !== "All" ? 1 : 0) +
    (selectedStatus !== "all" ? 1 : 0);

  const activeTopicObj =
    selectedTopic !== "all" ? topics.find((t) => t.id === selectedTopic) : null;
  const activeModuleObj =
    selectedModule !== "all" ? modules.find((m) => m.id === selectedModule) : null;

  const filteredLessons = lessons.filter((l) => {
    if (query) {
      const q = query.toLowerCase();
      const matchTitle = l.title.toLowerCase().includes(q);
      const matchDesc = l.description.toLowerCase().includes(q);
      const matchSummary = l.summary?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchSummary) return false;
    }

    if (selectedPath !== "all") {
      const pathObj = paths.find((p) => p.id === selectedPath);
      if (pathObj) {
        const topic = topics.find((t) => t.id === l.topicId);
        if (!topic || !pathObj.moduleIds.includes(topic.moduleId)) return false;
      }
    }

    if (selectedModule !== "all") {
      const topic = topics.find((t) => t.id === l.topicId);
      if (!topic || topic.moduleId !== selectedModule) return false;
    }

    if (selectedTopic !== "all" && l.topicId !== selectedTopic) {
      return false;
    }

    if (selectedDifficulty !== "All" && l.difficulty !== selectedDifficulty) {
      return false;
    }

    if (selectedStatus === "completed" && !lessonsCompleted.includes(l.id)) {
      return false;
    }

    if (selectedStatus === "bookmarked" && !bookmarks.includes(l.id)) {
      return false;
    }

    if (selectedStatus === "in_progress" && lessonsCompleted.includes(l.id)) {
      return false;
    }

    return true;
  });

  const firstFilteredLesson = filteredLessons[0];

  return (
    <div className="space-y-8">
      {/* Visual Hierarchy Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono bg-muted/30 border border-border/50 rounded-lg p-2.5">
        <GraduationCap className="h-4 w-4 text-primary" />
        <Link to="/learn" className="hover:text-foreground hover:underline">
          Roadmap
        </Link>
        <span>→</span>
        <Link to="/learn/modules" className="hover:text-foreground hover:underline">
          Modules
        </Link>
        <span>→</span>
        <Link to="/learn/topics" className="hover:text-foreground hover:underline">
          Topics
        </Link>
        <span>→</span>
        <span className="font-semibold text-primary">Lesson Catalog</span>
      </div>

      <PageHeader
        eyebrow="Lesson Catalog"
        title="Lesson Catalog & Index"
        description="Searchable, bite-sized lesson units engineered for staff-level retention, deep mental models, and interactive code sandboxes."
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/learn/modules" className="gap-1.5">
                <Layers className="h-4 w-4 text-primary" />
                Modules
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/learn/topics" className="gap-1.5">
                <FolderTree className="h-4 w-4 text-primary" />
                Chapters & Topics
              </Link>
            </Button>
          </div>
        }
      />

      {/* Topic / Module Overview Hero Banner when filtered */}
      {activeTopicObj && (
        <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/20 text-primary text-[10px]">
                Topic Focus
              </Badge>
              <DifficultyBadge difficulty={activeTopicObj.difficulty} />
              <Badge variant="outline" className="text-[10px]">
                <Clock className="h-3 w-3 mr-1 inline" />
                {activeTopicObj.estimatedMinutes}m total
              </Badge>
            </div>
            <h2 className="text-xl font-bold text-foreground">{activeTopicObj.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
              {activeTopicObj.description}
            </p>
          </div>
          {firstFilteredLesson && (
            <Button asChild size="lg" className="shrink-0 gap-2 shadow-glow">
              <Link to="/lesson/$lessonId" params={{ lessonId: firstFilteredLesson.id }}>
                <BookOpen className="h-4 w-4" /> Start Learning <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      )}

      {activeModuleObj && !activeTopicObj && (
        <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/20 text-primary text-[10px]">
                Module Focus
              </Badge>
              <DifficultyBadge difficulty={activeModuleObj.difficulty} />
              <Badge variant="outline" className="text-[10px]">
                ~{activeModuleObj.estimatedHours}h estimated
              </Badge>
            </div>
            <h2 className="text-xl font-bold text-foreground">{activeModuleObj.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
              {activeModuleObj.description}
            </p>
          </div>
          {firstFilteredLesson && (
            <Button asChild size="lg" className="shrink-0 gap-2 shadow-glow">
              <Link to="/lesson/$lessonId" params={{ lessonId: firstFilteredLesson.id }}>
                <BookOpen className="h-4 w-4" /> Start Module <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="space-y-4 rounded-xl border border-border/60 bg-card p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => updateFilter({ query: e.target.value }, true)}
              placeholder="Search lessons by title, concept, or description..."
              className="h-10 pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <select
              value={selectedModule}
              onChange={(e) => updateFilter({ moduleId: e.target.value }, false)}
              className="h-10 w-full sm:w-auto rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Modules</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>

            <select
              value={selectedTopic}
              onChange={(e) => updateFilter({ topicId: e.target.value }, false)}
              className="h-10 w-full sm:w-auto rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Topics</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>

            <select
              value={selectedDifficulty}
              onChange={(e) => updateFilter({ difficulty: e.target.value }, false)}
              className="h-10 w-full sm:w-auto rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
            >
              <option value="All">All Difficulties</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => updateFilter({ status: e.target.value }, false)}
              className="h-10 w-full sm:w-auto rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="bookmarked">Bookmarked</option>
            </select>

            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="gap-1.5 text-xs text-muted-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
          <span>
            Showing <strong className="text-foreground">{filteredLessons.length}</strong> of{" "}
            <strong className="text-foreground">{lessons.length}</strong> lessons
          </span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="text-[10px] gap-1">
              <Filter className="h-3 w-3" /> {activeFiltersCount} active filter
              {activeFiltersCount > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </div>

      {/* Lessons List */}
      {filteredLessons.length > 0 ? (
        <div className="grid gap-3">
          {filteredLessons.map((l) => {
            const isCompleted = lessonsCompleted.includes(l.id);
            const isBookmarked = bookmarks.includes(l.id);
            const topic = topics.find((t) => t.id === l.topicId);

            return (
              <Link key={l.id} to="/lesson/$lessonId" params={{ lessonId: l.id }} className="group">
                <Card className="border-border/60 transition hover:border-primary/40 hover:shadow-glow">
                  <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {isCompleted ? (
                          <Badge
                            variant="secondary"
                            className="gap-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Completed
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="gap-1 bg-primary/10 text-primary border-primary/20 text-[10px]"
                          >
                            <BookOpen className="h-3 w-3" />
                            Ready to learn
                          </Badge>
                        )}
                        <DifficultyBadge difficulty={l.difficulty} />
                        <Badge variant="outline" className="gap-1 text-[10px]">
                          <Clock className="h-3 w-3" />
                          {l.estimatedMinutes}m
                        </Badge>
                        {topic && (
                          <Badge variant="outline" className="text-[10px] bg-muted/20">
                            {topic.title}
                          </Badge>
                        )}
                        {isBookmarked && (
                          <Bookmark className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        )}
                      </div>
                      <h3 className="truncate text-base font-semibold group-hover:text-primary transition-colors">
                        {l.title}
                      </h3>
                      <p className="line-clamp-1 text-sm text-muted-foreground">{l.description}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-xs text-primary shrink-0 self-start sm:self-center"
                    >
                      Read Lesson{" "}
                      <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No lessons match your current filters"
          description="Try clearing your search query or selecting 'All' for modules and difficulties."
          action={
            <Button onClick={resetFilters} variant="outline">
              Clear lesson filters
            </Button>
          }
        />
      )}
    </div>
  );
}
