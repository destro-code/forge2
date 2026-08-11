import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/shared/progress-ring";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { CurriculumOverviewCard } from "@/components/learning/curriculum-overview-card";
import { LearningPathCard } from "@/components/learning/learning-path-card";
import { useCurriculum, getModuleProgress } from "@/lib/hooks/use-curriculum";
import { useLessons, useTopics, useModules, useLearningPaths } from "@/lib/hooks/use-content";
import { useProgress } from "@/lib/hooks/use-progress";
import {
  ArrowRight,
  BookOpen,
  Compass,
  Layers,
  FolderTree,
  PlayCircle,
  CheckCircle2,
  GraduationCap,
} from "lucide-react";

export const Route = createFileRoute("/learn/")({
  head: () => ({
    meta: [
      { title: "Learning Paths · Forge" },
      {
        name: "description",
        content:
          "The core engineering learning hub — structured hierarchy from Learning Paths to Modules, Topics, and Lessons.",
      },
      { property: "og:title", content: "Learning Paths · Forge" },
      {
        property: "og:description",
        content: "Master modern frontend engineering through structured learning paths.",
      },
    ],
  }),
  component: LearnIndexRoute,
});

function LearnIndexRoute() {
  const { learningPaths, stats, modules } = useCurriculum();
  const lessons = useLessons();
  const topics = useTopics();
  const paths = useLearningPaths();
  const { lessonsCompleted, lastActiveLessonId } = useProgress();

  // Determine active/up-next lesson
  const lastActiveLesson = lessons.find((l) => l.id === lastActiveLessonId);
  const nextIncompleteLesson = lessons.find((l) => !lessonsCompleted.includes(l.id)) || lessons[0];
  const currentLesson = lastActiveLesson || nextIncompleteLesson;

  const featuredPaths = learningPaths.filter((p) => p.featured);

  return (
    <div className="space-y-8">
      {/* Visual Hierarchy Navigation Breadcrumb Header */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono bg-muted/30 border border-border/50 rounded-lg p-2.5">
        <GraduationCap className="h-4 w-4 text-primary" />
        <span className="font-semibold text-foreground">Learning Hierarchy:</span>
        <span className="text-primary font-medium">Learning Path</span>
        <span>→</span>
        <Link to="/learn/modules" className="hover:text-foreground hover:underline">
          Modules
        </Link>
        <span>→</span>
        <Link to="/learn/topics" search={{}} className="hover:text-foreground hover:underline">
          Topics
        </Link>
        <span>→</span>
        <Link to="/learn/lessons" search={{}} className="hover:text-foreground hover:underline">
          Lessons
        </Link>
      </div>

      {/* Page Header */}
      <PageHeader
        eyebrow="Learning Hub"
        title="Learning Paths & Curriculum"
        description="A structured curriculum hierarchy engineered for modern frontend mastery — from structured paths to modules, topics, and hands-on lessons."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="default" className="shadow-glow">
              <Link to="/learn/modules" className="gap-1.5">
                <Layers className="h-4 w-4" />
                Browse Modules
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/learn/topics" search={{}} className="gap-1.5">
                <FolderTree className="h-4 w-4 text-primary" />
                Topics
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/learn/lessons" search={{}} className="gap-1.5">
                <BookOpen className="h-4 w-4 text-primary" />
                Lessons
              </Link>
            </Button>
          </div>
        }
      />

      {/* Current Resume / Up Next Card */}
      {currentLesson && (
        <Card className="border-primary/40 bg-gradient-to-r from-primary/10 via-card to-card p-6 shadow-glow relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge
                  variant="default"
                  className="bg-primary text-primary-foreground text-[10px] uppercase tracking-wider font-semibold"
                >
                  Up Next in Your Roadmap
                </Badge>
                {lessonsCompleted.includes(currentLesson.id) && (
                  <Badge
                    variant="outline"
                    className="border-emerald-500/40 text-emerald-400 text-[10px] gap-1"
                  >
                    <CheckCircle2 className="h-3 w-3" /> Completed
                  </Badge>
                )}
              </div>
              <h3 className="text-xl font-bold tracking-tight text-foreground">
                {currentLesson.title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2 max-w-2xl">
                {currentLesson.description}
              </p>
            </div>

            <Button asChild size="lg" className="shrink-0 gap-2 shadow-glow">
              <Link to="/lesson/$lessonId" params={{ lessonId: currentLesson.id }}>
                <PlayCircle className="h-5 w-5 fill-current" />
                Resume Lesson Reader
              </Link>
            </Button>
          </div>
        </Card>
      )}

      {/* Curriculum Overview Bar */}
      <CurriculumOverviewCard stats={stats} />

      {/* Role-Based Learning Paths Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
              <Compass className="h-4 w-4 text-primary" />
              Role-Based Learning Paths
            </h2>
            <p className="text-xs text-muted-foreground">
              Curated sequences targeting specific career milestones.
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
            <LearningPathCard key={path.id} path={path} />
          ))}
        </div>
      </section>

      {/* Learning Modules Overview */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Modules ({modules.length} Core Modules)
            </h2>
            <p className="text-xs text-muted-foreground">
              Core engineering domains. Click any module to explore its topics.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
            <Link to="/learn/modules">
              View All Modules <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {modules.slice(0, 4).map((m) => {
            return (
              <Card
                key={m.id}
                className="group flex flex-col justify-between border-border/60 transition hover:border-primary/40 hover:shadow-glow"
              >
                <CardContent className="p-5 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <DifficultyBadge difficulty={m.difficulty} />
                      <ProgressRing
                        value={getModuleProgress(m.id, lessonsCompleted) / 100}
                        size={42}
                      />
                    </div>
                    <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                      {m.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {m.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>
                      {m.topicCount} topics · {m.lessonCount} lessons
                    </span>
                    <Link
                      to="/learn/modules/$moduleId"
                      params={{ moduleId: m.id }}
                      className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                    >
                      Open Module <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
