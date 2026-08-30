import { useCallback, useEffect, useMemo, useState } from "react";
import { Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LessonCodeEditor } from "@/components/shared/lesson-editor/lesson-code-editor";
import { SandboxPreviewFrame } from "@/components/lesson/canonical/renderers/experiences/shared/sandbox-preview-frame";
import { useExperienceController } from "@/components/lesson/canonical/runtime/use-experience-controller";
import type { RuntimeSourceActivity } from "@/lib/compiler/canonical-runtime-service";
import type { SandboxExperimentExperience } from "@/lib/lesson-experience/types";

interface SandboxExperimentRendererProps {
  experience: SandboxExperimentExperience;
  onRunExecuted: () => void;
}

export function SandboxExperimentRenderer({
  experience,
  onRunExecuted,
}: SandboxExperimentRendererProps) {
  const { heading, instructions, starterSource } = experience.content;
  const [source, setSource] = useState(starterSource);
  const sourceRef = useCallback((value: string) => setSource(value), []);
  const activity = useMemo<RuntimeSourceActivity>(
    () => ({
      id: experience.id,
      type: "interactive-code",
      content: { title: heading, language: "javascript", starterCode: source },
    }),
    [experience.id, heading, source],
  );
  const runtime = useExperienceController({ activity, getSource: () => source });

  function handleRun() {
    runtime.run();
  }

  // Completion is emitted only after the canonical runtime reports execution.
  useEffect(() => {
    if (runtime.hasExecuted) onRunExecuted();
  }, [runtime.hasExecuted, onRunExecuted]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 className="font-serif text-2xl font-semibold text-lesson-text-primary text-balance">
          {heading}
        </h2>
        <p className="text-sm leading-relaxed text-lesson-text-secondary">{instructions}</p>
      </div>

      <LessonCodeEditor
        value={source}
        onChange={sourceRef}
        language="javascript"
        aria-label="Sandbox code editor"
        className="min-h-[160px] p-3"
      />
      <SandboxPreviewFrame
        iframeRef={runtime.iframeRef}
        title={runtime.iframeTitle}
        sandbox={runtime.iframeSandbox}
        ariaLabel="Sandbox execution frame"
        visuallyHidden
      />

      <div className="flex items-center gap-3">
        <Button type="button" onClick={handleRun} disabled={runtime.isRunning} size="sm">
          {runtime.isRunning ? <Loader2 className="animate-spin" /> : <Play />}
          Run
        </Button>
        {runtime.hasExecuted ? (
          <span className="text-xs text-lesson-text-muted">Executed in Forge&apos;s sandbox.</span>
        ) : null}
      </div>

      <div className="min-h-[64px] rounded-lg border border-lesson-border bg-lesson-bg p-3">
        {runtime.buildError ? (
          <div className="font-mono text-xs text-lesson-error-text">{runtime.buildError}</div>
        ) : runtime.consoleOutput.length === 0 ? (
          <div className="font-mono text-xs text-lesson-text-muted">
            Console output will appear here.
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {runtime.consoleOutput.map((line, index) => (
              <div key={`${line}-${index}`} className="font-mono text-xs text-lesson-text-primary">
                {line}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
