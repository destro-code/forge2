import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ProgressRing } from "@/components/shared/progress-ring";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { useModule, useModules, useTopics, useLessons, useCategory } from "@/lib/hooks/use-content";
import { useProgress } from "@/lib/hooks/use-progress";
import { getModuleProgress } from "@/lib/hooks/use-curriculum";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock,
  FolderTree,
  GraduationCap,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  Play,
  RotateCcw,
  Award,
  Circle,
  ChevronDown,
  ChevronUp,
  Layers,
  Compass,
} from "lucide-react";

export const Route = createFileRoute("/learn/modules/$moduleId")({
  head: ({ params }) => ({
    meta: [
      { title: `Course Overview · Forge` },
      {
        name: "description",
        content: `Structured course learning path and curriculum roadmap for frontend engineering.`,
      },
    ],
  }),
  component: ModuleHubRoute,
});

function ModuleHubRoute() {
  const { moduleId } = Route.useParams();
  const moduleItem = useModule(moduleId);
  const allModules = useModules();
  const category = useCategory(moduleItem?.categoryId);
  const allTopics = useTopics();
  const allLessons = useLessons();
  const { lessonsCompleted, lastActiveLessonId } = useProgress();

  // Collapsed state for chapters (all open by default for full visibility)
  const [collapsedChapters, setCollapsedChapters] = useState<Record<string, boolean>>({});

  const toggleChapter = (topicId: string) => {
    setCollapsedChapters((prev) => ({
      ...prev,
      [topicId]: !prev[topicId],
    }));
  };

  // 1. Get module topics and sort strictly by topic.order
  const moduleTopics = useMemo(() => {
    if (!moduleItem) return [];
    return allTopics
      .filter((t) => t.moduleId === moduleItem.id)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [allTopics, moduleItem]);

  // 2. Build structured chapters with ordered lessons
  const chapters = useMemo(() => {
    if (!moduleItem) return [];
    return moduleTopics.map((topic, index) => {
      const topicLessons = allLessons
        .filter((l) => l.topicId === topic.id || (l.moduleId === moduleItem.id && !l.topicId))
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      const completedTopicLessons = topicLessons.filter((l) => lessonsCompleted.includes(l.id));

      return {
        topic,
        chapterNumber: index + 1,
        lessons: topicLessons,
        completedCount: completedTopicLessons.length,
        isCompleted:
          topicLessons.length > 0 && completedTopicLessons.length === topicLessons.length,
      };
    });
  }, [moduleTopics, allLessons, moduleItem, lessonsCompleted]);

  // 3. Flat sequential list of all module lessons in deterministic curriculum order
  const orderedModuleLessons = useMemo(() => {
    return chapters.flatMap((c) => c.lessons);
  }, [chapters]);

  // Prerequisites resolution
  const prerequisites = useMemo(() => {
    if (!moduleItem?.prerequisites || moduleItem.prerequisites.length === 0) return [];
    return moduleItem.prerequisites
      .map((prereqId) => allModules.find((m) => m.id === prereqId))
      .filter(Boolean) as Array<NonNullable<ReturnType<typeof useModule>>>;
  }, [moduleItem, allModules]);

  if (!moduleItem) {
    return (
      <div className="space-y-6">
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link to="/learn/modules">
            <ArrowLeft className="h-4 w-4" /> Back to Modules
          </Link>
        </Button>
        <EmptyState
          title="Course Not Found"
          description="The requested curriculum module does not exist or may have been updated."
          action={
            <Button asChild>
              <Link to="/learn/modules">Browse All Courses</Link>
            </Button>
          }
        />
      </div>
    );
  }

  // 4. Progress and Progression Logic
  const totalLessons = orderedModuleLessons.length;
  const completedLessons = orderedModuleLessons.filter((l) => lessonsCompleted.includes(l.id));
  const completedCount = completedLessons.length;
  const isModuleCompleted = totalLessons > 0 && completedCount === totalLessons;
  const isStarted = completedCount > 0;
  const progressPercent = getModuleProgress(moduleItem.id, lessonsCompleted);

  // 5. Determine the active target lesson and primary CTA state
  let targetLesson = orderedModuleLessons[0];
  let ctaMode: "start" | "continue" | "review" = "start";

  if (isModuleCompleted) {
    ctaMode = "review";
    targetLesson = orderedModuleLessons[0];
  } else if (isStarted) {
    ctaMode = "continue";
    // Check if lastActiveLessonId belongs to this module and is not yet completed
    const lastActiveInModule = orderedModuleLessons.find((l) => l.id === lastActiveLessonId);
    if (lastActiveInModule && !lessonsCompleted.includes(lastActiveInModule.id)) {
      targetLesson = lastActiveInModule;
    } else {
      // Find first remaining uncompleted lesson in module order
      const firstUncompleted = orderedModuleLessons.find((l) => !lessonsCompleted.includes(l.id));
      targetLesson = firstUncompleted || orderedModuleLessons[0];
    }
  } else {
    ctaMode = "start";
    targetLesson = orderedModuleLessons[0];
  }

  // Find the topic belonging to the target lesson
  const targetTopic = targetLesson ? moduleTopics.find((t) => t.id === targetLesson.topicId) : null;

  return (
    <div className="space-y-8">
      {/* Navigation Breadcrumbs */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-mono bg-muted/30 border border-border/50 rounded-lg p-2.5">
        <GraduationCap className="h-4 w-4 text-primary shrink-0" />
        <Link to="/learn" className="hover:text-foreground hover:underline">
          Learning Path
        </Link>
        <span>→</span>
        <Link to="/learn/modules" className="hover:text-foreground hover:underline">
          Courses
        </Link>
        <span>→</span>
        <span className="font-semibold text-primary truncate max-w-[260px]">
          {moduleItem.title}
        </span>
      </div>

      {/* Course Overview Header */}
      <PageHeader
        eyebrow={`Course · ${category?.name || "Frontend Domain"}`}
        title={moduleItem.title}
        description={moduleItem.description}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm" className="gap-1.5 min-h-[36px]">
              <Link to="/learn/lessons" search={{ moduleId: moduleItem.id }}>
                <BookOpen className="h-4 w-4" /> Lesson Catalog
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="gap-1.5 min-h-[36px]">
              <Link to="/learn/modules">
                <ArrowLeft className="h-4 w-4" /> All Courses
              </Link>
            </Button>
          </div>
        }
      />

      {/* Hero Course Action Banner */}
      <Card className="border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <DifficultyBadge difficulty={moduleItem.difficulty} />
              {category && (
                <Badge variant="outline" className="text-[11px] bg-muted/50 font-mono">
                  {category.name}
                </Badge>
              )}
              <Badge variant="secondary" className="gap-1 text-[11px] font-mono">
                <Clock className="h-3 w-3 text-amber-400" /> ~{moduleItem.estimatedHours} Hours
              </Badge>
              <Badge variant="secondary" className="gap-1 text-[11px] font-mono">
                <FolderTree className="h-3 w-3 text-primary" /> {moduleTopics.length} Chapters
              </Badge>
              <Badge variant="secondary" className="gap-1 text-[11px] font-mono">
                <BookOpen className="h-3 w-3 text-emerald-400" /> {totalLessons} Lessons
              </Badge>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {isModuleCompleted
                  ? "You've Completed This Course!"
                  : isStarted
                    ? `Continue: ${moduleItem.title}`
                    : `Start ${moduleItem.title}`}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                {isModuleCompleted
                  ? `All ${totalLessons} lessons have been mastered. You can revisit any lesson or review the complete course roadmap below.`
                  : isStarted
                    ? `Pick up right where you left off at Lesson ${targetLesson?.order || 1}: "${targetLesson?.title}".`
                    : `Begin the structured step-by-step curriculum starting with Lesson 1: "${targetLesson?.title}".`}
              </p>
            </div>

            {/* Primary Action Button */}
            {targetLesson && (
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
                <Button
                  asChild
                  size="lg"
                  className="gap-2 text-sm font-semibold shadow-md min-h-[48px] px-6"
                >
                  <Link
                    to="/lesson/$lessonId"
                    params={{ lessonId: targetLesson.id }}
                    search={{ mode: "module" }}
                  >
                    {ctaMode === "review" ? (
                      <>
                        <RotateCcw className="h-4 w-4" /> Review Course
                      </>
                    ) : ctaMode === "continue" ? (
                      <>
                        <Play className="h-4 w-4 fill-current" /> Continue Course
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" /> Start Course
                      </>
                    )}
                  </Link>
                </Button>
                <div className="text-xs text-muted-foreground font-mono">
                  Target: <strong className="text-foreground">{targetLesson.title}</strong> (~
                  {targetLesson.estimatedMinutes || 20}m)
                </div>
              </div>
            )}
          </div>

          {/* Progress Overview Block */}
          <div className="flex items-center gap-5 border-t lg:border-t-0 lg:border-l border-border/60 pt-5 lg:pt-0 lg:pl-8 shrink-0 w-full lg:w-auto justify-between lg:justify-start">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                Course Progress
              </div>
              <div className="text-2xl font-bold font-mono">{progressPercent}%</div>
              <div className="text-xs text-muted-foreground">
                {completedCount} of {totalLessons} lessons
              </div>
            </div>
            <ProgressRing value={progressPercent / 100} size={64} />
          </div>
        </div>

        {/* Progress bar line */}
        <div className="mt-6 pt-4 border-t border-border/40">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-mono mb-2">
            <span>Overall Completion</span>
            <span>
              {completedCount}/{totalLessons} Lessons ({progressPercent}%)
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </Card>

      {/* Next Up Focus Banner (when in progress or new) */}
      {!isModuleCompleted && targetLesson && (
        <Card className="border-border/70 bg-card p-5 sm:p-6 shadow-xs relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Badge
                  variant="default"
                  className="gap-1 text-[11px] font-semibold uppercase tracking-wider"
                >
                  <Play className="h-3 w-3 fill-current" /> Next Up
                </Badge>
                {targetTopic && (
                  <span className="text-xs text-muted-foreground font-mono">
                    Chapter: {targetTopic.title}
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  Lesson {targetLesson.order || 1}: {targetLesson.title}
                </h3>
                {targetLesson.summary && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    {targetLesson.summary}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono pt-1">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  {targetLesson.estimatedMinutes || 20} min
                </span>
                <span>·</span>
                <DifficultyBadge difficulty={targetLesson.difficulty || moduleItem.difficulty} />
              </div>
            </div>

            <Button
              asChild
              variant="default"
              size="default"
              className="w-full sm:w-auto gap-2 shadow-xs shrink-0 min-h-[44px]"
            >
              <Link
                to="/lesson/$lessonId"
                params={{ lessonId: targetLesson.id }}
                search={{ mode: "module" }}
              >
                {isStarted ? "Resume Lesson" : "Start Lesson"} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Card>
      )}

      {/* Celebratory Completion Banner (when 100% complete) */}
      {isModuleCompleted && (
        <Card className="border-emerald-500/40 bg-emerald-500/5 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-500 shrink-0 mt-0.5">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  Course Complete · 100% Mastered
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                  Congratulations! You have completed every lesson in {moduleItem.title}. You can
                  review any chapter or practice with related challenges.
                </p>
              </div>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full sm:w-auto shrink-0 gap-1.5 min-h-[40px]"
            >
              <Link to="/learn/modules">
                Explore More Courses <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Card>
      )}

      {/* Prerequisites & Tags */}
      {(prerequisites.length > 0 || (moduleItem.tags && moduleItem.tags.length > 0)) && (
        <div className="grid gap-4 md:grid-cols-2">
          {prerequisites.length > 0 && (
            <Card className="border-border/60 bg-muted/20 p-4">
              <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5 text-primary" /> Recommended Prerequisites
              </div>
              <div className="space-y-2">
                {prerequisites.map((prereq) => (
                  <Link
                    key={prereq.id}
                    to="/learn/modules/$moduleId"
                    params={{ moduleId: prereq.id }}
                    className="flex items-center justify-between p-2 rounded-md bg-card border border-border/50 hover:border-primary/40 text-xs font-medium transition-colors"
                  >
                    <span>{prereq.title}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {moduleItem.tags && moduleItem.tags.length > 0 && (
            <Card className="border-border/60 bg-muted/20 p-4">
              <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-primary" /> Core Skills & Topics Covered
              </div>
              <div className="flex flex-wrap gap-1.5">
                {moduleItem.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Course Curriculum Roadmap Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Curriculum Roadmap
            </h2>
            <p className="text-xs text-muted-foreground">
              {moduleTopics.length} Chapters · {totalLessons} Sequential Lessons from start to
              finish
            </p>
          </div>
          <div className="text-xs font-mono text-muted-foreground">
            {completedCount} of {totalLessons} completed ({progressPercent}%)
          </div>
        </div>

        {chapters.length > 0 ? (
          <div className="space-y-4">
            {chapters.map((chapter) => {
              const isCollapsed = !!collapsedChapters[chapter.topic.id];

              return (
                <Card
                  key={chapter.topic.id}
                  className={`border-border/70 transition-all duration-200 ${
                    chapter.isCompleted
                      ? "bg-card/40 border-emerald-500/20"
                      : "bg-card/70 hover:border-border"
                  }`}
                >
                  {/* Chapter Header */}
                  <div
                    className="p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4 cursor-pointer select-none"
                    onClick={() => toggleChapter(chapter.topic.id)}
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant={chapter.isCompleted ? "default" : "outline"}
                          className={`text-[10px] font-mono uppercase tracking-wider ${
                            chapter.isCompleted ? "bg-emerald-600 hover:bg-emerald-600" : ""
                          }`}
                        >
                          Chapter {chapter.chapterNumber}
                        </Badge>
                        <DifficultyBadge difficulty={chapter.topic.difficulty} />
                        <span className="text-xs text-muted-foreground font-mono inline-flex items-center gap-1">
                          <Clock className="h-3 w-3 text-amber-400" />
                          {chapter.topic.estimatedMinutes}m
                        </span>
                        <Badge variant="secondary" className="gap-1 text-[10px] shrink-0 font-mono">
                          <TrendingUp className="h-3 w-3 text-emerald-400" />
                          {chapter.topic.interviewFrequency}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-foreground">
                          {chapter.topic.title}
                        </h3>
                        {chapter.isCompleted && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {chapter.topic.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right hidden sm:block">
                        <div className="text-xs font-mono font-medium text-foreground">
                          {chapter.completedCount} / {chapter.lessons.length}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {chapter.isCompleted ? "Completed" : "In Progress"}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground"
                        aria-label="Toggle chapter"
                      >
                        {isCollapsed ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronUp className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Chapter Lessons List */}
                  {!isCollapsed && (
                    <div className="border-t border-border/50 divide-y divide-border/40 bg-muted/10">
                      {chapter.lessons.map((lesson, lessonIndex) => {
                        const isLessonCompleted = lessonsCompleted.includes(lesson.id);
                        const isTarget = targetLesson?.id === lesson.id;

                        return (
                          <div
                            key={lesson.id}
                            className={`p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors ${
                              isTarget
                                ? "bg-primary/5 border-l-2 border-l-primary"
                                : isLessonCompleted
                                  ? "hover:bg-muted/30"
                                  : "hover:bg-muted/20"
                            }`}
                          >
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              {/* Status Icon */}
                              <div className="mt-0.5 shrink-0">
                                {isLessonCompleted ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                ) : isTarget ? (
                                  <Play className="h-4 w-4 text-primary fill-primary" />
                                ) : (
                                  <Circle className="h-4 w-4 text-muted-foreground/40" />
                                )}
                              </div>

                              <div className="space-y-1 min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[11px] font-mono text-muted-foreground">
                                    Lesson {lesson.order || lessonIndex + 1}
                                  </span>
                                  {isTarget && (
                                    <Badge
                                      variant="default"
                                      className="text-[10px] py-0 px-1.5 font-semibold"
                                    >
                                      Next Up
                                    </Badge>
                                  )}
                                  {isLessonCompleted && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] py-0 px-1.5 text-emerald-400 border-emerald-500/30"
                                    >
                                      Completed
                                    </Badge>
                                  )}
                                </div>

                                <h4 className="text-sm font-semibold text-foreground truncate">
                                  {lesson.title}
                                </h4>

                                {lesson.summary && (
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    {lesson.summary}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/30">
                              <span className="text-xs text-muted-foreground font-mono inline-flex items-center gap-1">
                                <Clock className="h-3 w-3 text-amber-400" />
                                {lesson.estimatedMinutes || 20}m
                              </span>

                              <Button
                                asChild
                                variant={
                                  isTarget ? "default" : isLessonCompleted ? "outline" : "secondary"
                                }
                                size="sm"
                                className="min-h-[36px] text-xs gap-1.5 shadow-xs"
                              >
                                <Link
                                  to="/lesson/$lessonId"
                                  params={{ lessonId: lesson.id }}
                                  search={{ mode: "module" }}
                                >
                                  {isLessonCompleted ? (
                                    <>
                                      <RotateCcw className="h-3.5 w-3.5" /> Revisit
                                    </>
                                  ) : isTarget ? (
                                    <>
                                      <Play className="h-3.5 w-3.5 fill-current" />{" "}
                                      {isStarted ? "Resume" : "Start"}
                                    </>
                                  ) : (
                                    <>
                                      <ArrowRight className="h-3.5 w-3.5" /> Start
                                    </>
                                  )}
                                </Link>
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No Chapters Found"
            description="There are currently no chapters assigned to this course."
          />
        )}
      </section>

      {/* Secondary Actions & External Links */}
      <Card className="border-border/60 bg-muted/20 p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-foreground">
              Need to search or browse by specific topics?
            </h4>
            <p className="text-xs text-muted-foreground">
              You can explore the filtered catalog of lessons or browse other courses in the
              curriculum.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs min-h-[36px] flex-1 sm:flex-none"
            >
              <Link to="/learn/lessons" search={{ moduleId: moduleItem.id }}>
                <BookOpen className="h-3.5 w-3.5" /> Filtered Lessons
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs min-h-[36px] flex-1 sm:flex-none"
            >
              <Link to="/learn/topics" search={{}}>
                <FolderTree className="h-3.5 w-3.5" /> All Topics
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
