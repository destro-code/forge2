import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, HelpCircle, LockKeyhole, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Callout } from "@/components/shared/callout";
import { LessonDiagram } from "@/components/lesson/lesson-diagram";
import { LessonInteractiveCode } from "@/components/lesson/lesson-interactive-code";
import { LessonWalkthrough } from "@/components/lesson/lesson-walkthrough";
import { LessonCollapsible } from "@/components/lesson/lesson-collapsible";
import { LessonCheckpoints } from "@/components/lesson/lesson-checkpoints";
import { LessonInlineSandbox } from "@/components/lesson/lesson-inline-sandbox";
import { getApplyActivityCta } from "@/lib/utils/apply-action";
import { useProgressStore } from "@/lib/stores/use-progress-store";
import type { Lesson, LessonSection } from "@/lib/types";

interface LessonPlayerProps {
  lesson: Lesson;
  isCompleted: boolean;
  onComplete: () => void;
  prevLessonId?: string | null;
  nextLessonId?: string | null;
}

type PlayerStep =
  | { kind: "section"; section: LessonSection }
  | { kind: "quiz"; index: number }
  | { kind: "exercise"; index: number }
  | { kind: "master" }
  | { kind: "continue" };

type ValidationAwareSection = LessonSection & {
  validation?: { exerciseId?: string };
};

type ExerciseWithId = Lesson["exercises"][number] & { id?: string };

function stepLabel(step: PlayerStep) {
  if (step.kind === "section") return step.section.type === "heading" ? "Learn" : "Understand";
  if (step.kind === "quiz") return "Check";
  if (step.kind === "exercise") return "Apply";
  if (step.kind === "master") return "Master";
  return "Finish";
}

export function LessonPlayer({ lesson, isCompleted, onComplete, prevLessonId, nextLessonId }: LessonPlayerProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const playgroundCompletions = useProgressStore((state) => state.playgroundCompletions ?? []);
  const lessonCheckpoints = useProgressStore((state) => state.lessonCheckpoints ?? {});

  const steps = useMemo<PlayerStep[]>(() => [
    ...lesson.sections.map((section) => ({ kind: "section" as const, section })),
    ...lesson.quiz.map((_, index) => ({ kind: "quiz" as const, index })),
    ...lesson.exercises.map((_, index) => ({ kind: "exercise" as const, index })),
    { kind: "master" as const },
    { kind: "continue" as const },
  ], [lesson]);

  const current = steps[stepIndex] ?? steps[steps.length - 1];
  const progress = steps.length <= 1 ? 100 : Math.round(((stepIndex + 1) / steps.length) * 100);
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  const currentGate = useMemo(() => {
    if (!current) return { blocked: false, reason: "" };

    if (current.kind === "quiz") {
      const question = lesson.quiz[current.index];
      const selected = quizAnswers[question.id];
      if (selected === undefined) {
        return { blocked: true, reason: "Answer the question correctly to continue." };
      }
      if (selected !== question.correctIndex) {
        return { blocked: true, reason: "Choose the correct answer to continue." };
      }
      return { blocked: false, reason: "" };
    }

    if (current.kind === "section" && current.section.type === "checkpoint") {
      const key = `${lesson.id}:${current.section.id}`;
      const assessment = current.section.assessment;
      if (assessment?.type === "sandbox-completion") {
        const sandboxId = `${lesson.id}:${assessment.sandboxId}`;
        if (!playgroundCompletions.some((completion) => completion.templateId === sandboxId)) {
          return { blocked: true, reason: "Complete the sandbox checkpoint to continue." };
        }
      } else if (!lessonCheckpoints[key]) {
        return { blocked: true, reason: "Complete the checkpoint to continue." };
      }
      return { blocked: false, reason: "" };
    }

    if (current.kind === "section" && current.section.type === "interactive-sandbox") {
      const validationExerciseId = (current.section as ValidationAwareSection).validation?.exerciseId;
      if (validationExerciseId && !playgroundCompletions.some((completion) => completion.templateId === validationExerciseId)) {
        return { blocked: true, reason: "Pass the exercise in the Playground to continue." };
      }
    }

    if (current.kind === "exercise") {
      const exercise = lesson.exercises[current.index] as ExerciseWithId;
      const exerciseId = exercise.id;
      if (exerciseId && !playgroundCompletions.some((completion) => completion.templateId === exerciseId)) {
        return { blocked: true, reason: "Complete this activity to continue." };
      }
    }

    return { blocked: false, reason: "" };
  }, [current, lesson.id, lesson.quiz, lesson.exercises, quizAnswers, playgroundCompletions, lessonCheckpoints]);

  const goNext = () => {
    if (currentGate.blocked || isLast) return;
    setStepIndex((value) => Math.min(value + 1, steps.length - 1));
  };

  const renderSection = (section: LessonSection) => {
    switch (section.type) {
      case "heading":
        return <div className="space-y-4"><Badge variant="outline" className="text-xs font-mono">CONCEPT</Badge><h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">{section.text}</h2></div>;
      case "paragraph":
        return <p className="text-base sm:text-lg leading-8 text-foreground/90 max-w-3xl">{section.text}</p>;
      case "callout":
        return <Callout variant={section.variant}>{section.text}</Callout>;
      case "code":
        return <div className="w-full space-y-4"><LessonInteractiveCode lessonId={lesson.id} exampleId={`example-${section.code.slice(0, 12)}`} language={section.language} code={section.code} title={section.title} highlightLines={section.highlightLines || []} runtime={section.runtime || lesson.runtime} /></div>;
      case "diagram":
        return <LessonDiagram diagramType={section.diagramType} title={section.title} description={section.description} />;
      case "walkthrough":
        return <LessonWalkthrough title={section.title} steps={section.steps} />;
      case "collapsible":
        return <LessonCollapsible title={section.title} subtitle={section.subtitle} content={section.content} variant={section.variant} />;
      case "checkpoint":
        return <div className="space-y-4 w-full"><Badge variant="outline" className="text-emerald-400 border-emerald-500/30">QUICK CHECK</Badge><h2 className="text-2xl font-bold">{section.label}</h2><LessonCheckpoints lessonId={lesson.id} checkpoints={[{ id: section.id, label: section.label, hint: section.hint, assessment: section.assessment }]} /></div>;
      case "interactive-sandbox":
        return <div className="w-full"><LessonInlineSandbox initialCode={section.initialCode} title={section.title} instructions={section.instructions} lessonId={lesson.id} sandboxId={section.id} language={section.language} /></div>;
      case "inline-quiz":
        return <Card className="max-w-3xl"><CardContent className="p-6"><p className="text-sm text-muted-foreground">Continue to the quiz step to check your understanding.</p></CardContent></Card>;
    }
  };

  const renderCurrent = () => {
    if (current.kind === "section") return renderSection(current.section);

    if (current.kind === "quiz") {
      const question = lesson.quiz[current.index];
      const selected = quizAnswers[question.id];
      const answered = selected !== undefined;
      return <Card className="w-full max-w-3xl border-border/60 bg-card/80"><CardHeader className="pb-4"><Badge variant="outline" className="w-fit text-emerald-400 border-emerald-500/30">CHECK · {current.index + 1}/{lesson.quiz.length}</Badge><CardTitle className="text-xl sm:text-2xl leading-snug">{question.question}</CardTitle></CardHeader><CardContent className="grid gap-3">{question.options.map((option, index) => { const correct = index === question.correctIndex; const selectedWrong = answered && selected === index && !correct; const style = !answered ? "border-border/60 hover:border-primary/50 hover:bg-accent" : correct ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300" : selectedWrong ? "border-rose-500/60 bg-rose-500/10 text-rose-300" : "border-border/40 opacity-50"; return <button key={index} onClick={() => setQuizAnswers((prev) => ({ ...prev, [question.id]: index }))} className={`flex items-center justify-between rounded-xl border px-4 py-4 text-left text-sm transition ${style}`}><span>{option}</span>{answered && correct && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />}</button>; })}{answered && question.explanation && <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm leading-relaxed"><div className="font-semibold text-primary mb-1 flex items-center gap-2"><HelpCircle className="h-4 w-4" />Explanation</div>{question.explanation}</div>}</CardContent></Card>;
    }

    if (current.kind === "exercise") {
      const exercise = lesson.exercises[current.index];
      const cta = getApplyActivityCta(exercise, lesson);
      return <Card className="w-full max-w-3xl border-amber-500/25 bg-amber-500/[0.03]"><CardHeader><Badge variant="outline" className="w-fit text-amber-400 border-amber-500/30">APPLY · {current.index + 1}/{lesson.exercises.length}</Badge><CardTitle className="text-2xl sm:text-3xl">{exercise.title}</CardTitle><p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{exercise.brief}</p></CardHeader><CardContent>{cta?.to ? <Button asChild size="lg" className="gap-2 shadow-glow"><Link to={cta.to}>{cta.label}<ArrowRight className="h-4 w-4" /></Link></Button> : cta?.href ? <Button asChild size="lg" className="gap-2 shadow-glow"><a href={cta.href} target="_blank" rel="noopener noreferrer">{cta.label}<ArrowRight className="h-4 w-4" /></a></Button> : null}</CardContent></Card>;
    }

    if (current.kind === "master") return <div className="w-full max-w-3xl space-y-6"><Badge variant="outline" className="text-purple-400 border-purple-500/30">MASTER</Badge><h2 className="text-3xl sm:text-4xl font-extrabold">Can you explain it without looking?</h2><div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-6"><div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-purple-400 mb-3"><Sparkles className="h-4 w-4" />Key takeaway</div><p className="text-base sm:text-lg leading-8">{lesson.summary}</p></div>{lesson.interviewQuestions.length > 0 && <div className="space-y-3">{lesson.interviewQuestions.map((question, index) => <div key={index} className="rounded-xl border border-border/60 bg-muted/20 p-4 flex gap-3 text-sm leading-relaxed"><Badge variant="outline" className="shrink-0">Q{index + 1}</Badge><span>{question}</span></div>)}</div>}</div>;

    return <Card className="w-full max-w-3xl border-emerald-500/25 bg-emerald-500/[0.03]"><CardContent className="p-6 sm:p-8 space-y-5"><Badge className="w-fit gap-1"><Check className="h-3.5 w-3.5" />COMPLETE</Badge><h2 className="text-3xl sm:text-4xl font-extrabold">You're done with this lesson.</h2><p className="text-muted-foreground leading-relaxed">Take a moment to lock in what you learned, then continue to the next lesson.</p><div className="flex flex-wrap gap-3">{!isCompleted && <Button onClick={onComplete} size="lg" className="gap-2 shadow-glow"><CheckCircle2 className="h-4 w-4" />Mark lesson complete</Button>}{nextLessonId && <Button asChild size="lg" variant={isCompleted ? "default" : "outline"} className="gap-2"><Link to="/lesson/$lessonId" params={{ lessonId: nextLessonId }}>Next lesson<ArrowRight className="h-4 w-4" /></Link></Button>}</div></CardContent></Card>;
  };

  return <div className="min-h-[calc(100vh-7rem)] flex flex-col"><div className="sticky top-0 z-20 -mx-3 sm:-mx-6 px-3 sm:px-6 py-3 border-b border-border/50 bg-background/90 backdrop-blur-xl"><div className="mx-auto max-w-5xl space-y-2"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2 text-xs text-muted-foreground font-mono"><BookOpen className="h-3.5 w-3.5 text-primary" /><span className="truncate">{lesson.title}</span></div><div className="text-[11px] text-muted-foreground mt-0.5">Step {stepIndex + 1} of {steps.length} · {stepLabel(current)}</div></div><div className="text-xs font-mono font-semibold text-primary">{progress}%</div></div><div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} /></div></div></div><main className="flex-1 flex items-center justify-center py-8 sm:py-12"><div className="w-full max-w-5xl flex justify-center"><div key={`${stepIndex}-${current.kind}`} className="w-full animate-in fade-in slide-in-from-right-2 duration-200">{renderCurrent()}</div></div></main><footer className="sticky bottom-0 z-20 -mx-3 sm:-mx-6 px-3 sm:px-6 py-3 border-t border-border/50 bg-background/90 backdrop-blur-xl"><div className="mx-auto max-w-5xl flex items-center justify-between gap-3">{isFirst ? prevLessonId ? <Button asChild variant="ghost" className="gap-2"><Link to="/lesson/$lessonId" params={{ lessonId: prevLessonId }}><ArrowLeft className="h-4 w-4" />Previous lesson</Link></Button> : <div /> : <Button variant="ghost" onClick={() => setStepIndex((value) => Math.max(value - 1, 0))} className="gap-2"> <ArrowLeft className="h-4 w-4" />Back</Button>}{!isLast && <div className="flex flex-col items-end gap-1.5"><Button onClick={goNext} disabled={currentGate.blocked} size="lg" className="gap-2 min-w-28 shadow-glow"><span>{currentGate.blocked ? "Locked" : "Next"}</span>{currentGate.blocked ? <LockKeyhole className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}</Button>{currentGate.blocked && <span className="text-[11px] text-muted-foreground text-right max-w-[260px]">{currentGate.reason}</span>}</div>}</div></footer></div>;
}
