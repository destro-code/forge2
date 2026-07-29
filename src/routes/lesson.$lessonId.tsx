import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Callout } from "@/components/shared/callout";
import { CodeBlock } from "@/components/shared/code-block";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { useLesson, useLessons } from "@/lib/hooks/use-content";
import { useProgress } from "@/lib/hooks/use-progress";
import { toast } from "sonner";
import {
  Bookmark,
  BookmarkCheck,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  BookOpen,
  Check,
} from "lucide-react";

export const Route = createFileRoute("/lesson/$lessonId")({
  head: ({ params }) => ({
    meta: [
      { title: `Lesson · Forge` },
      { name: "description", content: `Lesson ${params.lessonId} on Forge.` },
      { property: "og:title", content: "Forge lesson" },
      { property: "og:description", content: "Read, practice, quiz and master this concept." },
    ],
  }),
  component: LessonView,
});

function LessonView() {
  const { lessonId } = Route.useParams();
  const lesson = useLesson(lessonId);
  const allLessons = useLessons();
  const {
    bookmarks,
    toggleBookmark,
    saveNote,
    notes,
    completeLesson,
    lessonsCompleted,
    setLastActiveLesson,
    lastActiveLessonId,
  } = useProgress();

  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<string, number>>({});
  const [noteSaved, setNoteSaved] = useState(false);

  if (!lesson) throw notFound();

  const isBookmarked = bookmarks.includes(lesson.id);
  const isCompleted = lessonsCompleted.includes(lesson.id);

  const currentIndex = allLessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  useEffect(() => {
    if (lesson?.id && lastActiveLessonId !== lesson.id) {
      setLastActiveLesson(lesson.id);
    }
  }, [lesson?.id, lastActiveLessonId, setLastActiveLesson]);

  const handleToggleBookmark = () => {
    toggleBookmark(lesson.id);
    if (isBookmarked) {
      toast.info("Removed from bookmarks");
    } else {
      toast.success("Saved to bookmarks");
    }
  };

  const handleComplete = () => {
    completeLesson(lesson.id);
    if (!isCompleted) {
      toast.success("Lesson marked as complete! Keep up the great work.");
    } else {
      toast.info("Lesson completion toggled.");
    }
  };

  const handleQuizSelect = (questionId: string, optionIndex: number, correctIndex?: number) => {
    setSelectedQuizAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
    if (correctIndex !== undefined) {
      if (optionIndex === correctIndex) {
        toast.success("Correct answer!");
      } else {
        toast.error("Incorrect. Review the explanation below.");
      }
    }
  };

  const handleSaveNote = (text: string) => {
    saveNote(lesson.id, text);
    setNoteSaved(true);
    toast.success("Note saved for this lesson");
    setTimeout(() => setNoteSaved(false), 2000);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)_260px]">
      <aside className="hidden lg:block">
        <div className="sticky top-20">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            On this page
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {lesson.sections
              .filter((s) => s.type === "heading")
              .map((s, i) => (
                <li key={i}>
                  <a
                    href={`#h-${i}`}
                    className="text-muted-foreground transition hover:text-foreground"
                  >
                    {"text" in s ? s.text : ""}
                  </a>
                </li>
              ))}
            <li>
              <a href="#exercises" className="text-muted-foreground hover:text-foreground">
                Exercises
              </a>
            </li>
            <li>
              <a href="#quiz" className="text-muted-foreground hover:text-foreground">
                Quiz
              </a>
            </li>
            <li>
              <a href="#interview" className="text-muted-foreground hover:text-foreground">
                Interview
              </a>
            </li>
          </ul>
        </div>
      </aside>

      <article className="min-w-0">
        <PageHeader
          eyebrow="Lesson"
          title={lesson.title}
          description={lesson.description}
          actions={
            <div className="flex items-center gap-2">
              {isCompleted ? (
                <Badge
                  variant="secondary"
                  className="gap-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Completed
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className="gap-1 bg-primary/10 text-primary border-primary/20"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  In Progress
                </Badge>
              )}
              <DifficultyBadge difficulty={lesson.difficulty} />
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                {lesson.estimatedMinutes}m
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Bookmark"
                onClick={handleToggleBookmark}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="h-4 w-4 text-primary fill-primary/20" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
              </Button>
            </div>
          }
        />

        <div className="prose prose-invert max-w-none text-[15px] leading-relaxed">
          {lesson.sections.map((s, i) => {
            if (s.type === "heading")
              return (
                <h2 id={`h-${i}`} key={i} className="mt-8 text-xl font-bold tracking-tight">
                  {s.text}
                </h2>
              );
            if (s.type === "paragraph")
              return (
                <p key={i} className="mt-3 text-foreground/85 leading-relaxed">
                  {s.text}
                </p>
              );
            if (s.type === "callout")
              return (
                <Callout key={i} variant={s.variant}>
                  {s.text}
                </Callout>
              );
            if (s.type === "code") return <CodeBlock key={i} language={s.language} code={s.code} />;
            return null;
          })}
        </div>

        <section id="exercises" className="mt-10">
          <h2 className="text-lg font-bold">Exercises</h2>
          <div className="mt-4 grid gap-3">
            {lesson.exercises.map((ex) => (
              <Card key={ex.id} className="border-border/60">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold">{ex.title}</div>
                      <p className="mt-1 text-sm text-muted-foreground">{ex.brief}</p>
                    </div>
                    <Button asChild size="sm" variant="secondary">
                      <Link to="/playground">Open playground</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="quiz" className="mt-10">
          <h2 className="text-lg font-bold">Interactive Quiz</h2>
          <div className="mt-4 grid gap-4">
            {lesson.quiz.map((q) => {
              const selectedIdx = selectedQuizAnswers[q.id];
              const isAnswered = selectedIdx !== undefined;

              return (
                <Card key={q.id} className="border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold leading-snug">
                      {q.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-2">
                    {q.options.map((o, i) => {
                      const isSelected = selectedIdx === i;
                      const isCorrect = q.correctIndex !== undefined && i === q.correctIndex;

                      let btnStyle =
                        "border-border/60 bg-muted/30 hover:border-primary/50 hover:bg-accent text-foreground";
                      if (isAnswered) {
                        if (isCorrect) {
                          btnStyle =
                            "border-emerald-500/50 bg-emerald-500/10 text-emerald-300 font-medium";
                        } else if (isSelected && !isCorrect) {
                          btnStyle = "border-rose-500/50 bg-rose-500/10 text-rose-300 font-medium";
                        } else {
                          btnStyle = "border-border/40 bg-muted/20 opacity-60";
                        }
                      }

                      return (
                        <button
                          key={i}
                          onClick={() => handleQuizSelect(q.id, i, q.correctIndex)}
                          className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition duration-150 ${btnStyle}`}
                        >
                          <span>{o}</span>
                          {isAnswered && isCorrect && (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                          )}
                          {isAnswered && isSelected && !isCorrect && (
                            <XCircle className="h-4 w-4 shrink-0 text-rose-400" />
                          )}
                        </button>
                      );
                    })}

                    {isAnswered && q.explanation && (
                      <div className="mt-2 rounded-md border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground leading-relaxed">
                        <strong className="text-primary font-medium">Explanation: </strong>
                        {q.explanation}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section id="interview" className="mt-10">
          <h2 className="text-lg font-bold">Interview Questions</h2>
          <ul className="mt-4 grid gap-2">
            {lesson.interviewQuestions.map((q, i) => (
              <li key={i} className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
                {q}
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-10 rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-card to-transparent p-6 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-primary">
            Summary
          </div>
          <p className="mt-2 text-[15px] text-foreground/90 leading-relaxed">{lesson.summary}</p>
        </div>

        {/* Lesson Navigation Footer */}
        <nav className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border/40">
          {prevLesson ? (
            <Button variant="outline" asChild size="sm" className="max-w-[220px]">
              <Link to={`/lesson/${prevLesson.id}`} className="truncate">
                <ArrowLeft className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">Prev: {prevLesson.title}</span>
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" asChild size="sm">
              <Link to="/learn/lessons">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to library
              </Link>
            </Button>
          )}

          <Button
            onClick={handleComplete}
            variant={isCompleted ? "outline" : "default"}
            size="sm"
            className="shadow-glow"
          >
            {isCompleted ? (
              <>
                <Check className="mr-2 h-4 w-4 text-emerald-400" />
                Completed
              </>
            ) : (
              <>
                Mark complete
                <CheckCircle2 className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          {nextLesson ? (
            <Button variant="outline" asChild size="sm" className="max-w-[220px]">
              <Link to={`/lesson/${nextLesson.id}`} className="truncate">
                <span className="truncate">Next: {nextLesson.title}</span>
                <ArrowRight className="ml-2 h-4 w-4 shrink-0" />
              </Link>
            </Button>
          ) : (
            <Button variant="outline" asChild size="sm">
              <Link to="/learn/lessons">
                All lessons <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </nav>
      </article>

      <aside className="hidden lg:block">
        <div className="sticky top-20 space-y-4">
          <Card className="border-border/60">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                Notes
              </CardTitle>
              {noteSaved && <span className="text-[10px] text-emerald-400 font-medium">Saved</span>}
            </CardHeader>
            <CardContent>
              <Textarea
                defaultValue={notes[lesson.id] ?? ""}
                onBlur={(e) => handleSaveNote(e.target.value)}
                placeholder="Write your own explanation — teaching is learning."
                className="min-h-40 resize-none text-sm"
              />
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Resources</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              {lesson.resources.map((r) => (
                <a
                  key={r.url}
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {r.label}
                </a>
              ))}
            </CardContent>
          </Card>
        </div>
      </aside>
    </div>
  );
}
