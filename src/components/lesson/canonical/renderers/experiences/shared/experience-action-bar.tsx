import { Button } from "@/components/ui/button";
import { Play, CheckCircle2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ExperienceActionBarProps {
  onRun: () => void;
  onCheck: () => void;
  onReset: () => void;
  isRunning: boolean;
  /** True once the activity is already verified correct/completed — actions lock. */
  isLocked: boolean;
  /** True when there is no source to execute yet. */
  disabled: boolean;
  runLabel?: string;
  checkLabel?: string;
  resetLabel?: string;
  className?: string;
}

/**
 * The shared Run / Check / Reset trio for every sandboxed experience
 * renderer. Run is exploratory (never submits), Check produces a technical
 * result (never completes the activity), Reset restores a fresh runtime.
 * "Check Answer" — the learning-engine-owned completion action — lives
 * exclusively in the lesson player's footer, never here.
 */
export function ExperienceActionBar({
  onRun,
  onCheck,
  onReset,
  isRunning,
  isLocked,
  disabled,
  runLabel = "Run",
  checkLabel = "Check",
  resetLabel = "Reset",
  className,
}: ExperienceActionBarProps) {
  const actionsDisabled = disabled || isLocked || isRunning;
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="secondary"
        size="sm"
        onClick={onRun}
        disabled={actionsDisabled}
        className="min-h-9 gap-1.5 text-xs"
      >
        <Play className="h-3.5 w-3.5" />
        {isRunning ? "Running…" : runLabel}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onCheck}
        disabled={actionsDisabled}
        className="min-h-9 gap-1.5 text-xs"
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        {checkLabel}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onReset}
        disabled={disabled || isLocked}
        className="min-h-9 gap-1.5 text-xs text-lesson-text-secondary"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        {resetLabel}
      </Button>
    </div>
  );
}
