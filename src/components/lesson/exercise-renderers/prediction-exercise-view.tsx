import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Compass,
  Sparkles,
  CheckCircle2,
  Eye,
  EyeOff,
  RotateCcw,
  Palette,
  TextQuote,
} from "lucide-react";
import { ExerciseCard } from "./exercise-card";
import { useProgressStore } from "@/lib/stores/use-progress-store";
import { isExerciseCompleted } from "@/lib/utils/lesson-step-resolver";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { InteractiveExerciseLessonStep, Lesson } from "@/lib/types";

export interface PredictionExerciseViewProps {
  step: InteractiveExerciseLessonStep;
  lesson?: Lesson;
  onComplete?: () => void;
  className?: string;
}

export function PredictionExerciseView({
  step,
  onComplete,
  className,
}: PredictionExerciseViewProps) {
  const playgroundCompletions = useProgressStore((s) => s.playgroundCompletions);
  const completePlaygroundExercise = useProgressStore((s) => s.completePlaygroundExercise);

  const isAlreadyCompleted = isExerciseCompleted(step.exerciseId, playgroundCompletions);

  const [isRevealed, setIsRevealed] = useState(false);
  const [userPrediction, setUserPrediction] = useState("");
  const [activeColor, setActiveColor] = useState<"blue" | "red">("blue");
  const [activeSize, setActiveSize] = useState<"24px" | "32px">("24px");

  // Extract clean CSS or code block from initialCode
  const displayCode = useMemo(() => {
    if (!step.initialCode) return "";
    const styleMatch = step.initialCode.match(/<style>([\s\S]*?)<\/style>/);
    if (styleMatch && styleMatch[1]) {
      return styleMatch[1].trim();
    }
    return step.initialCode.trim();
  }, [step.initialCode]);

  const handleReveal = () => {
    setIsRevealed(true);
    if (!isAlreadyCompleted) {
      completePlaygroundExercise(step.exerciseId);
      toast.success("Prediction revealed & completed! +50 XP");
    }
    if (onComplete) onComplete();
  };

  const handleToggleColor = () => {
    setActiveColor((prev) => (prev === "blue" ? "red" : "blue"));
  };

  const handleToggleSize = () => {
    setActiveSize((prev) => (prev === "24px" ? "32px" : "24px"));
  };

  const handleReset = () => {
    setIsRevealed(false);
    setUserPrediction("");
    setActiveColor("blue");
    setActiveSize("24px");
  };

  return (
    <ExerciseCard
      title={step.title || "Code Detective & Prediction"}
      mode="prediction"
      leadIn={step.leadIn}
      instructions={step.instructions}
      isCompleted={isAlreadyCompleted || isRevealed}
      className={className}
    >
      <div className="flex flex-col gap-6 max-w-3xl mx-auto py-2">
        {/* Step 1: Code to Inspect */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 text-primary" />
              1. Inspect Rule / Code Snippet
            </span>
            <Badge variant="outline" className="text-[10px] font-mono">
              {step.language || "css"}
            </Badge>
          </div>
          <div className="rounded-xl border border-border/80 bg-muted/40 p-4 font-mono text-xs sm:text-sm text-foreground overflow-x-auto shadow-inner">
            <pre className="whitespace-pre leading-relaxed">
              {displayCode || "/* No snippet provided */"}
            </pre>
          </div>
        </div>

        {/* Step 2: Interactive Prediction Playground / Preview */}
        <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-sky-500" />
              2. Test Your Prediction Live
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleColor}
                className="h-7 text-xs gap-1"
              >
                <Palette className="h-3 w-3 text-primary" />
                Toggle color ({activeColor})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleSize}
                className="h-7 text-xs gap-1"
              >
                <TextQuote className="h-3 w-3 text-primary" />
                Toggle size ({activeSize})
              </Button>
            </div>
          </div>

          {/* Live Rendered Canvas Demo */}
          <div className="rounded-lg border border-border/60 bg-muted/20 p-5 text-center transition-all duration-200">
            <h3
              style={{
                color: activeColor === "blue" ? "#2563eb" : "#dc2626",
                fontSize: activeSize,
                fontWeight: 700,
                transition: "all 0.2s ease-in-out",
              }}
              className="mb-1"
            >
              Forge Academy
            </h3>
            <p className="text-xs text-muted-foreground">
              Current applied style:{" "}
              <code className="text-foreground font-mono">
                color: {activeColor === "blue" ? "#2563eb (Blue)" : "#dc2626 (Red)"}; font-size:{" "}
                {activeSize};
              </code>
            </p>
          </div>

          {/* Optional Prediction Scratchpad */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-medium text-muted-foreground block">
              What is your prediction? (Think or type below before revealing):
            </label>
            <textarea
              value={userPrediction}
              onChange={(e) => setUserPrediction(e.target.value)}
              placeholder="e.g. The selector #heading targets elements by ID and applies blue text with 24px font size..."
              rows={2}
              className="w-full rounded-lg border border-border/60 bg-background/50 p-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Step 3: Revealed Analysis */}
        {isRevealed && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4 sm:p-5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Expert Rule Analysis & Key Takeaway
            </div>
            <div className="space-y-2 text-xs sm:text-sm text-foreground/90 leading-relaxed">
              <p>
                <strong>Selector Breakdown:</strong> The{" "}
                <code className="font-mono text-primary">#heading</code> selector uses an ID
                selector syntax (prefixed by <code className="font-mono">#</code>) to uniquely
                target the element with <code className="font-mono">id="heading"</code>.
              </p>
              <p>
                <strong>Property & Values:</strong>{" "}
                <code className="font-mono">color: #2563eb</code> sets the foreground font color to
                hex blue, and <code className="font-mono">font-size: 24px</code> sets the font size
                dimension.
              </p>
              <p className="text-muted-foreground pt-1 border-t border-border/40">
                💡 <strong>Key Takeaway:</strong> ID selectors carry high CSS specificity and must
                only target unique elements on a single page.
              </p>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50 gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs text-muted-foreground gap-1.5"
          >
            <RotateCcw className="h-3 w-3" />
            Reset State
          </Button>

          {!isRevealed ? (
            <Button
              variant="default"
              size="sm"
              onClick={handleReveal}
              className="text-xs gap-1.5 font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Eye className="h-3.5 w-3.5" />
              Reveal Analysis & Complete (+50 XP)
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRevealed(false)}
                className="text-xs gap-1 text-muted-foreground"
              >
                <EyeOff className="h-3 w-3" />
                Hide Analysis
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={onComplete}
                className="text-xs gap-1.5 font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Continue
              </Button>
            </div>
          )}
        </div>
      </div>
    </ExerciseCard>
  );
}
