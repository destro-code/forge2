import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Sparkles,
  CheckCircle2,
  Eye,
  EyeOff,
  RotateCcw,
  Play,
  RefreshCw,
  Terminal,
  Layers,
} from "lucide-react";
import { ExerciseCard } from "./exercise-card";
import { useProgressStore } from "@/lib/stores/use-progress-store";
import { isExerciseCompleted } from "@/lib/utils/lesson-step-resolver";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { InteractiveExerciseLessonStep, Lesson } from "@/lib/types";

export interface RevealExerciseViewProps {
  step: InteractiveExerciseLessonStep;
  lesson?: Lesson;
  onComplete?: () => void;
  className?: string;
}

export function RevealExerciseView({ step, onComplete, className }: RevealExerciseViewProps) {
  const playgroundCompletions = useProgressStore((s) => s.playgroundCompletions);
  const completePlaygroundExercise = useProgressStore((s) => s.completePlaygroundExercise);

  const isAlreadyCompleted = isExerciseCompleted(step.exerciseId, playgroundCompletions);

  const [isRevealed, setIsRevealed] = useState(false);
  const [reflectionText, setReflectionText] = useState("");

  // Specialized state for Async/Await Lab
  const isAsyncAwaitLab = useMemo(() => {
    return (
      step.exerciseId === "exercise-2-2-8-1" ||
      step.exerciseId === "2-2-8-1" ||
      /async \/ await live lab/i.test(step.title || "")
    );
  }, [step.exerciseId, step.title]);

  const [useAwait, setUseAwait] = useState(false);
  const [isRunningSim, setIsRunningSim] = useState(false);
  const [simOutput, setSimOutput] = useState<string | null>(null);

  // Specialized state for Forge Loop reflection
  const isForgeLoopReflection = useMemo(() => {
    return (
      step.exerciseId === "exercise-0-1-5-1" ||
      step.exerciseId === "0-1-5-1" ||
      /explain the forge loop/i.test(step.title || "")
    );
  }, [step.exerciseId, step.title]);

  const handleRunAsyncSim = () => {
    setIsRunningSim(true);
    setSimOutput(null);

    setTimeout(() => {
      setIsRunningSim(false);
      if (useAwait) {
        setSimOutput(
          `[Console Output]\nResolved User Payload:\n{\n  id: 101,\n  name: "Alex Chen",\n  role: "Frontend Architect",\n  status: "verified"\n}\n\nExecution paused until Promise settled!`,
        );
      } else {
        setSimOutput(
          `[Console Output]\nImmediate Return Value:\nPromise { <state: "pending"> }\n\nNotice: Execution did not pause. The variable holds the Promise object itself, NOT the unwrapped resolved data.`,
        );
      }
    }, 400);
  };

  const handleReveal = () => {
    setIsRevealed(true);
    if (!isAlreadyCompleted) {
      completePlaygroundExercise(step.exerciseId);
      toast.success("Conceptual lab completed! +50 XP");
    }
    if (onComplete) onComplete();
  };

  const handleReset = () => {
    setIsRevealed(false);
    setReflectionText("");
    setUseAwait(false);
    setSimOutput(null);
  };

  return (
    <ExerciseCard
      title={step.title || "Conceptual Lab & Inspection"}
      mode="reveal"
      leadIn={step.leadIn}
      instructions={step.instructions}
      isCompleted={isAlreadyCompleted || isRevealed}
      className={className}
    >
      <div className="flex flex-col gap-6 max-w-3xl mx-auto py-2">
        {/* Branch 1: Async / Await Live Lab */}
        {isAsyncAwaitLab ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-primary" />
                Live Execution Inspector
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant={!useAwait ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setUseAwait(false);
                    setSimOutput(null);
                  }}
                  className="h-7 text-xs"
                >
                  Without <code>await</code>
                </Button>
                <Button
                  variant={useAwait ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setUseAwait(true);
                    setSimOutput(null);
                  }}
                  className="h-7 text-xs"
                >
                  With <code>await</code>
                </Button>
              </div>
            </div>

            {/* Code Snippet Box */}
            <div className="rounded-xl border border-border/80 bg-muted/40 p-4 font-mono text-xs text-foreground shadow-inner">
              <div className="text-muted-foreground mb-1">
                // Simulating asynchronous data fetch
              </div>
              <div>
                <span className="text-sky-500 font-semibold">async function</span>{" "}
                <span className="text-amber-500">loadUserDashboard</span>() &#123;
              </div>
              <div className="pl-4">
                <span className="text-purple-400">const</span> userResult ={" "}
                <span
                  className={cn(
                    "font-bold",
                    useAwait ? "text-emerald-500 underline" : "text-destructive line-through",
                  )}
                >
                  {useAwait ? "await " : ""}
                </span>
                fetchUserData(101);
              </div>
              <div className="pl-4">
                console.<span className="text-blue-400">log</span>(userResult);
              </div>
              <div>&#125;</div>
            </div>

            {/* Run Button and Output Terminal */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRunAsyncSim}
                  disabled={isRunningSim}
                  className="h-8 text-xs gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary border-primary/30 font-medium"
                >
                  {isRunningSim ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Play className="h-3.5 w-3.5" />
                  )}
                  Execute Function & Observe Log
                </Button>
              </div>

              {simOutput && (
                <div className="rounded-xl border border-border/80 bg-zinc-950 p-4 font-mono text-xs text-zinc-100 shadow-md animate-in fade-in duration-200">
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mb-2 border-b border-zinc-800 pb-1.5">
                    <Terminal className="h-3 w-3 text-emerald-400" />
                    Console Stream Output
                  </div>
                  <pre className="whitespace-pre leading-relaxed text-emerald-400">{simOutput}</pre>
                </div>
              )}
            </div>
          </div>
        ) : isForgeLoopReflection ? (
          /* Branch 2: Forge Loop Reflection */
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-4 space-y-1.5">
                <div className="text-xs font-semibold text-sky-500 uppercase tracking-wider">
                  1. Learn
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed">
                  Grasp foundational mental models without overwhelming trivia. Understand the why
                  behind web systems.
                </p>
              </div>
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-1.5">
                <div className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
                  2. Practice
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed">
                  Engage in active recall, code inspection, and targeted sandboxes to build muscle
                  memory.
                </p>
              </div>
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-1.5">
                <div className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">
                  3. Grow
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed">
                  Retain mastery through spaced checkpoints, code diagnostics, and self-directed
                  projects.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground block">
                Your Reflection (Explain in your own words what Learn / Practice / Grow means for
                you):
              </label>
              <textarea
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                placeholder="Type your thoughts here to lock in your mental model..."
                rows={3}
                className="w-full rounded-lg border border-border/60 bg-background/50 p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none resize-none"
              />
            </div>
          </div>
        ) : (
          /* Branch 3: General Conceptual Lab */
          <div className="space-y-4">
            {step.initialCode && (
              <div className="rounded-xl border border-border/80 bg-muted/40 p-4 font-mono text-xs text-foreground overflow-x-auto shadow-inner">
                <pre className="whitespace-pre leading-relaxed">{step.initialCode.trim()}</pre>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground block">
                Reflection & Thought Process:
              </label>
              <textarea
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                placeholder="Take a moment to formulate your thoughts or explain the concept before revealing the answer..."
                rows={3}
                className="w-full rounded-lg border border-border/60 bg-background/50 p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none resize-none"
              />
            </div>
          </div>
        )}

        {/* Revealed Principles Breakdown */}
        {isRevealed && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4 sm:p-5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Core Principle & Synthesis
            </div>
            <div className="text-xs sm:text-sm text-foreground/90 space-y-2 leading-relaxed">
              {isAsyncAwaitLab ? (
                <>
                  <p>
                    <strong>
                      The Role of <code>await</code>:
                    </strong>{" "}
                    When you call an async function without <code>await</code>, JavaScript
                    immediately returns a pending <code>Promise</code> object synchronously.
                  </p>
                  <p>
                    Adding <code>await</code> tells the JavaScript runtime to pause execution within
                    that async function until the promise settles, and automatically unwraps the
                    resolved value.
                  </p>
                </>
              ) : isForgeLoopReflection ? (
                <>
                  <p>
                    <strong>The Pedagogical Flywheel:</strong> The Forge loop transforms passive
                    reading into lasting capability. True engineering mastery comes when reading
                    (Learn) is immediately validated by tactile experimentation (Practice), then
                    locked into long-term memory (Grow).
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <strong>Synthesis:</strong> Deep conceptual understanding comes from active
                    analysis before passive consumption. By predicting and reflecting on code
                    mechanics, you develop robust intuition for building reliable software.
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50 gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs text-muted-foreground gap-1.5"
          >
            <RotateCcw className="h-3 w-3" />
            Reset State
          </Button>

          {!isRevealed ? (
            <Button
              variant="default"
              size="sm"
              onClick={handleReveal}
              className="text-xs gap-1.5 font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Reveal Principles & Complete (+50 XP)
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRevealed(false)}
                className="text-xs gap-1 text-muted-foreground"
              >
                <EyeOff className="h-3 w-3" />
                Hide Principles
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={onComplete}
                className="text-xs gap-1.5 font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Continue
              </Button>
            </div>
          )}
        </div>
      </div>
    </ExerciseCard>
  );
}
