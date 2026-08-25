import type { ActivityInteractionStatus } from "../types";

export interface ActivityActionsProps {
  status?: ActivityInteractionStatus;
  onSubmit?: () => void;
  onRetry?: () => void;
  onContinue?: () => void;
  canSubmit?: boolean;
  isInteractive?: boolean;
  submitLabel?: string;
  continueLabel?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * ActivityActions
 *
 * In accordance with the canonical lesson architecture, primary lesson actions
 * (Check Answer, Continue, Try Again, Complete lesson) are rendered EXCLUSIVELY
 * by the authoritative persistent footer in `canonical-lesson-player.tsx`.
 *
 * This primitive is preserved for interface compatibility and non-conflicting
 * secondary children/layout, but will NEVER render duplicate primary action buttons.
 */
export function ActivityActions({ children }: ActivityActionsProps) {
  if (!children) return null;
  return <div className="activity-secondary-actions">{children}</div>;
}
