import type {
  CanonicalActivity,
  ActivityValidationConfig,
  ActivityFeedback,
  ActivityEvidenceConfig,
  ActivityIntent,
} from "@/lib/curriculum/types";

export type ActivityInteractionStatus =
  "idle" | "active" | "submitted" | "correct" | "incorrect" | "completed";

export interface ActivityValidationResult {
  isValid: boolean;
  score?: number;
  feedbackMessage?: string;
  details?: Record<string, unknown>;
}

export interface ActivityInteractionState<TResponse = unknown> {
  status: ActivityInteractionStatus;
  response: TResponse;
  validationResult?: ActivityValidationResult;
  attempts: number;
  hintsRevealed: number;
  startedAt: number;
  submittedAt?: number;
}

export interface ActivityCompletionEvent<TResponse = unknown> {
  activityId: string;
  activityType: string;
  status: "passed" | "failed" | "completed";
  finalResponse: TResponse;
  validationResult?: ActivityValidationResult;
  metrics: {
    attempts: number;
    hintsRevealed: number;
    durationMs: number;
  };
  evidenceConfig?: ActivityEvidenceConfig;
}

export interface ActivityRendererProps<TActivity extends CanonicalActivity, TResponse = unknown> {
  activity: TActivity;
  state: ActivityInteractionState<TResponse>;
  onResponse: (response: TResponse) => void;
  onSubmit?: () => void;
  onRetry?: () => void;
  onContinue?: () => void;
  onRevealHint?: () => void;
  readOnly?: boolean;
  className?: string;
}

export type ActivityComponent<
  TActivity extends CanonicalActivity,
  TResponse = any,
> = React.ComponentType<ActivityRendererProps<TActivity, TResponse>>;
