import { useState, useRef, useEffect, useMemo } from "react";
import type {
  Lesson,
  LessonStep,
  ContentLessonStep,
  CodeExampleLessonStep,
  InteractiveExerciseLessonStep,
  QuizLessonStep,
  CheckpointLessonStep,
} from "@/lib/types";
import { buildLessonSteps } from "@/lib/utils/lesson-step-resolver";
import { useProgressStore } from "@/lib/stores/use-progress-store";
import { useProgress } from "@/lib/hooks/use-progress";
import { usePlaygroundStore } from "@/lib/stores/use-playground-store";
import { EmbeddedPlayground } from "@/components/playground/embedded-playground";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Callout } from "@/components/shared/callout";
import { CodeBlock } from "@/components/shared/code-block";
import { LessonDiagram } from "@/components/lesson/lesson-diagram";
import { LessonWalkthrough } from "@/components/lesson/lesson-walkthrough";
import { LessonCollapsible } from "@/components/lesson/lesson-collapsible";
import {
  MultipleChoiceExerciseView,
  PredictionExerciseView,
  RevealExerciseView,
  CompactCodeChallengeView,
} from "./exercise-renderers";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Code2,
  Terminal,
  HelpCircle,
  CheckSquare,
  Check,
  X,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface LessonPlayerProps {
  lesson: Lesson;
  onComplete?: () => void;
  initialStepIndex?: number;
  className?: string;
}

const STEP_TYPE_META: Record<
  LessonStep["type"],
  { label: string; icon: typeof BookOpen; color: string }
> = {
  content: {
    label: "Concept",
    icon: BookOpen,
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  "code-example": {
    label: "Code Example",
    icon: Code2,
    color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  },
  "interactive-exercise": {
    label: "Interactive Exercise",
    icon: Terminal,
    color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  quiz: {
    label: "Knowledge Check",
    icon: HelpCircle,
    color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
  checkpoint: {
    label: "Checkpoint",
    icon: CheckSquare,
    color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  },
};

const EMPTY_ARRAY: never[] = [];
const EMPTY_OBJECT: Record<string, unknown> = {};

export function LessonPlayer({
  lesson,
  onComplete,
  initialStepIndex,
  className,
}: LessonPlayerProps) {
  const steps = useMemo(() => buildLessonSteps(lesson), [lesson]);
  const rawPlaygroundCompletions = useProgressStore((state) => state.playgroundCompletions);
  const rawLessonsCompleted = useProgressStore((state) => state.lessonsCompleted);
  const rawLessonCheckpoints = useProgressStore((state) => state.lessonCheckpoints);

  const playgroundCompletions = rawPlaygroundCompletions ?? EMPTY_ARRAY;
  const lessonsCompleted = rawLessonsCompleted ?? EMPTY_ARRAY;
  const lessonCheckpoints = rawLessonCheckpoints ?? EMPTY_OBJECT;
  const validationReport = usePlaygroundStore((state) => state.validationReport);
  const { completeLesson } = useProgress();

  // Derive initial step index safely using resume logic
  const derivedInitialIndex = useMemo(() => {
    if (typeof initialStepIndex === "number") {
      if (initialStepIndex < 0) return 0;
      if (initialStepIndex >= steps.length) return Math.max(0, steps.length - 1);
      return initialStepIndex;
    }

    // Try session storage first for active session persistence
    if (typeof window !== "undefined" && window.sessionStorage) {
      const saved = window.sessionStorage.getItem(`forge:lesson_step:${lesson.id}`);
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed < steps.length) {
          return parsed;
        }
      }
    }

    // Always start at step 0 for new lessons or lessons without a saved session
    return 0;
  }, [initialStepIndex, steps.length, lesson.id]);

  const [currentStepIndex, setCurrentStepIndex] = useState(derivedInitialIndex);

  // Sync step index when lesson changes
  useEffect(() => {
    setCurrentStepIndex(derivedInitialIndex);
  }, [derivedInitialIndex]);

  const contentRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const totalSteps = steps.length;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;
  const currentStep = steps[currentStepIndex] || null;

  // Sync active step to sessionStorage for safe session resume
  useEffect(() => {
    if (typeof window !== "undefined" && window.sessionStorage && lesson?.id) {
      window.sessionStorage.setItem(`forge:lesson_step:${lesson.id}`, String(currentStepIndex));
    }
  }, [lesson.id, currentStepIndex]);

  // Determine if Next button should be gated/disabled for interactive exercise
  const isNextDisabled = useMemo(() => {
    if (!currentStep || currentStep.type !== "interactive-exercise") return false;

    const exerciseStep = currentStep as InteractiveExerciseLessonStep;
    if (!exerciseStep.hasValidation || !exerciseStep.validation?.exerciseId) {
      return false; // Legacy exercise or no validation spec attached
    }

    const exerciseId = exerciseStep.validation.exerciseId;
    const isCompletedInStore = playgroundCompletions.some(
      (c) => c.templateId === exerciseId || c.templateId === exerciseStep.exerciseId,
    );
    const isPassedInReport =
      validationReport?.status === "passed" && validationReport?.exerciseId === exerciseId;

    return !isCompletedInStore && !isPassedInReport;
  }, [currentStep, playgroundCompletions, validationReport]);

  // Reset internal content scroll position and manage focus on step change
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
    if (headingRef.current) {
      headingRef.current.focus();
    }
  }, [currentStepIndex]);

  const handleNext = () => {
    if (isNextDisabled) return;
    if (!isLastStep) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      completeLesson(lesson.id);
      if (onComplete) {
        onComplete();
      }
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleStepSelect = (index: number) => {
    if (index >= 0 && index < totalSteps) {
      if (index > currentStepIndex && isNextDisabled) {
        return;
      }
      setCurrentStepIndex(index);
    }
  };

  // Determine button text & semantic label based on step type
  const nextButtonLabel = useMemo(() => {
    if (isLastStep) return "Complete";
    if (currentStep?.type === "quiz") return "Continue";
    return "Next";
  }, [isLastStep, currentStep?.type]);

  if (!currentStep) {
    return (
      <div className="p-8 text-center text-muted-foreground">No steps found for this lesson.</div>
    );
  }

  const meta = STEP_TYPE_META[currentStep.type];
  const StepIcon = meta.icon;

  return (
    <div
      className={cn(
        "flex flex-col h-full min-h-0 flex-1 overflow-hidden bg-background text-foreground rounded-xl border border-border/60 shadow-sm relative",
        className,
      )}
      data-testid="lesson-player-shell"
    >
      {/* Accessible Screen Reader Announcement for Step Changes */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Step {currentStepIndex + 1} of {totalSteps}: {currentStep.title || meta.label}
      </div>

      {/* Header Bar */}
      <header className="flex-shrink-0 border-b border-border/60 bg-card/70 backdrop-blur-sm px-3.5 py-2.5 md:px-5 md:py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Badge
              variant="outline"
              className={cn("shrink-0 gap-1 text-[11px] font-semibold py-0.5", meta.color)}
            >
              <StepIcon className="h-3 w-3" />
              {meta.label}
            </Badge>
            <span className="text-xs text-muted-foreground truncate font-medium hidden sm:inline">
              {lesson.title}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
            <span className="font-medium whitespace-nowrap text-[11px] sm:text-xs">
              Step {currentStepIndex + 1} of {totalSteps}
            </span>

            {/* Visual Step Indicator */}
            {totalSteps <= 10 ? (
              <div
                className="flex items-center gap-1 overflow-x-auto max-w-[140px] sm:max-w-[220px] py-1 no-scrollbar"
                role="tablist"
                aria-label="Lesson steps navigation"
              >
                {steps.map((st, idx) => {
                  const isCurrent = idx === currentStepIndex;
                  const isStepGated = idx > currentStepIndex && isNextDisabled;
                  const isPassed = idx < currentStepIndex;

                  return (
                    <button
                      key={st.id || idx}
                      type="button"
                      role="tab"
                      aria-selected={isCurrent}
                      disabled={isStepGated}
                      onClick={() => handleStepSelect(idx)}
                      title={`Step ${idx + 1}: ${st.title || st.type}${isStepGated ? " (Locked until exercise complete)" : ""}`}
                      className={cn(
                        "h-2 rounded-full transition-all shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
                        isCurrent
                          ? "w-5 bg-primary"
                          : isPassed
                            ? "w-2 bg-primary/60 hover:bg-primary/80 cursor-pointer"
                            : isStepGated
                              ? "w-2 bg-muted/40 cursor-not-allowed opacity-50"
                              : "w-2 bg-muted hover:bg-muted-foreground/40 cursor-pointer",
                      )}
                      aria-label={`Go to step ${idx + 1}: ${st.title || st.type}`}
                    />
                  );
                })}
              </div>
            ) : (
              <div
                className="w-16 sm:w-24 h-1.5 rounded-full bg-muted overflow-hidden shrink-0"
                title={`Progress: ${Math.round(((currentStepIndex + 1) / totalSteps) * 100)}%`}
                aria-hidden="true"
              >
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Internal Content Scroll Region */}
      <main
        ref={contentRef}
        tabIndex={-1}
        data-testid="lesson-player-content"
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3.5 sm:p-5 md:p-6 scrollbar-thin focus:outline-none"
      >
        <StepRenderer
          step={currentStep}
          lesson={lesson}
          headingRef={headingRef}
          onComplete={handleNext}
        />
      </main>

      {/* Footer Navigation Controls */}
      <footer className="flex-shrink-0 border-t border-border/60 bg-card/90 backdrop-blur-sm px-3.5 py-2.5 md:px-5 md:py-3 flex items-center justify-between gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
          disabled={isFirstStep}
          className="gap-1.5 text-xs h-8 sm:h-9 px-3"
          aria-label="Previous step"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back</span>
        </Button>

        <div className="text-xs font-medium text-muted-foreground truncate hidden sm:block max-w-[50%] text-center">
          {currentStep.title ? (
            <span>
              {currentStepIndex + 1}. {currentStep.title}
            </span>
          ) : (
            <span>
              Step {currentStepIndex + 1} of {totalSteps}
            </span>
          )}
        </div>

        <Button
          variant="default"
          size="sm"
          onClick={handleNext}
          disabled={isNextDisabled}
          aria-disabled={isNextDisabled}
          className={cn(
            "gap-1.5 text-xs h-8 sm:h-9 px-3.5 font-medium transition-all",
            isNextDisabled && "opacity-60 cursor-not-allowed",
          )}
          aria-label={isLastStep ? "Complete lesson" : `${nextButtonLabel} step`}
          title={isNextDisabled ? "Complete and validate the exercise to proceed" : undefined}
        >
          <span>{nextButtonLabel}</span>
          {isLastStep ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <ArrowRight className="h-3.5 w-3.5" />
          )}
        </Button>
      </footer>
    </div>
  );
}

export function formatStepTitle(title: string): string {
  if (!title) return "";
  return title.replace(/^(Interact|Exercise|Checkpoint):\s*/i, "").trim();
}

/** Modular Step Dispatcher */
function StepRenderer({
  step,
  lesson,
  headingRef,
  onComplete,
}: {
  step: LessonStep;
  lesson?: Lesson;
  headingRef?: React.RefObject<HTMLHeadingElement | null>;
  onComplete?: () => void;
}) {
  switch (step.type) {
    case "content":
      return <ContentStepView step={step} headingRef={headingRef} />;
    case "code-example":
      return <CodeExampleStepView step={step} headingRef={headingRef} />;
    case "interactive-exercise":
      return (
        <InteractiveExerciseStepView
          step={step}
          lesson={lesson}
          headingRef={headingRef}
          onComplete={onComplete}
        />
      );
    case "quiz":
      return <QuizStepView step={step} lesson={lesson} headingRef={headingRef} />;
    case "checkpoint":
      return <CheckpointStepView step={step} lesson={lesson} headingRef={headingRef} />;
    default:
      return <div className="text-muted-foreground">Unknown step type.</div>;
  }
}

/** 1. Content Step Renderer */
function ContentStepView({
  step,
  headingRef,
}: {
  step: ContentLessonStep;
  headingRef?: React.RefObject<HTMLHeadingElement | null>;
}) {
  const formattedTitle = formatStepTitle(step.title);

  return (
    <div className="space-y-4 md:space-y-5 max-w-3xl mx-auto py-1 sm:py-2">
      {formattedTitle && (
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-foreground/95 pb-2 border-b border-border/30 focus:outline-none"
        >
          {formattedTitle}
        </h2>
      )}
      {step.sections.map((section, idx) => {
        switch (section.type) {
          case "heading": {
            const isDuplicateHeading =
              section.text === step.title || formatStepTitle(section.text) === formattedTitle;

            if (isDuplicateHeading) {
              return null;
            }

            return (
              <h3
                key={section.id || idx}
                id={section.id}
                className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-foreground/95 pt-2 first:pt-0 pb-1 border-b border-border/30"
              >
                {section.text}
              </h3>
            );
          }
          case "paragraph":
            return (
              <p
                key={idx}
                className="text-foreground/90 leading-relaxed text-sm md:text-base font-normal"
              >
                {section.text}
              </p>
            );
          case "callout":
            return (
              <Callout key={idx} variant={section.variant || "info"}>
                {section.text}
              </Callout>
            );
          case "diagram":
            return section.diagram ? <LessonDiagram key={idx} config={section.diagram} /> : null;
          case "walkthrough":
            return section.walkthrough ? (
              <LessonWalkthrough key={idx} config={section.walkthrough} />
            ) : null;
          case "collapsible":
            return section.title && section.content ? (
              <LessonCollapsible key={idx} title={section.title} content={section.content} />
            ) : null;
          case "code":
          case "jsx":
          case "javascript": {
            const codeSec = section as LessonSection & {
              type: "code" | "jsx" | "javascript";
              code: string;
              title?: string;
              language?: string;
            };
            const codeLang =
              codeSec.language ||
              (section.type === "jsx"
                ? "jsx"
                : section.type === "javascript"
                  ? "javascript"
                  : "typescript");

            return (
              <div key={idx} className="space-y-2 my-3">
                {codeSec.title && (
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                    <Code2 className="h-4 w-4 shrink-0" />
                    <span>{codeSec.title}</span>
                  </div>
                )}
                <CodeBlock code={codeSec.code || ""} language={codeLang} />
              </div>
            );
          }
          default:
            return null;
        }
      })}
    </div>
  );
}

/** 2. Code Example Step Renderer */
function CodeExampleStepView({
  step,
  headingRef,
}: {
  step: CodeExampleLessonStep;
  headingRef?: React.RefObject<HTMLHeadingElement | null>;
}) {
  const formattedTitle = formatStepTitle(step.title);
  const showCodeTitle = step.codeTitle && formatStepTitle(step.codeTitle) !== formattedTitle;

  return (
    <div className="space-y-3 sm:space-y-4 max-w-3xl mx-auto py-1 sm:py-2">
      {formattedTitle && (
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-foreground/95 pb-2 border-b border-border/30 focus:outline-none"
        >
          {formattedTitle}
        </h2>
      )}
      {showCodeTitle && (
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
          <Code2 className="h-4 w-4 shrink-0" />
          <span>{step.codeTitle}</span>
        </div>
      )}
      <CodeBlock code={step.code} language={step.language} />
    </div>
  );
}

/** 3. Interactive Exercise Step Renderer */
function InteractiveExerciseStepView({
  step,
  lesson,
  headingRef,
  onComplete,
}: {
  step: InteractiveExerciseLessonStep;
  lesson?: Lesson;
  headingRef?: React.RefObject<HTMLHeadingElement | null>;
  onComplete?: () => void;
}) {
  const [forceFullIDE, setForceFullIDE] = useState(false);

  // If editor is not required, route to lightweight, specialized exercise renderer
  if (step.editorRequired === false) {
    if (step.mode === "multiple-choice") {
      return <MultipleChoiceExerciseView step={step} lesson={lesson} onComplete={onComplete} />;
    }

    if (step.mode === "prediction") {
      return <PredictionExerciseView step={step} lesson={lesson} onComplete={onComplete} />;
    }

    return <RevealExerciseView step={step} lesson={lesson} onComplete={onComplete} />;
  }

  // If exercise is a focused compact code drill and user has not expanded to full IDE
  if (step.challengeSize === "compact" && !forceFullIDE) {
    return (
      <CompactCodeChallengeView
        step={step}
        lesson={lesson}
        onComplete={onComplete}
        onExpandToFullPlayground={() => setForceFullIDE(true)}
      />
    );
  }

  // Full Code Editor Sandbox / Project / Debugger / Completion
  const formattedTitle = formatStepTitle(step.title);

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col h-full min-h-[440px]">
      {formattedTitle && (
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-foreground/95 pb-2 border-b border-border/30 mb-2 sm:mb-3 shrink-0 focus:outline-none"
        >
          {formattedTitle}
        </h2>
      )}

      {step.leadIn && (
        <div className="mb-3 sm:mb-4 space-y-2 text-foreground/90 text-sm md:text-base leading-relaxed bg-accent/30 dark:bg-accent/20 border border-border/50 rounded-lg p-3.5 sm:p-4 shrink-0">
          {step.leadIn.sections ? (
            step.leadIn.sections.map((sec, idx) => {
              if (sec.type === "heading") {
                const hTitle = formatStepTitle(sec.text);
                if (hTitle === formattedTitle) return null;
                return (
                  <div
                    key={idx}
                    className="font-semibold text-foreground text-sm sm:text-base pt-1 first:pt-0"
                  >
                    {sec.text}
                  </div>
                );
              }
              if (sec.type === "paragraph") {
                return (
                  <p key={idx} className="text-foreground/90 text-xs sm:text-sm leading-relaxed">
                    {sec.text}
                  </p>
                );
              }
              if (sec.type === "callout") {
                return (
                  <Callout key={idx} variant={sec.variant || "info"}>
                    {sec.text}
                  </Callout>
                );
              }
              return null;
            })
          ) : (
            <>
              {step.leadIn.title && formatStepTitle(step.leadIn.title) !== formattedTitle && (
                <div className="font-semibold text-foreground text-sm">
                  {formatStepTitle(step.leadIn.title)}
                </div>
              )}
              {step.leadIn.text && (
                <p className="text-foreground/90 text-xs sm:text-sm leading-relaxed">
                  {step.leadIn.text}
                </p>
              )}
            </>
          )}
        </div>
      )}

      <EmbeddedPlayground
        exerciseStep={step}
        lesson={lesson}
        lessonId={lesson?.id}
        className="flex-1 min-h-[440px]"
      />
    </div>
  );
}

/** 4. Quiz Step Renderer */
function QuizStepView({
  step,
  lesson,
  headingRef,
}: {
  step: QuizLessonStep;
  lesson?: Lesson;
  headingRef?: React.RefObject<HTMLHeadingElement | null>;
}) {
  const { saveQuizResult } = useProgress();
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [checkedState, setCheckedState] = useState<Record<string, boolean>>({});
  const formattedTitle = formatStepTitle(step.title);

  const handleSelectOption = (qId: string, optIdx: number) => {
    setUserAnswers((prev) => ({ ...prev, [qId]: optIdx }));
    setCheckedState((prev) => ({ ...prev, [qId]: false }));
  };

  const handleCheckAnswer = (qId: string) => {
    const nextCheckedState = { ...checkedState, [qId]: true };
    setCheckedState(nextCheckedState);

    if (step.questions.length > 0) {
      const allChecked = step.questions.every((q) => nextCheckedState[q.id]);
      if (allChecked) {
        let correctCount = 0;
        step.questions.forEach((q) => {
          const selected = userAnswers[q.id];
          if (
            selected !== undefined &&
            q.correctIndex !== undefined &&
            selected === q.correctIndex
          ) {
            correctCount++;
          }
        });
        const scorePercent = Math.round((correctCount / step.questions.length) * 100);
        const quizId = step.quizId || (lesson?.id ? `quiz_${lesson.id}_${step.id}` : step.id);
        saveQuizResult(quizId, scorePercent);
      }
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto py-1 sm:py-2">
      {formattedTitle && (
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-foreground/95 pb-2 border-b border-border/30 focus:outline-none"
        >
          {formattedTitle}
        </h2>
      )}
      <div className="flex items-center justify-between pb-2 border-b border-border/40">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-foreground">
          <HelpCircle className="h-4 w-4 text-amber-500 shrink-0" />
          <span>
            Question Progress ({step.questions.length} Question
            {step.questions.length > 1 ? "s" : ""})
          </span>
        </div>
        <Badge
          variant="outline"
          className="text-[11px] font-medium text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10"
        >
          Quiz
        </Badge>
      </div>

      {step.questions.length === 0 ? (
        <div className="p-6 text-center text-muted-foreground bg-card rounded-lg border border-border">
          Inline Quiz placeholder ({step.quizId})
        </div>
      ) : (
        step.questions.map((q, idx) => {
          const selectedOpt = userAnswers[q.id];
          const isChecked = checkedState[q.id];
          const isCorrect =
            selectedOpt !== undefined &&
            q.correctIndex !== undefined &&
            selectedOpt === q.correctIndex;

          return (
            <Card key={q.id || idx} className="border-border/80 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold leading-snug">
                  {idx + 1}. {q.question}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = selectedOpt === optIdx;
                    let optStyle = "border-border/60 hover:border-border hover:bg-accent/40";

                    if (isSelected) {
                      if (isChecked) {
                        optStyle = isCorrect
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium"
                          : "border-destructive bg-destructive/10 text-destructive font-medium";
                      } else {
                        optStyle = "border-primary bg-primary/10 text-foreground font-medium";
                      }
                    } else if (isChecked && optIdx === q.correctIndex) {
                      optStyle =
                        "border-emerald-500/50 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400";
                    }

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectOption(q.id, optIdx)}
                        className={cn(
                          "w-full text-left p-3.5 rounded-lg border text-sm transition-all flex items-center justify-between gap-3 focus:outline-none focus:ring-2 focus:ring-primary/40",
                          optStyle,
                        )}
                      >
                        <span>{opt}</span>
                        {isSelected && !isChecked && (
                          <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                        )}
                        {isChecked && optIdx === q.correctIndex && (
                          <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                        )}
                        {isChecked && isSelected && !isCorrect && (
                          <X className="h-4 w-4 text-destructive shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {selectedOpt !== undefined && !isChecked && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCheckAnswer(q.id)}
                    className="mt-2 text-xs font-medium"
                  >
                    Check Answer
                  </Button>
                )}

                {isChecked && (
                  <div
                    aria-live="polite"
                    className={cn(
                      "p-3.5 rounded-lg text-xs leading-relaxed mt-3 border",
                      isCorrect
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                        : "bg-destructive/10 border-destructive/30 text-destructive",
                    )}
                  >
                    <div className="font-semibold mb-1 flex items-center gap-1.5">
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Correct!
                        </>
                      ) : (
                        <>
                          <X className="h-3.5 w-3.5 text-destructive" /> Not quite.
                        </>
                      )}
                    </div>
                    {q.explanation && <div>{q.explanation}</div>}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}

/** 5. Checkpoint Step Renderer */
function CheckpointStepView({
  step,
  lesson,
  headingRef,
}: {
  step: CheckpointLessonStep;
  lesson?: Lesson;
  headingRef?: React.RefObject<HTMLHeadingElement | null>;
}) {
  const { toggleCheckpoint } = useProgress();
  const rawLessonCheckpoints = useProgressStore((state) => state.lessonCheckpoints);
  const lessonCheckpoints = rawLessonCheckpoints ?? EMPTY_OBJECT;

  const checkpointKey = lesson?.id ? `${lesson.id}:${step.id}` : step.id;
  const isAlreadyCompleted = Boolean(
    lessonCheckpoints[checkpointKey] || lessonCheckpoints[step.id],
  );

  const [acknowledged, setAcknowledged] = useState(isAlreadyCompleted);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  const assessment = step.assessment;
  const formattedTitle = formatStepTitle(step.title || step.label || "Checkpoint");

  const handleToggleAcknowledge = () => {
    const nextState = !acknowledged;
    setAcknowledged(nextState);
    if (lesson?.id) {
      toggleCheckpoint(lesson.id, step.id);
    }
  };

  const handleCheckAssessment = () => {
    setChecked(true);
    if (assessment && selectedOption === assessment.correctAnswer && lesson?.id) {
      toggleCheckpoint(lesson.id, step.id);
      setAcknowledged(true);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto py-1 sm:py-2">
      {formattedTitle && (
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-foreground/95 pb-2 border-b border-border/30 focus:outline-none"
        >
          {formattedTitle}
        </h2>
      )}
      <Card className="border-indigo-500/30 bg-indigo-500/5 dark:bg-indigo-950/10 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-indigo-500 shrink-0" />
              <span>Checkpoint Assessment</span>
            </div>
            {(acknowledged || isAlreadyCompleted) && (
              <Badge
                variant="outline"
                className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1"
              >
                <CheckCircle2 className="h-3 w-3" />
                <span>Completed</span>
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step.hint && (
            <div className="p-3 rounded-lg bg-background/80 border border-border/50 text-xs text-muted-foreground flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground">Hint: </span>
                {step.hint}
              </div>
            </div>
          )}

          {assessment && (
            <div className="space-y-3 pt-2">
              <div className="text-sm font-semibold text-foreground">{assessment.prompt}</div>
              <div className="space-y-2">
                {assessment.options.map((opt) => {
                  const isSelected = selectedOption === opt.id;
                  const isCorrect = checked && opt.id === assessment.correctAnswer;
                  const isWrongSelected =
                    checked && isSelected && opt.id !== assessment.correctAnswer;

                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setSelectedOption(opt.id);
                        setChecked(false);
                      }}
                      className={cn(
                        "w-full text-left p-3.5 rounded-lg border text-sm transition-all flex items-center justify-between gap-3 focus:outline-none focus:ring-2 focus:ring-primary/40",
                        isSelected && !checked && "border-primary bg-primary/10",
                        isCorrect &&
                          "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium",
                        isWrongSelected && "border-destructive bg-destructive/10 text-destructive",
                      )}
                    >
                      <span>{opt.label}</span>
                      {isCorrect && <Check className="h-4 w-4 text-emerald-500 shrink-0" />}
                      {isWrongSelected && <X className="h-4 w-4 text-destructive shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {selectedOption && !checked && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCheckAssessment}
                  className="text-xs font-medium"
                >
                  Check Answer
                </Button>
              )}

              {checked && assessment.explanation && (
                <div
                  aria-live="polite"
                  className="p-3.5 rounded-lg text-xs bg-indigo-500/10 border border-indigo-500/20 text-foreground/90"
                >
                  <div className="font-semibold mb-1">Explanation</div>
                  {assessment.explanation}
                </div>
              )}
            </div>
          )}

          {!assessment && (
            <div className="pt-2 flex items-center gap-3">
              <Button
                variant={acknowledged ? "default" : "outline"}
                size="sm"
                onClick={handleToggleAcknowledge}
                className="gap-2 text-xs font-medium"
              >
                {acknowledged ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-primary-foreground" /> Checkpoint
                    Acknowledged
                  </>
                ) : (
                  "I understand this concept"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
