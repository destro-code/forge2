import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { LessonCheckpoints } from "@/components/lesson/lesson-checkpoints";
import { useProgress } from "@/lib/hooks/use-progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProgressStore } from "@/lib/stores/use-progress-store";
import {
  Trophy,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  ArrowRight,
  Sparkles,
  HelpCircle,
} from "lucide-react";

export const Route = createFileRoute("/assessment-test")({
  component: AssessmentTestPage,
});

const TEST_LESSON_ID = "test-lesson-id";

const mockCheckpoints = [
  {
    id: "legacy-test",
    label: "H. Existing legacy checkpoint: Works as before (click-to-complete)",
    hint: "Click the row to manually toggle this simple checkbox checkpoint.",
  },
  {
    id: "mcq-test",
    label: "A. Multiple Choice Assessment (What is 2 + 2?)",
    hint: "Must complete correctly with 'Four' to pass. Wrong answers must not pass.",
    assessment: {
      type: "multiple-choice" as const,
      prompt: "What is 2 + 2?",
      options: [
        { id: "3", label: "Three (Wrong)" },
        { id: "4", label: "Four (Correct)" },
        { id: "5", label: "Five (Wrong)" },
      ],
      correctAnswer: "4",
      explanation: "2 + 2 equals 4. Basic mathematical addition.",
    },
  },
  {
    id: "multi-test",
    label: "B. Multiple Select Assessment (Select even numbers)",
    hint: "Must check exactly 'Two' and 'Four'. Correct selection must complete it.",
    assessment: {
      type: "multiple-select" as const,
      prompt: "Select all even numbers from the list:",
      options: [
        { id: "1", label: "One (Odd)" },
        { id: "2", label: "Two (Even)" },
        { id: "3", label: "Three (Odd)" },
        { id: "4", label: "Four (Even)" },
      ],
      correctAnswer: ["2", "4"],
      explanation: "2 and 4 are even because they are evenly divisible by 2.",
    },
  },
  {
    id: "tf-test",
    label: "C. True / False Assessment (JavaScript Threading)",
    hint: "Must select True. Correct answer completes, incorrect does not.",
    assessment: {
      type: "true-false" as const,
      prompt: "Is JavaScript single-threaded in its main execution thread?",
      correctAnswer: "true",
      explanation:
        "Yes, JS uses a single call stack and executes sequentially on a single main thread.",
    },
  },
  {
    id: "prediction-test",
    label: "D. Output Prediction Assessment (typeof null)",
    hint: "Must predict 'object'. Extra spacing and case errors are ignored for safety.",
    assessment: {
      type: "output-prediction" as const,
      prompt: "What is evaluated by: typeof null?",
      correctAnswer: "object",
      explanation: "typeof null returns 'object' due to an early implementation bug.",
    },
  },
  {
    id: "sandbox-test",
    label: "E. Sandbox Completion (Sandbox-A)",
    hint: "Is satisfied ONLY when Sandbox-A is solved. Sandbox-B completion must not satisfy it.",
    assessment: {
      type: "sandbox-completion" as const,
      sandboxId: "sandbox-a",
    },
  },
  {
    id: "debug-test",
    label: "F. Debug Lab Bug Completion (Bug-A)",
    hint: "Is satisfied ONLY when Bug-A is resolved. Unrelated bug resolutions must not satisfy it.",
    assessment: {
      type: "debug-completion" as const,
      debugBugId: "bug-a",
    },
  },
  {
    id: "reflection-test",
    label: "G. Open Reflection Assessment (Tradeoffs Analysis)",
    hint: "Saves response and completes without grading correctness. Response persists.",
    assessment: {
      type: "open-reflection" as const,
      prompt: "Reflect on React 19's Server Actions vs typical API endpoints:",
    },
  },
];

export function AssessmentTestPage() {
  const { lessonCheckpoints = {}, playgroundCompletions = [], solvedBugs = [] } = useProgress();

  const { setProgress } = useProgressStore();

  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  // Reset progress state back to clean test baseline
  const handleFullReset = () => {
    setProgress((p) => {
      const clearedCheckpoints = { ...p.lessonCheckpoints };
      mockCheckpoints.forEach((c) => {
        delete clearedCheckpoints[`${TEST_LESSON_ID}:${c.id}`];
        if (typeof window !== "undefined") {
          localStorage.removeItem(`forge_assessment_state_${TEST_LESSON_ID}_${c.id}`);
        }
      });

      return {
        ...p,
        lessonCheckpoints: clearedCheckpoints,
        playgroundCompletions:
          p.playgroundCompletions?.filter((c) => !c.templateId.startsWith(`${TEST_LESSON_ID}:`)) ||
          [],
        solvedBugs: p.solvedBugs?.filter((b) => b !== "bug-a" && b !== "bug-b") || [],
      };
    });
    toast.success("Progress state for assessments has been reset!");
  };

  // Mock-solving functions
  const toggleMockSandbox = (id: string) => {
    setProgress((p) => {
      const templateId = `${TEST_LESSON_ID}:${id}`;
      const completions = p.playgroundCompletions || [];
      const exists = completions.some((c) => c.templateId === templateId);

      const updated = exists
        ? completions.filter((c) => c.templateId !== templateId)
        : [...completions, { templateId, completedAt: new Date().toISOString() }];

      toast.info(`Mock Sandbox ${id} set to: ${exists ? "Incomplete" : "Completed"}`);
      return { ...p, playgroundCompletions: updated };
    });
  };

  const toggleMockBug = (id: string) => {
    setProgress((p) => {
      const bugs = p.solvedBugs || [];
      const exists = bugs.includes(id);

      const updated = exists ? bugs.filter((b) => b !== id) : [...bugs, id];

      toast.info(`Mock Bug ${id} set to: ${exists ? "Unresolved" : "Resolved"}`);
      return { ...p, solvedBugs: updated };
    });
  };

  // Run dynamic verification checklist
  useEffect(() => {
    const results: Record<string, boolean> = {};

    // H. Legacy Checkpoint
    results["H"] = Boolean(lessonCheckpoints[`${TEST_LESSON_ID}:legacy-test`]);

    // A. MCQ MCQ
    const mcqState = getLocalSavedState("mcq-test");
    const isMcqCorrect =
      mcqState?.status === "completed" && lessonCheckpoints[`${TEST_LESSON_ID}:mcq-test`];
    results["A"] = Boolean(isMcqCorrect);

    // B. Multiple Select
    const multiState = getLocalSavedState("multi-test");
    const isMultiCorrect =
      multiState?.status === "completed" && lessonCheckpoints[`${TEST_LESSON_ID}:multi-test`];
    results["B"] = Boolean(isMultiCorrect);

    // C. True / False
    const tfState = getLocalSavedState("tf-test");
    const isTfCorrect =
      tfState?.status === "completed" && lessonCheckpoints[`${TEST_LESSON_ID}:tf-test`];
    results["C"] = Boolean(isTfCorrect);

    // D. Prediction
    const predState = getLocalSavedState("prediction-test");
    const isPredCorrect =
      predState?.status === "completed" && lessonCheckpoints[`${TEST_LESSON_ID}:prediction-test`];
    results["D"] = Boolean(isPredCorrect);

    // E. Sandbox Checkpoint
    const isSandboxASolved = playgroundCompletions.some(
      (c) => c.templateId === `${TEST_LESSON_ID}:sandbox-a`,
    );
    const isSandboxBSolved = playgroundCompletions.some(
      (c) => c.templateId === `${TEST_LESSON_ID}:sandbox-b`,
    );
    // Is completed if Sandbox A is completed
    results["E"] = isSandboxASolved && !isSandboxBSolved;

    // F. Debug Checkpoint
    const isBugASolved = solvedBugs.includes("bug-a");
    const isBugBSolved = solvedBugs.includes("bug-b");
    results["F"] = isBugASolved && !isBugBSolved;

    // G. Reflection Checkpoint
    const reflState = getLocalSavedState("reflection-test");
    const hasReflectionText = String(reflState?.answers || "").trim().length > 0;
    const isReflCompleted =
      reflState?.status === "completed" && lessonCheckpoints[`${TEST_LESSON_ID}:reflection-test`];
    results["G"] = isReflCompleted && hasReflectionText;

    setTestResults(results);
  }, [lessonCheckpoints, playgroundCompletions, solvedBugs]);

  const getLocalSavedState = (checkpointId: string) => {
    if (typeof window === "undefined") return null;
    const item = localStorage.getItem(`forge_assessment_state_${TEST_LESSON_ID}_${checkpointId}`);
    if (item) {
      try {
        return JSON.parse(item);
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Trophy className="h-8 w-8 text-emerald-400" />
            Assessment Verification Suite
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Phase 6C.1 Core Assessment Infrastructure and Verification Harness.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleFullReset} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset State
          </Button>
          <Badge
            variant="outline"
            className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
          >
            Phase 6C.1 Ready
          </Badge>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Panel: Real Live Component rendering */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-emerald-400 animate-pulse" /> Live Component
              Renderer
            </h2>
            <p className="text-xs text-muted-foreground">
              This panel executes the unified `LessonCheckpoints` component loaded with test
              definitions.
            </p>

            {/* Render checkpoints */}
            <LessonCheckpoints lessonId={TEST_LESSON_ID} checkpoints={mockCheckpoints} />
          </div>

          {/* Sandbox & Debug Challenge Mock Controls */}
          <div className="rounded-xl border border-border bg-card/60 p-4 space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase">
              Mock-Solver Operations Toolbar
            </h2>
            <p className="text-xs text-muted-foreground">
              Simulate actions in the Playground editor or Debug Lab to test automatic binding and
              reactivity.
            </p>

            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 pt-1">
              <div className="space-y-1.5 border border-border/40 p-2.5 rounded bg-black/10">
                <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                  Playground Sandbox
                </span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleMockSandbox("sandbox-a")}
                    className={`h-8 text-xs font-semibold ${
                      playgroundCompletions.some(
                        (c) => c.templateId === `${TEST_LESSON_ID}:sandbox-a`,
                      )
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                        : "bg-background"
                    }`}
                  >
                    Solve Sandbox-A
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleMockSandbox("sandbox-b")}
                    className={`h-8 text-xs font-semibold ${
                      playgroundCompletions.some(
                        (c) => c.templateId === `${TEST_LESSON_ID}:sandbox-b`,
                      )
                        ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                        : "bg-background"
                    }`}
                  >
                    Solve Sandbox-B (Noise)
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5 border border-border/40 p-2.5 rounded bg-black/10">
                <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                  Debug Challenge Lab
                </span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleMockBug("bug-a")}
                    className={`h-8 text-xs font-semibold ${
                      solvedBugs.includes("bug-a")
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                        : "bg-background"
                    }`}
                  >
                    Solve Bug-A
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleMockBug("bug-b")}
                    className={`h-8 text-xs font-semibold ${
                      solvedBugs.includes("bug-b")
                        ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                        : "bg-background"
                    }`}
                  >
                    Solve Bug-B (Noise)
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Verification Checklist matrix */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider text-[11px]">
              Verification Results Checklist
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Real-time programmatic evaluations verifying the core requirements specified in Phase
              6C.1.
            </p>

            <div className="space-y-3 pt-1">
              {/* Test Case A */}
              <div className="flex items-start gap-2.5">
                {testResults["A"] ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold block">
                    Case A: Multiple choice verification
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Incorrect inputs leave checkpoint incomplete; submitting correct answer
                    completes it.
                  </p>
                </div>
              </div>

              {/* Test Case B */}
              <div className="flex items-start gap-2.5">
                {testResults["B"] ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold block">
                    Case B: Multiple select verification
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Only exact matches of the correct options completes checkpoint. Partial
                    selections stay incomplete.
                  </p>
                </div>
              </div>

              {/* Test Case C */}
              <div className="flex items-start gap-2.5">
                {testResults["C"] ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold block">Case C: True / False verification</span>
                  <p className="text-[11px] text-muted-foreground">
                    Submit correctness aligns with boolean state evaluation.
                  </p>
                </div>
              </div>

              {/* Test Case D */}
              <div className="flex items-start gap-2.5">
                {testResults["D"] ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold block">
                    Case D: Output prediction verification
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Text comparison ignores casing and padding differences for forgiving correct
                    matches.
                  </p>
                </div>
              </div>

              {/* Test Case E */}
              <div className="flex items-start gap-2.5">
                {testResults["E"] ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold block">
                    Case E: Exact Sandbox routing validation
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Solving Sandbox-A must trigger completion; Sandbox-B solver is treated as
                    unrelated noise.
                  </p>
                </div>
              </div>

              {/* Test Case F */}
              <div className="flex items-start gap-2.5">
                {testResults["F"] ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold block">
                    Case F: Exact Debug lab challenge validation
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Solving Bug-A completes the checkpoint; Bug-B remains noise.
                  </p>
                </div>
              </div>

              {/* Test Case G */}
              <div className="flex items-start gap-2.5">
                {testResults["G"] ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold block">
                    Case G: Qualitative open reflection persistence
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Does not grade responses as incorrect. Saves and restores text input seamlessly.
                  </p>
                </div>
              </div>

              {/* Test Case H */}
              <div className="flex items-start gap-2.5">
                {testResults["H"] ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold block">
                    Case H: Existing legacy checkpoint compatibility
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Simple checklist checkpoints with no configuration still function as direct
                    click-to-complete rows.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
