import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowLeft,
  Clock,
  Sparkles,
  Check,
  X,
  Target,
  Trophy,
  BarChart3,
  Lightbulb,
} from "lucide-react";

import type { Quiz, QuizQuestion } from "@/lib/types";

interface QuizResultsProps {
  quiz: Quiz;
  userAnswers: Record<string, unknown>;
  timeSpentSeconds: number;
  onRetake: (onlyIncorrect?: boolean) => void;
}

function formatUserAnswer(q: QuizQuestion, ans: unknown): string {
  if (ans === undefined || ans === null) return "No answer provided";
  switch (q.type) {
    case "mcq":
    case "code":
      return typeof ans === "number" && q.options[ans] ? q.options[ans] : "No answer provided";
    case "multiple":
      return Array.isArray(ans)
        ? ans
            .map((i) => (typeof i === "number" ? q.options[i] : ""))
            .filter(Boolean)
            .join(", ")
        : "No answer provided";
    case "ordering":
      return Array.isArray(ans) ? ans.join(" ➔ ") : "No order provided";
    case "drag_drop":
      return typeof ans === "object" ? JSON.stringify(ans) : "No matches provided";
    case "fill_in_blank":
      return typeof ans === "string" ? ans : "No answer provided";
  }
}

function formatCorrectAnswer(q: QuizQuestion): string {
  switch (q.type) {
    case "mcq":
    case "code":
      return q.options[q.correctIndex] ?? "";
    case "multiple":
      return q.correctIndices.map((i) => q.options[i]).join(", ");
    case "ordering":
      return q.correctOrder.join(" ➔ ");
    case "drag_drop":
      return q.pairs.map((p) => `${p.left} ➔ ${p.right}`).join("; ");
    case "fill_in_blank":
      return q.acceptedAnswers.join(" or ");
  }
}

export function QuizResults({ quiz, userAnswers, timeSpentSeconds, onRetake }: QuizResultsProps) {
  const [filter, setFilter] = useState<"all" | "incorrect" | "correct">("all");

  // Helper to check correctness per question type
  const checkQuestionCorrectness = (q: QuizQuestion): boolean => {
    const ans = userAnswers[q.id];
    if (ans === undefined || ans === null) return false;

    switch (q.type) {
      case "mcq":
      case "code":
        return ans === q.correctIndex;

      case "multiple": {
        if (!Array.isArray(ans)) return false;
        const userSet = new Set(ans);
        const correctSet = new Set(q.correctIndices);
        if (userSet.size !== correctSet.size) return false;
        return Array.from(userSet).every((idx) => correctSet.has(idx));
      }

      case "ordering": {
        if (!Array.isArray(ans)) return false;
        return JSON.stringify(ans) === JSON.stringify(q.correctOrder);
      }

      case "drag_drop": {
        if (typeof ans !== "object") return false;
        return q.pairs.every((p) => ans[p.id] === p.right);
      }

      case "fill_in_blank": {
        if (typeof ans !== "string") return false;
        const normalized = ans.trim().toLowerCase().replace(/^\.+/, "");
        return q.acceptedAnswers.some(
          (acc) => acc.trim().toLowerCase().replace(/^\.+/, "") === normalized,
        );
      }

      default:
        return false;
    }
  };

  const questionResults = quiz.questions.map((q) => ({
    question: q,
    isCorrect: checkQuestionCorrectness(q),
  }));

  const correctCount = questionResults.filter((r) => r.isCorrect).length;
  const totalCount = quiz.questions.length;
  const scorePercent = Math.round((correctCount / totalCount) * 100);

  const formattedTimeSpent = `${Math.floor(timeSpentSeconds / 60)}m ${timeSpentSeconds % 60}s`;

  const filteredResults = questionResults.filter((r) => {
    if (filter === "correct") return r.isCorrect;
    if (filter === "incorrect") return !r.isCorrect;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Score Header Banner */}
      <Card className="border-border/60 bg-card shadow-elegant overflow-hidden">
        <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Badge
                variant="outline"
                className={`gap-1 text-xs px-2.5 py-0.5 ${
                  scorePercent >= 80
                    ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                    : scorePercent >= 60
                      ? "border-amber-500/40 text-amber-400 bg-amber-500/10"
                      : "border-rose-500/40 text-rose-400 bg-rose-500/10"
                }`}
              >
                {scorePercent >= 80 ? (
                  <>
                    <Trophy className="h-3.5 w-3.5" /> Mastery Score
                  </>
                ) : scorePercent >= 60 ? (
                  <>
                    <Target className="h-3.5 w-3.5" /> Proficient
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-3.5 w-3.5" /> Review Recommended
                  </>
                )}
              </Badge>

              <Badge variant="outline" className="gap-1 text-xs">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                {formattedTimeSpent}
              </Badge>
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              {correctCount} / {totalCount} Correct ({scorePercent}%)
            </h2>

            <p className="text-sm text-muted-foreground max-w-lg">
              {scorePercent >= 80
                ? "Outstanding work! You demonstrated deep recall and practical accuracy."
                : scorePercent >= 60
                  ? "Good effort! Review the missed questions below to solidify your mastery."
                  : "Keep practicing! Review explanations and retake missed questions."}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 shrink-0">
            {correctCount < totalCount && (
              <Button
                variant="outline"
                onClick={() => onRetake(true)}
                className="gap-2 border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-xs"
              >
                <RotateCcw className="h-4 w-4" />
                Retake Missed ({totalCount - correctCount})
              </Button>
            )}

            <Button onClick={() => onRetake(false)} className="gap-2 text-xs shadow-glow">
              <RotateCcw className="h-4 w-4" />
              Restart Full Quiz
            </Button>
          </div>
        </div>

        <Progress value={scorePercent} className="h-1.5 rounded-none" />
      </Card>

      {/* Review Filter & Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" /> Answer Breakdown & Explanations
        </h3>

        <div className="flex items-center rounded-lg border border-border/60 bg-muted/30 p-1">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
              filter === "all"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setFilter("correct")}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
              filter === "correct"
                ? "bg-emerald-500 text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Correct ({correctCount})
          </button>
          <button
            onClick={() => setFilter("incorrect")}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
              filter === "incorrect"
                ? "bg-rose-500 text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Incorrect ({totalCount - correctCount})
          </button>
        </div>
      </div>

      {/* Questions Review List */}
      <div className="grid gap-4">
        {filteredResults.map(({ question: q, isCorrect }, idx) => (
          <Card
            key={q.id}
            className={`border transition ${
              isCorrect
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-rose-500/30 bg-rose-500/5"
            }`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="text-base font-semibold text-foreground flex items-start gap-2.5">
                  {isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <span>
                    Q{idx + 1}. {q.question}
                  </span>
                </CardTitle>

                <Badge
                  variant="outline"
                  className={`capitalize text-[10px] shrink-0 ${
                    isCorrect
                      ? "border-emerald-500/40 text-emerald-400"
                      : "border-rose-500/40 text-rose-400"
                  }`}
                >
                  {q.type.replace("_", " ")}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 text-xs leading-relaxed">
              {/* User Answer Display */}
              <div className="p-3 rounded-lg bg-background/60 border border-border/50 space-y-1">
                <div className="font-semibold text-muted-foreground flex items-center justify-between">
                  <span>Your Answer:</span>
                  <span className={isCorrect ? "text-emerald-400" : "text-rose-400 font-bold"}>
                    {isCorrect ? "Correct ✓" : "Incorrect ✕"}
                  </span>
                </div>

                <div className="font-mono text-foreground">
                  {formatUserAnswer(q, userAnswers[q.id])}
                </div>
              </div>

              {/* Correct Answer Reference */}
              {!isCorrect && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 space-y-1">
                  <div className="font-semibold text-emerald-400">Correct Answer Reference:</div>
                  <div className="font-mono">{formatCorrectAnswer(q)}</div>
                </div>
              )}

              {/* Explanation Box */}
              <div className="p-3 rounded-lg bg-card/60 border border-border/40 text-muted-foreground flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground block mb-0.5">Explanation:</strong>
                  {q.explanation}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="pt-4 flex items-center justify-between">
        <Button asChild variant="outline">
          <Link to="/quizzes">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Quizzes List
          </Link>
        </Button>
      </div>
    </div>
  );
}
