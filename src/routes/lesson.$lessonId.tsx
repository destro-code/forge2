import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { Bookmark, BookmarkCheck, Clock, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { LessonPlayer } from "@/components/lesson/lesson-player";
import {
  useLesson,
  useLessons,
  useModule,
  useModules,
  useTopic,
  useTopics,
} from "@/lib/hooks/use-content";
import { useProgress } from "@/lib/hooks/use-progress";
import { getOrderedCurriculumLessons } from "@/lib/utils/curriculum-order";

export const Route = createFileRoute("/lesson/$lessonId")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search.mode === "curriculum" ? ("curriculum" as const) : ("module" as const),
  }),
  head: ({ params }) => ({
    meta: [
      { title: "Lesson · Forge" },
      { name: "description", content: `Lesson ${params.lessonId} on Forge.` },
    ],
  }),
  component: LessonView,
});

function LessonView() {
  const { lessonId } = Route.useParams();
  const { mode = "module" } = Route.useSearch();
  const lesson = useLesson(lessonId);
  const allLessons = useLessons();
  const allModules = useModules();
  const allTopics = useTopics();
  const topic = useTopic(lesson?.topicId);
  const parentModule = useModule(lesson?.moduleId || topic?.moduleId);
  const {
    bookmarks,
    toggleBookmark,
    completeLesson,
    lessonsCompleted,
    setLastActiveLesson,
    lastActiveLessonId,
  } = useProgress();

  useEffect(() => {
    if (lesson?.id && lesson.id !== lastActiveLessonId) {
      setLastActiveLesson(lesson.id);
    }
  }, [lesson?.id, lastActiveLessonId, setLastActiveLesson]);

  if (!lesson) throw notFound();

  const isCompleted = lessonsCompleted.includes(lesson.id);
  const isBookmarked = bookmarks.includes(lesson.id);

  const moduleTopics = allTopics
    .filter((item) => item.moduleId === (lesson.moduleId || topic?.moduleId))
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  const topicIds = moduleTopics.map((item) => item.id);

  const moduleLessons = allLessons
    .filter(
      (item) =>
        (item.topicId && topicIds.includes(item.topicId)) ||
        item.moduleId === (lesson.moduleId || topic?.moduleId),
    )
    .sort((a, b) => {
      const topicA = moduleTopics.find((item) => item.id === a.topicId)?.order ?? 0;
      const topicB = moduleTopics.find((item) => item.id === b.topicId)?.order ?? 0;
      if (topicA !== topicB) return topicA - topicB;
      return (a.order || 0) - (b.order || 0);
    });

  const curriculumLessons = getOrderedCurriculumLessons(allModules, allTopics, allLessons);
  const activeLessons = mode === "curriculum" ? curriculumLessons : moduleLessons;
  const currentIndex = activeLessons.findIndex((item) => item.id === lesson.id);
  const prevLesson = currentIndex > 0 ? activeLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < activeLessons.length - 1
      ? activeLessons[currentIndex + 1]
      : null;

  const handleComplete = () => {
    const wasCompleted = lessonsCompleted.includes(lesson.id);
    completeLesson(lesson.id);
    if (!wasCompleted) {
      toast.success("Lesson complete! +50 XP");
    }
  };

  const handleBookmark = () => {
    toggleBookmark(lesson.id);
    toast.success(isBookmarked ? "Removed from bookmarks" : "Saved to bookmarks");
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] space-y-4">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 rounded-xl border border-border/60 bg-card/70 px-4 py-3 backdrop-blur-xl sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          {parentModule ? (
            <Link
              to="/learn/modules/$moduleId"
              params={{ moduleId: parentModule.id }}
              className="hidden shrink-0 items-center gap-2 text-xs text-muted-foreground transition hover:text-foreground sm:flex"
            >
              <GraduationCap className="h-4 w-4 text-primary" />
              {parentModule.title}
            </Link>
          ) : (
            <Link
              to="/learn"
              className="hidden shrink-0 items-center gap-2 text-xs text-muted-foreground transition hover:text-foreground sm:flex"
            >
              <GraduationCap className="h-4 w-4 text-primary" />
              Roadmap
            </Link>
          )}
          <div className="hidden h-5 w-px bg-border/60 sm:block" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{lesson.title}</div>
            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {lesson.estimatedMinutes} min
              </span>
              <DifficultyBadge difficulty={lesson.difficulty} />
              {isCompleted && (
                <Badge className="h-5 bg-emerald-500/10 text-[10px] text-emerald-400">
                  Completed
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleBookmark}
          aria-label={isBookmarked ? "Remove bookmark" : "Bookmark lesson"}
          className="shrink-0"
        >
          {isBookmarked ? (
            <BookmarkCheck className="h-4 w-4 text-primary" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )}
        </Button>
      </header>

      <LessonPlayer
        lesson={lesson}
        isCompleted={isCompleted}
        onComplete={handleComplete}
        prevLessonId={prevLesson?.id}
        nextLessonId={nextLesson?.id}
      />
    </div>
  );
}
