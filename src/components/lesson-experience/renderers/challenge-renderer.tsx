import { useState } from "react";
import { Play, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LessonCodeEditor } from "@/components/shared/lesson-editor/lesson-code-editor";
import { cn } from "@/lib/utils";
import { runInSandbox, type SandboxTestCaseResult } from "@/lib/lesson-experience/sandbox";
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
  const [results, setResults] = useState<SandboxTestCaseResult[] | undefined>();
  const [runtimeError, setRuntimeError] = useState<string | undefined>();
  const [isRunning, setIsRunning] = useState(false);

  async function handleRun() {
    setIsRunning(true);
    const result = await runInSandbox(source, testCases);
    setResults(result.testResults);
    setRuntimeError(result.runtimeError);
    setIsRunning(false);

    if (result.runtimeError) {
      onValidated({ isValid: false, message: result.runtimeError });
      return;
    }
    const allPassed = result.testResults.length > 0 && result.testResults.every((tc) => tc.passed);
    onValidated({
      isValid: allPassed,
      message: allPassed ? "All checks passed." : "Some checks did not pass yet.",
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 className="font-serif text-2xl font-semibold text-lesson-text-primary text-balance">
          {heading}
        </h2>
        <p className="text-sm leading-relaxed text-lesson-text-secondary">{instructions}</p>
      </div>

      <div className="rounded-lg border border-lesson-border bg-lesson-surface-elevated">
        <LessonCodeEditor
          value={source}
          onChange={setSource}
          language="javascript"
          aria-label="Challenge code editor"
          className="min-h-[140px] p-3"
          readOnly={isPassed}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="button" onClick={handleRun} disabled={isRunning || isPassed} size="sm">
          {isRunning ? <Loader2 className="animate-spin" /> : <Play />}
          Run checks
        </Button>
      </div>

      {runtimeError ? (
        <div className="rounded-lg border border-lesson-error-border bg-lesson-error-bg p-3 font-mono text-xs text-lesson-error-text">
          {runtimeError}
        </div>
      ) : null}

      {results ? (
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
