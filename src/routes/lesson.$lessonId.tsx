import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Callout } from "@/components/shared/callout";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import {
  useLesson,
  useCanonicalLesson,
  useLessons,
  useTopic,
  useTopics,
  useModule,
  useModules,
  useQuizzes,
  useBugs,
} from "@/lib/hooks/use-content";
import { useProgress } from "@/lib/hooks/use-progress";
import { getOrderedCurriculumLessons } from "@/lib/utils/curriculum-order";
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
  Bug as BugIcon,
  Sparkles,
  List,
  FileText,
  Compass,
  Terminal,
  CheckSquare,
  Zap,
  BrainCircuit,
  Target,
  Award,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import { LessonReadingProgress } from "@/components/lesson/lesson-reading-progress";
import { LessonDiagram } from "@/components/lesson/lesson-diagram";
import { LessonInteractiveCode } from "@/components/lesson/lesson-interactive-code";
import { LessonWalkthrough } from "@/components/lesson/lesson-walkthrough";
import { LessonCollapsible } from "@/components/lesson/lesson-collapsible";
import { LessonCheckpoints } from "@/components/lesson/lesson-checkpoints";
import { LessonInlineSandbox } from "@/components/lesson/lesson-inline-sandbox";
import { LessonTextHighlighter } from "@/components/lesson/lesson-text-highlighter";
import { LessonNotesWidget } from "@/components/lesson/lesson-notes-widget";
import { LessonPlayer } from "@/components/lesson/lesson-player";
import { CanonicalLessonPlayer } from "@/components/lesson/canonical";
import { getApplyActivityCta } from "@/lib/utils/apply-action";

export const Route = createFileRoute("/lesson/$lessonId")({
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    mode?: "curriculum" | "module";
    player?: boolean;
    classic?: boolean;
  } => ({
    mode: search.mode === "curriculum" ? "curriculum" : "module",
    player: search.player === true || search.player === "true",
    classic: search.classic === true || search.classic === "true",
  }),
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

const PHASES = [
  { id: "orient", number: "01", label: "Orient", icon: Compass },
  { id: "understand", number: "02", label: "Understand", icon: BookOpen },
  { id: "see-try", number: "03", label: "See & Try", icon: Terminal },
  { id: "check", number: "04", label: "Check", icon: CheckSquare },
  { id: "apply", number: "05", label: "Apply", icon: Zap },
  { id: "master", number: "06", label: "Master", icon: BrainCircuit },
  { id: "continue", number: "07", label: "Continue", icon: Sparkles },
];

function LessonView() {
  const { lessonId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const lesson = useLesson(lessonId);
  const canonicalLesson = useCanonicalLesson(lessonId);
  const { setLastActiveLesson, lastActiveLessonId } = useProgress();

  const allModules = useModules();
  const allTopics = useTopics();
  const allLessons = useLessons();
  const topic = useTopic(lesson?.topicId);
  const currentModuleId = lesson?.moduleId || topic?.moduleId;

  const currentMode: "curriculum" | "module" =
    search.mode === "curriculum" ? "curriculum" : "module";

  // Module-scoped ordered topic and lesson queue
  const moduleTopics = useMemo(() => {
    if (!currentModuleId) return [];
    return allTopics
      .filter((t) => t.moduleId === currentModuleId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [allTopics, currentModuleId]);

  const moduleLessons = useMemo(() => {
    if (!currentModuleId) return allLessons;
    const topicIds = moduleTopics.map((t) => t.id);
    return allLessons
      .filter((l) => (l.topicId && topicIds.includes(l.topicId)) || l.moduleId === currentModuleId)
      .sort((a, b) => {
        const topicA = moduleTopics.find((t) => t.id === a.topicId);
        const topicB = moduleTopics.find((t) => t.id === b.topicId);
        const topicOrderA = topicA?.order ?? 0;
        const topicOrderB = topicB?.order ?? 0;
        if (topicOrderA !== topicOrderB) return topicOrderA - topicOrderB;
        return (a.order || 0) - (b.order || 0);
      });
  }, [allLessons, currentModuleId, moduleTopics]);

  // Full global curriculum ordered lesson queue
  const curriculumLessons = useMemo(() => {
    return getOrderedCurriculumLessons(allModules, allTopics, allLessons);
  }, [allModules, allTopics, allLessons]);

  const activeLessons = currentMode === "curriculum" ? curriculumLessons : moduleLessons;
  const currentIndex = lesson ? activeLessons.findIndex((l) => l.id === lesson.id) : -1;
  const nextLesson =
    currentIndex >= 0 && currentIndex < activeLessons.length - 1
      ? activeLessons[currentIndex + 1]
      : lesson?.nextLessonId
        ? allLessons.find((l) => l.id === lesson.nextLessonId) || null
        : null;

  if (!lesson) throw notFound();

  useEffect(() => {
    if (lesson?.id && lastActiveLessonId !== lesson.id) {
      setLastActiveLesson(lesson.id);
    }
  }, [lesson?.id, lastActiveLessonId, setLastActiveLesson]);

  const handleLessonPlayerComplete = () => {
    if (nextLesson) {
      toast.success(`Lesson completed! Moving to ${nextLesson.title}`);
      navigate({
        to: "/lesson/$lessonId",
        params: { lessonId: nextLesson.id },
        search: { mode: currentMode },
      });
    } else if (currentModuleId) {
      toast.success("Module completed! Returning to module overview.");
      navigate({
        to: "/learn/modules/$moduleId",
        params: { moduleId: currentModuleId },
      });
    } else {
      toast.success("Curriculum completed! Returning to curriculum overview.");
      navigate({
        to: "/learn",
      });
    }
  };

  if (!search.classic) {
    return (
      <div className="flex flex-col h-dvh w-full overflow-hidden">
        {canonicalLesson ? (
          <CanonicalLessonPlayer
            key={canonicalLesson.id}
            lesson={canonicalLesson}
            onComplete={handleLessonPlayerComplete}
            className="flex-1 min-h-0"
          />
        ) : (
          <LessonPlayer
            key={lesson.id}
            lesson={lesson}
            onComplete={handleLessonPlayerComplete}
            className="flex-1 min-h-0"
          />
        )}
      </div>
    );
  }

  return <ClassicLessonView lesson={lesson} search={search} />;
}

function ClassicLessonView({
  lesson,
  search,
}: {
  lesson: Lesson;
  search: Record<string, unknown>;
}) {
  const currentMode: "curriculum" | "module" =
    search.mode === "curriculum" ? "curriculum" : "module";
  const isCurriculumMode = currentMode === "curriculum";

  const allModules = useModules();
  const allTopics = useTopics();
  const topic = useTopic(lesson?.topicId);
  const currentModuleId = lesson?.moduleId || topic?.moduleId;
  const parentModule = useModule(currentModuleId);
  const allLessons = useLessons();
  const quizzes = useQuizzes();
  const bugs = useBugs();

  const matchingQuiz = quizzes.find((q) => q.topicId === lesson?.topicId) || quizzes[0];
  const matchingBug = bugs.find((b) => b.topicId === lesson?.topicId);
  const { bookmarks, toggleBookmark, saveNote, notes, completeLesson, lessonsCompleted } =
    useProgress();

  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<string, number>>({});
  const [activeSectionId, setActiveSectionId] = useState<string>("");
  const [activePhase, setActivePhase] = useState<string>("orient");
  const [tocOpen, setTocOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  // 1. Build module-scoped ordered topic and lesson queue
  const moduleTopics = useMemo(() => {
    if (!currentModuleId) return [];
    return allTopics
      .filter((t) => t.moduleId === currentModuleId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [allTopics, currentModuleId]);

  const moduleLessons = useMemo(() => {
    if (!currentModuleId) return allLessons;
    const topicIds = moduleTopics.map((t) => t.id);
    return allLessons
      .filter((l) => (l.topicId && topicIds.includes(l.topicId)) || l.moduleId === currentModuleId)
      .sort((a, b) => {
        const topicA = moduleTopics.find((t) => t.id === a.topicId);
        const topicB = moduleTopics.find((t) => t.id === b.topicId);
        const topicOrderA = topicA?.order ?? 0;
        const topicOrderB = topicB?.order ?? 0;
        if (topicOrderA !== topicOrderB) return topicOrderA - topicOrderB;
        return (a.order || 0) - (b.order || 0);
      });
  }, [allLessons, currentModuleId, moduleTopics]);

  // 2. Build full global curriculum ordered lesson queue (Module Order -> Topic Order -> Lesson Order)
  const curriculumLessons = useMemo(() => {
    return getOrderedCurriculumLessons(allModules, allTopics, allLessons);
  }, [allModules, allTopics, allLessons]);

  const isBookmarked = bookmarks.includes(lesson.id);
  const isCompleted = lessonsCompleted.includes(lesson.id);

  // Active progression queue according to selected learning mode
  const activeLessons = isCurriculumMode ? curriculumLessons : moduleLessons;
  const totalActiveLessons = activeLessons.length;
  const currentIndex = activeLessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIndex > 0 ? activeLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < activeLessons.length - 1
      ? activeLessons[currentIndex + 1]
      : null;

  // Active sequence completion status
  const completedActiveLessonsCount = activeLessons.filter((l) =>
    lessonsCompleted.includes(l.id),
  ).length;
  const isSequenceFullyCompleted =
    totalActiveLessons > 0 && completedActiveLessonsCount === totalActiveLessons;

  // Module completion status specifically
  const completedModuleLessonsCount = moduleLessons.filter((l) =>
    lessonsCompleted.includes(l.id),
  ).length;
  const isModuleFullyCompleted =
    moduleLessons.length > 0 && completedModuleLessonsCount === moduleLessons.length;

  // Dynamic active phase scroll observer
  useEffect(() => {
    const phaseIds = PHASES.map((p) => p.id);
    const observerCallback: IntersectionObserverCallback = (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setActivePhase(entry.target.id);
          break;
        }
      }
    };

    const observer = new IntersectionObserver(observerCallback, {
      rootMargin: "-80px 0px -50% 0px",
      threshold: 0.1,
    });

    phaseIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToPhase = (phaseId: string) => {
    setActivePhase(phaseId);
    const el = document.getElementById(phaseId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

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

  const currentPhaseIndex = PHASES.findIndex((p) => p.id === activePhase);

  return (
    <div className="space-y-6">
      {/* Scroll Reading Progress Bar */}
      <LessonReadingProgress title={lesson.title} estimatedMinutes={lesson.estimatedMinutes} />

      <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)_280px]">
        {/* Left Sticky TOC Navigation */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                On this page
              </div>
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
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Status</span>
                {isCompleted ? (
                  <Badge
                    variant="secondary"
                    className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  >
                    Completed
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="text-[10px] bg-primary/10 text-primary border-primary/20"
                  >
                    In Progress
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Center Main Article Content */}
        <article className="min-w-0 space-y-8">
          {/* PHASE 01 — ORIENT */}
          <section id="orient" className="space-y-4">
            {/* Hierarchy Breadcrumb Navigation */}
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono bg-muted/20 border border-border/40 rounded-lg px-3 py-2 overflow-x-auto whitespace-nowrap scrollbar-none"
            >
              <GraduationCap className="h-4 w-4 text-primary shrink-0" />
              <Link to="/learn" className="hover:text-foreground transition-colors">
                Roadmap
              </Link>
              <span className="opacity-40">/</span>
              <Link to="/learn/modules" className="hover:text-foreground transition-colors">
                Modules
              </Link>
              {parentModule && (
                <>
                  <span className="opacity-40">/</span>
                  <Link
                    to="/learn/modules/$moduleId"
                    params={{ moduleId: parentModule.id }}
                    className="hover:text-foreground transition-colors text-foreground/80"
                  >
                    {parentModule.title}
                  </Link>
                </>
              )}
              {topic && (
                <>
                  <span className="opacity-40">/</span>
                  <Link
                    to="/learn/topics/$topicId"
                    params={{ topicId: topic.id }}
                    className="hover:text-foreground transition-colors text-foreground/80"
                  >
                    {topic.title}
                  </Link>
                </>
              )}
              <span className="opacity-40">/</span>
              <span className="font-semibold text-primary truncate max-w-[200px]">
                {lesson.title}
              </span>
            </nav>

            {/* Mobile Lesson Controls (< lg screens) */}
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-border/60 bg-card/80 lg:hidden text-xs">
              <div className="flex items-center gap-1.5 font-medium text-muted-foreground min-w-0 truncate">
                <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="truncate">
                  Lesson {currentIndex >= 0 ? currentIndex + 1 : 1} of {totalActiveLessons}
                </span>
                {isCurriculumMode ? (
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-primary/10 border-primary/30 text-primary py-0 px-1.5 shrink-0"
                  >
                    Curriculum
                  </Badge>
                ) : parentModule ? (
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-muted/30 py-0 px-1.5 truncate max-w-[100px]"
                  >
                    {parentModule.title}
                  </Badge>
                ) : null}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Sheet open={tocOpen} onOpenChange={setTocOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 px-2.5">
                      <List className="h-3.5 w-3.5 text-primary" />
                      <span>Contents</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="bottom"
                    className="max-h-[80vh] overflow-y-auto rounded-t-xl p-4"
                  >
                    <SheetHeader className="pb-3 border-b border-border/50">
                      <SheetTitle className="text-sm font-semibold flex items-center justify-between">
                        <span>On this lesson</span>
                        <span className="text-xs font-normal text-muted-foreground font-mono">
                          Lesson {currentIndex >= 0 ? currentIndex + 1 : 1} of {totalActiveLessons}
                        </span>
                      </SheetTitle>
                    </SheetHeader>
                    <div className="py-4 space-y-4">
                      <ul className="space-y-2.5 text-xs font-medium">
                        {lesson.sections
                          .filter((s) => s.type === "heading")
                          .map((s, i) => (
                            <li key={i}>
                              <a
                                href={`#h-${i}`}
                                onClick={() => {
                                  setActiveSectionId(`h-${i}`);
                                  setTocOpen(false);
                                }}
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
                          <a
                            href="#exercises"
                            onClick={() => setTocOpen(false)}
                            className="text-muted-foreground hover:text-foreground block"
                          >
                            Exercises
                          </a>
                        </li>
                        <li>
                          <a
                            href="#quiz"
                            onClick={() => setTocOpen(false)}
                            className="text-muted-foreground hover:text-foreground block"
                          >
                            Quiz
                          </a>
                        </li>
                        <li>
                          <a
                            href="#interview"
                            onClick={() => setTocOpen(false)}
                            className="text-muted-foreground hover:text-foreground block"
                          >
                            Interview Questions
                          </a>
                        </li>
                      </ul>

                      <div className="pt-3 border-t border-border/50 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Estimated Time</span>
                          <span className="font-mono font-medium text-foreground">
                            {lesson.estimatedMinutes} mins
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Difficulty</span>
                          <DifficultyBadge difficulty={lesson.difficulty} />
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>

                <Sheet open={notesOpen} onOpenChange={setNotesOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 px-2.5">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                      <span>Notes</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="bottom"
                    className="max-h-[85vh] overflow-y-auto rounded-t-xl p-4"
                  >
                    <SheetHeader className="pb-3 border-b border-border/50 mb-3">
                      <SheetTitle className="text-sm font-semibold">
                        Lesson Notes & Resources
                      </SheetTitle>
                    </SheetHeader>
                    <div className="space-y-4">
                      <LessonNotesWidget lessonId={lesson.id} lessonTitle={lesson.title} />

                      {lesson.resources.length > 0 && (
                        <Card className="border-border/60">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-semibold">
                              Resources & Docs
                            </CardTitle>
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
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* Learning Journey Stepper Indicator */}
            <div className="overflow-x-auto scrollbar-none rounded-xl border border-border/50 bg-card/50 p-1.5 max-w-full">
              <div className="flex items-center justify-between min-w-[580px] gap-1 text-xs">
                {PHASES.map((p, idx) => {
                  const Icon = p.icon;
                  const isCurrent = activePhase === p.id;
                  const isPast = idx < currentPhaseIndex;

                  return (
                    <button
                      key={p.id}
                      onClick={() => scrollToPhase(p.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all font-mono whitespace-nowrap text-xs select-none cursor-pointer ${
                        isCurrent
                          ? "bg-primary text-primary-foreground font-bold shadow-xs ring-1 ring-primary/50"
                          : isPast
                            ? "bg-emerald-500/10 text-emerald-400 font-medium hover:bg-emerald-500/20 border border-emerald-500/20"
                            : "text-muted-foreground/80 hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      {isPast ? (
                        <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                      ) : (
                        <span className="text-[10px] opacity-70 font-bold">{p.number}</span>
                      )}
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Header & Metadata Briefing */}
            <div className="space-y-3 pt-1">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs bg-muted/30">
                    Lesson {currentIndex >= 0 ? currentIndex + 1 : 1} of {totalActiveLessons}
                  </Badge>
                  {isCurriculumMode ? (
                    <Badge
                      variant="secondary"
                      className="gap-1 bg-primary/15 text-primary border-primary/20 text-xs font-mono font-medium"
                    >
                      <Sparkles className="h-3 w-3" /> Full Curriculum
                    </Badge>
                  ) : parentModule ? (
                    <Badge
                      variant="secondary"
                      className="gap-1 bg-muted/50 text-foreground/80 border-border text-xs font-medium"
                    >
                      <BookOpen className="h-3 w-3 text-primary" /> {parentModule.title}
                    </Badge>
                  ) : null}
                  <DifficultyBadge difficulty={lesson.difficulty} />
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Clock className="h-3 w-3" />
                    {lesson.estimatedMinutes} mins
                  </Badge>
                  {isCompleted ? (
                    <Badge
                      variant="secondary"
                      className="gap-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs font-medium"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Completed
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="gap-1 bg-primary/10 text-primary border-primary/20 text-xs font-medium"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      In Progress
                    </Badge>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleBookmark}
                  className="h-8 text-xs gap-1.5 hover:bg-muted"
                  aria-label="Bookmark lesson"
                >
                  {isBookmarked ? (
                    <>
                      <BookmarkCheck className="h-4 w-4 text-primary fill-primary/20" />
                      <span className="text-primary font-medium">Bookmarked</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Bookmark</span>
                    </>
                  )}
                </Button>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground leading-tight">
                {lesson.title}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-prose">
                {lesson.description}
              </p>

              {/* Scannable Objectives & Prerequisites */}
              {((lesson.learningObjectives && lesson.learningObjectives.length > 0) ||
                (lesson.prerequisites && lesson.prerequisites.length > 0)) && (
                <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs space-y-3">
                  {lesson.learningObjectives && lesson.learningObjectives.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-primary uppercase text-[11px] tracking-wider font-mono">
                        <Target className="h-4 w-4" />
                        <span>What You Will Learn</span>
                      </div>
                      <ul className="grid gap-2 sm:grid-cols-2 text-foreground/90 font-medium">
                        {lesson.learningObjectives.map((obj, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <span>{obj}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {lesson.prerequisites && lesson.prerequisites.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-primary/15 text-xs">
                      <span className="font-semibold text-foreground/70 font-mono text-[11px] uppercase">
                        Prerequisites:
                      </span>
                      {lesson.prerequisites.map((prereq, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="text-[11px] bg-background/60 border-border/60"
                        >
                          {prereq}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* PHASE 02 — UNDERSTAND & PHASE 03 — SEE & TRY */}
          <section id="understand" className="space-y-6 pt-6 border-t border-border/40">
            <div id="see-try" />
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground uppercase tracking-wider pb-1">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="font-semibold text-foreground">
                02 & 03 · UNDERSTAND & EXPERIMENT
              </span>
            </div>

            {/* Text Highlighter Wrapper enabling drag-to-highlight */}
            <LessonTextHighlighter lessonId={lesson.id} onAddNoteFromText={handleAddNoteFromText}>
              <div className="space-y-5 text-[15px] sm:text-base leading-relaxed">
                {lesson.sections.map((s, i) => {
                  if (s.type === "heading")
                    return (
                      <h2
                        id={`h-${i}`}
                        key={i}
                        className="mt-8 text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 scroll-mt-20"
                      >
                        <span className="text-primary/70 text-sm font-mono font-normal">#</span>
                        {s.text}
                      </h2>
                    );
                  if (s.type === "paragraph")
                    return (
                      <p key={i} className="text-foreground/90 leading-relaxed max-w-prose">
                        {s.text}
                      </p>
                    );
                  if (s.type === "callout")
                    return (
                      <Callout key={i} variant={s.variant}>
                        {s.text}
                      </Callout>
                    );
                  if (s.type === "code") {
                    const exampleId = "id" in s && s.id ? (s.id as string) : `example-${i}`;
                    return (
                      <div
                        key={i}
                        className="my-4 rounded-xl border border-border/70 bg-card/60 p-2 space-y-2 shadow-2xs"
                      >
                        <div className="flex items-center gap-1.5 px-2 pt-1 text-xs font-mono text-muted-foreground">
                          <Terminal className="h-3.5 w-3.5 text-primary" />
                          <span className="font-semibold text-foreground/80 uppercase text-[10px] tracking-wider">
                            03 · SEE & TRY
                          </span>
                          <span>·</span>
                          <span>Interactive Code Example</span>
                        </div>
                        <LessonInteractiveCode
                          lessonId={lesson.id}
                          exampleId={exampleId}
                          language={s.language}
                          code={s.code}
                          title={"title" in s ? s.title : undefined}
                          highlightLines={"highlightLines" in s ? s.highlightLines : []}
                          runtime={"runtime" in s && s.runtime ? s.runtime : lesson.runtime}
                        />
                      </div>
                    );
                  }
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
                      <div
                        key={i}
                        className="my-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2"
                      >
                        <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400">
                          <CheckSquare className="h-3.5 w-3.5" />
                          <span className="font-semibold uppercase text-[10px] tracking-wider">
                            04 · CHECK
                          </span>
                          <span>·</span>
                          <span>Quick Checkpoint</span>
                        </div>
                        <LessonCheckpoints
                          lessonId={lesson.id}
                          checkpoints={[
                            { id: s.id, label: s.label, hint: s.hint, assessment: s.assessment },
                          ]}
                        />
                      </div>
                    );
                  if (s.type === "interactive-sandbox")
                    return (
                      <div
                        key={i}
                        className="my-6 rounded-xl border border-primary/30 bg-primary/5 p-2 space-y-2"
                      >
                        <div className="flex items-center gap-1.5 px-2 pt-1 text-xs font-mono text-primary">
                          <Terminal className="h-3.5 w-3.5" />
                          <span className="font-semibold uppercase text-[10px] tracking-wider">
                            03 · SEE & TRY
                          </span>
                          <span>·</span>
                          <span>Interactive Sandbox</span>
                        </div>
                        <LessonInlineSandbox
                          initialCode={s.initialCode}
                          title={s.title}
                          instructions={s.instructions}
                          lessonId={lesson.id}
                          sandboxId={s.id}
                          language={s.language}
                        />
                      </div>
                    );
                  return null;
                })}
              </div>
            </LessonTextHighlighter>
          </section>

          {/* PHASE 04 — CHECK */}
          {lesson.quiz && lesson.quiz.length > 0 && (
            <section id="check" className="space-y-4 pt-6 border-t border-border/40">
              <div id="quiz" />
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider">
                <CheckSquare className="h-4 w-4" />
                <span className="font-semibold text-foreground">04 · CHECK</span>
                <span className="opacity-40">·</span>
                <span>Check Your Understanding</span>
              </div>

              <div className="grid gap-4">
                {lesson.quiz.map((q) => {
                  const selectedIdx = selectedQuizAnswers[q.id];
                  const isAnswered = selectedIdx !== undefined;

                  return (
                    <Card key={q.id} className="border-border/60 bg-card/80">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm sm:text-base font-semibold leading-snug">
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
                                "border-emerald-500/60 bg-emerald-500/10 text-emerald-300 font-medium ring-1 ring-emerald-500/30";
                            } else if (isSelected && !isCorrect) {
                              btnStyle =
                                "border-rose-500/60 bg-rose-500/10 text-rose-300 font-medium ring-1 ring-rose-500/30";
                            } else {
                              btnStyle = "border-border/40 bg-muted/20 opacity-50";
                            }
                          }

                          return (
                            <button
                              key={i}
                              onClick={() => handleQuizSelect(q.id, i, q.correctIndex)}
                              className={`flex items-center justify-between rounded-lg border px-3.5 py-3 text-left text-xs sm:text-sm transition duration-150 min-h-[44px] cursor-pointer select-none ${btnStyle}`}
                            >
                              <span className="pr-2">{o}</span>
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
                          <div className="mt-3 rounded-lg border border-primary/25 bg-primary/5 p-3.5 text-xs sm:text-sm text-foreground/90 leading-relaxed">
                            <div className="font-semibold text-primary mb-1 flex items-center gap-1.5">
                              <HelpCircle className="h-4 w-4" />
                              <span>Explanation:</span>
                            </div>
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

          {/* PHASE 05 — APPLY */}
          {lesson.exercises && lesson.exercises.length > 0 && (
            <section id="apply" className="space-y-4 pt-6 border-t border-border/40">
              <div id="exercises" />
              <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider">
                <Zap className="h-4 w-4" />
                <span className="font-semibold text-foreground">05 · APPLY</span>
                <span className="opacity-40">·</span>
                <span>Apply Your Skills</span>
              </div>

              <div className="grid gap-3">
                {lesson.exercises.map((ex) => {
                  const cta = getApplyActivityCta(ex, lesson);
                  return (
                    <Card
                      key={ex.id}
                      className="border-border/60 bg-card/80 hover:border-primary/40 transition shadow-2xs"
                    >
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="font-bold text-sm sm:text-base text-foreground">
                              {ex.title}
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                              {ex.brief}
                            </p>
                          </div>
                          {cta && (
                            <Button
                              asChild={Boolean(cta.to || cta.href)}
                              size="default"
                              className="text-xs font-semibold shrink-0 gap-1.5 shadow-glow"
                            >
                              {cta.isExternal && cta.href ? (
                                <a href={cta.href} target="_blank" rel="noopener noreferrer">
                                  {cta.label} <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              ) : cta.to ? (
                                <Link to={cta.to}>
                                  {cta.label}{" "}
                                  {cta.actionType === "playground" ? (
                                    <Code2 className="h-3.5 w-3.5" />
                                  ) : cta.actionType === "quiz" ? (
                                    <HelpCircle className="h-3.5 w-3.5" />
                                  ) : cta.actionType === "debug-lab" ? (
                                    <BugIcon className="h-3.5 w-3.5" />
                                  ) : (
                                    <ArrowRight className="h-3.5 w-3.5" />
                                  )}
                                </Link>
                              ) : (
                                <span>{cta.label}</span>
                              )}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          {/* PHASE 06 — MASTER */}
          <section id="master" className="space-y-6 pt-6 border-t border-border/40">
            <div id="interview" />
            <div className="flex items-center gap-2 text-xs font-mono text-purple-400 uppercase tracking-wider">
              <BrainCircuit className="h-4 w-4 text-purple-400" />
              <span className="font-semibold text-foreground">06 · MASTER</span>
              <span className="opacity-40">·</span>
              <span>Recall & Key Takeaway</span>
            </div>

            {/* Key Takeaway Summary */}
            <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-5 space-y-3 shadow-2xs">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-purple-400 font-mono">
                <Award className="h-4 w-4" />
                <span>Key Takeaway</span>
              </div>
              <p className="text-sm sm:text-base text-foreground/90 leading-relaxed font-medium">
                {lesson.summary}
              </p>
            </div>

            {/* Interview Recall Questions */}
            {lesson.interviewQuestions && lesson.interviewQuestions.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-muted-foreground font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                  <span>
                    Interview Recall — Can you explain these without looking at your notes?
                  </span>
                </div>
                <ul className="grid gap-2.5">
                  {lesson.interviewQuestions.map((q, i) => (
                    <li
                      key={i}
                      className="rounded-xl border border-border/60 bg-muted/30 p-4 text-xs sm:text-sm leading-relaxed font-medium text-foreground/90 flex items-start gap-3"
                    >
                      <Badge
                        variant="outline"
                        className="font-mono text-xs bg-purple-500/10 text-purple-300 border-purple-500/20 shrink-0 mt-0.5"
                      >
                        Q{i + 1}
                      </Badge>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* PHASE 07 — CONTINUE */}
          <section id="continue" className="space-y-6 pt-6 border-t border-border/40">
            <div className="flex items-center gap-2 text-xs font-mono text-primary uppercase tracking-wider">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span className="font-semibold text-foreground">07 · CONTINUE</span>
              <span className="opacity-40">·</span>
              <span>Completion & Next Action</span>
            </div>

            {/* BLOCK A: LESSON COMPLETION STATE */}
            <Card className="border-border/70 bg-gradient-to-br from-card via-card/90 to-muted/30 p-5 sm:p-6 shadow-elegant">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div className="space-y-1 max-w-xl">
                  <div className="text-[11px] font-mono font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Completion Status</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-foreground">
                    {isCompleted ? "Lesson Completed!" : "Ready to complete this lesson?"}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {isCompleted
                      ? "Congratulations on completing this lesson! Follow the recommended next step below to reinforce your knowledge."
                      : "Mark this lesson complete to update your progress streak and keep track of your learning achievements."}
                  </p>
                </div>

                <Button
                  onClick={handleComplete}
                  variant={isCompleted ? "outline" : "default"}
                  size="lg"
                  className={`shrink-0 text-sm font-semibold gap-2 ${
                    isCompleted
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                      : "shadow-glow"
                  }`}
                >
                  {isCompleted ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>Completed</span>
                    </>
                  ) : (
                    <>
                      <span>Mark Complete</span>
                      <CheckCircle2 className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* BLOCK B: WHAT SHOULD YOU DO NOW? (NEXT ACTION HIERARCHY) */}
            <div className="space-y-4 pt-2">
              <div className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                What should you do now?
              </div>

              {/* PRIMARY CTA: Start Next Lesson (Featured Dominant Card) */}
              {nextLesson ? (
                <Card className="border-primary/50 bg-primary/10 p-5 sm:p-6 hover:border-primary transition shadow-glow">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="bg-primary/20 text-primary border-primary/30 text-[10px] font-mono font-bold uppercase"
                        >
                          {isCurriculumMode ? "Curriculum Step" : "Primary Recommended Step"}
                        </Badge>
                        <span className="text-xs font-mono text-muted-foreground">
                          Step {currentIndex + 2} of {totalActiveLessons}
                        </span>
                      </div>
                      <h4 className="text-base sm:text-lg font-bold text-foreground">
                        Next Lesson: {nextLesson.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2 max-w-xl">
                        {nextLesson.description}
                      </p>
                    </div>

                    <Button
                      asChild
                      size="lg"
                      className="shrink-0 text-sm font-bold gap-2 shadow-glow w-full sm:w-auto"
                    >
                      <Link
                        to="/lesson/$lessonId"
                        params={{ lessonId: nextLesson.id }}
                        search={{ mode: currentMode }}
                      >
                        <span>Start Next Lesson</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              ) : isCurriculumMode ? (
                isSequenceFullyCompleted ? (
                  <Card className="border-emerald-500/40 bg-emerald-500/10 p-5 sm:p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] font-mono font-bold uppercase"
                          >
                            Curriculum Complete
                          </Badge>
                          <span className="text-xs font-mono text-emerald-400">
                            100% Curriculum Progress ({completedActiveLessonsCount}/
                            {totalActiveLessons} Lessons)
                          </span>
                        </div>
                        <h4 className="text-base sm:text-lg font-bold text-foreground">
                          Curriculum Complete: {completedActiveLessonsCount} / {totalActiveLessons}{" "}
                          Lessons Mastered
                        </h4>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Congratulations! You have completed the full Forge curriculum across all
                          27 modules. You have achieved comprehensive frontend engineering mastery.
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
                        <Button
                          asChild
                          variant="default"
                          size="default"
                          className="font-semibold gap-1.5 w-full sm:w-auto"
                        >
                          <Link to="/learn">
                            <RotateCcw className="h-4 w-4" />
                            <span>Curriculum Overview</span>
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="outline"
                          size="default"
                          className="font-semibold gap-1.5 w-full sm:w-auto"
                        >
                          <Link to="/progress">
                            <span>View Mastery</span>
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card className="border-primary/40 bg-card/60 p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono font-bold uppercase text-primary border-primary/30"
                          >
                            Final Curriculum Lesson
                          </Badge>
                          <span className="text-xs font-mono text-muted-foreground">
                            {completedActiveLessonsCount} of {totalActiveLessons} completed
                          </span>
                        </div>
                        <h4 className="text-base sm:text-lg font-bold text-foreground">
                          Complete this lesson to master the Forge curriculum
                        </h4>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Mark this final lesson complete to finish the entire {totalActiveLessons}
                          -lesson curriculum.
                        </p>
                      </div>
                      <Button
                        asChild
                        variant="outline"
                        size="default"
                        className="shrink-0 font-semibold gap-2 w-full sm:w-auto"
                      >
                        <Link to="/learn">
                          <span>Curriculum Overview</span>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </Card>
                )
              ) : isModuleFullyCompleted ? (
                <Card className="border-emerald-500/40 bg-emerald-500/10 p-5 sm:p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] font-mono font-bold uppercase"
                        >
                          Course Complete
                        </Badge>
                        <span className="text-xs font-mono text-emerald-400">
                          100% Module Progress ({completedModuleLessonsCount}/{totalActiveLessons}{" "}
                          Lessons)
                        </span>
                      </div>
                      <h4 className="text-base sm:text-lg font-bold text-foreground">
                        Module Complete: {parentModule?.title || "Curriculum Course"}
                      </h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Congratulations! You have completed all lessons in this course. You can
                        review the course overview or explore additional curriculum tracks.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
                      {parentModule && (
                        <Button
                          asChild
                          variant="default"
                          size="default"
                          className="font-semibold gap-1.5 w-full sm:w-auto"
                        >
                          <Link
                            to="/learn/modules/$moduleId"
                            params={{ moduleId: parentModule.id }}
                          >
                            <RotateCcw className="h-4 w-4" />
                            <span>Back to {parentModule.title}</span>
                          </Link>
                        </Button>
                      )}
                      <Button
                        asChild
                        variant="outline"
                        size="default"
                        className="font-semibold gap-1.5 w-full sm:w-auto"
                      >
                        <Link to="/learn/modules">
                          <span>Explore All Modules</span>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="border-primary/40 bg-card/60 p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono font-bold uppercase text-primary border-primary/30"
                        >
                          Final Module Lesson
                        </Badge>
                        <span className="text-xs font-mono text-muted-foreground">
                          {completedModuleLessonsCount} of {totalActiveLessons} completed
                        </span>
                      </div>
                      <h4 className="text-base sm:text-lg font-bold text-foreground">
                        Complete this lesson to finish the module
                      </h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Mark this final lesson complete to master{" "}
                        {parentModule?.title || "this course"} and unlock full module completion.
                      </p>
                    </div>
                    {parentModule && (
                      <Button
                        asChild
                        variant="outline"
                        size="default"
                        className="shrink-0 font-semibold gap-2 w-full sm:w-auto"
                      >
                        <Link to="/learn/modules/$moduleId" params={{ moduleId: parentModule.id }}>
                          <span>Module Overview</span>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </Card>
              )}

              {/* SECONDARY & TERTIARY ACTIONS GRID */}
              <div className="grid gap-3 sm:grid-cols-2">
                {/* SECONDARY: Practice Topic Quiz */}
                {matchingQuiz && (
                  <Card className="border-border/60 bg-card/60 hover:border-primary/40 transition">
                    <CardContent className="p-4 sm:p-5 flex flex-col justify-between space-y-3 h-full">
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-primary uppercase font-semibold">
                          <HelpCircle className="h-3.5 w-3.5" />
                          <span>Secondary Action</span>
                        </div>
                        <div className="text-sm font-bold mt-1 text-foreground">
                          Practice This Concept
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          Take the topic quiz to test your memory and solidify key concepts.
                        </p>
                      </div>
                      <Button
                        asChild
                        size="sm"
                        variant="secondary"
                        className="w-full text-xs font-semibold gap-1.5"
                      >
                        <Link to="/quizzes/$quizId" params={{ quizId: matchingQuiz.id }}>
                          <span>Practice Concept</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* TERTIARY: Fix a Bug in Debug Lab */}
                {matchingBug && (
                  <Card className="border-border/60 bg-card/60 hover:border-rose-500/40 transition">
                    <CardContent className="p-4 sm:p-5 flex flex-col justify-between space-y-3 h-full">
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-rose-400 uppercase font-semibold">
                          <BugIcon className="h-3.5 w-3.5" />
                          <span>Tertiary Action</span>
                        </div>
                        <div className="text-sm font-bold mt-1 text-foreground">
                          Fix a Bug in Debug Lab
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          Solve a hands-on debugging challenge tailored to this topic.
                        </p>
                      </div>
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="w-full text-xs border-rose-500/30 text-rose-400 hover:bg-rose-500/10 font-semibold gap-1.5"
                      >
                        <Link to="/debug-lab/$bugId" params={{ bugId: matchingBug.id }}>
                          <BugIcon className="h-3.5 w-3.5" />
                          <span>Fix a Bug</span>
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* SUBORDINATE BACK / PREVIOUS LESSON NAVIGATION */}
              <nav
                aria-label="Lesson navigation"
                className="flex items-center justify-between gap-4 pt-4 border-t border-border/30 text-xs"
              >
                {prevLesson ? (
                  <Button
                    variant="ghost"
                    asChild
                    size="sm"
                    className="text-muted-foreground hover:text-foreground text-xs gap-1.5 max-w-[240px]"
                  >
                    <Link
                      to="/lesson/$lessonId"
                      params={{ lessonId: prevLesson.id }}
                      search={{ mode: currentMode }}
                      className="truncate"
                    >
                      <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">Previous: {prevLesson.title}</span>
                    </Link>
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    asChild
                    size="sm"
                    className="text-muted-foreground hover:text-foreground text-xs gap-1.5"
                  >
                    <Link to="/learn/lessons" search={{}}>
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>All Lessons Library</span>
                    </Link>
                  </Button>
                )}

                {prevLesson && (
                  <Button
                    variant="ghost"
                    asChild
                    size="sm"
                    className="text-muted-foreground hover:text-foreground text-xs gap-1.5"
                  >
                    <Link to="/learn/lessons" search={{}}>
                      <span>All Lessons</span>
                    </Link>
                  </Button>
                )}
              </nav>
            </div>
          </section>
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
