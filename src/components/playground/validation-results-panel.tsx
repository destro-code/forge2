import { useMemo } from "react";
import {
  CheckCircle2,
  XCircle,
  MinusCircle,
  Play,
  Loader2,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  Clock,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { usePlaygroundStore } from "@/lib/stores/use-playground-store";
import { useProgressStore } from "@/lib/stores/use-progress-store";
import { getCanonicalExerciseId } from "@/lib/utils/lesson-step-resolver";
import type {
  ExerciseValidationSpec,
  ValidationAssertion,
  ValidationTestResult,
} from "@/lib/types/validation";

interface ValidationResultsPanelProps {
  validationSpec?: ExerciseValidationSpec;
  onRunValidation: () => void;
  isBuilding?: boolean;
}

export function ValidationResultsPanel({
  validationSpec,
  onRunValidation,
  isBuilding = false,
}: ValidationResultsPanelProps) {
  const { validationReport, isValidating } = usePlaygroundStore();

  const exerciseId = validationSpec?.exerciseId;
  const canonId = exerciseId ? getCanonicalExerciseId(exerciseId) : undefined;
  const isExerciseCompletedInStore = useProgressStore((state) =>
    exerciseId
      ? (state.playgroundCompletions || []).some(
          (c) => c.templateId === exerciseId || (canonId && c.templateId === canonId),
        )
      : false,
  );

  const assertions = useMemo(() => validationSpec?.assertions || [], [validationSpec]);

  const requiredAssertions = useMemo(() => assertions.filter((a) => !a.isOptional), [assertions]);

  const optionalAssertions = useMemo(() => assertions.filter((a) => a.isOptional), [assertions]);

  const totalRequired = requiredAssertions.length;
  const totalOptional = optionalAssertions.length;

  // Map results by assertion ID for easy lookup
  const resultsMap = useMemo(() => {
    const map = new Map<string, ValidationTestResult>();
    if (validationReport?.results) {
      for (const res of validationReport.results) {
        map.set(res.assertionId, res);
      }
    }
    return map;
  }, [validationReport]);

  const passedRequiredCount = validationReport
    ? validationReport.results.filter(
        (r) => r.status === "passed" && !assertions.find((a) => a.id === r.assertionId)?.isOptional,
      ).length
    : 0;

  const progressPercent = totalRequired > 0 ? (passedRequiredCount / totalRequired) * 100 : 0;
  const isPassed = validationReport?.status === "passed";
  const isFailed = validationReport?.status === "failed";
  const isIdle = !validationReport && !isValidating;

  // State A: NO VALIDATION SPEC
  if (!validationSpec) {
    return null;
  }

  return (
    <div
      className="flex-1 flex flex-col h-full min-h-[400px] bg-background w-full min-w-0 overflow-hidden font-sans"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-card/60 px-3 py-2 text-xs shrink-0">
        <div className="flex items-center gap-1.5 font-medium text-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>Exercise Validation</span>
          {isIdle && (
            <>
              <Badge variant="outline" className="text-[10px] h-4.5 px-1.5 text-muted-foreground">
                {totalRequired} {totalRequired === 1 ? "check" : "checks"} required
              </Badge>
              {isExerciseCompletedInStore && (
                <Badge
                  variant="outline"
                  className="text-[10px] h-4.5 px-1.5 border-emerald-500/40 text-emerald-400 bg-emerald-500/10 gap-1 font-mono"
                >
                  <Check className="h-3 w-3" />
                  Completed
                </Badge>
              )}
            </>
          )}
          {isValidating && (
            <Badge
              variant="outline"
              className="text-[10px] h-4.5 px-1.5 border-primary/40 text-primary bg-primary/10 gap-1 animate-pulse"
            >
              <Loader2 className="h-3 w-3 animate-spin" />
              Validating...
            </Badge>
          )}
          {isPassed && (
            <div className="flex items-center gap-1.5">
              <Badge
                variant="outline"
                className="text-[10px] h-4.5 px-1.5 border-emerald-500/40 text-emerald-400 bg-emerald-500/10 gap-1"
              >
                <Check className="h-3 w-3" />
                Passed ({passedRequiredCount}/{totalRequired})
              </Badge>
              {isExerciseCompletedInStore && (
                <Badge
                  variant="outline"
                  className="text-[10px] h-4.5 px-1.5 border-amber-500/40 text-amber-300 bg-amber-500/10 gap-1 font-mono"
                >
                  <Sparkles className="h-3 w-3" />
                  Completed
                </Badge>
              )}
            </div>
          )}
          {isFailed && (
            <Badge
              variant="outline"
              className="text-[10px] h-4.5 px-1.5 border-rose-500/40 text-rose-400 bg-rose-500/10 gap-1"
            >
              <X className="h-3 w-3" />
              Not Passed ({passedRequiredCount}/{totalRequired})
            </Badge>
          )}
        </div>

        <Button
          size="sm"
          onClick={onRunValidation}
          disabled={isValidating || isBuilding}
          className={`h-7 px-2.5 text-xs font-semibold gap-1.5 ${
            isPassed
              ? "border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300"
              : "shadow-glow bg-primary hover:bg-primary/90 text-primary-foreground"
          }`}
          aria-label={isValidating ? "Validating solution..." : "Run and Validate Exercise"}
        >
          {isValidating ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Validating...</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>{isPassed ? "Re-run Checks" : "Run & Validate"}</span>
            </>
          )}
        </Button>
      </div>

      {/* Main Validation Content Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 w-full min-w-0">
        {/* State B: IDLE */}
        {isIdle && (
          <div className="rounded-lg border border-border/60 bg-card/30 p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Automated Check Suite
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Your code will be evaluated against {totalRequired} required automated{" "}
                  {totalRequired === 1 ? "assertion" : "assertions"}
                  {totalOptional > 0 ? ` and ${totalOptional} optional challenge` : ""}.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 block mb-2">
                Requirements Checklist
              </span>
              <div className="space-y-1.5" role="list">
                {assertions.map((assertion) => (
                  <div
                    key={assertion.id}
                    className="flex items-start gap-2 rounded-md border border-border/40 bg-background/50 p-2 text-xs"
                    role="listitem"
                  >
                    <div className="h-4 w-4 rounded-full border border-border flex items-center justify-center shrink-0 mt-0.5 text-muted-foreground text-[10px]">
                      •
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-foreground font-medium block">
                        {assertion.description}
                      </span>
                      {assertion.isOptional && (
                        <span className="text-[10px] text-amber-400 font-mono inline-block mt-0.5">
                          Optional Challenge
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-border/40">
              <span className="text-[11px] text-muted-foreground">
                Click &quot;Run &amp; Validate&quot; to test your solution.
              </span>
              <Button
                size="sm"
                onClick={onRunValidation}
                disabled={isValidating || isBuilding}
                className="h-7 text-xs gap-1 shadow-glow"
              >
                <Play className="h-3 w-3 fill-current" /> Run &amp; Validate
              </Button>
            </div>
          </div>
        )}

        {/* State C: VALIDATING */}
        {isValidating && (
          <div className="rounded-lg border border-primary/40 bg-primary/5 p-4 space-y-3 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-foreground">
                  Running Exercise Assertions...
                </h4>
                <p className="text-xs text-muted-foreground">
                  Evaluating DOM queries, computed styles, and sandbox runtime state.
                </p>
              </div>
            </div>
            <Progress value={50} className="h-1.5 bg-primary/20" />
            <div className="space-y-1.5 pt-1">
              {assertions.map((assertion) => (
                <div
                  key={assertion.id}
                  className="flex items-center gap-2 rounded-md border border-border/30 bg-background/30 p-2 text-xs opacity-60"
                >
                  <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
                  <span className="text-foreground truncate">{assertion.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* State D & E: FAILED or PASSED (Report available) */}
        {validationReport && !isValidating && (
          <div className="space-y-4">
            {/* Status Summary Banner */}
            <div
              className={`rounded-xl border p-4 shadow-sm ${
                isPassed
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                  : "border-rose-500/40 bg-rose-500/10 text-rose-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isPassed
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-rose-500/20 text-rose-400"
                    }`}
                  >
                    {isPassed ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <XCircle className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      {isPassed
                        ? "All Required Checks Passed!"
                        : `${passedRequiredCount} of ${totalRequired} required checks passed`}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isPassed
                        ? isExerciseCompletedInStore
                          ? "Your solution meets all required criteria and is recorded as completed."
                          : "Your solution meets all required exercise criteria."
                        : "Some requirements have not been satisfied yet. Review the details below."}
                    </p>
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className={`text-xs font-semibold shrink-0 ${
                    isPassed
                      ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                      : "border-rose-500/40 bg-rose-500/20 text-rose-300"
                  }`}
                >
                  {isPassed ? "PASSED" : "NOT PASSED"}
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                  <span>Progress</span>
                  <span>{Math.round(progressPercent)}%</span>
                </div>
                <Progress
                  value={progressPercent}
                  className={`h-1.5 ${
                    isPassed
                      ? "bg-emerald-950 [&>div]:bg-emerald-500"
                      : "bg-rose-950 [&>div]:bg-rose-500"
                  }`}
                />
              </div>
            </div>

            {/* Required Assertions Section */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>
                  Required Assertions ({passedRequiredCount}/{totalRequired})
                </span>
                {validationReport.timestamp && (
                  <span className="text-[10px] font-mono lowercase flex items-center gap-1 font-normal">
                    <Clock className="h-3 w-3" />
                    {new Date(validationReport.timestamp).toLocaleTimeString()}
                  </span>
                )}
              </span>

              <div className="space-y-2" role="list">
                {requiredAssertions.map((assertion) => {
                  const result = resultsMap.get(assertion.id);
                  return (
                    <AssertionResultRow key={assertion.id} assertion={assertion} result={result} />
                  );
                })}
              </div>
            </div>

            {/* Optional Challenges Section (if present) */}
            {optionalAssertions.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/40">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Optional Challenges (Non-blocking)
                </span>

                <div className="space-y-2" role="list">
                  {optionalAssertions.map((assertion) => {
                    const result = resultsMap.get(assertion.id);
                    return (
                      <AssertionResultRow
                        key={assertion.id}
                        assertion={assertion}
                        result={result}
                        isOptional
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface AssertionResultRowProps {
  assertion: ValidationAssertion;
  result?: ValidationTestResult;
  isOptional?: boolean;
}

function AssertionResultRow({ assertion, result, isOptional = false }: AssertionResultRowProps) {
  const status = result?.status || "skipped";
  const isSuccess = status === "passed";
  const isFailed = status === "failed";
  const isSkipped = status === "skipped";

  const errorMessage = result?.errorMessage || assertion.failureMessage;

  return (
    <div
      className={`rounded-lg border p-3 text-xs transition-all ${
        isSuccess
          ? "border-emerald-500/30 bg-emerald-500/5 text-foreground"
          : isFailed
            ? isOptional
              ? "border-amber-500/30 bg-amber-500/5 text-foreground"
              : "border-rose-500/40 bg-rose-500/10 text-foreground"
            : "border-border/40 bg-card/30 text-muted-foreground"
      }`}
      role="listitem"
    >
      <div className="flex items-start gap-2.5">
        {/* Status Icon */}
        <div className="mt-0.5 shrink-0">
          {isSuccess && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
          {isFailed && (
            <XCircle className={`h-4 w-4 ${isOptional ? "text-amber-400" : "text-rose-400"}`} />
          )}
          {isSkipped && <MinusCircle className="h-4 w-4 text-muted-foreground/60" />}
        </div>

        {/* Assertion Description & Details */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="font-semibold text-foreground leading-snug">
              {assertion.description}
            </span>

            <div className="flex items-center gap-1.5 shrink-0">
              {isOptional && (
                <Badge
                  variant="outline"
                  className="text-[9px] h-4 px-1 border-amber-500/30 text-amber-400 bg-amber-500/10"
                >
                  Optional
                </Badge>
              )}
              <Badge
                variant="outline"
                className={`text-[9px] font-mono uppercase h-4 px-1 ${
                  isSuccess
                    ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                    : isFailed
                      ? isOptional
                        ? "border-amber-500/30 text-amber-400 bg-amber-500/10"
                        : "border-rose-500/30 text-rose-400 bg-rose-500/10"
                      : "border-border text-muted-foreground"
                }`}
              >
                {status}
              </Badge>
              {result && typeof result.durationMs === "number" && result.durationMs > 0 && (
                <span className="text-[10px] text-muted-foreground/70 font-mono">
                  {result.durationMs}ms
                </span>
              )}
            </div>
          </div>

          {/* Failure message presentation */}
          {isFailed && errorMessage && (
            <div
              className={`mt-2 rounded border p-2.5 text-[11px] leading-relaxed font-sans ${
                isOptional
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-200/90"
                  : "border-rose-500/30 bg-rose-500/10 text-rose-200/90"
              }`}
            >
              <div className="font-medium flex items-center gap-1 mb-0.5">
                <AlertTriangle className="h-3 w-3" />
                <span>{isOptional ? "Optional Hint:" : "Correction required:"}</span>
              </div>
              <p className="whitespace-pre-wrap">{errorMessage}</p>
            </div>
          )}

          {/* Skipped reason */}
          {isSkipped && (
            <p className="text-[11px] text-muted-foreground/80 italic mt-1">
              Check skipped (execution stopped after earlier failure).
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
