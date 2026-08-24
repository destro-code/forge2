import { useState } from "react";
import type { DebugActivity } from "@/lib/curriculum/types";
import type { ActivityRendererProps } from "../types";
import { ActivityContainer } from "../primitives/activity-container";
import { ActivityHeader } from "../primitives/activity-header";
import { ActivityFeedback } from "../primitives/activity-feedback";
import { ActivityActions } from "../primitives/activity-actions";
import { LessonCodeEditor } from "@/components/shared/lesson-editor/lesson-code-editor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bug,
  RotateCcw,
  Play,
  Terminal,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BookOpen,
  FileCode,
  Lightbulb,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function DebugRenderer({
  activity,
  state,
  onResponse,
  onSubmit,
  onRetry,
  onContinue,
  onRevealHint,
  readOnly,
}: ActivityRendererProps<DebugActivity, string>) {
  const { buggyCode, bugDescription, language, testCases, fixRequirements } = activity.content;

  const currentCode = typeof state.response === "string" ? state.response : buggyCode;

  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<
    Array<{ description: string; passed: boolean; error?: string }>
  >([]);
  const [activeTab, setActiveTab] = useState<"instructions" | "code" | "results">("instructions");

  const hints = activity.feedback?.hints || activity.content?.hints;
  const hintsRemaining = (hints?.length || 0) - state.hintsRevealed;

  const handleRunTest = () => {
    setIsRunning(true);
    const logs: string[] = [];
    let allPassed = true;
    const results: Array<{ description: string; passed: boolean; error?: string }> = [];

    const customConsole = {
      log: (...args: any[]) => logs.push(args.map(String).join(" ")),
      error: (...args: any[]) => logs.push("[ERROR] " + args.map(String).join(" ")),
      warn: (...args: any[]) => logs.push("[WARN] " + args.map(String).join(" ")),
    };

    try {
      if (language === "javascript" || language === "typescript") {
        const runner = new Function("console", currentCode);
        runner(customConsole);

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
                if (!passed) allPassed = false;
              } else {
                results.push({ description: test.description, passed: true });
              }
            } catch (err: any) {
              results.push({
                description: test.description,
                passed: false,
                error: err.message,
              });
              allPassed = false;
            }
          }
        }
      }
      setConsoleOutput(logs.length > 0 ? logs : ["(Executed with no output)"]);
      setTestResults(results);

      // Auto-switch to results tab on mobile/tablet view so learner gets instant feedback
      setActiveTab("results");
    } catch (err: any) {
      setConsoleOutput([...logs, `Runtime Error: ${err.message}`]);
      setTestResults([]);
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
            aria-label="View Bug Report and Requirements"
          >
            <Bug className="w-3.5 h-3.5 text-rose-500" />
            <span>Bug Report</span>
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
            <FileCode className="w-3.5 h-3.5" />
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
            aria-label="View Verification Results"
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
        {/* LEFT COLUMN: Bug Report, Requirements, Hints */}
        <div
          className={cn(
            "lg:col-span-5 flex flex-col p-6 md:p-8 bg-lesson-surface-subtle/10 overflow-y-auto max-h-[650px] lg:max-h-none",
            "lg:flex", // Always visible on desktop
            activeTab === "instructions" ? "flex" : "hidden lg:flex", // Responsive visibility
          )}
        >
          <div className="space-y-5">
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-500 font-mono">
                Diagnostics Lab
              </span>
              <h2 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                <Bug className="w-5 h-5 text-rose-500" />
                <span>Debug Lab Challenge</span>
              </h2>
            </div>

            {/* Reported Bug Callout */}
            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 text-foreground text-sm">
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-xs text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
                  Reported Bug
                </span>
                <p className="leading-relaxed text-foreground/90 font-normal">{bugDescription}</p>
              </div>
            </div>

            {/* Fix Requirements Checklist */}
            {fixRequirements && fixRequirements.length > 0 && (
              <div className="space-y-2.5 pt-1">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                  Requirements to Fix
                </span>
                <div className="grid gap-2">
                  {fixRequirements.map((req, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 text-xs text-foreground/90 font-medium"
                    >
                      <div className="w-5 h-5 rounded-md bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="leading-relaxed pt-0.5">{req}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hint Trigger section */}
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

        {/* RIGHT COLUMN: Code Editor, Console/Output, Test Assertions */}
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
                  <FileCode className="w-3.5 h-3.5 text-rose-500" />
                  <span>buggy-code.{language === "javascript" ? "js" : "ts"}</span>
                </div>
                <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 py-0">
                  {language}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onResponse(buggyCode)}
                className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5 hover:bg-muted/50 rounded-md"
                title="Reset buggy code to its initial broken template state"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Buggy Code</span>
              </Button>
            </div>

            {/* CodeMirror Editor Box */}
            <LessonCodeEditor
              value={currentCode}
              language={language || "javascript"}
              onChange={(val) => onResponse(val || "")}
              readOnly={readOnly}
              className="min-h-[16rem] md:min-h-[22rem] h-auto flex flex-col"
              aria-label="Debug Lesson Code Editor"
              id={`lesson-code-editor-${activity.id}`}
            />

            {/* Test Your Fix Action Button */}
            <div className="flex items-center justify-between pt-1">
              <Button
                size="md"
                onClick={handleRunTest}
                disabled={isRunning}
                className="gap-2 h-11 px-5 rounded-lg font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-sm"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Test Your Fix</span>
              </Button>
            </div>
          </div>

          {/* RESULTS AREA */}
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
                      : "bg-rose-500/5 border-rose-500/20 text-rose-900 dark:text-rose-200",
                  )}
                >
                  {allTestsPassed ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
                  )}
                  <div>
                    <h4 className="font-extrabold text-sm uppercase tracking-wide">
                      {allTestsPassed ? "FIX STABLE" : "BUG PERSISTS"}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {allTestsPassed
                        ? "Your patch successfully resolved all diagnostic checks!"
                        : "One or more assertions still failed. Double-check your logic edits."}
                    </p>
                  </div>
                </div>

                {/* Console Output Block */}
                {consoleOutput.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                      <Terminal className="w-3.5 h-3.5 text-rose-500" />
                      <span>Diagnostics Logs</span>
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

                {/* Verification Tests */}
                {testResults.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                      Verification Tests ({testResults.filter((t) => t.passed).length}/
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
              hints={hints}
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
