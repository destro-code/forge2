import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useQuiz } from "@/lib/hooks/use-content";
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Flag,
  RotateCcw,
  Eye,
  AlertTriangle,
  Clock,
  Sparkles,
} from "lucide-react";

import type { Quiz, QuizQuestion } from "@/lib/types";
import quizzesData from "@/data/quizzes.json";
import { QuizTimer } from "@/components/quiz/quiz-timer";
import { QuizNavigationDrawer } from "@/components/quiz/quiz-navigation-drawer";
import { MCQQuestionCard } from "@/components/quiz/questions/mcq-question";
import { MultipleQuestionCard } from "@/components/quiz/questions/multiple-question";
import { OrderingQuestionCard } from "@/components/quiz/questions/ordering-question";
import { DragDropQuestionCard } from "@/components/quiz/questions/drag-drop-question";
import { CodeQuestionCard } from "@/components/quiz/questions/code-question";
import { FillInBlankQuestionCard } from "@/components/quiz/questions/fill-blank-question";
import { QuizResults } from "@/components/quiz/quiz-results";

export const Route = createFileRoute("/quizzes/$quizId")({
  loader: ({ params }) => {
    const quizExists = (quizzesData as Quiz[]).some((q) => q.id === params.quizId);
    if (!quizExists) {
      throw notFound();
    }
  },
  head: () => ({
    meta: [
      { title: "Quiz Runner · Forge" },
      {
        name: "description",
        content: "Interactive quiz engine with timer, review mode, and instant feedback.",
      },
      { property: "og:title", content: "Forge Quiz Engine" },
      { property: "og:description", content: "Sharpen your frontend mastery." },
    ],
  }),
  component: QuizPlay,
});

function QuizPlay() {
  const { quizId } = Route.useParams();
  const quiz = useQuiz(quizId);

  // State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, unknown>>({});
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(0);

  // Retake questions list (for retake missed mode)
  const [customQuestions, setCustomQuestions] = useState<QuizQuestion[] | null>(null);
  const activeQuestions = customQuestions || (quiz ? quiz.questions : []);

  // Submit Handler
  const handleSubmitQuiz = useCallback(() => {
    setIsFinished(true);
    toast.success("Quiz submitted! Generating score summary...");
  }, []);

  // Timer expire handler
  const handleTimeExpired = useCallback(() => {
    toast.warning("Time expired! Automatically submitting your answers.");
    setIsFinished(true);
  }, []);

  if (!quiz) {
    throw notFound();
  }

  if (activeQuestions.length === 0) {
    return null;
  }

  const currentQuestion = activeQuestions[currentIndex] || activeQuestions[0];
  const progressPercent = ((currentIndex + 1) / activeQuestions.length) * 100;

  // Answer updater handler
  const handleAnswerChange = (questionId: string, answer: unknown) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  // Toggle flag
  const handleToggleFlag = (questionId: string) => {
    setFlaggedIds((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
        toast.info("Unflagged question");
      } else {
        next.add(questionId);
        toast.info("Flagged question for review");
      }
      return next;
    });
  };

  // Retake handler
  const handleRetake = (onlyIncorrect = false) => {
    if (onlyIncorrect) {
      const incorrectQuestions = activeQuestions.filter((q) => {
        const ans = userAnswers[q.id];
        if (q.type === "mcq" || q.type === "code") return ans !== q.correctIndex;
        if (q.type === "multiple") {
          const userArr = Array.isArray(ans) ? [...ans].sort() : [];
          const correctArr = [...q.correctIndices].sort();
          return JSON.stringify(userArr) !== JSON.stringify(correctArr);
        }
        return true;
      });

      if (incorrectQuestions.length === 0) {
        toast.success("No incorrect questions to retake!");
        return;
      }
      setCustomQuestions(incorrectQuestions);
    } else {
      setCustomQuestions(null);
    }

    setUserAnswers({});
    setFlaggedIds(new Set());
    setCurrentIndex(0);
    setIsReviewMode(false);
    setIsFinished(false);
    setTimeSpentSeconds(0);
    setIsTimerPaused(false);
  };

  // Render post-quiz results
  if (isFinished) {
    return (
      <QuizResults
        quiz={{ ...quiz, questions: activeQuestions }}
        userAnswers={userAnswers}
        timeSpentSeconds={timeSpentSeconds}
        onRetake={handleRetake}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Quiz Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/quizzes"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Quizzes
            </Link>
            <span className="text-muted-foreground">/</span>
            <Badge variant="secondary" className="text-[10px]">
              {quiz.difficulty}
            </Badge>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">{quiz.title}</h1>
        </div>

        {/* Timer & Controls */}
        <div className="flex items-center gap-3">
          <QuizTimer
            durationMinutes={quiz.estimatedMinutes}
            onTimeExpired={handleTimeExpired}
            isPaused={isTimerPaused}
            onTogglePause={() => setIsTimerPaused(!isTimerPaused)}
            onTick={(secondsRemaining) => {
              const elapsed = quiz.estimatedMinutes * 60 - secondsRemaining;
              setTimeSpentSeconds(elapsed);
            }}
          />

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsReviewMode(!isReviewMode)}
            className="gap-1.5 text-xs"
          >
            <Eye className="h-3.5 w-3.5 text-primary" />
            {isReviewMode ? "Resume Exam" : "Review All"}
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
          <span>
            Question {currentIndex + 1} of {activeQuestions.length}
          </span>
          <span>{Math.round(progressPercent)}% Completed</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Paused Overlay */}
      {isTimerPaused && (
        <Card className="border-amber-500/50 bg-amber-500/10 p-6 text-center space-y-3">
          <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto" />
          <h3 className="text-lg font-bold text-amber-300">Quiz Paused</h3>
          <p className="text-xs text-amber-200/80 max-w-md mx-auto">
            The timer is paused. Take a breath and resume whenever you are ready.
          </p>
          <Button onClick={() => setIsTimerPaused(false)} className="gap-2 text-xs shadow-glow">
            Resume Quiz
          </Button>
        </Card>
      )}

      {/* Main Question Card / Review Mode */}
      {!isTimerPaused && (
        <>
          {isReviewMode ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 text-xs space-y-1 text-primary">
                <div className="flex items-center gap-1.5 font-bold">
                  <Sparkles className="h-4 w-4" /> Exam Review Mode
                </div>
                <p className="text-foreground/80">
                  Review all your current choices below before making final submission. You can
                  click any question card to jump directly to edit it.
                </p>
              </div>

              <div className="grid gap-4">
                {activeQuestions.map((q, idx) => (
                  <Card
                    key={q.id}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setIsReviewMode(false);
                    }}
                    className={`border cursor-pointer transition hover:border-primary/60 ${
                      userAnswers[q.id] !== undefined
                        ? "border-emerald-500/30 bg-card/60"
                        : "border-border/60 bg-muted/10"
                    }`}
                  >
                    <CardHeader className="py-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold text-foreground">
                          Q{idx + 1}. {q.question}
                        </CardTitle>
                        <Badge variant="outline" className="text-[10px]">
                          {userAnswers[q.id] !== undefined ? "Answered" : "Unanswered"}
                        </Badge>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card className="border-border/60 bg-card shadow-elegant">
              <CardContent className="p-6">
                {currentQuestion.type === "mcq" && (
                  <MCQQuestionCard
                    question={currentQuestion}
                    selectedAnswer={userAnswers[currentQuestion.id] as number | undefined}
                    onSelectAnswer={(ans) => handleAnswerChange(currentQuestion.id, ans)}
                  />
                )}

                {currentQuestion.type === "multiple" && (
                  <MultipleQuestionCard
                    question={currentQuestion}
                    selectedAnswers={userAnswers[currentQuestion.id] as number[] | undefined}
                    onSelectAnswer={(ans) => handleAnswerChange(currentQuestion.id, ans)}
                  />
                )}

                {currentQuestion.type === "ordering" && (
                  <OrderingQuestionCard
                    question={currentQuestion}
                    currentOrder={userAnswers[currentQuestion.id] as string[] | undefined}
                    onOrderChange={(ans) => handleAnswerChange(currentQuestion.id, ans)}
                  />
                )}

                {currentQuestion.type === "drag_drop" && (
                  <DragDropQuestionCard
                    question={currentQuestion}
                    currentMatches={
                      userAnswers[currentQuestion.id] as Record<string, string> | undefined
                    }
                    onMatchChange={(ans) => handleAnswerChange(currentQuestion.id, ans)}
                  />
                )}

                {currentQuestion.type === "code" && (
                  <CodeQuestionCard
                    question={currentQuestion}
                    selectedAnswer={userAnswers[currentQuestion.id] as number | undefined}
                    onSelectAnswer={(ans) => handleAnswerChange(currentQuestion.id, ans)}
                  />
                )}

                {currentQuestion.type === "fill_in_blank" && (
                  <FillInBlankQuestionCard
                    question={currentQuestion}
                    userAnswer={userAnswers[currentQuestion.id] as string | undefined}
                    onAnswerChange={(ans) => handleAnswerChange(currentQuestion.id, ans)}
                  />
                )}

                {/* Question Navigation Footer */}
                <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                    className="gap-1.5 text-xs"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Previous
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      variant={flaggedIds.has(currentQuestion.id) ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => handleToggleFlag(currentQuestion.id)}
                      className="gap-1.5 text-xs"
                    >
                      <Flag
                        className={`h-3.5 w-3.5 ${
                          flaggedIds.has(currentQuestion.id) ? "fill-amber-400 text-amber-400" : ""
                        }`}
                      />
                      {flaggedIds.has(currentQuestion.id) ? "Flagged" : "Flag"}
                    </Button>

                    {currentIndex + 1 < activeQuestions.length ? (
                      <Button
                        size="sm"
                        onClick={() =>
                          setCurrentIndex((i) => Math.min(activeQuestions.length - 1, i + 1))
                        }
                        className="gap-1.5 text-xs"
                      >
                        Next <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={handleSubmitQuiz}
                        className="gap-1.5 shadow-glow text-xs"
                      >
                        <Check className="h-3.5 w-3.5" /> Submit Quiz
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Drawer Navigator */}
          <QuizNavigationDrawer
            questions={activeQuestions}
            currentIndex={currentIndex}
            userAnswers={userAnswers}
            flaggedQuestionIds={flaggedIds}
            onSelectQuestion={(idx) => {
              setCurrentIndex(idx);
              setIsReviewMode(false);
            }}
            onToggleFlag={handleToggleFlag}
            isReviewMode={isReviewMode}
            onToggleReviewMode={() => setIsReviewMode(!isReviewMode)}
            onSubmitQuiz={handleSubmitQuiz}
          />
        </>
      )}
    </div>
  );
}
