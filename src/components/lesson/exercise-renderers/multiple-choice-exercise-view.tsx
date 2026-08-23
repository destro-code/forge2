import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Lightbulb,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { ExerciseCard } from "./exercise-card";
import { useProgressStore } from "@/lib/stores/use-progress-store";
import { isExerciseCompleted } from "@/lib/utils/lesson-step-resolver";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { InteractiveExerciseLessonStep, Lesson } from "@/lib/types";

export interface MultipleChoiceExerciseViewProps {
  step: InteractiveExerciseLessonStep;
  lesson?: Lesson;
  onComplete?: () => void;
  className?: string;
}

interface ScenarioItem {
  task: string;
  answer: string;
  explanation?: string;
}

function parseScenariosFromCode(code?: string): ScenarioItem[] {
  if (!code) return [];
  const match = code.match(/scenarios\s*=\s*(\[[\s\S]*?\]);/);
  if (match && match[1]) {
    try {
      const fn = new Function(`return ${match[1]}`);
      const raw = fn();
      if (Array.isArray(raw)) {
        return raw
          .map((item: any) => ({
            task: item.task || item.text || item.question || item.prompt || "",
            answer: item.answer || item.correct || "",
            explanation: item.explanation || item.reason || "",
          }))
          .filter((s) => s.task.length > 0);
      }
    } catch {
      /* ignore */
    }
  }
  return [];
}

export function MultipleChoiceExerciseView({
  step,
  onComplete,
  className,
}: MultipleChoiceExerciseViewProps) {
  const playgroundCompletions = useProgressStore((s) => s.playgroundCompletions);
  const completePlaygroundExercise = useProgressStore((s) => s.completePlaygroundExercise);

  const isAlreadyCompleted = isExerciseCompleted(step.exerciseId, playgroundCompletions);

  const scenarios: ScenarioItem[] = useMemo(() => {
    const parsed = parseScenariosFromCode(step.initialCode);
    if (parsed.length > 0) return parsed;

    // Fallback if no scenario array is in code
    return [
      {
        task: step.instructions || "Review the prompt and select the best answer.",
        answer: "Correct",
        explanation: "Good job reviewing this conceptual scenario.",
      },
    ];
  }, [step.initialCode, step.instructions]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [completedScenarios, setCompletedScenarios] = useState<number[]>([]);

  const currentScenario = scenarios[currentIndex] || scenarios[0];

  // Derive available option choices
  const availableOptions = useMemo(() => {
    const uniqueAnswers = Array.from(new Set(scenarios.map((s) => s.answer.trim()))).filter(
      Boolean,
    );

    // If standard role detective
    if (uniqueAnswers.some((a) => ["Frontend", "Backend", "Design"].includes(a))) {
      return ["Frontend", "Backend", "Design", "DevOps"];
    }
    // If request / response
    if (uniqueAnswers.some((a) => ["Request", "Response"].includes(a))) {
      return ["Request", "Response"];
    }
    // If client / server
    if (uniqueAnswers.some((a) => ["Browser", "Server"].includes(a))) {
      return ["Browser", "Server", "Both / Shared"];
    }

    if (uniqueAnswers.length >= 2) return uniqueAnswers;
    return ["Option A", "Option B", "Option C"];
  }, [scenarios]);

  const isCorrect = useMemo(() => {
    if (!selectedAnswer) return null;
    const normalizedSelected = selectedAnswer.trim().toLowerCase();
    const normalizedAnswer = currentScenario.answer.trim().toLowerCase();
    return (
      normalizedSelected === normalizedAnswer ||
      normalizedAnswer.includes(normalizedSelected) ||
      normalizedSelected.includes(normalizedAnswer)
    );
  }, [selectedAnswer, currentScenario]);

  const handleSelectOption = (opt: string) => {
    if (isRevealed) return;
    setSelectedAnswer(opt);
    setIsRevealed(true);

    if (!completedScenarios.includes(currentIndex)) {
      setCompletedScenarios((prev) => [...prev, currentIndex]);
    }
  };

  const handleReveal = () => {
    setIsRevealed(true);
    if (!completedScenarios.includes(currentIndex)) {
      setCompletedScenarios((prev) => [...prev, currentIndex]);
    }
  };

  const handleNext = () => {
    if (currentIndex < scenarios.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsRevealed(false);
    } else {
      // Completed all scenarios in this exercise
      if (!isAlreadyCompleted) {
        completePlaygroundExercise(step.exerciseId);
        toast.success("Exercise completed! +50 XP awarded");
      }
      if (onComplete) onComplete();
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsRevealed(false);
    setCompletedScenarios([]);
  };

  const allCompleted = completedScenarios.length >= scenarios.length;

  useEffect(() => {
    if (allCompleted && !isAlreadyCompleted) {
      completePlaygroundExercise(step.exerciseId);
    }
  }, [allCompleted, isAlreadyCompleted, completePlaygroundExercise, step.exerciseId]);

  return (
    <ExerciseCard
      title={step.title || "Scenario Matching"}
      mode="multiple-choice"
      leadIn={step.leadIn}
      instructions={step.instructions}
      isCompleted={isAlreadyCompleted || allCompleted}
      className={className}
    >
      <div className="flex flex-col gap-5 max-w-3xl mx-auto py-2">
        {/* Scenario Progress Stepper */}
        {scenarios.length > 1 && (
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground border-b border-border/40 pb-3">
            <span className="font-medium">
              Scenario <span className="text-foreground font-semibold">{currentIndex + 1}</span> of{" "}
              {scenarios.length}
            </span>
            <div className="flex items-center gap-1.5">
              {scenarios.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setSelectedAnswer(null);
                    setIsRevealed(false);
                  }}
                  className={cn(
                    "h-2 rounded-full transition-all duration-200",
                    idx === currentIndex
                      ? "w-6 bg-primary"
                      : completedScenarios.includes(idx)
                        ? "w-2 bg-emerald-500"
                        : "w-2 bg-muted-foreground/30",
                  )}
                  title={`Go to Scenario ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Scenario Prompt Card */}
        <div className="rounded-xl border border-border/80 bg-muted/30 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <HelpCircle className="h-3.5 w-3.5 text-primary" />
            Scenario Prompt
          </div>
          <div className="text-sm sm:text-base font-medium text-foreground leading-relaxed">
            {currentScenario.task}
          </div>
        </div>

        {/* Choice Options Grid */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground block">
            Choose the correct role / category:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {availableOptions.map((opt) => {
              const isChosen = selectedAnswer === opt;
              const isRightAnswer =
                isRevealed && currentScenario.answer.toLowerCase().includes(opt.toLowerCase());

              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleSelectOption(opt)}
                  disabled={isRevealed}
                  className={cn(
                    "flex items-center justify-between p-3.5 rounded-xl border text-sm font-medium text-left transition-all duration-150 shadow-xs",
                    !isRevealed &&
                      "hover:border-primary/60 hover:bg-accent/40 bg-card border-border/70 active:scale-[0.99] cursor-pointer",
                    isRevealed &&
                      isChosen &&
                      isCorrect &&
                      "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold",
                    isRevealed &&
                      isChosen &&
                      !isCorrect &&
                      "border-destructive bg-destructive/10 text-destructive font-semibold",
                    isRevealed &&
                      !isChosen &&
                      isRightAnswer &&
                      "border-emerald-500/60 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400",
                    isRevealed &&
                      !isChosen &&
                      !isRightAnswer &&
                      "opacity-50 border-border/40 bg-muted/20 cursor-default",
                  )}
                >
                  <span>{opt}</span>
                  {isRevealed && isChosen && isCorrect && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  )}
                  {isRevealed && isChosen && !isCorrect && (
                    <XCircle className="h-4 w-4 text-destructive shrink-0" />
                  )}
                  {isRevealed && !isChosen && isRightAnswer && (
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                    >
                      Answer
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Revealed Explanation Area */}
        {isRevealed && (
          <div
            className={cn(
              "rounded-xl border p-4 sm:p-5 transition-all animate-in fade-in slide-in-from-top-2 duration-200",
              isCorrect
                ? "border-emerald-500/40 bg-emerald-500/5"
                : "border-border/80 bg-accent/30",
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "p-2 rounded-lg shrink-0 mt-0.5",
                  isCorrect ? "bg-emerald-500/10 text-emerald-500" : "bg-primary/10 text-primary",
                )}
              >
                <Lightbulb className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <span>Correct Role:</span>
                  <Badge variant="outline" className="font-semibold text-foreground">
                    {currentScenario.answer}
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                  {currentScenario.explanation ||
                    "Understanding where this logic belongs ensures clean architecture."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50 gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs text-muted-foreground gap-1.5"
          >
            <RotateCcw className="h-3 w-3" />
            Restart Scenarios
          </Button>

          <div className="flex items-center gap-2">
            {!isRevealed ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReveal}
                className="text-xs gap-1.5"
              >
                <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                Reveal Answer
              </Button>
            ) : currentIndex < scenarios.length - 1 ? (
              <Button
                variant="default"
                size="sm"
                onClick={handleNext}
                className="text-xs gap-1.5 font-medium"
              >
                Next Scenario
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={handleNext}
                className="text-xs gap-1.5 font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Complete Exercise
              </Button>
            )}
          </div>
        </div>
      </div>
    </ExerciseCard>
  );
}
