import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scale,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Lock,
  Check,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { JudgmentStep } from "../types";

export interface JudgmentRendererProps {
  step: JudgmentStep;
  onComplete: (evidence?: any) => void;
  isCompleted: boolean;
}

export function JudgmentRenderer({
  step,
  onComplete,
  isCompleted,
}: {
  step: JudgmentStep;
  onComplete: (evidence?: any) => void;
  isCompleted: boolean;
}) {
  const [response, setResponse] = useState<string>("");
  const [isCommitted, setIsCommitted] = useState<boolean>(isCompleted);
  const [checkedCriteria, setCheckedCriteria] = useState<Set<string>>(new Set());

  const MIN_CHARACTERS = 50;
  const charCount = response.trim().length;
  const isSatisfied = charCount >= MIN_CHARACTERS;
  const progressPercent = Math.min(100, (charCount / MIN_CHARACTERS) * 100);

  const handleCommit = () => {
    if (!isSatisfied) return;
    setIsCommitted(true);
  };

  const toggleCriterion = (criterionId: string) => {
    if (isCompleted) return;
    setCheckedCriteria((prev) => {
      const next = new Set(prev);
      if (next.has(criterionId)) {
        next.delete(criterionId);
      } else {
        next.add(criterionId);
      }
      return next;
    });
  };

  const handleFinish = () => {
    onComplete({
      response,
      checkedCriteria: Array.from(checkedCriteria),
      totalCriteria: step.evaluationRubric?.length || 0,
      charCount,
    });
  };

  const isLocked = isCommitted || isCompleted;
  const rubricList = step.evaluationRubric || [];
  const takeawaysList = step.takeaways || [];
  const keyTradeoffs = step.modelAnswer?.keyTradeoffs || [];

  return (
    <div
      id={`judgment-step-${step.id}`}
      className="w-full max-w-4xl mx-auto flex flex-col bg-lesson-surface border border-lesson-border rounded-xl shadow-xs overflow-hidden text-lesson-text-primary transition-all"
    >
      {/* Header */}
      <div className="p-6 border-b border-lesson-border bg-muted/30 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
                Judgment &amp; Decision Drill
              </span>
              {isCompleted && (
                <Badge
                  variant="outline"
                  className="text-xs border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 gap-1 font-mono"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Completed
                </Badge>
              )}
            </div>
            <h2 className="text-lg font-extrabold text-foreground tracking-tight">
              {step.title || "Engineering Judgment Drill"}
            </h2>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-8">
        {/* Context & Prompt */}
        <div className="space-y-4">
          {step.context && (
            <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-1.5 text-sm">
              <span className="text-xs font-mono font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-primary" />
                Scenario Context
              </span>
              <p className="text-foreground/90 leading-relaxed font-sans">{step.context}</p>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-foreground leading-snug">{step.prompt}</h3>
          </div>
        </div>

        {/* Step 1: Text Response Capture */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label
              htmlFor={`judgment-textarea-${step.id}`}
              className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground/90 flex items-center gap-1.5"
            >
              {isLocked ? (
                <Lock className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Scale className="w-3.5 h-3.5 text-primary" />
              )}
              <span>Your Architectural Judgment</span>
            </label>
            {isLocked && (
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <Lock className="w-3 h-3" /> Response Locked &amp; Saved
              </span>
            )}
          </div>

          <Textarea
            id={`judgment-textarea-${step.id}`}
            value={response}
            disabled={isLocked}
            placeholder={
              step.responsePlaceholder ||
              "Articulate your architectural judgment, trade-offs, and reasoning here..."
            }
            rows={6}
            onChange={(e) => setResponse(e.target.value)}
            className={cn(
              "text-base resize-y leading-relaxed font-sans p-4 rounded-xl border-lesson-border bg-card shadow-xs transition-all duration-200",
              isLocked && "opacity-90 bg-muted/30 cursor-not-allowed border-emerald-500/30",
            )}
            aria-label="Your Architectural Judgment response"
          />

          {!isLocked && (
            <div className="flex flex-col gap-2 pt-1 font-mono text-xs select-none">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  {isSatisfied ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  )}
                  <span>
                    {charCount} / {MIN_CHARACTERS} character minimum
                  </span>
                </span>
                {isSatisfied && (
                  <span className="text-emerald-500 font-bold animate-pulse">Ready to Commit</span>
                )}
              </div>
              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "h-full rounded-full transition-colors",
                    isSatisfied ? "bg-emerald-500" : "bg-primary",
                  )}
                />
              </div>
            </div>
          )}

          {!isLocked && (
            <div className="pt-2 flex justify-end">
              <Button
                onClick={handleCommit}
                disabled={!isSatisfied}
                className="gap-2 font-semibold shadow-xs"
              >
                <span>Commit &amp; Compare</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Reveal Expert Model Answer & Self-Assessment Rubric */}
        <AnimatePresence mode="wait">
          {isLocked && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="space-y-8 pt-4 border-t border-lesson-border"
            >
              {/* Expert Model Answer */}
              <div className="p-6 rounded-2xl border border-sky-500/20 bg-sky-500/5 space-y-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-sky-500/20 pb-3">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-500" />
                    <span>Expert Model Answer &amp; Benchmark Rationale</span>
                  </span>
                  <Badge
                    variant="outline"
                    className="text-xs border-sky-500/30 text-sky-600 dark:text-sky-400 font-mono"
                  >
                    Benchmark Reference
                  </Badge>
                </div>

                {/* Summary */}
                {step.modelAnswer?.summary && (
                  <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 space-y-1">
                    <span className="text-xs font-mono font-bold uppercase text-sky-700 dark:text-sky-300">
                      Core Benchmark Summary
                    </span>
                    <p className="text-foreground font-semibold leading-relaxed text-sm md:text-base">
                      {step.modelAnswer.summary}
                    </p>
                  </div>
                )}

                {/* Detailed Rationale */}
                {step.modelAnswer?.detailedAnalysis && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-mono font-bold uppercase text-muted-foreground">
                      Detailed Rationale &amp; Analysis
                    </h4>
                    <p className="text-foreground/90 leading-relaxed text-sm font-sans whitespace-pre-line">
                      {step.modelAnswer.detailedAnalysis}
                    </p>
                  </div>
                )}

                {/* Key Tradeoffs */}
                {keyTradeoffs.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-mono font-bold uppercase text-muted-foreground">
                      Key Tradeoffs &amp; Considerations
                    </h4>
                    <ul className="grid gap-2 text-sm text-foreground/90">
                      {keyTradeoffs.map((tradeoff, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-sky-500 shrink-0 font-bold select-none">•</span>
                          <span>{tradeoff}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Self-Assessment Rubric */}
              {rubricList.length > 0 && (
                <div className="p-6 rounded-2xl border border-lesson-border bg-card space-y-5 shadow-xs">
                  <div className="flex items-center justify-between border-b border-lesson-border pb-3">
                    <div className="space-y-0.5">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                        <CheckSquare className="w-4 h-4" />
                        <span>Self-Assessment Rubric</span>
                      </span>
                      <p className="text-xs text-muted-foreground">
                        Compare your response against the criteria below and check off what you
                        covered:
                      </p>
                    </div>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {checkedCriteria.size} / {rubricList.length} Criteria Met
                    </Badge>
                  </div>

                  <div className="grid gap-3">
                    {rubricList.map((criterion) => {
                      const isChecked = checkedCriteria.has(criterion.id);
                      return (
                        <div
                          key={criterion.id}
                          onClick={() => toggleCriterion(criterion.id)}
                          className={cn(
                            "p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none",
                            isChecked
                              ? "border-emerald-500/40 bg-emerald-500/5 text-foreground"
                              : "border-border/80 bg-muted/10 hover:bg-muted/20 text-foreground/80",
                          )}
                        >
                          <Checkbox
                            id={`criterion-${criterion.id}`}
                            checked={isChecked}
                            onCheckedChange={() => toggleCriterion(criterion.id)}
                            disabled={isCompleted}
                            className="mt-0.5"
                          />
                          <div className="space-y-1">
                            <label
                              htmlFor={`criterion-${criterion.id}`}
                              className="text-sm font-bold leading-none cursor-pointer block text-foreground"
                            >
                              {criterion.label}
                            </label>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {criterion.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Takeaways */}
              {takeawaysList.length > 0 && (
                <div className="p-5 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Engineering Takeaways</span>
                  </span>
                  <ul className="grid gap-2 text-sm text-foreground/90">
                    {takeawaysList.map((takeaway, idx) => (
                      <li key={idx} className="flex items-start gap-2 font-medium">
                        <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Completion Action */}
              <div className="flex justify-end pt-2">
                {!isCompleted ? (
                  <Button
                    onClick={handleFinish}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs px-6 py-2.5 rounded-xl"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete Judgment Drill</span>
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-sm bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/30">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Drill Completed &amp; Recorded</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
