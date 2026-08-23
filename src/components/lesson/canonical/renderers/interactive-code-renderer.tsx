import { useState, useRef, useEffect } from "react";
import type { InteractiveCodeActivity } from "@/lib/curriculum/types";
import type { ActivityRendererProps } from "../types";
import { ActivityContainer } from "../primitives/activity-container";
import { ActivityHeader } from "../primitives/activity-header";
import { ActivityFeedback } from "../primitives/activity-feedback";
import { ActivityActions } from "../primitives/activity-actions";
import { MonacoEditor } from "@/components/shared/monaco-editor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code2, Play, RotateCcw, Terminal, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function InteractiveCodeRenderer({
  activity,
  state,
  onResponse,
  onSubmit,
  onRetry,
  onContinue,
  onRevealHint,
  readOnly,
}: ActivityRendererProps<InteractiveCodeActivity, string>) {
  const { instructions, starterCode, language, hints, testCases, files } = activity.content;

  const currentCode = typeof state.response === "string" ? state.response : starterCode;

  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<
    Array<{ description: string; passed: boolean; error?: string }>
  >([]);

  const isSubmitted =
    state.status === "submitted" || state.status === "correct" || state.status === "incorrect";
  const isCorrect = state.status === "correct" || state.status === "completed";
  const isIncorrect = state.status === "incorrect";

  const hintsRemaining = (activity.hints?.length || 0) - state.hintsRevealed;

  // Initialize response
  useEffect(() => {
    if (state.response === undefined || state.response === null) {
      onResponse(starterCode);
    }
  }, [starterCode, state.response, onResponse]);

  const handleRunCode = () => {
    setIsRunning(true);
    const logs: string[] = [];
    let testsPassed = true;
    const results: Array<{ description: string; passed: boolean; error?: string }> = [];

    // Capture console output
    const customConsole = {
      log: (...args: any[]) => logs.push(args.map(String).join(" ")),
      error: (...args: any[]) => logs.push("[ERROR] " + args.map(String).join(" ")),
      warn: (...args: any[]) => logs.push("[WARN] " + args.map(String).join(" ")),
      info: (...args: any[]) => logs.push("[INFO] " + args.map(String).join(" ")),
    };

    try {
      if (language === "javascript" || language === "typescript") {
        // Execute in safe function wrapper with captured console
        const runner = new Function("console", currentCode);
        runner(customConsole);

        // Run test cases if available
        if (testCases && testCases.length > 0) {
          for (const test of testCases) {
            try {
              if (test.assertion) {
                const testFn = new Function(
                  "console",
                  `${currentCode}\nreturn (${test.assertion});`,
                );
                const passed = Boolean(testFn(customConsole));
                results.push({ description: test.description, passed });
                if (!passed) testsPassed = false;
              } else {
                results.push({ description: test.description, passed: true });
              }
            } catch (err: any) {
              results.push({
                description: test.description,
                passed: false,
                error: err.message,
              });
              testsPassed = false;
            }
          }
        }
      }
      setConsoleOutput(
        logs.length > 0 ? logs : ["(Code executed successfully with no console output)"],
      );
      setTestResults(results);
    } catch (err: any) {
      setConsoleOutput([...logs, `Runtime Error: ${err.message}`]);
      testsPassed = false;
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <ActivityContainer id={`activity-${activity.id}`}>
      <ActivityHeader
        activity={activity}
        onRevealHint={onRevealHint}
        hintsRemaining={hintsRemaining}
      />

      <div className="p-6 md:p-8 flex flex-col gap-6">
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Code2 className="w-5 h-5 text-primary" />
            <span>Interactive Code Challenge</span>
          </h2>
          <div className="p-4 rounded-xl bg-muted/30 border border-border/80 text-sm text-foreground/90 leading-relaxed">
            {instructions}
          </div>
        </div>

        {/* Code Editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
              Solution Editor ({language})
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onResponse(starterCode)}
              className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Code</span>
            </Button>
          </div>

          <div className="rounded-xl overflow-hidden border border-border/80 shadow-xs h-64">
            <MonacoEditor
              value={currentCode}
              language={language || "javascript"}
              onChange={(val) => onResponse(val || "")}
              height="100%"
            />
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={handleRunCode} disabled={isRunning} className="gap-2 h-9">
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Code & Tests</span>
          </Button>
        </div>

        {/* Console / Output Tabs */}
        {consoleOutput.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Terminal className="w-3.5 h-3.5 text-primary" />
              <span>Console Output</span>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-950 text-zinc-100 font-mono text-xs max-h-36 overflow-y-auto leading-relaxed border border-border/40">
              {consoleOutput.map((line, idx) => (
                <div key={idx} className="whitespace-pre-wrap">
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Test Assertions ({testResults.filter((t) => t.passed).length}/{testResults.length})
            </h3>
            <div className="grid gap-2">
              {testResults.map((t, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border text-xs font-mono",
                    t.passed
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                      : "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300",
                  )}
                >
                  <div className="flex items-center gap-2">
                    {t.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600" />
                    )}
                    <span>{t.description}</span>
                  </div>
                  {t.error && <span className="text-rose-500">{t.error}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feedback Section */}
        <ActivityFeedback
          status={state.status}
          validationResult={state.validationResult}
          hints={activity.hints}
          hintsRevealed={state.hintsRevealed}
        />
      </div>

      <ActivityActions
        status={state.status}
        onSubmit={onSubmit}
        onRetry={onRetry}
        onContinue={onContinue}
        canSubmit={Boolean(currentCode.trim())}
      />
    </ActivityContainer>
  );
}
