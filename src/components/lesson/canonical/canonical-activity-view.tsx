import { useState, useCallback, useEffect } from "react";
import type { CanonicalActivity } from "@/lib/curriculum/types";
import type { ActivityInteractionState, ActivityValidationResult } from "./types";
import { getActivityRenderer } from "./registry";
import { evaluateActivityValidation } from "./validation";

export interface CanonicalActivityViewProps {
  activity: CanonicalActivity;
  onComplete?: (result?: ActivityValidationResult) => void;
  onResponseChange?: (response: unknown) => void;
  readOnly?: boolean;
  className?: string;
}

export function CanonicalActivityView({
  activity,
  onComplete,
  onResponseChange,
  readOnly,
  className,
}: CanonicalActivityViewProps) {
  const [state, setState] = useState<ActivityInteractionState<unknown>>({
    status: "idle",
    response: undefined,
    validationResult: undefined,
    attempts: 0,
    hintsRevealed: 0,
    startedAt: Date.now(),
  });

  // Reset state on activity change
  useEffect(() => {
    setState({
      status: "idle",
      response: undefined,
      validationResult: undefined,
      attempts: 0,
      hintsRevealed: 0,
      startedAt: Date.now(),
    });
  }, [activity.id]);

  const handleResponse = useCallback(
    (newResponse: unknown) => {
      setState((prev) => ({
        ...prev,
        response: newResponse,
        status: prev.status === "idle" ? "active" : prev.status,
      }));
      onResponseChange?.(newResponse);
    },
    [onResponseChange],
  );

  const handleSubmit = useCallback(() => {
    setState((prev) => {
      const valResult = evaluateActivityValidation(activity, prev.response);
      const isCorrect = valResult.isValid;

      return {
        ...prev,
        status: isCorrect ? "correct" : "incorrect",
        validationResult: valResult,
        attempts: prev.attempts + 1,
        submittedAt: Date.now(),
      };
    });
  }, [activity]);

  const handleRetry = useCallback(() => {
    setState((prev) => ({
      ...prev,
      status: "active",
      validationResult: undefined,
    }));
  }, []);

  const handleContinue = useCallback(() => {
    setState((prev) => ({
      ...prev,
      status: "completed",
    }));
    onComplete?.(state.validationResult);
  }, [onComplete, state.validationResult]);

  const handleRevealHint = useCallback(() => {
    const maxHints = activity.hints?.length || 0;
    setState((prev) => ({
      ...prev,
      hintsRevealed: Math.min(prev.hintsRevealed + 1, maxHints),
    }));
  }, [activity.hints]);

  // Lookup the renderer component in the registry
  const RendererComponent = getActivityRenderer(activity.type);

  return (
    <div className={className}>
      <RendererComponent
        activity={activity}
        state={state}
        onResponse={handleResponse}
        onSubmit={handleSubmit}
        onRetry={handleRetry}
        onContinue={handleContinue}
        onRevealHint={handleRevealHint}
        readOnly={readOnly}
      />
    </div>
  );
}
