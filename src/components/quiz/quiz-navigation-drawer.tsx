import { Flag, CheckCircle2, Circle, Eye, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { QuizQuestion } from "@/lib/types";

interface QuizNavigationDrawerProps {
  questions: QuizQuestion[];
  currentIndex: number;
  userAnswers: Record<string, unknown>;
  flaggedQuestionIds: Set<string>;
  onSelectQuestion: (index: number) => void;
  onToggleFlag: (questionId: string) => void;
  isReviewMode: boolean;
  onToggleReviewMode: () => void;
  onSubmitQuiz: () => void;
}

export function QuizNavigationDrawer({
  questions,
  currentIndex,
  userAnswers,
  flaggedQuestionIds,
  onSelectQuestion,
  onToggleFlag,
  isReviewMode,
  onToggleReviewMode,
  onSubmitQuiz,
}: QuizNavigationDrawerProps) {
  const isQuestionAnswered = (q: QuizQuestion) => {
    const ans = userAnswers[q.id];
    if (ans === undefined || ans === null) return false;
    if (Array.isArray(ans)) return ans.length > 0;
    if (typeof ans === "object") return Object.keys(ans).length > 0;
    if (typeof ans === "string") return ans.trim().length > 0;
    return true;
  };

  const answeredCount = questions.filter((q) => isQuestionAnswered(q)).length;
  const flaggedCount = flaggedQuestionIds.size;
  const currentQuestion = questions[currentIndex];
  const isCurrentFlagged = currentQuestion ? flaggedQuestionIds.has(currentQuestion.id) : false;

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 space-y-4 shadow-sm">
      {/* Drawer Header */}
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <div>
          <h4 className="text-sm font-semibold text-foreground">Question Navigator</h4>
          <p className="text-xs text-muted-foreground">
            {answeredCount} of {questions.length} answered · {flaggedCount} flagged
          </p>
        </div>

        {currentQuestion && (
          <Button
            variant={isCurrentFlagged ? "secondary" : "outline"}
            size="sm"
            onClick={() => onToggleFlag(currentQuestion.id)}
            className={`gap-1.5 text-xs ${
              isCurrentFlagged ? "border-amber-500/50 text-amber-400 bg-amber-500/10" : ""
            }`}
          >
            <Flag
              className={`h-3.5 w-3.5 ${isCurrentFlagged ? "fill-amber-400 text-amber-400" : ""}`}
            />
            {isCurrentFlagged ? "Flagged" : "Flag for Review"}
          </Button>
        )}
      </div>

      {/* Grid of Question Badges */}
      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
        {questions.map((q, idx) => {
          const answered = isQuestionAnswered(q);
          const isFlagged = flaggedQuestionIds.has(q.id);
          const isCurrent = idx === currentIndex;

          return (
            <button
              key={q.id}
              onClick={() => onSelectQuestion(idx)}
              className={`relative flex flex-col items-center justify-center h-10 rounded-lg border text-xs font-semibold transition ${
                isCurrent
                  ? "border-primary bg-primary/20 text-primary ring-2 ring-primary/30"
                  : answered
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:border-emerald-500/60"
                    : "border-border/60 bg-muted/20 text-muted-foreground hover:border-border hover:text-foreground"
              }`}
            >
              <span>{idx + 1}</span>

              {/* Status Icons */}
              <div className="absolute top-0.5 right-0.5 flex gap-0.5">
                {isFlagged && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3 text-xs">
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> Answered
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-400" /> Flagged
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-border" /> Unanswered
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={isReviewMode ? "secondary" : "outline"}
            size="sm"
            onClick={onToggleReviewMode}
            className="gap-1.5 text-xs"
          >
            <Eye className="h-3.5 w-3.5 text-primary" />
            {isReviewMode ? "Exit Review Mode" : "Review All Answers"}
          </Button>

          <Button size="sm" onClick={onSubmitQuiz} className="gap-1.5 shadow-glow text-xs">
            <Check className="h-3.5 w-3.5" /> Submit Quiz
          </Button>
        </div>
      </div>
    </div>
  );
}
