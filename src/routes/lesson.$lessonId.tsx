import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Callout } from "@/components/shared/callout";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { useLesson, useLessons, useTopic, useModule } from "@/lib/hooks/use-content";
import { useProgress } from "@/lib/hooks/use-progress";
import { toast } from "sonner";
import {
  Bookmark,
  BookmarkCheck,
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  BookOpen,
  Check,
  Code2,
  HelpCircle,
  GraduationCap,
} from "lucide-react";

import { LessonReadingProgress } from "@/components/lesson/lesson-reading-progress";
import { LessonDiagram } from "@/components/lesson/lesson-diagram";
import { LessonInteractiveCode } from "@/components/lesson/lesson-interactive-code";
import { LessonWalkthrough } from "@/components/lesson/lesson-walkthrough";
import { LessonCollapsible } from "@/components/lesson/lesson-collapsible";
import { LessonCheckpoints } from "@/components/lesson/lesson-checkpoints";
import { LessonInlineSandbox } from "@/components/lesson/lesson-inline-sandbox";
import { LessonTextHighlighter } from "@/components/lesson/lesson-text-highlighter";
import { LessonNotesWidget } from "@/components/lesson/lesson-notes-widget";

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
  const topic = useTopic(lesson?.topicId);
  const parentModule = useModule(topic?.moduleId);
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
  const [activeSectionId, setActiveSectionId] = useState<string>("");

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

  const handleAddNoteFromText = (selectedQuote: string) => {
    const existing = notes[lesson.id] ?? "";
    const updated = existing ? `${existing}\n\n> "${selectedQuote}"` : `> "${selectedQuote}"`;
    saveNote(lesson.id, updated);
    toast.success("Added quote to lesson notes");
  };

  return (
    <div className="space-y-6">
      {/* Scroll Reading Progress Bar */}
      <LessonReadingProgress title={lesson.title} estimatedMinutes={lesson.estimatedMinutes} />

      <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)_280px]">
        {/* Left Sticky TOC Navigation */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-4">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              On this page
            </div>
            <ul className="mt-3 space-y-2 text-xs font-medium">
              {lesson.sections
                .filter((s) => s.type === "heading")
                .map((s, i) => (
                  <li key={i}>
                    <a
                      href={`#h-${i}`}
                      onClick={() => setActiveSectionId(`h-${i}`)}
                      className={`block truncate transition ${
                        activeSectionId === `h-${i}`
                          ? "text-primary font-semibold border-l-2 border-primary pl-2 -ml-2"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {"text" in s ? s.text : ""}
                    </a>
                  </li>
                ))}
              <li>
                <a href="#exercises" className="text-muted-foreground hover:text-foreground block">
                  Exercises
                </a>
              </li>
              <li>
                <a href="#quiz" className="text-muted-foreground hover:text-foreground block">
                  Quiz
                </a>
              </li>
              <li>
                <a href="#interview" className="text-muted-foreground hover:text-foreground block">
                  Interview Questions
                </a>
              </li>
            </ul>

            <div className="pt-4 border-t border-border/40 space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Lesson Stats
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Est. Time</span>
                <span className="font-mono font-medium text-foreground">
                  {lesson.estimatedMinutes} mins
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Difficulty</span>
                <DifficultyBadge difficulty={lesson.difficulty} />
              </div>
            </div>
          </div>
        </aside>

        {/* Center Main Article Content */}
        <article className="min-w-0 space-y-6">
          {/* Hierarchy Breadcrumb Navigation */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono bg-muted/30 border border-border/50 rounded-lg p-2.5 overflow-x-auto whitespace-nowrap scrollbar-none">
            <GraduationCap className="h-4 w-4 text-primary shrink-0" />
            <Link to="/learn" className="hover:text-foreground hover:underline">
              Roadmap
            </Link>
            <span>/</span>
            <Link to="/learn/modules" className="hover:text-foreground hover:underline">
              Modules
            </Link>
            {parentModule && (
              <>
                <span>/</span>
                <Link
                  to="/learn/modules/$moduleId"
                  params={{ moduleId: parentModule.id }}
                  className="hover:text-foreground hover:underline text-foreground"
                >
                  {parentModule.title}
                </Link>
              </>
            )}
            {topic && (
              <>
                <span>/</span>
                <Link
                  to="/learn/topics/$topicId"
                  params={{ topicId: topic.id }}
                  className="hover:text-foreground hover:underline text-foreground"
                >
                  {topic.title}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="font-semibold text-primary truncate max-w-[180px]">
              {lesson.title}
            </span>
          </div>

          <PageHeader
            eyebrow="Lesson Engine 2.0"
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

          {/* Text Highlighter Wrapper enabling drag-to-highlight */}
          <LessonTextHighlighter lessonId={lesson.id} onAddNoteFromText={handleAddNoteFromText}>
            <div className="prose prose-invert max-w-none text-[15px] leading-relaxed">
              {lesson.sections.map((s, i) => {
                if (s.type === "heading")
                  return (
                    <h2
                      id={`h-${i}`}
                      key={i}
                      className="mt-8 text-xl font-bold tracking-tight text-foreground"
                    >
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
                if (s.type === "code")
                  return (
                    <LessonInteractiveCode
                      key={i}
                      language={s.language}
                      code={s.code}
                      title={"title" in s ? s.title : undefined}
                      highlightLines={"highlightLines" in s ? s.highlightLines : []}
                    />
                  );
                if (s.type === "diagram")
                  return (
                    <LessonDiagram
                      key={i}
                      diagramType={s.diagramType}
                      title={s.title}
                      description={s.description}
                    />
                  );
                if (s.type === "walkthrough")
                  return <LessonWalkthrough key={i} title={s.title} steps={s.steps} />;
                if (s.type === "collapsible")
                  return (
                    <LessonCollapsible
                      key={i}
                      title={s.title}
                      subtitle={s.subtitle}
                      content={s.content}
                      variant={s.variant}
                    />
                  );
                if (s.type === "checkpoint")
                  return (
                    <LessonCheckpoints
                      key={i}
                      lessonId={lesson.id}
                      checkpoints={[{ id: s.id, label: s.label, hint: s.hint }]}
                    />
                  );
                if (s.type === "interactive-sandbox")
                  return (
                    <LessonInlineSandbox
                      key={i}
                      initialCode={s.initialCode}
                      title={s.title}
                      instructions={s.instructions}
                    />
                  );
                return null;
              })}
            </div>
          </LessonTextHighlighter>

          {/* Exercises Section */}
          {lesson.exercises && lesson.exercises.length > 0 && (
            <section id="exercises" className="mt-10">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Code2 className="h-4 w-4 text-primary" />
                Exercises
              </h2>
              <div className="mt-4 grid gap-3">
                {lesson.exercises.map((ex) => (
                  <Card key={ex.id} className="border-border/60">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-semibold text-sm">{ex.title}</div>
                          <p className="mt-1 text-xs text-muted-foreground">{ex.brief}</p>
                        </div>
                        <Button asChild size="sm" variant="secondary" className="text-xs">
                          <Link to="/playground">Open playground</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Interactive Quiz Section */}
          {lesson.quiz && lesson.quiz.length > 0 && (
            <section id="quiz" className="mt-10">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-emerald-400" />
                Interactive Checkpoint Quiz
              </h2>
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
                              btnStyle =
                                "border-rose-500/50 bg-rose-500/10 text-rose-300 font-medium";
                            } else {
                              btnStyle = "border-border/40 bg-muted/20 opacity-60";
                            }
                          }

                          return (
                            <button
                              key={i}
                              onClick={() => handleQuizSelect(q.id, i, q.correctIndex)}
                              className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left text-xs transition duration-150 ${btnStyle}`}
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
          )}

          {/* Interview Questions Section */}
          {lesson.interviewQuestions && lesson.interviewQuestions.length > 0 && (
            <section id="interview" className="mt-10">
              <h2 className="text-lg font-bold">Interview Questions</h2>
              <ul className="mt-4 grid gap-2">
                {lesson.interviewQuestions.map((q, i) => (
                  <li
                    key={i}
                    className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs leading-relaxed"
                  >
                    {q}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Lesson Summary Card */}
          <div className="mt-10 rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-card to-transparent p-6 shadow-xs">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-primary">
              Summary Key Takeaway
            </div>
            <p className="mt-2 text-[15px] text-foreground/90 leading-relaxed">{lesson.summary}</p>
          </div>

          {/* Lesson Navigation Footer */}
          <nav className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border/40">
            {prevLesson ? (
              <Button
                variant="outline"
                asChild
                size="sm"
                className="w-full sm:w-auto sm:max-w-[220px]"
              >
                <Link to={`/lesson/${prevLesson.id}`} className="truncate justify-center">
                  <ArrowLeft className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">Prev: {prevLesson.title}</span>
                </Link>
              </Button>
            ) : (
              <Button variant="ghost" asChild size="sm" className="w-full sm:w-auto">
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
              className="w-full sm:w-auto shadow-glow"
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
              <Button
                variant="outline"
                asChild
                size="sm"
                className="w-full sm:w-auto sm:max-w-[220px]"
              >
                <Link to={`/lesson/${nextLesson.id}`} className="truncate justify-center">
                  <span className="truncate">Next: {nextLesson.title}</span>
                  <ArrowRight className="ml-2 h-4 w-4 shrink-0" />
                </Link>
              </Button>
            ) : (
              <Button variant="outline" asChild size="sm" className="w-full sm:w-auto">
                <Link to="/learn/lessons">
                  All lessons <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </nav>
        </article>

        {/* Right Sidebar Notes & Highlights Widget */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-4">
            <LessonNotesWidget lessonId={lesson.id} lessonTitle={lesson.title} />

            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold">Resources & Docs</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-xs">
                {lesson.resources.map((r) => (
                  <a
                    key={r.url}
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline-offset-4 hover:underline truncate"
                  >
                    {r.label}
                  </a>
                ))}
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>
    </div>
  );
}
