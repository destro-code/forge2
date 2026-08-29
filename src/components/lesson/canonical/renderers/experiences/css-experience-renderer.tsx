import { useCallback, useMemo, useRef } from "react";
import type { InteractiveCodeActivity } from "@/lib/curriculum/types";
import type { ActivityRendererProps } from "../../types";
import type { CssExperience } from "@/lib/curriculum/experience";
import { useExperienceController } from "../../runtime/use-experience-controller";
import { parseCssRules } from "../../validation";
import { ActivityContainer } from "../../primitives/activity-container";
import { ActivityHeader } from "../../primitives/activity-header";
import { ActivityFeedback } from "../../primitives/activity-feedback";
import { ActivityActions } from "../../primitives/activity-actions";
import { LessonCodeEditor } from "@/components/shared/lesson-editor/lesson-code-editor";
import { ExperienceActionBar } from "./shared/experience-action-bar";
import { SandboxPreviewFrame } from "./shared/sandbox-preview-frame";
import { TestResultsPanel } from "./shared/test-results-panel";
import { Button } from "@/components/ui/button";
import { Lightbulb, Paintbrush, MonitorPlay } from "lucide-react";

export interface CssExperienceRendererProps
  extends ActivityRendererProps<InteractiveCodeActivity, string> {
  experience: CssExperience;
}

/**
 * The styling experience: "I am styling this interface." The rendered
 * result stays permanently visible next to the CSS source — never behind a
 * tab — with a lightweight parsed-rules panel surfacing only what the CSS
 * validation strategy actually checks.
 */
export function CssExperienceRenderer({
  activity,
  state,
  onResponse,
  onSubmit,
  onRetry,
  onContinue,
  onRevealHint,
  readOnly,
  experience,
}: CssExperienceRendererProps) {
  const { starterCode, testCases } = activity.content;
  const taskTitle = activity.content.title || "Style the interface";
  const taskInstructions = activity.content.instructions || activity.content.prompt || "";
  const currentCode = typeof state.response === "string" ? state.response : starterCode;

  const sourceRef = useRef(currentCode);
  sourceRef.current = currentCode;
  const getSource = useCallback(() => sourceRef.current, []);

  const controller = useExperienceController({ activity, getSource });
  const isCorrect = state.status === "correct" || state.status === "completed";
  const resolvedHints = activity.feedback?.hints || activity.content?.hints;
  const hintsRemaining = (resolvedHints?.length || 0) - state.hintsRevealed;

  const handleReset = useCallback(() => {
    controller.reset();
    onResponse(starterCode);
  }, [controller, onResponse, starterCode]);

  // Only the rules the learner actually authored, honestly reflecting what
  // the sandbox's computed-style validation strategy inspects — never a
  // fabricated browser computed-style read.
  const parsedRules = useMemo(() => parseCssRules(currentCode), [currentCode]);
  const parsedSelectors = Object.keys(parsedRules);

  return (
    <ActivityContainer id={`activity-${activity.id}`} variant="workspace">
      <ActivityHeader activity={activity} onRevealHint={onRevealHint} hintsRemaining={hintsRemaining} />

      <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(220px,0.7fr)_minmax(0,1.3fr)]">
        <aside className="space-y-5">
          <div>
            <p className="text-xs font-medium text-lesson-text-muted">You are styling this interface</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-lesson-text-primary">
              {taskTitle}
            </h2>
          </div>
          {taskInstructions ? (
            <p className="whitespace-pre-wrap text-sm leading-7 text-lesson-text-secondary">
              {taskInstructions}
            </p>
          ) : null}
          {testCases && testCases.length > 0 && (
            <div className="space-y-2 border-t border-lesson-border/60 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-lesson-text-muted">
                Your styles should
              </p>
              <div className="space-y-1.5">
                {testCases.map((tc, idx) => (
                  <div
                    key={tc.id || idx}
                    className="flex items-start gap-2 text-xs leading-relaxed text-lesson-text-secondary"
                  >
                    <span className="mt-0.5 select-none font-mono text-lesson-accent">•</span>
                    <span>{tc.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {parsedSelectors.length > 0 && (
            <div className="space-y-2 border-t border-lesson-border/60 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-lesson-text-muted">
                Rules you&apos;ve written
              </p>
              <div className="space-y-2">
                {parsedSelectors.map((selector) => (
                  <div key={selector} className="rounded-lg border border-lesson-border/60 p-2.5">
                    <p className="font-mono text-xs font-semibold text-lesson-accent">{selector}</p>
                    <div className="mt-1 space-y-0.5">
                      {Object.entries(parsedRules[selector]).map(([prop, val]) => (
                        <p key={prop} className="font-mono text-[11px] text-lesson-text-secondary">
                          {prop}: {val}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {onRevealHint && hintsRemaining > 0 && (
            <Button
              variant="ghost"
              onClick={onRevealHint}
              className="min-h-11 w-full justify-start gap-2 px-3 text-sm text-lesson-text-secondary hover:bg-lesson-surface hover:text-lesson-text-primary"
            >
              <Lightbulb className="h-4 w-4" />
              Hint · {hintsRemaining} remaining
            </Button>
          )}
        </aside>

        <section className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-lesson-border pb-2">
            <div className="flex items-center gap-2 text-xs text-lesson-text-muted">
              <Paintbrush className="h-4 w-4" />
              <span className="font-mono">css</span>
            </div>
            <ExperienceActionBar
              onRun={controller.run}
              onCheck={controller.check}
              onReset={handleReset}
              isRunning={controller.isRunning}
              isLocked={isCorrect}
              disabled={readOnly || !currentCode}
            />
          </div>

          {/* The visual result stays visible at all times — this is the
              point of the CSS experience, so it never sits behind a tab. */}
          <div className="flex items-center gap-2 text-xs font-semibold text-lesson-text-muted">
            <MonitorPlay className="h-3.5 w-3.5" />
            <span>Live preview</span>
          </div>
          <SandboxPreviewFrame
            iframeRef={controller.iframeRef}
            title={controller.iframeTitle}
            sandbox={controller.iframeSandbox}
            ariaLabel="Styled preview"
            className="min-h-56"
          />

          <LessonCodeEditor
            value={currentCode}
            language="css"
            onChange={(value) => onResponse(value || "")}
            readOnly={readOnly || isCorrect}
            className="min-h-[14rem] md:min-h-[18rem]"
            aria-label="CSS editor"
            id={`lesson-code-editor-${activity.id}`}
          />

          {controller.hasExecuted && (
            <TestResultsPanel
              results={controller.testResults}
              successMessage={activity.feedback?.correct || "Every style requirement is met."}
              failureMessage={
                activity.feedback?.incorrect ||
                "Review the requirements below and adjust your rules."
              }
            />
          )}
        </section>
      </div>

      <ActivityFeedback
        status={state.status}
        validationResult={state.validationResult}
        hints={resolvedHints}
        hintsRevealed={state.hintsRevealed}
      />
      <ActivityActions
        status={state.status}
        onSubmit={onSubmit}
        onRetry={onRetry}
        onContinue={onContinue}
        canSubmit={Boolean(currentCode)}
      />
    </ActivityContainer>
  );
}
