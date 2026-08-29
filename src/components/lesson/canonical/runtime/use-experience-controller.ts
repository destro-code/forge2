import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import {
  compileCanonicalRuntime,
  createCanonicalValidationRequest,
  mapCanonicalValidation,
  canonicalRuntimeError,
  CANONICAL_IFRAME_TITLE,
  type RuntimeSourceActivity,
} from "@/lib/compiler/canonical-runtime-service";
import { SandboxRuntimeHost, CANONICAL_IFRAME_SANDBOX } from "@/lib/compiler/sandbox-runtime-host";
import {
  isPlaygroundReady,
  isPlaygroundBuildError,
  isPlaygroundConsoleMessage,
  isPlaygroundValidateResponse,
} from "@/lib/types/validation-messages";
import type { ActivityValidationResult } from "../types";

export interface ExperienceTestResult {
  id: string;
  description: string;
  passed: boolean;
  error?: string;
}

export interface UseExperienceControllerOptions {
  /** The activity backing the sandboxed runtime (interactive-code or debug). */
  activity: RuntimeSourceActivity;
  /** Reads the learner's *current* source at the moment Run/Check fires. */
  getSource: () => string;
}

export interface ExperienceController {
  /** Attach to the sandboxed <iframe>. */
  iframeRef: RefObject<HTMLIFrameElement | null>;
  iframeTitle: string;
  /** Always exactly "allow-scripts allow-modals" — never allow-same-origin. */
  iframeSandbox: string;

  isRunning: boolean;
  hasExecuted: boolean;
  consoleOutput: string[];
  testResults: ExperienceTestResult[];
  /** Only populated after Check — Run never produces a technical result. */
  technicalResult?: ActivityValidationResult;
  buildError?: string;

  /** Execute the learner's current source. Exploratory — never submits or completes. */
  run: () => void;
  /** Execute + run sandboxed assertions, producing a technical result. Never completes the activity. */
  check: () => void;
  /** Invalidate any in-flight request, dispose the current sandbox, and clear all execution state. */
  reset: () => void;
}

/**
 * Shared orchestration layer for every executable (sandboxed) learner
 * experience — currently `interactive-code` and `debug` activities.
 *
 * Owns the iframe ref, `SandboxRuntimeHost` lifecycle, workspace revision,
 * request identity, and stale-message rejection so renderers never touch
 * the sandbox protocol or construct compiler manifests directly.
 *
 * Run/Check/Reset semantics (see v0_plans/visionary-flow.md, Phase B):
 * - Run executes what the learner currently wrote. It never calls
 *   `onSubmit`, never marks anything complete, and never invokes Check
 *   semantics.
 * - Check technically evaluates the current work (compiles, executes,
 *   runs sandboxed assertions) and exposes a technical result. It does
 *   NOT directly complete the activity — "Check Answer" / the learning
 *   engine remains the sole authority for completion, and callers must
 *   still call `onSubmit` themselves if they want that to happen.
 * - Reset guarantees a genuinely fresh runtime: it bumps the workspace
 *   revision (so any late message from the previous runtime is rejected
 *   by `SandboxRuntimeHost`'s revision filter), disposes the current
 *   sandbox host, and clears console/error/validation/technical state.
 *   Restoring the editor's starter source remains the caller's
 *   responsibility (renderers already own `onResponse`).
 */
export function useExperienceController({
  activity,
  getSource,
}: UseExperienceControllerOptions): ExperienceController {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hostRef = useRef<SandboxRuntimeHost | null>(null);
  const revisionRef = useRef(0);
  const pendingRequestRef = useRef<string | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<ExperienceTestResult[]>([]);
  const [technicalResult, setTechnicalResult] = useState<ActivityValidationResult | undefined>(
    undefined,
  );
  const [buildError, setBuildError] = useState<string | undefined>(undefined);

  const disposeHost = useCallback(() => {
    hostRef.current?.dispose();
    hostRef.current = null;
  }, []);

  const execute = useCallback(
    (validate: boolean) => {
      const iframe = iframeRef.current;
      if (!iframe) return;

      // A fresh revision + a disposed previous host means any message still
      // in flight from the old sandbox will be rejected by the new host's
      // (or nobody's) revision filter — see SandboxRuntimeHost.
      disposeHost();
      pendingRequestRef.current = null;
      setIsRunning(true);
      setConsoleOutput([]);
      setTestResults([]);
      setTechnicalResult(undefined);
      setBuildError(undefined);

      const revision = ++revisionRef.current;
      const source = getSource();

      try {
        const report = compileCanonicalRuntime(activity, source, revision);
        const request = validate
          ? createCanonicalValidationRequest(activity, revision, source)
          : null;
        pendingRequestRef.current = request?.requestId ?? null;

        const host = new SandboxRuntimeHost({
          iframe,
          workspaceRevision: revision,
          onMessage: (event) => {
            if (isPlaygroundConsoleMessage(event.data)) {
              setConsoleOutput((previous) =>
                [...previous, `[${event.data.level}] ${event.data.message}`].slice(-50),
              );
              return;
            }
            if (isPlaygroundReady(event.data)) {
              if (request) {
                iframe.contentWindow?.postMessage(request, "*");
              } else {
                setIsRunning(false);
                host.dispose();
              }
              return;
            }
            if (
              isPlaygroundValidateResponse(event.data) &&
              event.data.requestId === pendingRequestRef.current
            ) {
              const result = mapCanonicalValidation(event.data.report);
              setTechnicalResult(result);
              setTestResults(
                event.data.report.results.map((item, index) => ({
                  id: item.assertionId ?? `test-${index}`,
                  description: item.description,
                  passed: item.status === "passed",
                  error: item.errorMessage,
                })),
              );
              setIsRunning(false);
              host.dispose();
              return;
            }
            if (isPlaygroundBuildError(event.data)) {
              setBuildError(event.data.message);
              setConsoleOutput((previous) => [...previous, event.data.message]);
              setIsRunning(false);
              host.dispose();
            }
          },
        });

        hostRef.current = host;
        // Register the listener before assigning srcdoc so a fast runtime
        // cannot emit PLAYGROUND_READY before the host is listening.
        host.mount();
        iframe.srcdoc = report.outputHtml;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Runtime error";
        setBuildError(message);
        setConsoleOutput([message]);
        if (validate) {
          const { result } = canonicalRuntimeError(activity.id, error);
          setTechnicalResult(result);
        }
        setIsRunning(false);
      }
    },
    [activity, getSource, disposeHost],
  );

  const run = useCallback(() => execute(false), [execute]);
  const check = useCallback(() => execute(true), [execute]);

  const reset = useCallback(() => {
    revisionRef.current += 1;
    pendingRequestRef.current = null;
    disposeHost();
    setIsRunning(false);
    setConsoleOutput([]);
    setTestResults([]);
    setTechnicalResult(undefined);
    setBuildError(undefined);
  }, [disposeHost]);

  // Invalidate and dispose whenever the activity itself changes/unmounts —
  // an old iframe must never be able to update a new activity's state.
  useEffect(() => {
    return () => {
      revisionRef.current += 1;
      pendingRequestRef.current = null;
      disposeHost();
    };
  }, [activity.id, disposeHost]);

  const hasExecuted =
    consoleOutput.length > 0 ||
    testResults.length > 0 ||
    Boolean(technicalResult) ||
    Boolean(buildError);

  return {
    iframeRef,
    iframeTitle: CANONICAL_IFRAME_TITLE,
    iframeSandbox: CANONICAL_IFRAME_SANDBOX,
    isRunning,
    hasExecuted,
    consoleOutput,
    testResults,
    technicalResult,
    buildError,
    run,
    check,
    reset,
  };
}
