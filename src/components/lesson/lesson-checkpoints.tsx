import { useState, useEffect } from "react";
import {
  CheckCircle2,
  Circle,
  HelpCircle,
  Trophy,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Code,
  FileText,
  Check,
  Play,
  Bookmark,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useProgress } from "@/lib/hooks/use-progress";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import type { CheckpointAssessmentConfig } from "@/lib/types";

interface CheckpointItem {
  id: string;
  label: string;
  hint?: string;
  assessment?: CheckpointAssessmentConfig;
}

interface LessonCheckpointsProps {
  lessonId: string;
  checkpoints: CheckpointItem[];
}

export function LessonCheckpoints({ lessonId, checkpoints }: LessonCheckpointsProps) {
  const {
    lessonCheckpoints = {},
    toggleCheckpoint,
    playgroundCompletions = [],
    solvedBugs = [],
  } = useProgress();

  if (!checkpoints || checkpoints.length === 0) return null;

  // Calculate the total completed checkpoints
  const completedCount = checkpoints.filter((item) => {
    if (!item.assessment) {
      return Boolean(lessonCheckpoints[`${lessonId}:${item.id}`]);
    }
    const config = item.assessment;
    if (config.type === "sandbox-completion") {
      return playgroundCompletions.some((c) => c.templateId === `${lessonId}:${config.sandboxId}`);
    }
    if (config.type === "debug-completion") {
      return solvedBugs.includes(config.debugBugId || "");
    }
    return Boolean(lessonCheckpoints[`${lessonId}:${item.id}`]);
  }).length;

  const isAllDone = completedCount === checkpoints.length;

  const handleToggleLegacy = (id: string, label: string) => {
    toggleCheckpoint(lessonId, id);
    const nowDone = !lessonCheckpoints[`${lessonId}:${id}`];
    if (nowDone) {
      toast.success(`Checkpoint passed: ${label}`);
    }
  };

  return (
    <div className="my-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-emerald-500/20">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-emerald-400" />
          <span className="font-bold text-sm text-foreground">Lesson Checkpoints</span>
        </div>
        <Badge
          variant="secondary"
          className={`text-xs gap-1 font-mono ${
            isAllDone ? "bg-emerald-500/20 text-emerald-300" : "bg-muted text-muted-foreground"
          }`}
        >
          {completedCount} / {checkpoints.length} Mastered
        </Badge>
      </div>

      <div className="space-y-4">
        {checkpoints.map((item) => {
          const isLegacy = !item.assessment;

          // Compute interactive completed status
          let isCompleted = Boolean(lessonCheckpoints[`${lessonId}:${item.id}`]);
          if (item.assessment?.type === "sandbox-completion") {
            isCompleted = playgroundCompletions.some(
              (c) => c.templateId === `${lessonId}:${item.assessment?.sandboxId}`,
            );
          } else if (item.assessment?.type === "debug-completion") {
            isCompleted = solvedBugs.includes(item.assessment?.debugBugId || "");
          }

          return (
            <div
              key={item.id}
              className={`rounded-lg border transition ${
                isCompleted
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                  : "border-border/60 bg-card/60 text-foreground/90"
              }`}
            >
              {/* Checkpoint Header/Title Row */}
              <div
                onClick={() => {
                  if (isLegacy) {
                    handleToggleLegacy(item.id, item.label);
                  }
                }}
                className={`flex items-start gap-3 p-3 select-none ${
                  isLegacy ? "cursor-pointer hover:bg-muted/30" : ""
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 fill-emerald-400/20" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span
                    className={`text-sm ${isCompleted ? "line-through opacity-80" : "font-semibold"}`}
                  >
                    {item.label}
                  </span>
                  {item.hint && (
                    <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                      <HelpCircle className="h-3 w-3 text-sky-400 shrink-0" />
                      {item.hint}
                    </p>
                  )}
                </div>
              </div>

              {/* Assessment Section Details (if interactive) */}
              {!isLegacy && item.assessment && (
                <div className="px-3 pb-3 pt-1 border-t border-border/40 bg-black/20 rounded-b-lg">
                  <CheckpointAssessmentWidget
                    lessonId={lessonId}
                    item={item}
                    isCompleted={isCompleted}
                    playgroundCompletions={playgroundCompletions}
                    solvedBugs={solvedBugs}
                    toggleCheckpoint={toggleCheckpoint}
                    lessonCheckpoints={lessonCheckpoints}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface AssessmentLocalState {
  status: "not_started" | "attempted" | "incorrect" | "completed";
  answers: any;
  submitted: boolean;
}

interface CheckpointAssessmentWidgetProps {
  lessonId: string;
  item: CheckpointItem;
  isCompleted: boolean;
  playgroundCompletions: any[];
  solvedBugs: string[];
  toggleCheckpoint: (lessonId: string, checkpointId: string) => void;
  lessonCheckpoints: Record<string, boolean>;
}

function CheckpointAssessmentWidget({
  lessonId,
  item,
  isCompleted,
  playgroundCompletions,
  solvedBugs,
  toggleCheckpoint,
  lessonCheckpoints,
}: CheckpointAssessmentWidgetProps) {
  const config = item.assessment!;

  // Read initial local state
  const getInitialState = (): AssessmentLocalState => {
    if (typeof window === "undefined") {
      return { status: "not_started", answers: null, submitted: false };
    }
    const saved = localStorage.getItem(`forge_assessment_state_${lessonId}_${item.id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          return parsed;
        }
      } catch (e) {
        // ignore
      }
    }
    // Set fallback defaults depending on assessment type
    let defaultAnswers: any = null;
    if (config.type === "multiple-select") {
      defaultAnswers = [];
    } else if (config.type === "structured-form") {
      defaultAnswers = {};
      config.formFields?.forEach((f) => {
        defaultAnswers[f.id] = "";
      });
    } else if (config.type === "open-reflection" || config.type === "output-prediction") {
      defaultAnswers = "";
    }
    return {
      status: isCompleted ? "completed" : "not_started",
      answers: defaultAnswers,
      submitted: isCompleted,
    };
  };

  const [state, setState] = useState<AssessmentLocalState>(getInitialState);

  // Sync completion states
  useEffect(() => {
    if (isCompleted && state.status !== "completed") {
      setState((prev) => ({ ...prev, status: "completed", submitted: true }));
    }
  }, [isCompleted]);

  // Handle automatic check for Sandbox & Bug completions
  useEffect(() => {
    if (config.type === "sandbox-completion") {
      const sandboxDone = playgroundCompletions.some(
        (c) => c.templateId === `${lessonId}:${config.sandboxId}`,
      );
      if (sandboxDone) {
        const isAlreadyDone = Boolean(lessonCheckpoints[`${lessonId}:${item.id}`]);
        if (!isAlreadyDone) {
          toggleCheckpoint(lessonId, item.id);
          toast.success(`Checkpoint completed: '${item.label}' solved!`);
        }
        updateState({ status: "completed", submitted: true, answers: true });
      }
    } else if (config.type === "debug-completion") {
      const bugDone = solvedBugs.includes(config.debugBugId || "");
      if (bugDone) {
        const isAlreadyDone = Boolean(lessonCheckpoints[`${lessonId}:${item.id}`]);
        if (!isAlreadyDone) {
          toggleCheckpoint(lessonId, item.id);
          toast.success(`Checkpoint completed: Bug resolved!`);
        }
        updateState({ status: "completed", submitted: true, answers: true });
      }
    }
  }, [playgroundCompletions, solvedBugs]);

  const updateState = (updates: Partial<AssessmentLocalState>) => {
    setState((prev) => {
      const next = { ...prev, ...updates };
      if (typeof window !== "undefined") {
        localStorage.setItem(`forge_assessment_state_${lessonId}_${item.id}`, JSON.stringify(next));
      }
      return next;
    });
  };

  const handleReset = () => {
    let defaultAnswers: any = null;
    if (config.type === "multiple-select") {
      defaultAnswers = [];
    } else if (config.type === "structured-form") {
      defaultAnswers = {};
      config.formFields?.forEach((f) => {
        defaultAnswers[f.id] = "";
      });
    } else if (config.type === "open-reflection" || config.type === "output-prediction") {
      defaultAnswers = "";
    }

    const resetState: AssessmentLocalState = {
      status: "not_started",
      answers: defaultAnswers,
      submitted: false,
    };
    localStorage.setItem(
      `forge_assessment_state_${lessonId}_${item.id}`,
      JSON.stringify(resetState),
    );
    setState(resetState);

    // If already marked in store, we also reset it there so they can re-attempt cleanly
    if (lessonCheckpoints[`${lessonId}:${item.id}`]) {
      toggleCheckpoint(lessonId, item.id);
    }
    toast.info("Checkpoint reset. You can now re-attempt.");
  };

  const handleSubmit = () => {
    if (config.type === "multiple-choice") {
      const isCorrect = state.answers === config.correctAnswer;
      if (isCorrect) {
        updateState({ status: "completed", submitted: true });
        if (!lessonCheckpoints[`${lessonId}:${item.id}`]) {
          toggleCheckpoint(lessonId, item.id);
        }
        toast.success("Correct answer! Checkpoint passed.");
      } else {
        updateState({ status: "incorrect", submitted: true });
        toast.error("Incorrect answer. Please try again.");
      }
    } else if (config.type === "true-false") {
      const isCorrect = String(state.answers) === String(config.correctAnswer);
      if (isCorrect) {
        updateState({ status: "completed", submitted: true });
        if (!lessonCheckpoints[`${lessonId}:${item.id}`]) {
          toggleCheckpoint(lessonId, item.id);
        }
        toast.success("Correct! Checkpoint passed.");
      } else {
        updateState({ status: "incorrect", submitted: true });
        toast.error("Incorrect. Try again.");
      }
    } else if (config.type === "multiple-select") {
      const correctArr = Array.isArray(config.correctAnswer)
        ? config.correctAnswer
        : [config.correctAnswer];
      const selectedArr = Array.isArray(state.answers) ? state.answers : [];

      const correctSet = new Set(correctArr.map((v) => String(v).trim()));
      const selectedSet = new Set(selectedArr.map((v) => String(v).trim()));

      const isExact =
        correctSet.size === selectedSet.size &&
        [...correctSet].every((val) => selectedSet.has(val));

      if (isExact) {
        updateState({ status: "completed", submitted: true });
        if (!lessonCheckpoints[`${lessonId}:${item.id}`]) {
          toggleCheckpoint(lessonId, item.id);
        }
        toast.success("Exact correct set selected! Checkpoint passed.");
      } else {
        updateState({ status: "incorrect", submitted: true });
        toast.error("Incorrect selection. Please try again.");
      }
    } else if (config.type === "output-prediction") {
      const correctStr = String(config.correctAnswer || "")
        .trim()
        .toLowerCase();
      const userStr = String(state.answers || "")
        .trim()
        .toLowerCase();
      const isCorrect = correctStr === userStr;

      if (isCorrect) {
        updateState({ status: "completed", submitted: true });
        if (!lessonCheckpoints[`${lessonId}:${item.id}`]) {
          toggleCheckpoint(lessonId, item.id);
        }
        toast.success("Correct output predicted! Checkpoint passed.");
      } else {
        updateState({ status: "incorrect", submitted: true });
        toast.error("Output did not match. Try again.");
      }
    } else if (config.type === "open-reflection") {
      if (!String(state.answers).trim()) {
        toast.error("Please write a reflection response before saving.");
        return;
      }
      updateState({ status: "completed", submitted: true });
      if (!lessonCheckpoints[`${lessonId}:${item.id}`]) {
        toggleCheckpoint(lessonId, item.id);
      }
      toast.success("Reflection recorded! Checkpoint passed.");
    } else if (config.type === "structured-form") {
      const values = state.answers || {};
      const allFilled = config.formFields?.every((f) => String(values[f.id] || "").trim() !== "");
      if (!allFilled) {
        toast.error("Please fill in all response fields.");
        return;
      }
      updateState({ status: "completed", submitted: true });
      if (!lessonCheckpoints[`${lessonId}:${item.id}`]) {
        toggleCheckpoint(lessonId, item.id);
      }
      toast.success("Responses recorded! Checkpoint passed.");
    }
  };

  const isCompletedState = state.status === "completed" || isCompleted;

  return (
    <div className="space-y-4 pt-2 text-foreground/90">
      {/* Prompt Label */}
      {config.prompt && (
        <p className="text-sm font-medium text-muted-foreground leading-relaxed">{config.prompt}</p>
      )}

      {/* Render Completed View */}
      {isCompletedState ? (
        <div className="space-y-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <Check className="h-3.5 w-3.5" />
            <span>Success: Requirement Completed</span>
          </div>

          {/* Render Saved Answers */}
          {config.type === "multiple-choice" && (
            <div className="text-xs text-muted-foreground">
              <span>Your Selection: </span>
              <strong className="text-foreground">
                {config.options?.find((o) => o.id === state.answers)?.label || state.answers}
              </strong>
            </div>
          )}

          {config.type === "true-false" && (
            <div className="text-xs text-muted-foreground">
              <span>Your Answer: </span>
              <strong className="text-foreground capitalize">{String(state.answers)}</strong>
            </div>
          )}

          {config.type === "multiple-select" && (
            <div className="text-xs text-muted-foreground space-y-1">
              <span>Your Selection:</span>
              <ul className="list-disc pl-4 space-y-0.5 text-foreground">
                {(Array.isArray(state.answers) ? state.answers : []).map((ansId) => (
                  <li key={ansId}>{config.options?.find((o) => o.id === ansId)?.label || ansId}</li>
                ))}
              </ul>
            </div>
          )}

          {config.type === "output-prediction" && (
            <div className="text-xs font-mono bg-black/40 p-2 rounded border border-border/40 text-emerald-300">
              Predicted: {state.answers}
            </div>
          )}

          {config.type === "open-reflection" && (
            <div className="text-xs text-muted-foreground space-y-1 bg-black/30 p-2.5 rounded border border-border/20">
              <span className="font-semibold text-foreground">Your Recorded Reflection:</span>
              <p className="whitespace-pre-wrap italic text-foreground/90 font-sans">
                {state.answers}
              </p>
            </div>
          )}

          {config.type === "structured-form" && (
            <div className="text-xs text-muted-foreground space-y-2 bg-black/30 p-2.5 rounded border border-border/20">
              <span className="font-semibold text-foreground">Your Recorded Responses:</span>
              {config.formFields?.map((f) => (
                <div key={f.id} className="space-y-0.5 border-l-2 border-primary/40 pl-2">
                  <span className="font-mono text-[10px] uppercase text-muted-foreground">
                    {f.label}
                  </span>
                  <p className="text-foreground/90 font-sans italic">
                    {state.answers?.[f.id] || "No response"}
                  </p>
                </div>
              ))}
            </div>
          )}

          {config.type === "sandbox-completion" && (
            <div className="text-xs text-emerald-300 flex items-center gap-1.5 font-mono">
              <Code className="h-3.5 w-3.5 text-emerald-400" />
              <span>Sandbox exercise template ({config.sandboxId}) completed.</span>
            </div>
          )}

          {config.type === "debug-completion" && (
            <div className="text-xs text-emerald-300 flex items-center gap-1.5 font-mono">
              <FileText className="h-3.5 w-3.5 text-emerald-400" />
              <span>Debug Challenge bug ({config.debugBugId}) resolved.</span>
            </div>
          )}

          {/* Explanation Callout */}
          {config.explanation && (
            <div className="mt-2 text-xs border-t border-emerald-500/10 pt-2 text-muted-foreground/90 font-sans leading-relaxed">
              <strong className="text-foreground">Explanation:</strong> {config.explanation}
            </div>
          )}

          {/* Retry Button to re-attempt (qualitative & single/multi assessments can retry) */}
          <div className="flex justify-end pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-7 text-[10px] font-mono hover:bg-emerald-500/10 hover:text-emerald-300 text-muted-foreground"
            >
              <RefreshCw className="mr-1.5 h-3 w-3" /> Redo Assessment
            </Button>
          </div>
        </div>
      ) : (
        /* Render Interactive Entry View */
        <div className="space-y-3">
          {/* 1. Multiple Choice */}
          {config.type === "multiple-choice" && (
            <RadioGroup
              value={state.answers || ""}
              onValueChange={(val) => updateState({ answers: val })}
              className="space-y-2"
            >
              {config.options?.map((opt) => (
                <div
                  key={opt.id}
                  className="flex items-center space-x-2 rounded-md border border-border/40 p-2 bg-card/40 hover:bg-muted/20 transition cursor-pointer"
                  onClick={() => updateState({ answers: opt.id })}
                >
                  <RadioGroupItem value={opt.id} id={`${item.id}-${opt.id}`} />
                  <Label
                    htmlFor={`${item.id}-${opt.id}`}
                    className="text-xs font-medium cursor-pointer w-full"
                  >
                    {opt.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {/* 2. True / False */}
          {config.type === "true-false" && (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => updateState({ answers: "true" })}
                className={`py-3 px-4 rounded-lg border text-xs font-semibold text-center transition ${
                  state.answers === "true"
                    ? "border-primary bg-primary/10 text-primary font-bold"
                    : "border-border/40 bg-card/35 hover:bg-muted/20"
                }`}
              >
                True
              </button>
              <button
                type="button"
                onClick={() => updateState({ answers: "false" })}
                className={`py-3 px-4 rounded-lg border text-xs font-semibold text-center transition ${
                  state.answers === "false"
                    ? "border-primary bg-primary/10 text-primary font-bold"
                    : "border-border/40 bg-card/35 hover:bg-muted/20"
                }`}
              >
                False
              </button>
            </div>
          )}

          {/* 3. Multiple Select */}
          {config.type === "multiple-select" && (
            <div className="space-y-2">
              {config.options?.map((opt) => {
                const currentList = Array.isArray(state.answers) ? state.answers : [];
                const isSelected = currentList.includes(opt.id);
                const handleCheckChange = () => {
                  if (isSelected) {
                    updateState({ answers: currentList.filter((id) => id !== opt.id) });
                  } else {
                    updateState({ answers: [...currentList, opt.id] });
                  }
                };

                return (
                  <div
                    key={opt.id}
                    className="flex items-center space-x-2 rounded-md border border-border/40 p-2 bg-card/40 hover:bg-muted/20 transition cursor-pointer"
                    onClick={handleCheckChange}
                  >
                    <Checkbox
                      id={`${item.id}-${opt.id}`}
                      checked={isSelected}
                      onCheckedChange={handleCheckChange}
                    />
                    <Label
                      htmlFor={`${item.id}-${opt.id}`}
                      className="text-xs font-medium cursor-pointer w-full"
                    >
                      {opt.label}
                    </Label>
                  </div>
                );
              })}
            </div>
          )}

          {/* 4. Output Prediction */}
          {config.type === "output-prediction" && (
            <div className="space-y-1.5">
              <Input
                placeholder="Type your predicted output (e.g. undefined, true, standard value)"
                value={state.answers || ""}
                onChange={(e) => updateState({ answers: e.target.value })}
                className="font-mono text-xs"
              />
            </div>
          )}

          {/* 5. Open Reflection */}
          {config.type === "open-reflection" && (
            <div className="space-y-1.5">
              <Textarea
                placeholder="Write your brief engineering reflection, STAR narrative, or tradeoffs analysis here..."
                value={state.answers || ""}
                onChange={(e) => updateState({ answers: e.target.value })}
                className="text-xs h-24"
              />
            </div>
          )}

          {/* 6. Structured Form */}
          {config.type === "structured-form" && (
            <div className="space-y-3">
              {config.formFields?.map((field) => {
                const currentVals = state.answers || {};
                const handleFieldChange = (text: string) => {
                  updateState({ answers: { ...currentVals, [field.id]: text } });
                };

                return (
                  <div key={field.id} className="space-y-1">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                      {field.label}
                    </Label>
                    {field.type === "textarea" ? (
                      <Textarea
                        placeholder={field.placeholder || "Enter details..."}
                        value={currentVals[field.id] || ""}
                        onChange={(e) => handleFieldChange(e.target.value)}
                        className="text-xs h-20"
                      />
                    ) : (
                      <Input
                        placeholder={field.placeholder || "Enter response..."}
                        value={currentVals[field.id] || ""}
                        onChange={(e) => handleFieldChange(e.target.value)}
                        className="text-xs"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 7. Sandbox Completion */}
          {config.type === "sandbox-completion" && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono">
                <AlertCircle className="h-4 w-4" />
                <span>Prerequisite: Coding Sandbox Incomplete</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                To master this checkpoint, open the interactive playground coding environment and
                solve the Sandbox Exercise:
                <strong className="text-foreground"> {item.label}</strong>.
              </p>
              <div className="pt-1 flex">
                <Button size="sm" asChild className="text-xs h-8 gap-1 shadow-glow font-semibold">
                  <Link
                    to="/playground"
                    search={{
                      lessonId,
                      sandboxId: config.sandboxId,
                    }}
                  >
                    Open Workspace Sandbox <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {/* 8. Debug Lab Bug Completion */}
          {config.type === "debug-completion" && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono">
                <AlertCircle className="h-4 w-4" />
                <span>Prerequisite: Debug Challenge Unresolved</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                To master this checkpoint, solve the designated debugging lab:
                <strong className="text-foreground"> {item.label}</strong>. Fix the seeded errors in
                the live diagnostic inspector.
              </p>
              <div className="pt-1 flex">
                <Button size="sm" asChild className="text-xs h-8 gap-1 shadow-glow font-semibold">
                  <Link to="/debug-lab/$bugId" params={{ bugId: config.debugBugId || "" }}>
                    Open Debug Challenge <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {/* Submission and Incorrect state feedback */}
          {state.status === "incorrect" && (
            <div className="flex items-start gap-1.5 text-xs text-destructive p-2 bg-destructive/10 rounded border border-destructive/20 leading-relaxed">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <div>
                <span className="font-semibold">Incorrect response.</span> Double check your
                calculations, syntax concepts, or options, and try again.
              </div>
            </div>
          )}

          {/* Action Submission Row */}
          {config.type !== "sandbox-completion" && config.type !== "debug-completion" && (
            <div className="flex justify-between items-center pt-1.5 gap-2">
              {state.status === "incorrect" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateState({ status: "not_started" })}
                  className="h-8 text-xs border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                >
                  <RefreshCw className="mr-1.5 h-3 w-3" /> Retry Answer
                </Button>
              ) : (
                <div />
              )}
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={
                  (config.type === "multiple-choice" && !state.answers) ||
                  (config.type === "true-false" && !state.answers) ||
                  (config.type === "multiple-select" &&
                    (!state.answers || state.answers.length === 0)) ||
                  (config.type === "output-prediction" && !String(state.answers).trim()) ||
                  (config.type === "open-reflection" && !String(state.answers).trim()) ||
                  (config.type === "structured-form" &&
                    !config.formFields?.every(
                      (f) => String(state.answers?.[f.id] || "").trim() !== "",
                    ))
                }
                className="h-8 text-xs font-semibold shadow-glow px-4"
              >
                {config.type === "open-reflection" || config.type === "structured-form"
                  ? "Record Response"
                  : "Submit Answer"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
