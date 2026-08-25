import { useCallback, useEffect, useState } from "react";
import type { InteractiveCodeActivity } from "@/lib/curriculum/types";
import type { ActivityRendererProps } from "../types";
import { parseCssRules } from "../validation";
import { ActivityContainer } from "../primitives/activity-container";
import { ActivityHeader } from "../primitives/activity-header";
import { ActivityFeedback } from "../primitives/activity-feedback";
import { ActivityActions } from "../primitives/activity-actions";
import { LessonCodeEditor } from "@/components/shared/lesson-editor/lesson-code-editor";
import { Button } from "@/components/ui/button";
import {
  Code2,
  RotateCcw,
  Terminal,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
} from "lucide-react";
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
  const { starterCode, language, testCases } = activity.content;
  const taskTitle = activity.content.title || activity.title || "Interactive Code Challenge";
  const taskInstructions =
    activity.content.instructions ||
    activity.content.prompt ||
    (activity as any).prompt ||
    (activity as any).description ||
    "";
  const currentCode = typeof state.response === "string" ? state.response : starterCode;
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<
    Array<{ description: string; passed: boolean; error?: string }>
  >([]);
  const [activeTab, setActiveTab] = useState<"instructions" | "code" | "results">("instructions");
  const isCorrect = state.status === "correct" || state.status === "completed";
  const resolvedHints = activity.feedback?.hints || activity.content?.hints;
  const hintsRemaining = (resolvedHints?.length || 0) - state.hintsRevealed;

  const runEvaluation = useCallback(() => {
    setIsRunning(true);
    const logs: string[] = [];
    let testsPassed = true;
    const results: Array<{ description: string; passed: boolean; error?: string }> = [];
    const customConsole = {
      log: (...args: any[]) => logs.push(args.map(String).join(" ")),
      error: (...args: any[]) => logs.push("[ERROR] " + args.map(String).join(" ")),
      warn: (...args: any[]) => logs.push("[WARN] " + args.map(String).join(" ")),
      info: (...args: any[]) => logs.push("[INFO] " + args.map(String).join(" ")),
    };
    try {
      if (language === "html") {
        if (typeof DOMParser !== "undefined") {
          const doc = new DOMParser().parseFromString(currentCode, "text/html");
          for (const test of testCases || []) {
            try {
              if (test.assertion) {
                const testFn = new Function(
                  "doc",
                  "document",
                  "code",
                  `return (${test.assertion});`,
                );
                const passed = Boolean(testFn(doc, doc, currentCode));
                results.push({ description: test.description, passed });
                if (!passed) testsPassed = false;
              } else results.push({ description: test.description, passed: true });
            } catch (err: any) {
              results.push({ description: test.description, passed: false, error: err.message });
              testsPassed = false;
            }
          }
        }
      } else if (language === "javascript" || language === "typescript") {
        new Function("console", currentCode)(customConsole);
        for (const test of testCases || []) {
          try {
            if (test.assertion) {
              const testFn = new Function("console", `${currentCode}\nreturn (${test.assertion});`);
              const passed = Boolean(testFn(customConsole));
              results.push({ description: test.description, passed });
              if (!passed) testsPassed = false;
            } else results.push({ description: test.description, passed: true });
          } catch (err: any) {
            results.push({ description: test.description, passed: false, error: err.message });
            testsPassed = false;
          }
        }
      } else if (language === "css") {
        const rules = parseCssRules(currentCode);
        for (const test of testCases || []) {
          try {
            if (test.assertion) {
              const passed = Boolean(
                new Function("rules", "code", `return (${test.assertion});`)(rules, currentCode),
              );
              results.push({ description: test.description, passed });
              if (!passed) testsPassed = false;
            } else results.push({ description: test.description, passed: true });
          } catch (err: any) {
            results.push({ description: test.description, passed: false, error: err.message });
            testsPassed = false;
          }
        }
      }
      setConsoleOutput(logs);
      setTestResults(results);
      if (!testsPassed) {
        setActiveTab("results");
      } else {
        setActiveTab("code");
      }
    } catch (err: any) {
      setConsoleOutput([...logs, `Runtime Error: ${err.message}`]);
      setTestResults([]);
      testsPassed = false;
      setActiveTab("results");
    } finally {
      setIsRunning(false);
    }
  }, [currentCode, language, testCases]);

  useEffect(() => {
    if (
      state.status === "evaluating" ||
      state.status === "correct" ||
      state.status === "incorrect" ||
      state.status === "failed" ||
      state.status === "passed" ||
      state.status === "completed"
    ) {
      runEvaluation();
    } else if (state.status === "idle") {
      setActiveTab("code");
    }
  }, [state.status, state.validationResult, runEvaluation]);

  const hasExecuted = consoleOutput.length > 0 || testResults.length > 0;
  const allTestsPassed = testResults.length > 0 && testResults.every((test) => test.passed);

  return (
    <ActivityContainer id={`activity-${activity.id}`} variant="workspace">
      <ActivityHeader
        activity={activity}
        onRevealHint={onRevealHint}
        hintsRemaining={hintsRemaining}
      />

      <div className="border-b border-lesson-border bg-lesson-surface-subtle/30 px-3 py-3 lg:hidden">
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-lesson-surface-subtle p-1">
          {[
            ["instructions", BookOpen, "Task"],
            ["code", Code2, "Code"],
            ["results", Terminal, "Results"],
          ].map(([tab, Icon, label]) => (
            <button
              key={tab as string}
              type="button"
              onClick={() => setActiveTab(tab as "instructions" | "code" | "results")}
              aria-pressed={activeTab === tab}
              className={cn(
                "flex min-h-11 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lesson-focus-ring",
                activeTab === tab
                  ? "bg-lesson-surface text-lesson-text-primary shadow-xs"
                  : "text-lesson-text-muted hover:text-lesson-text-primary",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label as string}
            </button>
          ))}
        </div>
      </div>

      <div className="grid min-h-[32rem] grid-cols-1 lg:grid-cols-[minmax(240px,0.85fr)_minmax(0,1.6fr)]">
        <aside
          className={cn(
            "border-b border-lesson-border bg-lesson-surface-subtle/20 p-5 sm:p-7 lg:border-b-0 lg:border-r",
            activeTab === "instructions" ? "block" : "hidden lg:block",
          )}
        >
          <div className="sticky top-0 space-y-5">
            <div>
              <p className="text-xs font-medium text-lesson-text-muted">Your task</p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-lesson-text-primary">
                {taskTitle}
              </h2>
            </div>
            {taskInstructions ? (
              <div className="whitespace-pre-wrap text-sm leading-7 text-lesson-text-secondary">
                {taskInstructions}
              </div>
            ) : null}
            {testCases && testCases.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-lesson-border/60">
                <p className="text-xs font-semibold uppercase tracking-wider text-lesson-text-muted">
                  Requirements
                </p>
                <div className="space-y-1.5">
                  {testCases.map((tc, idx) => (
                    <div
                      key={tc.id || idx}
                      className="flex items-start gap-2 text-xs text-lesson-text-secondary leading-relaxed"
                    >
                      <span className="font-mono text-lesson-accent select-none mt-0.5">•</span>
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
          </div>
        </aside>

        <section
          className={cn(
            "min-w-0 bg-lesson-surface p-4 sm:p-6",
            activeTab === "code" || activeTab === "results" ? "block" : "hidden lg:block",
          )}
        >
          <div className={cn("space-y-3", activeTab === "results" ? "hidden lg:block" : "block")}>
            <div className="flex min-h-10 items-center justify-between gap-3 border-b border-lesson-border pb-2">
              <div className="flex min-w-0 items-center gap-2 text-xs text-lesson-text-muted">
                <Code2 className="h-4 w-4 shrink-0" />
                <span className="font-mono">{language || "javascript"}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onResponse(starterCode)}
                disabled={readOnly || isCorrect}
                className="min-h-9 gap-1.5 text-xs text-lesson-text-secondary"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset Code
              </Button>
            </div>

            <LessonCodeEditor
              value={currentCode}
              language={language || "javascript"}
              onChange={(value) => onResponse(value || "")}
              readOnly={readOnly || isCorrect}
              className="min-h-[18rem] md:min-h-[26rem]"
              aria-label="Lesson code editor"
              id={`lesson-code-editor-${activity.id}`}
            />

            {isCorrect && (
              <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="font-medium">
                  {activity.feedback?.correct || "Solution verified. All checks passed!"}
                </span>
              </div>
            )}
          </div>

          <div className={cn("space-y-4", activeTab === "code" ? "hidden lg:block" : "block")}>
            {hasExecuted ? (
              <>
                <div
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-4",
                    allTestsPassed
                      ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-900 dark:text-emerald-200"
                      : "border-rose-500/20 bg-rose-500/5 text-rose-900 dark:text-rose-200",
                  )}
                >
                  {allTestsPassed ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-lesson-text-primary">
                      {allTestsPassed ? "All checks passed" : "Requirements not met"}
                    </p>
                    <p className="mt-0.5 text-xs text-lesson-text-secondary leading-relaxed">
                      {allTestsPassed
                        ? activity.feedback?.correct || "Your solution passed all validation tests."
                        : activity.feedback?.incorrect ||
                          "Review the failing requirements below and adjust your code."}
                    </p>
                  </div>
                </div>

                {testResults.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-lesson-text-muted">
                      Validation
                    </p>
                    <div className="space-y-1.5">
                      {testResults.map((test, index) => (
                        <div
                          key={`${test.description}-${index}`}
                          className={cn(
                            "flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-xs sm:text-sm",
                            test.passed
                              ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-900 dark:text-emerald-200"
                              : "border-rose-500/20 bg-rose-500/5 text-rose-900 dark:text-rose-200",
                          )}
                        >
                          {test.passed ? (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                          )}
                          <div className="min-w-0 flex-1">
                            <span className="font-medium text-lesson-text-primary">
                              {test.description}
                            </span>
                            {test.error && (
                              <p className="mt-1 font-mono text-[11px] text-rose-500">
                                {test.error}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!allTestsPassed &&
                  (activity.feedback?.incorrect || (resolvedHints && state.hintsRevealed > 0)) && (
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-900 dark:text-amber-200">
                      <p className="font-semibold text-amber-800 dark:text-amber-300">Guidance</p>
                      <p className="mt-1 text-lesson-text-secondary">
                        {activity.feedback?.incorrect || resolvedHints?.[0]}
                      </p>
                    </div>
                  )}

                {consoleOutput.length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-lesson-text-muted">
                      <Terminal className="h-3.5 w-3.5" /> Console
                    </div>
                    <pre className="max-h-40 overflow-auto rounded-xl bg-zinc-950 p-4 font-mono text-xs leading-6 text-zinc-100 border border-zinc-800">
                      {consoleOutput.join("\n")}
                    </pre>
                  </div>
                )}
              </>
            ) : (
              <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-lesson-border px-6 text-center text-sm text-lesson-text-muted">
                Run the code to see results.
              </div>
            )}
          </div>
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
