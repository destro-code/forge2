import { useCallback, useEffect, useMemo, useRef } from "react";
import type { CanonicalLesson } from "@/lib/curriculum/types";
import { CanonicalActivityView } from "./canonical-activity-view";
import { evaluateActivityValidation } from "./validation";
import type { ActivityCompletionEvent } from "./types";
import { useLessonSession } from "@/lib/learning-engine/use-lesson-session";
import { useProgress } from "@/lib/hooks/use-progress";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CheckCircle2, Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CanonicalLessonPlayerProps {
  lesson: CanonicalLesson;
  onComplete?: () => void;
  className?: string;
}

const INTERACTIVE_TYPES = new Set([
  "multiple-choice",
  "multi-select",
  "fill-blank",
  "ordering",
  "output-prediction",
  "interactive-code",
  "debug",
  "reflection",
  "judgment",
]);

export function CanonicalLessonPlayer({
  lesson,
  onComplete,
  className,
}: CanonicalLessonPlayerProps) {
  const { completeLesson: completeGlobalProgress } = useProgress();
  const handleLessonCompleted = useCallback(() => {
    completeGlobalProgress(lesson.id);
    onComplete?.();
  }, [completeGlobalProgress, lesson.id, onComplete]);

  const {
    session,
    currentActivity,
    currentActivityState,
    getActivityState,
    updateResponse,
    startEvaluation,
    resolveEvaluation,
    retry,
    revealHint,
    completeActivity,
    goNext,
    goPrevious,
    goToActivity,
    completeLesson,
    matchedMisconception,
  } = useLessonSession(lesson, { onComplete: handleLessonCompleted });

  const activities = lesson.activities || [];
  const currentActivityIndex = session.currentActivityIndex;
  const totalActivities = session.totalActivities;

  const scrollContainerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    scrollContainerRef.current?.scrollTo({
      top: 0,
      behavior: "instant",
    });
  }, [currentActivity?.id]);

  const handleResponseChange = useCallback(
    (newResponse: unknown) => {
      if (currentActivity) updateResponse(newResponse, currentActivity.id);
    },
    [currentActivity, updateResponse],
  );

  const handleSubmit = useCallback(() => {
    if (!currentActivity) return;
    const latestActState = getActivityState(currentActivity.id);
    let responseToEvaluate =
      latestActState?.response ??
      session.activities[currentActivity.id]?.response ??
      currentActivityState?.response;
    startEvaluation(currentActivity.id);

    if (responseToEvaluate === null || responseToEvaluate === undefined) {
      if (currentActivity.content && "starterCode" in currentActivity.content) {
        responseToEvaluate = (currentActivity.content as { starterCode?: string }).starterCode;
      } else if (currentActivity.content && "buggyCode" in currentActivity.content) {
        responseToEvaluate = (currentActivity.content as { buggyCode?: string }).buggyCode;
      }
    }

    const valResult = evaluateActivityValidation(currentActivity, responseToEvaluate);
    resolveEvaluation(valResult, currentActivity.id);
  }, [
    currentActivity,
    getActivityState,
    session.activities,
    currentActivityState?.response,
    startEvaluation,
    resolveEvaluation,
  ]);

  const handleRetry = useCallback(() => {
    if (currentActivity) retry(currentActivity.id);
  }, [currentActivity, retry]);

  const handleRevealHint = useCallback(() => {
    if (currentActivity) revealHint(currentActivity.id);
  }, [currentActivity, revealHint]);

  const handleActivityContinue = useCallback(
    (_event?: ActivityCompletionEvent<unknown>) => {
      if (!currentActivity) return;
      completeActivity(currentActivity.id);
      if (currentActivityIndex < totalActivities - 1) goNext();
      else completeLesson();
    },
    [
      currentActivity,
      currentActivityIndex,
      totalActivities,
      completeActivity,
      goNext,
      completeLesson,
    ],
  );

  const isInteractive = currentActivity ? INTERACTIVE_TYPES.has(currentActivity.type) : false;

  const activeResponse = useMemo(() => {
    if (!currentActivity) return undefined;
    return (
      getActivityState(currentActivity.id)?.response ??
      session.activities[currentActivity.id]?.response ??
      currentActivityState?.response
    );
  }, [currentActivity, getActivityState, session.activities, currentActivityState?.response]);

  const canSubmit = useMemo(() => {
    if (!currentActivity) return false;
    if (!isInteractive) return true;

    switch (currentActivity.type) {
      case "multiple-choice":
        return typeof activeResponse === "string" && activeResponse.length > 0;
      case "multi-select":
        return Array.isArray(activeResponse) && activeResponse.length > 0;
      case "fill-blank":
        return (
          typeof activeResponse === "object" &&
          activeResponse !== null &&
          Object.keys(activeResponse).length > 0
        );
      case "ordering":
        return Array.isArray(activeResponse) && activeResponse.length > 0;
      case "reflection":
        return typeof activeResponse === "string" && activeResponse.trim().length >= 10;
      case "interactive-code":
      case "debug":
      case "output-prediction":
      case "judgment":
      default:
        return activeResponse !== undefined && activeResponse !== null;
    }
  }, [currentActivity, isInteractive, activeResponse]);

  const effectiveStatus = useMemo(() => {
    if (!currentActivity) return "idle";
    const state = getActivityState(currentActivity.id) || currentActivityState;
    return state?.status || "idle";
  }, [currentActivity, getActivityState, currentActivityState]);

  const isCorrect =
    effectiveStatus === "passed" ||
    effectiveStatus === "correct" ||
    effectiveStatus === "completed";
  const isIncorrect = effectiveStatus === "failed" || effectiveStatus === "incorrect";
  const isSubmitted = effectiveStatus === "evaluating" || effectiveStatus === "submitted";

  const isLastActivity = currentActivityIndex === totalActivities - 1;

  const progressPercent =
    totalActivities > 0 ? ((currentActivityIndex + 1) / totalActivities) * 100 : 0;

  return (
    <div
      className={cn(
        "flex h-full min-h-0 w-full flex-col overflow-hidden bg-lesson-bg text-lesson-text-primary",
        className,
      )}
      data-testid="canonical-lesson-player"
    >
      <header className="shrink-0 border-b border-lesson-border bg-lesson-bg px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4">
          <a
            href="/learn"
            className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-medium text-lesson-text-secondary transition-colors hover:bg-lesson-surface-subtle hover:text-lesson-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lesson-focus-ring"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to learning</span>
          </a>

          <div className="min-w-0 flex-1 text-center sm:px-8">
            <p className="truncate text-xs font-medium text-lesson-text-muted">
              Lesson {lesson.order}
            </p>
            <h1 className="truncate text-sm font-semibold sm:text-base">{lesson.title}</h1>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-xs font-medium text-lesson-text-muted">Progress</p>
            <p className="font-mono text-xs font-semibold text-lesson-text-secondary">
              {currentActivityIndex + 1} / {totalActivities}
            </p>
          </div>
        </div>

        <div className="mx-auto mt-3 max-w-[1400px]">
          <div className="flex items-center justify-between gap-3 text-[11px] font-medium text-lesson-text-muted sm:hidden">
            <span>Activity {currentActivityIndex + 1}</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-lesson-surface-subtle">
            <div
              className="h-full rounded-full bg-lesson-accent transition-[width] duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div
            className="mt-2 hidden items-center gap-1 md:flex"
            role="tablist"
            aria-label="Lesson activities"
          >
            {activities.map((activity, index) => {
              const current = index === currentActivityIndex;
              const done = session.completedActivityIds.includes(activity.id);
              return (
                <button
                  key={activity.id}
                  type="button"
                  role="tab"
                  aria-selected={current}
                  aria-label={`Activity ${index + 1}: ${activity.type}`}
                  onClick={() => goToActivity(index)}
                  className="group flex min-h-7 flex-1 items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lesson-focus-ring"
                >
                  <span
                    className={cn(
                      "h-1.5 w-full rounded-full transition-colors",
                      current
                        ? "bg-lesson-accent"
                        : done
                          ? "bg-emerald-500/80"
                          : "bg-lesson-surface-subtle group-hover:bg-lesson-text-muted/30",
                    )}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main
        ref={scrollContainerRef}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 pb-32 sm:px-6 sm:pb-36 md:py-8 lg:px-8"
      >
        <div className="mx-auto flex min-h-full w-full max-w-[1200px] flex-col justify-start">
          {currentActivity ? (
            <CanonicalActivityView
              key={currentActivity.id}
              activity={currentActivity}
              activityState={currentActivityState}
              onResponseChange={handleResponseChange}
              onSubmit={handleSubmit}
              onRetry={handleRetry}
              onRevealHint={handleRevealHint}
              onComplete={handleActivityContinue}
              matchedMisconception={matchedMisconception}
              className="w-full"
            />
          ) : (
            <div className="py-16 text-center text-lesson-text-muted">
              No activities available in this lesson.
            </div>
          )}
        </div>
      </main>

      {/* Single, authoritative, stateful lesson action bar */}
      <footer className="shrink-0 border-t border-lesson-border bg-lesson-surface/95 backdrop-blur-sm px-4 py-3 sm:px-6 z-30 shadow-[0_-4px_16px_rgba(0,0,0,0.03)] pb-[calc(12px+env(safe-area-inset-bottom,0px))]">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={goPrevious}
            disabled={currentActivityIndex === 0}
            className="min-h-11 gap-1 px-3 text-sm text-lesson-text-secondary hover:bg-lesson-surface-subtle hover:text-lesson-text-primary"
            aria-label="Previous activity"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>

          <span className="hidden max-w-[45%] truncate text-xs font-medium text-lesson-text-muted sm:block">
            {currentActivity?.title || `Activity ${currentActivityIndex + 1}`}
          </span>

          <div className="flex items-center gap-2">
            {!isInteractive || isCorrect ? (
              <Button
                onClick={handleActivityContinue}
                disabled={!currentActivity}
                className="min-h-11 gap-2 px-6 text-sm font-semibold rounded-md bg-lesson-accent text-lesson-accent-foreground hover:bg-lesson-accent/90 focus-visible:ring-2 focus-visible:ring-lesson-focus-ring shadow-xs"
              >
                <span>{isLastActivity ? "Complete Lesson" : "Continue"}</span>
                {isLastActivity ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0" />
                )}
              </Button>
            ) : isIncorrect ? (
              <Button
                onClick={handleRetry}
                className="min-h-11 gap-2 px-6 text-sm font-semibold rounded-md bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-2 focus-visible:ring-rose-500 shadow-xs"
              >
                <RotateCcw className="h-4 w-4 shrink-0" />
                <span>Try Again</span>
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitted}
                className="min-h-11 gap-2 px-6 text-sm font-semibold rounded-md bg-lesson-accent text-lesson-accent-foreground hover:bg-lesson-accent/90 disabled:opacity-45 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-lesson-focus-ring shadow-xs"
              >
                <Check className="h-4 w-4 shrink-0" />
                <span>{isSubmitted ? "Evaluating…" : "Check Answer"}</span>
              </Button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
