import type { ExerciseValidationSpec } from "@/lib/types/validation";
import type { ValidationReport } from "@/lib/types/validation";

/**
 * Message sent from parent window to playground iframe to trigger validation.
 */
export interface PlaygroundValidateRequestMessage {
  type: "PLAYGROUND_VALIDATE_REQUEST";
  requestId: string;
  exerciseId: string;
  validationSpec: ExerciseValidationSpec;
  workspaceRevision?: number;
}

/**
 * Message sent from playground iframe to parent window containing the completed validation report.
 */
export interface PlaygroundValidateResponseMessage {
  type: "PLAYGROUND_VALIDATE_RESPONSE";
  requestId: string;
  exerciseId: string;
  report: ValidationReport;
  workspaceRevision?: number;
}

/**
 * Type guard for incoming validate request message in iframe.
 */
export function isPlaygroundValidateRequest(
  data: unknown,
): data is PlaygroundValidateRequestMessage {
  if (!data || typeof data !== "object") return false;
  const msg = data as Record<string, unknown>;
  return (
    msg.type === "PLAYGROUND_VALIDATE_REQUEST" &&
    typeof msg.requestId === "string" &&
    typeof msg.exerciseId === "string" &&
    typeof msg.validationSpec === "object" &&
    msg.validationSpec !== null &&
    Array.isArray((msg.validationSpec as Record<string, unknown>).assertions) &&
    (msg.workspaceRevision === undefined || typeof msg.workspaceRevision === "number")
  );
}

/**
 * Type guard for incoming validate response message in parent.
 */
export function isPlaygroundValidateResponse(
  data: unknown,
): data is PlaygroundValidateResponseMessage {
  if (!data || typeof data !== "object") return false;
  const msg = data as Record<string, unknown>;
  return (
    msg.type === "PLAYGROUND_VALIDATE_RESPONSE" &&
    typeof msg.requestId === "string" &&
    typeof msg.exerciseId === "string" &&
    typeof msg.report === "object" &&
    msg.report !== null &&
    (msg.workspaceRevision === undefined || typeof msg.workspaceRevision === "number")
  );
}

/**
 * Message sent from playground iframe to parent when runtime has mounted and is ready for interaction/validation.
 */
export interface PlaygroundReadyMessage {
  type: "PLAYGROUND_READY";
  workspaceRevision?: number;
}

/**
 * Message sent from playground iframe to parent when compilation or runtime initialization fails.
 */
export interface PlaygroundConsoleMessage {
  type: "PLAYGROUND_CONSOLE";
  level: "log" | "info" | "warn" | "error";
  message: string;
  workspaceRevision?: number;
}

export function isPlaygroundConsoleMessage(data: unknown): data is PlaygroundConsoleMessage {
  if (!data || typeof data !== "object") return false;
  const msg = data as Record<string, unknown>;
  return (
    msg.type === "PLAYGROUND_CONSOLE" &&
    (msg.level === "log" || msg.level === "info" || msg.level === "warn" || msg.level === "error") &&
    typeof msg.message === "string" &&
    (msg.workspaceRevision === undefined || typeof msg.workspaceRevision === "number")
  );
}

export interface PlaygroundBuildErrorMessage {
  type: "PLAYGROUND_BUILD_ERROR";
  message: string;
  errorType?: string;
  file?: string;
  line?: number;
  column?: number;
  workspaceRevision?: number;
}

/**
 * Type guard for incoming ready message in parent.
 */
export function isPlaygroundReady(data: unknown): data is PlaygroundReadyMessage {
  if (!data || typeof data !== "object") return false;
  const msg = data as Record<string, unknown>;
  return (
    msg.type === "PLAYGROUND_READY" &&
    (msg.workspaceRevision === undefined || typeof msg.workspaceRevision === "number")
  );
}

/**
 * Type guard for incoming build/runtime error message in parent.
 */
export function isPlaygroundBuildError(data: unknown): data is PlaygroundBuildErrorMessage {
  if (!data || typeof data !== "object") return false;
  const msg = data as Record<string, unknown>;
  return (
    msg.type === "PLAYGROUND_BUILD_ERROR" &&
    typeof msg.message === "string" &&
    (msg.workspaceRevision === undefined || typeof msg.workspaceRevision === "number")
  );
}
