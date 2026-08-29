import { useCallback, useRef } from "react";
import type { InteractiveCodeActivity } from "@/lib/curriculum/types";
import type { ActivityRendererProps } from "../../types";
import type { JavaScriptExperience } from "@/lib/curriculum/experience";
import { useExperienceController } from "../../runtime/use-experience-controller";
import { ActivityContainer } from "../../primitives/activity-container";
import { ActivityHeader } from "../../primitives/activity-header";
import { ActivityFeedback } from "../../primitives/activity-feedback";
import { ActivityActions } from "../../primitives/activity-actions";
import { LessonCodeEditor } from "@/components/shared/lesson-editor/lesson-code-editor";
import { ExperienceActionBar } from "./shared/experience-action-bar";
import { SandboxPreviewFrame } from "./shared/sandbox-preview-frame";
import { ConsolePanel } from "./shared/console-panel";
import { TestResultsPanel } from "./shared/test-results-panel";
import { Button } from "@/components/ui/button";
import { Lightbulb, Terminal } from "lucide-react";

export interface JavaScriptExperienceRendererProps
  extends ActivityRendererProps<InteractiveCodeActivity, string> {
  experience: JavaScriptExperience;
}

/**
 * The execution experience: "I am running code and observing what it
 * does." The console is the primary, first-class feedback surface. A DOM
 * preview only appears when the resolved experience actually declares one
 * (i.e. curriculum supplies an `htmlFixture`) — otherwise no preview chrome
 * is shown at all.
 */
export function JavaScriptExperienceRenderer({
  activity,
  state,
  onResponse,
  onSubmit,
  onRetry,
  onContinue,
  onRevealHint,
  readOnly,
  experience,
}: JavaScriptExperienceRendererProps) {
  const { starterCode, testCases } = activity.content;
  const taskTitle = activity.content.title || "Run the code";
  const taskInstructions = activity.content.instructions || activity.content.prompt || "";
  const currentCode = typeof state.response === "string" ? state.response : starterCode;
  const hasPreview = experience.output.preview;

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

  return (
    <ActivityContainer id={`activity-${activity.id}`} variant="workspace">
      <ActivityHeader activity={activity} onRevealHint={onRevealHint} hintsRemaining={hintsRemaining} />

      <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(220px,0.7fr)_minmax(0,1.3fr)]">
        <aside className="space-y-5">
          <div>
            <p className="text-xs font-medium text-lesson-text-muted">You are running code</p>
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
                Your code should
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
              <Terminal className="h-4 w-4" />
              <span className="font-mono">javascript</span>
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

          <LessonCodeEditor
            value={currentCode}
            language="javascript"
            onChange={(value) => onResponse(value || "")}
            readOnly={readOnly || isCorrect}
            className="min-h-[14rem] md:min-h-[18rem]"
            aria-label="JavaScript editor"
            id={`lesson-code-editor-${activity.id}`}
          />

          {/* The sandbox always executes here, whether or not a visual
              preview is shown — this iframe is the actual execution host. */}
          <SandboxPreviewFrame
            iframeRef={controller.iframeRef}
            title={controller.iframeTitle}
            sandbox={controller.iframeSandbox}
            ariaLabel={hasPreview ? "Script preview" : "Secure JavaScript execution sandbox"}
            visuallyHidden={!hasPreview}
            label={hasPreview ? "Preview" : undefined}
            className={hasPreview ? "min-h-48" : undefined}
          />

          <ConsolePanel output={controller.consoleOutput} buildError={controller.buildError} prominent />

          {controller.hasExecuted && controller.testResults.length > 0 && (
            <TestResultsPanel
              results={controller.testResults}
              successMessage={activity.feedback?.correct || "Your code behaves as expected."}
              failureMessage={
                activity.feedback?.incorrect ||
                "Review the requirements below and adjust your logic."
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
