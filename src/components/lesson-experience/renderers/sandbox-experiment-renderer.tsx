import { useState } from "react";
import { Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LessonCodeEditor } from "@/components/shared/lesson-editor/lesson-code-editor";
import { runInSandbox, type SandboxLogEntry } from "@/lib/lesson-experience/sandbox";
import type { SandboxExperimentExperience } from "@/lib/lesson-experience/types";

interface SandboxExperimentRendererProps {
  experience: SandboxExperimentExperience;
  onRunExecuted: () => void;
}

function ConsoleLine({ entry }: { entry: SandboxLogEntry }) {
  const color =
    entry.level === "error"
      ? "text-lesson-error-text"
      : entry.level === "warn"
        ? "text-lesson-warning-text"
        : "text-lesson-text-primary";
  return <div className={`font-mono text-xs ${color}`}>{entry.args.join(" ")}</div>;
}

export function SandboxExperimentRenderer({
  experience,
  onRunExecuted,
}: SandboxExperimentRendererProps) {
  const { heading, instructions, starterSource } = experience.content;
  const [source, setSource] = useState(starterSource);
  const [logs, setLogs] = useState<SandboxLogEntry[]>([]);
  const [runtimeError, setRuntimeError] = useState<string | undefined>();
  const [isRunning, setIsRunning] = useState(false);
  const [hasRunOnce, setHasRunOnce] = useState(false);

  async function handleRun() {
    setIsRunning(true);
    const result = await runInSandbox(source);
    setLogs(result.logs);
    setRuntimeError(result.runtimeError);
    setIsRunning(false);
    if (!hasRunOnce) {
      setHasRunOnce(true);
      onRunExecuted();
    }
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
          aria-label="Sandbox code editor"
          className="min-h-[160px] p-3"
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="button" onClick={handleRun} disabled={isRunning} size="sm">
          {isRunning ? <Loader2 className="animate-spin" /> : <Play />}
          Run
        </Button>
        {hasRunOnce ? (
          <span className="text-xs text-lesson-text-muted">
            Executed in an isolated sandbox iframe.
          </span>
        ) : null}
      </div>

      <div className="min-h-[64px] rounded-lg border border-lesson-border bg-lesson-bg p-3">
        {runtimeError ? (
          <div className="font-mono text-xs text-lesson-error-text">{runtimeError}</div>
        ) : logs.length === 0 ? (
          <div className="font-mono text-xs text-lesson-text-muted">
            Console output will appear here.
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {logs.map((entry, index) => (
              <ConsoleLine key={index} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
