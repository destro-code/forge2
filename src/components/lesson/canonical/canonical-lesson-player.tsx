import { useCallback } from "react";
import type { CanonicalLesson } from "@/lib/curriculum/types";
import { CanonicalActivityView } from "./canonical-activity-view";
import { evaluateActivityValidation } from "./validation";
import type { ActivityCompletionEvent } from "./types";
import { useLessonSession } from "@/lib/learning-engine/use-lesson-session";
import { useProgress } from "@/lib/hooks/use-progress";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, BookOpen, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CanonicalLessonPlayerProps {
  lesson: CanonicalLesson;
  onComplete?: () => void;
  className?: string;
}

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

  const handleResponseChange = useCallback(
    (newResponse: unknown) => {
      if (!currentActivity) return;
      updateResponse(newResponse, currentActivity.id);
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

    if (
      (responseToEvaluate === null || responseToEvaluate === undefined) &&
      currentActivity.content &&
      "starterCode" in currentActivity.content
    ) {
      const codeContent = currentActivity.content as { starterCode?: string };
      responseToEvaluate = codeContent.starterCode;
    }
    if (
      (responseToEvaluate === null || responseToEvaluate === undefined) &&
      currentActivity.content &&
      "buggyCode" in currentActivity.content
    ) {
      const debugContent = currentActivity.content as { buggyCode?: string };
      responseToEvaluate = debugContent.buggyCode;
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
    if (!currentActivity) return;
    retry(currentActivity.id);
  }, [currentActivity, retry]);

  const handleRevealHint = useCallback(() => {
    if (!currentActivity) return;
    revealHint(currentActivity.id);
  }, [currentActivity, revealHint]);

  const handleActivityContinue = useCallback(
    (_event?: ActivityCompletionEvent<unknown>) => {
      if (!currentActivity) return;

      completeActivity(currentActivity.id);

      if (currentActivityIndex < totalActivities - 1) {
        goNext();
      } else {
        completeLesson();
      }
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

  return (
    <div className={cn("flex flex-col h-full w-full bg-lesson-bg overflow-hidden", className)}>
      {/* Lesson Header */}
      <header className="flex flex-col border-b border-lesson-border bg-lesson-surface/80 backdrop-blur-md px-4 sm:px-6 py-3.5 shrink-0 select-none">
        {/* Mobile/Desktop Top Row */}
        <div className="flex items-center justify-between gap-4">
          {/* Left Section: Back button & Breadcrumbs */}
          <div className="flex items-center gap-2.5 min-w-0">
            <a
              href="/learn"
              className="inline-flex items-center justify-center h-10 px-2 sm:px-3 text-sm font-semibold text-lesson-text-secondary hover:text-lesson-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lesson-focus-ring rounded-lg hover:bg-lesson-surface-subtle transition-all shrink-0"
            >
              <ChevronLeft className="w-5 h-5 -ml-1" />
              <span className="hidden sm:inline">Back</span>
            </a>

            <div className="w-px h-5 bg-lesson-border shrink-0" />

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-lesson-text-muted tracking-wide uppercase">
                <span>Lesson {lesson.order}</span>
                <span className="w-1 h-1 rounded-full bg-lesson-border shrink-0" />
                <span className="capitalize text-lesson-text-muted/80">{lesson.difficulty}</span>
              </div>
              <h1 className="text-sm sm:text-base font-bold text-lesson-text-primary truncate">
                {lesson.title}
              </h1>
            </div>
          </div>

          {/* Right Section: Compact Navigation and Stats */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-lesson-text-muted">
              <Clock className="w-4 h-4 text-lesson-text-muted/75" />
              <span>{lesson.estimatedMinutes} min</span>
            </div>

            {/* Steps Selector and Controls */}
            <div className="flex items-center gap-1 bg-lesson-surface border border-lesson-border/60 rounded-xl p-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                disabled={currentActivityIndex === 0}
                onClick={goPrevious}
                className="h-9 w-9 text-lesson-text-secondary hover:text-lesson-text-primary hover:bg-lesson-surface-subtle disabled:opacity-25 rounded-lg focus-visible:ring-2 focus-visible:ring-lesson-focus-ring"
                aria-label="Previous activity"
              >
                <ChevronLeft className="w-4.5 h-4.5" />
              </Button>

              <span className="text-xs font-mono font-bold px-2 text-lesson-text-secondary min-w-[50px] text-center select-none">
                {currentActivityIndex + 1} / {totalActivities}
              </span>

              <Button
                variant="ghost"
                size="icon"
                disabled={currentActivityIndex === totalActivities - 1}
                onClick={goNext}
                className="h-9 w-9 text-lesson-text-secondary hover:text-lesson-text-primary hover:bg-lesson-surface-subtle disabled:opacity-25 rounded-lg focus-visible:ring-2 focus-visible:ring-lesson-focus-ring"
                aria-label="Next activity"
              >
                <ChevronRight className="w-4.5 h-4.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Progress Area / Ribbon */}
        {/* Desktop segmented bar, mobile unified thin bar */}
        <div className="mt-3.5">
          {/* Desktop Segmented Indicator */}
          <div className="hidden md:flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {activities.map((act, idx) => {
              const isCurrent = idx === currentActivityIndex;
              const isDone = session.completedActivityIds.includes(act.id);

              return (
                <button
                  key={act.id}
                  type="button"
                  onClick={() => goToActivity(idx)}
                  aria-label={`Activity ${idx + 1}: ${act.type}`}
                  className="h-5 flex-1 min-w-[24px] flex items-center relative group cursor-pointer focus:outline-none"
                >
                  <div
                    className={cn(
                      "h-1.5 w-full rounded-full transition-all duration-200",
                      isCurrent
                        ? "bg-lesson-accent shadow-xs ring-2 ring-lesson-accent/30"
                        : isDone
                          ? "bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-500/80 dark:hover:bg-emerald-500"
                          : "bg-lesson-surface-subtle border border-lesson-border/40 hover:bg-lesson-text-muted/15",
                    )}
                  />
                </button>
              );
            })}
          </div>

          {/* Mobile Simple Progress Bar */}
          <div className="flex md:hidden flex-col gap-1 px-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-lesson-text-muted">
              <span>Progress</span>
              <span>{Math.round(((currentActivityIndex + 1) / totalActivities) * 100)}%</span>
            </div>
            <div className="w-full h-1.5 bg-lesson-surface-subtle border border-lesson-border/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-lesson-accent rounded-full transition-all duration-300 ease-out"
                style={{ width: `${((currentActivityIndex + 1) / totalActivities) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Activity Viewport */}
      <main className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 pt-4 md:pt-6 lg:pt-8 pb-0 md:pb-8 flex flex-col justify-start">
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
            className="w-full my-auto"
          />
        ) : (
          <div className="p-12 text-center text-lesson-text-muted">
            No activities available in this lesson.
          </div>
        )}
      </main>
    </div>
  );
}
