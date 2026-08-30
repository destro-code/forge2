import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  applyValidationResult,
  completeCurrentExperience,
  createLessonExperienceState,
  getCurrentExperience,
  getProgress,
  getRuntimeState,
  goToExperience,
  goToNextExperience,
  goToPreviousExperience,
  isExperienceComplete,
  recordInteraction,
  recordRunExecuted,
  respondToExperience,
  retryExperience,
} from "@/lib/lesson-experience/engine";
import type { LessonExperienceDefinition } from "@/lib/lesson-experience/types";
import { HookRenderer } from "./renderers/hook-renderer";
import { VisualRenderer } from "./renderers/visual-renderer";
import { PredictionRenderer } from "./renderers/prediction-renderer";
import { SandboxExperimentRenderer } from "./renderers/sandbox-experiment-renderer";
import { ChallengeRenderer } from "./renderers/challenge-renderer";
import { ExplanationRenderer } from "./renderers/explanation-renderer";
import { MasteryCheckRenderer } from "./renderers/mastery-check-renderer";

export interface LessonExperiencePlayerProps {
  definition: LessonExperienceDefinition;
  onStateChange?: (state: ReturnType<typeof createLessonExperienceState>) => void;
  resetKey?: string;
}

export function LessonExperiencePlayer({
  definition,
  onStateChange,
  resetKey,
}: LessonExperiencePlayerProps) {
  const [state, setState] = useState(() => createLessonExperienceState(definition));

  useEffect(() => {
    onStateChange?.(state);
  }, [onStateChange, state]);

  useEffect(() => {
    if (resetKey === undefined) return;
    setState(createLessonExperienceState(definition));
  }, [definition, resetKey]);
  const experience = getCurrentExperience(definition, state);
  const runtime = experience ? getRuntimeState(state, experience.id) : undefined;
  const progress = getProgress(state);
  const canGoBack = state.currentIndex > 0;
  const isLastExperience = state.currentIndex === state.order.length - 1;

  const canAdvance = useMemo(() => {
    if (!experience || !runtime) return false;
    return isExperienceComplete(experience, runtime);
  }, [experience, runtime]);

  function handleNext() {
    if (!experience) return;
    if (isLastExperience) {
      setState((prev) => completeCurrentExperience(definition, prev));
      return;
    }
    setState((prev) => goToNextExperience(definition, prev));
  }

  function handleBack() {
    setState((prev) => goToPreviousExperience(prev));
  }

  if (!experience || !runtime) return null;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <ProgressRail
        order={state.order}
        currentIndex={state.currentIndex}
        completedIds={state.completedIds}
        visitedIds={state.visitedIds}
        onSelect={(id) => setState((prev) => goToExperience(prev, id))}
      />

      <div className="rounded-2xl border border-lesson-border bg-lesson-surface p-6 md:p-8">
        {experience.kind === "hook" && <HookRenderer experience={experience} />}

        {experience.kind === "visual" && (
          <VisualRenderer
            experience={experience}
            interactedTargetIds={runtime.interactedTargetIds}
            onInteract={(targetId) =>
              setState((prev) => recordInteraction(prev, experience.id, targetId))
            }
          />
        )}

        {experience.kind === "prediction" && (
          <PredictionRenderer
            experience={experience}
            runtime={runtime}
            onSelect={(optionId) => {
              setState((prev) => {
                const responded = respondToExperience(prev, experience.id, optionId);
                return applyValidationResult(responded, experience.id, {
                  isValid: optionId === experience.content.correctOptionId,
                });
              });
            }}
          />
        )}

        {experience.kind === "sandbox-experiment" && (
          <SandboxExperimentRenderer
            experience={experience}
            onRunExecuted={() => setState((prev) => recordRunExecuted(prev, experience.id))}
          />
        )}

        {experience.kind === "challenge" && (
          <ChallengeRenderer
            experience={experience}
            isPassed={runtime.status === "passed"}
            onValidated={(result) =>
              setState((prev) => applyValidationResult(prev, experience.id, result))
            }
          />
        )}

        {experience.kind === "explanation" && <ExplanationRenderer experience={experience} />}

        {experience.kind === "mastery-check" && (
          <MasteryCheckRenderer
            experience={experience}
            runtime={runtime}
            onSelect={(optionId) =>
              setState((prev) => respondToExperience(prev, experience.id, optionId))
            }
            onSubmit={() =>
              setState((prev) => {
                const selected = getRuntimeState(prev, experience.id).response;
                return applyValidationResult(prev, experience.id, {
                  isValid: selected === experience.content.correctOptionId,
                });
              })
            }
            onRetry={() => setState((prev) => retryExperience(prev, experience.id))}
          />
        )}
      </div>

      {state.status === "completed" ? (
        <div className="flex items-center gap-2 rounded-xl border border-lesson-success-border bg-lesson-success-bg px-4 py-3 text-sm font-medium text-lesson-success-text">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Lesson complete — {progress.completed}/{progress.total} experiences finished.
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleBack}
            disabled={!canGoBack}
          >
            <ArrowLeft />
            Back
          </Button>
          <Button type="button" size="sm" onClick={handleNext} disabled={!canAdvance}>
            {isLastExperience ? "Finish" : "Continue"}
            <ArrowRight />
          </Button>
        </div>
      )}
    </div>
  );
}

interface ProgressRailProps {
  order: string[];
  currentIndex: number;
  completedIds: string[];
  visitedIds: string[];
  onSelect: (id: string) => void;
}

function ProgressRail({
  order,
  currentIndex,
  completedIds,
  visitedIds,
  onSelect,
}: ProgressRailProps) {
  return (
    <div
      className="flex items-center gap-1.5"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={order.length}
      aria-valuenow={completedIds.length}
    >
      {order.map((id, index) => {
        const isCompleted = completedIds.includes(id);
        const isCurrent = index === currentIndex;
        const isVisited = visitedIds.includes(id);
        return (
          <button
            key={id}
            type="button"
            disabled={!isVisited}
            onClick={() => onSelect(id)}
            aria-label={`Step ${index + 1}`}
            aria-current={isCurrent}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors disabled:cursor-not-allowed",
              isCompleted
                ? "bg-lesson-accent"
                : isCurrent
                  ? "bg-lesson-accent/50"
                  : "bg-lesson-border",
            )}
          />
        );
      })}
    </div>
  );
}
