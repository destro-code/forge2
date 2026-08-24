import { useState } from "react";
import type { InteractiveCodeActivity } from "@/lib/curriculum/types";
import type { ActivityRendererProps } from "../types";
import { parseCssRules } from "../validation";
import { ActivityContainer } from "../primitives/activity-container";
import { ActivityHeader } from "../primitives/activity-header";
import { ActivityFeedback } from "../primitives/activity-feedback";
import { ActivityActions } from "../primitives/activity-actions";
import { LessonCodeEditor } from "@/components/shared/lesson-editor/lesson-code-editor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Code2,
  Play,
  RotateCcw,
  Terminal,
  CheckCircle2,
  XCircle,
  Sparkles,
  BookOpen,
  FileCode,
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
  const { instructions, starterCode, language, hints, testCases } = activity.content;

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
      if (language === "html") {
        if (typeof DOMParser !== "undefined") {
          const parser = new DOMParser();
          const doc = parser.parseFromString(currentCode, "text/html");
          if (testCases && testCases.length > 0) {
            for (const test of testCases) {
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
      } else if (language === "javascript" || language === "typescript") {
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
      } else if (language === "css") {
        const rules = parseCssRules(currentCode);
        if (testCases && testCases.length > 0) {
          for (const test of testCases) {
            try {
              if (test.assertion) {
                const testFn = new Function("rules", "code", `return (${test.assertion});`);
                const passed = Boolean(testFn(rules, currentCode));
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

      // Auto-switch to results tab on mobile/tablet view so learner gets instant feedback
      setActiveTab("results");
    } catch (err: any) {
      setConsoleOutput([...logs, `Runtime Error: ${err.message}`]);
      setTestResults([]);
      testsPassed = false;
      setActiveTab("results");
    } finally {
      setIsRunning(false);
    }
  };

  const hasExecuted = consoleOutput.length > 0 || testResults.length > 0;
  const allTestsPassed = testResults.length > 0 && testResults.every((t) => t.passed);

  return (
    <ActivityContainer id={`activity-${activity.id}`} variant="workspace">
      <ActivityHeader
        activity={activity}
        onRevealHint={onRevealHint}
        hintsRemaining={hintsRemaining}
      />

      {/* Mobile Tab Segment Bar (< lg viewports) */}
      <div className="lg:hidden px-4 pt-4 border-b border-lesson-border bg-lesson-surface-subtle/20">
        <div className="flex p-1 bg-muted/50 rounded-xl gap-1">
          <button
            onClick={() => setActiveTab("instructions")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-lg transition-all min-h-[44px]",
              activeTab === "instructions"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-label="View Instructions"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Instructions</span>
          </button>
          <button
            onClick={() => setActiveTab("code")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-lg transition-all min-h-[44px]",
              activeTab === "code"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-label="View Code Editor"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Editor</span>
          </button>
          <button
            onClick={() => setActiveTab("results")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-lg transition-all min-h-[44px] relative",
              activeTab === "results"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-label="View Console and Results"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Results</span>
            {hasExecuted && (
              <span
                className={cn(
                  "absolute top-1 right-2 w-2 h-2 rounded-full",
                  allTestsPassed ? "bg-emerald-500" : "bg-rose-500",
                )}
              />
            )}
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 lg:divide-x lg:divide-lesson-border min-h-[500px]">
        {/* LEFT COLUMN: Instructions, Task, Hints */}
        <div
          className={cn(
            "lg:col-span-5 flex flex-col p-6 md:p-8 bg-lesson-surface-subtle/10 overflow-y-auto max-h-[650px] lg:max-h-none",
            "lg:flex", // Always visible on desktop
            activeTab === "instructions" ? "flex" : "hidden lg:flex", // Responsive visibility
          )}
        >
          <div className="space-y-5">
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-primary/80 font-mono">
                Your Objective
              </span>
              <h2 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                <Code2 className="w-5 h-5 text-primary" />
                <span>Interactive Code Challenge</span>
              </h2>
            </div>

            <div className="text-sm text-foreground/90 leading-relaxed font-normal prose prose-neutral dark:prose-invert">
              {instructions}
            </div>

            {/* Hint Reveal Section */}
            {onRevealHint && hintsRemaining > 0 && (
              <div className="pt-3 border-t border-lesson-border/60">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRevealHint}
                  className="w-full h-11 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 gap-2 rounded-lg font-semibold"
                >
                  <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Need a hint? ({hintsRemaining} remaining)</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Code Editor, Console Output, Test Results */}
        <div
          className={cn(
            "lg:col-span-7 flex flex-col p-6 md:p-8 bg-lesson-surface gap-6 overflow-y-auto max-h-[750px] lg:max-h-none",
            "lg:flex", // Always visible on desktop
            activeTab === "code" || activeTab === "results" ? "flex" : "hidden lg:flex", // Responsive visibility
          )}
        >
          {/* Editor Container Section */}
          <div className={cn("space-y-3", activeTab === "results" ? "hidden lg:block" : "block")}>
            {/* Editor Top Bar/Chrome */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg bg-lesson-surface border-t border-x border-lesson-border text-xs font-semibold text-foreground/90 font-mono">
                  <FileCode className="w-3.5 h-3.5 text-primary" />
                  <span>
                    solution.
                    {language === "javascript"
                      ? "js"
                      : language === "css"
                        ? "css"
                        : language === "html"
                          ? "html"
                          : "ts"}
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 py-0">
                  {language}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onResponse(starterCode)}
                className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5 hover:bg-muted/50 rounded-md"
                title="Reset code to original starter template"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Code</span>
              </Button>
            </div>

            {/* CodeMirror Editor Box */}
            <LessonCodeEditor
              value={currentCode}
              language={language || "javascript"}
              onChange={(val) => onResponse(val || "")}
              readOnly={readOnly}
              className="min-h-[16rem] md:min-h-[22rem] h-auto flex flex-col"
              aria-label="Interactive Lesson Code Editor"
              id={`lesson-code-editor-${activity.id}`}
            />

            {/* Run Button Action Bar */}
            <div className="flex items-center justify-between pt-1">
              <Button
                size="md"
                onClick={handleRunCode}
                disabled={isRunning}
                className="gap-2 h-11 px-5 rounded-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Run Code & Tests</span>
              </Button>
            </div>
          </div>

          {/* RESULTS AREA (Console + Test Cases) */}
          <div
            className={cn(
              "space-y-5",
              activeTab === "code" ? "hidden lg:block" : "block",
              !hasExecuted && activeTab === "results" ? "hidden lg:block" : "",
            )}
          >
            {hasExecuted && (
              <div className="space-y-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-lesson-border/60">
                {/* Visual Outcome Banner */}
                <div
                  className={cn(
                    "p-4 rounded-xl border flex items-start gap-3.5 transition-all duration-300",
                    allTestsPassed
                      ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-900 dark:text-emerald-200"
                      : "bg-amber-500/5 border-amber-500/20 text-amber-900 dark:text-amber-200",
                  )}
                >
                  {allTestsPassed ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
                  )}
                  <div>
                    <h4 className="font-extrabold text-sm uppercase tracking-wide">
                      {allTestsPassed ? "SUCCESS" : "NEEDS ANOTHER LOOK"}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {allTestsPassed
                        ? "All verification checks passed. You are ready to submit!"
                        : "Some evaluation test assertions did not pass yet. Review details below."}
                    </p>
                  </div>
                </div>

                {/* Console Output Block */}
                {consoleOutput.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                      <Terminal className="w-3.5 h-3.5 text-primary" />
                      <span>Console Logs</span>
                    </div>
                    <div className="p-4 rounded-xl bg-zinc-950 text-zinc-100 font-mono text-xs max-h-36 overflow-y-auto leading-relaxed border border-zinc-800">
                      {consoleOutput.map((line, idx) => (
                        <div key={idx} className="whitespace-pre-wrap">
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Test Assertion Results */}
                {testResults.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                      Test Assertions ({testResults.filter((t) => t.passed).length}/
                      {testResults.length})
                    </h3>
                    <div className="grid gap-2">
                      {testResults.map((t, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "flex items-center justify-between p-3.5 rounded-lg border text-xs font-mono transition-all",
                            t.passed
                              ? "bg-emerald-500/5 border-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                              : "bg-rose-500/5 border-rose-500/15 text-rose-800 dark:text-rose-300",
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            {t.passed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                            )}
                            <span className="leading-relaxed">{t.description}</span>
                          </div>
                          {t.error && (
                            <span className="text-rose-500 text-[10px] max-w-[200px] truncate">
                              {t.error}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Standard Lesson Feedback (from learning engine validation) */}
            <ActivityFeedback
              status={state.status}
              validationResult={state.validationResult}
              hints={resolvedHints}
              hintsRevealed={state.hintsRevealed}
            />
          </div>
        </div>
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
