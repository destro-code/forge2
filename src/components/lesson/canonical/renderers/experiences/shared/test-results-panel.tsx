import { CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExperienceTestResult } from "../../../runtime/use-experience-controller";

export interface TestResultsPanelProps {
  results: ExperienceTestResult[];
  successMessage: string;
  failureMessage: string;
  className?: string;
}

/**
 * The shared per-assertion feedback surface shown after Check. This
 * displays the technical result the sandbox actually produced — it never
 * fabricates pass/fail state locally.
 */
export function TestResultsPanel({
  results,
  successMessage,
  failureMessage,
  className,
}: TestResultsPanelProps) {
  if (results.length === 0) return null;
  const allPassed = results.every((test) => test.passed);

  return (
    <div className={cn("space-y-3", className)}>
      <div
        className={cn(
          "flex items-start gap-3 rounded-xl border p-4",
          allPassed
            ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-900 dark:text-emerald-200"
            : "border-rose-500/20 bg-rose-500/5 text-rose-900 dark:text-rose-200",
        )}
      >
        {allPassed ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
        )}
        <p className="text-sm font-semibold leading-relaxed text-lesson-text-primary">
          {allPassed ? successMessage : failureMessage}
        </p>
      </div>

      <div className="space-y-1.5">
        {results.map((test, index) => (
          <div
            key={test.id || index}
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
              <span className="font-medium text-lesson-text-primary">{test.description}</span>
              {test.error && (
                <p className="mt-1 font-mono text-[11px] text-rose-500">{test.error}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
