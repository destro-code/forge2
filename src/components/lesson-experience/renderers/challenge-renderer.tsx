import { useCallback, useEffect, useMemo, useState } from "react";
import { Play, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LessonCodeEditor } from "@/components/shared/lesson-editor/lesson-code-editor";
import { SandboxPreviewFrame } from "@/components/lesson/canonical/renderers/experiences/shared/sandbox-preview-frame";
import { useExperienceController } from "@/components/lesson/canonical/runtime/use-experience-controller";
import type { RuntimeSourceActivity } from "@/lib/compiler/canonical-runtime-service";
import { cn } from "@/lib/utils";
import type {
  ChallengeExperience,
  ExperienceValidationResult,
} from "@/lib/lesson-experience/types";

interface ChallengeRendererProps {
  experience: ChallengeExperience;
  isPassed: boolean;
  onValidated: (result: ExperienceValidationResult) => void;
}

export function ChallengeRenderer({ experience, isPassed, onValidated }: ChallengeRendererProps) {
  const { heading, instructions, starterSource, testCases } = experience.content;
  const [source, setSource] = useState(starterSource);
  const sourceRef = useCallback((value: string) => setSource(value), []);
  const activity = useMemo<RuntimeSourceActivity>(
    () => ({
      id: experience.id,
      type: "interactive-code",
      content: {
        title: heading,
        language: "javascript",
        starterCode: source,
        testCases: testCases.map((test) => ({
          id: test.id,
          description: test.description,
          assertion: test.expression,
        })),
      },
    }),
    [experience.id, heading, source, testCases],
  );
  const runtime = useExperienceController({ activity, getSource: () => source });

  function handleCheck() {
    runtime.check();
    onValidated({ isValid: false, message: "Checking your code…" });
  }

  const results = runtime.testResults;
  const passed = runtime.technicalResult?.isValid === true;
  useEffect(() => {
    if (runtime.technicalResult) onValidated(runtime.technicalResult);
  }, [runtime.technicalResult, onValidated]);

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
        aria-label="Challenge code editor"
        className="min-h-[140px] p-3"
        readOnly={isPassed}
      />
      <SandboxPreviewFrame
        iframeRef={runtime.iframeRef}
        title={runtime.iframeTitle}
        sandbox={runtime.iframeSandbox}
        ariaLabel="Challenge execution frame"
        visuallyHidden
      />
      <Button
        type="button"
        onClick={handleCheck}
        disabled={runtime.isRunning || isPassed}
        size="sm"
        className="self-start"
      >
        {runtime.isRunning ? <Loader2 className="animate-spin" /> : <Play />} Check
      </Button>
      {runtime.buildError ? (
        <div className="rounded-lg border border-lesson-error-border bg-lesson-error-bg p-3 font-mono text-xs text-lesson-error-text">
          {runtime.buildError}
        </div>
      ) : null}
      {results.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {results.map((result) => (
            <li
              key={result.id}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                result.passed
                  ? "border-lesson-success-border bg-lesson-success-bg text-lesson-success-text"
                  : "border-lesson-error-border bg-lesson-error-bg text-lesson-error-text",
              )}
            >
              {result.passed ? (
                <Check className="h-4 w-4 shrink-0" />
              ) : (
                <X className="h-4 w-4 shrink-0" />
              )}
              <span>{result.description}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
