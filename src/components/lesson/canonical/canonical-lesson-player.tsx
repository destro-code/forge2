import { useCallback, useEffect, useMemo, useRef } from "react";
import type { CanonicalLesson } from "@/lib/curriculum/types";
import { CanonicalActivityView } from "./canonical-activity-view";
import { evaluateActivityValidation } from "./validation";
import type { ActivityCompletionEvent } from "./types";
import {
  ActivityFeedback,
  hasActivityFeedback,
} from "./primitives/activity-feedback";
import { LessonLayoutProvider } from "./primitives/lesson-layout-context";
import { useLessonSession } from "@/lib/learning-engine/use-lesson-session";
import { useProgress } from "@/lib/hooks/use-progress";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CheckCircle2, Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { movementForActivityType, movementVars } from "./lesson-movements";
import { MovementRail, MovementBadge } from "./movement-rail";

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

    const valResult = evaluateActivityValidation(
      currentActivity,
      responseToEvaluate as Parameters<typeof evaluateActivityValidation>[1],
    );
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
    (_event?: ActivityCompletionEvent<unknown> | React.MouseEvent<HTMLButtonElement>) => {
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
      case "fill-blank": {
        // Every blank must actually be filled — an empty or partial response
        // must never be submittable.
        const blanks =
          (currentActivity.content as { blanks?: unknown[] })?.blanks ?? [];
        if (!Array.isArray(activeResponse)) return false;
        if (blanks.length > 0 && activeResponse.length < blanks.length) return false;
        return (
          activeResponse.length > 0 &&
          activeResponse.every((v) => typeof v === "string" && v.trim().length > 0)
        );
      }
      case "ordering": {
        // The learner must have arranged the list themselves. Renderers no
        // longer seed a default order, so an untouched activity has no
        // response and cannot be submitted.
        const items = (currentActivity.content as { items?: unknown[] })?.items ?? [];
        return Array.isArray(activeResponse) && activeResponse.length === items.length;
      }
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

  const isCorrect = effectiveStatus === "passed" || effectiveStatus === "completed";
  const isIncorrect = effectiveStatus === "failed";
  const isSubmitted = effectiveStatus === "evaluating";

  const isLastActivity = currentActivityIndex === totalActivities - 1;

  const progressPercent =
    totalActivities > 0 ? ((currentActivityIndex + 1) / totalActivities) * 100 : 0;

  const movement = movementForActivityType(currentActivity?.type ?? "explanation");
  const railNodes = activities.map((a) => ({
    id: a.id,
    type: a.type,
    title: "title" in a.content ? a.content.title : a.type,
  }));

  return (
    <div
      className={cn(
        "flex h-full min-h-0 w-full flex-col overflow-hidden bg-lesson-bg text-lesson-text-primary",
        className,
      )}
      data-testid="canonical-lesson-player"
      style={movementVars(movement)}
    >
      <header className="relative z-20 shrink-0 border-b border-lesson-border bg-lesson-bg/80 px-4 py-3 backdrop-blur-sm sm:px-6">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4">
          <a
            href="/learn"
            className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-sm font-medium text-lesson-text-secondary transition-colors hover:bg-lesson-surface-subtle hover:text-lesson-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lesson-focus-ring"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Leave</span>
          </a>

          <MovementBadge movement={movement} />

          <div className="hidden min-w-0 flex-1 flex-col items-end text-right sm:flex">
            <p className="truncate text-xs font-medium text-lesson-text-muted">{lesson.title}</p>
            <p className="font-mono text-[11px] font-semibold text-lesson-text-secondary">
              {currentActivityIndex + 1}
              <span className="text-lesson-text-muted"> / {totalActivities}</span>
            </p>
          </div>
        </div>

        <div className="mx-auto mt-3 max-w-[1200px]">
          <MovementRail
            nodes={railNodes}
            currentIndex={currentActivityIndex}
            completedIds={session.completedActivityIds}
            onSelect={goToActivity}
          />
        </div>
      </header>

      <main
        ref={scrollContainerRef}
        className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pt-8 pb-36 sm:px-6 sm:pt-10 sm:pb-40 md:pb-40 lg:px-8"
      >
        {/* Ambient movement backdrop — a meaningful signal of the current
            movement's energy, not decoration. Shifts hue and intensity as the
            learner moves between orienting, forging, proving, reflecting. */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[420px] transition-opacity duration-700"
          style={{
            background:
              "radial-gradient(900px 380px at 50% -8%, var(--m-glow), transparent 70%)",
          }}
        />
        <div className="relative z-10 mx-auto flex min-h-full w-full max-w-[1200px] flex-col justify-start">
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
            {(currentActivity && "title" in currentActivity.content
              ? currentActivity.content.title
              : undefined) || `Activity ${currentActivityIndex + 1}`}
          </span>

          <div className="flex items-center gap-2">
            {!isInteractive || isCorrect ? (
              <Button
                onClick={handleActivityContinue}
                disabled={!currentActivity}
                style={{ backgroundColor: "var(--m-accent)", color: "var(--lesson-bg)" }}
                className="min-h-11 gap-2 rounded-lg px-6 text-sm font-semibold shadow-[0_6px_20px_var(--m-glow)] transition-transform hover:-translate-y-px hover:brightness-105 focus-visible:ring-2 focus-visible:ring-[var(--m-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-lesson-surface"
              >
                <span>{isLastActivity ? "Set the skill" : "Continue"}</span>
                {isLastActivity ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0" />
                )}
              </Button>
            ) : isIncorrect ? (
              <Button
                onClick={handleRetry}
                className="min-h-11 gap-2 px-6 text-sm font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-2 focus-visible:ring-rose-500 shadow-xs"
              >
                <RotateCcw className="h-4 w-4 shrink-0" />
                <span>Try Again</span>
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitted}
                style={{ backgroundColor: "var(--m-accent)", color: "var(--lesson-bg)" }}
                className="min-h-11 gap-2 rounded-lg px-6 text-sm font-semibold shadow-[0_6px_20px_var(--m-glow)] transition-transform hover:-translate-y-px hover:brightness-105 disabled:opacity-40 disabled:shadow-none disabled:hover:translate-y-0 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-[var(--m-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-lesson-surface"
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
