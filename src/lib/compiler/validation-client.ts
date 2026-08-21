import { usePlaygroundStore } from "@/lib/stores/use-playground-store";
import type { ExerciseValidationSpec, ValidationReport } from "@/lib/types/validation";
import {
  isPlaygroundValidateResponse,
  isPlaygroundReady,
  isPlaygroundBuildError,
  type PlaygroundValidateRequestMessage,
} from "@/lib/types/validation-messages";

// Active pending validation requests mapped by requestId
const pendingRequests = new Map<
  string,
  {
    exerciseId: string;
    workspaceRevision: number;
    resolve: (report: ValidationReport) => void;
    reject: (err: Error) => void;
    timeoutId: NodeJS.Timeout;
  }
>();

// Single-listener initialization flag
let isGlobalValidationListenerInitialized = false;

function ensureValidationListener() {
  if (typeof window === "undefined" || isGlobalValidationListenerInitialized) return;

  window.addEventListener("message", (event: MessageEvent) => {
    if (!isPlaygroundValidateResponse(event.data)) return;

    // Security & isolation check: must originate from the mounted playground iframe
    const iframe = document.querySelector<HTMLIFrameElement>(
      "iframe[title='Forge Playground Live Preview']",
    );
    if (iframe && iframe.contentWindow && event.source !== iframe.contentWindow) {
      return;
    }

    const { requestId, report, workspaceRevision: resRevision } = event.data;
    const pending = pendingRequests.get(requestId);
    if (pending) {
      clearTimeout(pending.timeoutId);
      pendingRequests.delete(requestId);

      const currentStore = usePlaygroundStore.getState();

      // Check if the workspace revision or store state has mutated since this request was dispatched
      const isRevisionStale =
        pending.workspaceRevision !== undefined &&
        pending.workspaceRevision !== currentStore.workspaceRevision;

      if (!isRevisionStale) {
        currentStore.setValidationReport(report);
      }

      // If no other pending requests exist, clear isValidating
      if (pendingRequests.size === 0) {
        currentStore.setIsValidating(false);
      }

      pending.resolve(report);
    }
  });

  isGlobalValidationListenerInitialized = true;
}

/**
 * Helper to check if a MessageEvent source corresponds to an active Forge Playground preview iframe contentWindow.
 */
export function isEventFromActivePlaygroundPreview(event: MessageEvent): boolean {
  if (typeof document === "undefined" || !event.source) return false;
  const iframes = document.querySelectorAll<HTMLIFrameElement>(
    "iframe[title='Forge Playground Live Preview']",
  );
  for (let i = 0; i < iframes.length; i++) {
    if (iframes[i].contentWindow && event.source === iframes[i].contentWindow) {
      return true;
    }
  }
  return false;
}

/**
 * Deterministic synchronization barrier.
 * Waits for an active preview iframe to complete its compilation, module execution, and DOM/React mount.
 * Resolves only when an active preview iframe matching the target workspace revision reports PLAYGROUND_READY.
 * Rejects if the runtime encounters a build/runtime initialization error or times out.
 */
export function waitForIframeReady(
  workspaceRevision: number,
  timeoutMs: number = 7000,
  targetIframe?: HTMLIFrameElement | null,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let timeoutId: NodeJS.Timeout | null = null;
    let isSettled = false;

    const cleanup = () => {
      isSettled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (typeof window !== "undefined") {
        window.removeEventListener("message", handleMessage);
      }
    };

    const handleMessage = (event: MessageEvent) => {
      if (isSettled) return;

      // Authenticity & isolation check:
      // Must originate from an active preview iframe currently in the DOM,
      // or specifically the targetIframe if it is still mounted and alive.
      const isAuthenticPreviewSource = targetIframe?.contentWindow
        ? event.source === targetIframe.contentWindow || isEventFromActivePlaygroundPreview(event)
        : isEventFromActivePlaygroundPreview(event);

      if (!isAuthenticPreviewSource) {
        return;
      }

      // Check for Build / Runtime Error message
      if (isPlaygroundBuildError(event.data)) {
        if (
          event.data.workspaceRevision !== undefined &&
          event.data.workspaceRevision !== workspaceRevision
        ) {
          return;
        }

        cleanup();
        reject(
          new Error(
            event.data.message ||
              "Playground runtime encountered a compilation or initialization error.",
          ),
        );
        return;
      }

      // Check for READY message
      if (isPlaygroundReady(event.data)) {
        // Revision check: if specified and does not match the target workspace revision, ignore stale ready
        if (
          event.data.workspaceRevision !== undefined &&
          event.data.workspaceRevision !== workspaceRevision
        ) {
          return;
        }

        cleanup();
        resolve();
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("message", handleMessage);
    }

    timeoutId = setTimeout(() => {
      if (isSettled) return;
      cleanup();
      reject(
        new Error(
          `Timed out waiting for playground iframe ready signal (revision ${workspaceRevision}, ${timeoutMs}ms).`,
        ),
      );
    }, timeoutMs);
  });
}

/**
 * Cancels all active pending validation requests.
 * Useful when switching exercises, resetting workspace, or unmounting.
 */
export function cancelPendingValidationRequests() {
  pendingRequests.forEach(({ timeoutId, resolve, exerciseId }) => {
    clearTimeout(timeoutId);
    resolve({
      exerciseId,
      status: "failed",
      results: [
        {
          assertionId: "validation-cancelled",
          description: "Validation request cancelled",
          status: "failed",
          errorMessage: "Validation request cancelled due to workspace or exercise switch.",
          durationMs: 0,
        },
      ],
      passedCount: 0,
      totalRequired: 1,
      timestamp: Date.now(),
    });
  });
  pendingRequests.clear();
  usePlaygroundStore.getState().setIsValidating(false);
}

/**
 * Triggers a validation run inside the active mounted preview iframe.
 * Correlates the response via a unique requestId and returns a Promise with the ValidationReport.
 */
export async function requestPlaygroundValidation(
  exerciseId: string,
  validationSpec: ExerciseValidationSpec,
  timeoutMs: number = 6000,
): Promise<ValidationReport> {
  ensureValidationListener();

  const iframe = document.querySelector<HTMLIFrameElement>(
    "iframe[title='Forge Playground Live Preview']",
  );

  const currentRevision = usePlaygroundStore.getState().workspaceRevision;

  if (!iframe || !iframe.contentWindow) {
    const errorReport: ValidationReport = {
      exerciseId,
      status: "failed",
      results: [
        {
          assertionId: "no-iframe-instance",
          description: "Preview iframe mounted check",
          status: "failed",
          errorMessage: "Playground preview iframe is not mounted or ready.",
          durationMs: 0,
        },
      ],
      passedCount: 0,
      totalRequired: validationSpec.assertions.filter((a) => !a.isOptional).length,
      timestamp: Date.now(),
    };
    usePlaygroundStore.getState().setValidationReport(errorReport);
    usePlaygroundStore.getState().setIsValidating(false);
    return errorReport;
  }

  const requestId = `val-req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  usePlaygroundStore.getState().setIsValidating(true);

  return new Promise<ValidationReport>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      pendingRequests.delete(requestId);
      if (pendingRequests.size === 0) {
        usePlaygroundStore.getState().setIsValidating(false);
      }
      const timeoutReport: ValidationReport = {
        exerciseId,
        status: "failed",
        results: [
          {
            assertionId: "validation-timeout",
            description: "Validation response timeout",
            status: "failed",
            errorMessage: `Validation timed out after ${timeoutMs}ms without response from iframe.`,
            durationMs: timeoutMs,
          },
        ],
        passedCount: 0,
        totalRequired: validationSpec.assertions.filter((a) => !a.isOptional).length,
        timestamp: Date.now(),
      };
      if (usePlaygroundStore.getState().workspaceRevision === currentRevision) {
        usePlaygroundStore.getState().setValidationReport(timeoutReport);
      }
      resolve(timeoutReport);
    }, timeoutMs);

    pendingRequests.set(requestId, {
      exerciseId,
      workspaceRevision: currentRevision,
      resolve,
      reject,
      timeoutId,
    });

    const msg: PlaygroundValidateRequestMessage = {
      type: "PLAYGROUND_VALIDATE_REQUEST",
      requestId,
      exerciseId,
      validationSpec,
      workspaceRevision: currentRevision,
    };

    iframe.contentWindow?.postMessage(msg, "*");
  });
}
