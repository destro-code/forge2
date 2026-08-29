import { useCallback, useRef } from "react";
import type { InteractiveCodeActivity } from "@/lib/curriculum/types";
import type { ActivityRendererProps } from "../../types";
import type { MarkupExperience } from "@/lib/curriculum/experience";
import { useExperienceController } from "../../runtime/use-experience-controller";
import { ActivityContainer } from "../../primitives/activity-container";
import { ActivityHeader } from "../../primitives/activity-header";
import { ActivityFeedback } from "../../primitives/activity-feedback";
import { ActivityActions } from "../../primitives/activity-actions";
import { LessonCodeEditor } from "@/components/shared/lesson-editor/lesson-code-editor";
import { ExperienceActionBar } from "./shared/experience-action-bar";
import { SandboxPreviewFrame } from "./shared/sandbox-preview-frame";
import { TestResultsPanel } from "./shared/test-results-panel";
import { Button } from "@/components/ui/button";
import { Lightbulb, FileCode2, MonitorPlay } from "lucide-react";

export interface HtmlExperienceRendererProps
  extends ActivityRendererProps<InteractiveCodeActivity, string> {
  experience: MarkupExperience;
}

/**
 * The document-building experience: "I am building a document." Editor and
 * rendered preview sit side by side so structure and result stay in view
 * together — the core mental model for markup.
 */
export function HtmlExperienceRenderer({
  activity,
  state,
  onResponse,
  onSubmit,
  onRetry,
  onContinue,
  onRevealHint,
  readOnly,
}: HtmlExperienceRendererProps) {
  const { starterCode, testCases } = activity.content;
  const taskTitle = activity.content.title || "Build the document";
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

  return (
    <ActivityContainer id={`activity-${activity.id}`} variant="workspace">
      <ActivityHeader activity={activity} onRevealHint={onRevealHint} hintsRemaining={hintsRemaining} />

      <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(220px,0.7fr)_minmax(0,1.3fr)]">
        <aside className="space-y-5">
          <div>
            <p className="text-xs font-medium text-lesson-text-muted">You are building a document</p>
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
                Your document should
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
              <FileCode2 className="h-4 w-4" />
              <span className="font-mono">html</span>
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
            language="html"
            onChange={(value) => onResponse(value || "")}
            readOnly={readOnly || isCorrect}
            className="min-h-[16rem] md:min-h-[20rem]"
            aria-label="HTML document editor"
            id={`lesson-code-editor-${activity.id}`}
          />

          <div className="flex items-center gap-2 text-xs font-semibold text-lesson-text-muted">
            <MonitorPlay className="h-3.5 w-3.5" />
            <span>Rendered document</span>
          </div>
          <SandboxPreviewFrame
            iframeRef={controller.iframeRef}
            title={controller.iframeTitle}
            sandbox={controller.iframeSandbox}
            ariaLabel="Rendered document preview"
            className="min-h-64"
          />

          {controller.hasExecuted && (
            <TestResultsPanel
              results={controller.testResults}
              successMessage={
                activity.feedback?.correct || "Your document meets every requirement."
              }
              failureMessage={
                activity.feedback?.incorrect ||
                "Review the requirements below and adjust your structure."
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
