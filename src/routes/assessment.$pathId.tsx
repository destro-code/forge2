import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  RotateCcw,
  BookOpen,
  HelpCircle,
  Lock,
  Trophy,
  Check,
  Flag,
} from "lucide-react";

import { useProgress } from "@/lib/hooks/use-progress";
import { checkPathEligibility } from "@/lib/utils/path-eligibility";
import type { QuizQuestion, CertificateRecord } from "@/lib/types";
import { QuizTimer } from "@/components/quiz/quiz-timer";
import { QuizNavigationDrawer } from "@/components/quiz/quiz-navigation-drawer";
import { MCQQuestionCard } from "@/components/quiz/questions/mcq-question";
import { MultipleQuestionCard } from "@/components/quiz/questions/multiple-question";
import { OrderingQuestionCard } from "@/components/quiz/questions/ordering-question";
import { DragDropQuestionCard } from "@/components/quiz/questions/drag-drop-question";
import { CodeQuestionCard } from "@/components/quiz/questions/code-question";
import { FillInBlankQuestionCard } from "@/components/quiz/questions/fill-blank-question";

export const Route = createFileRoute("/assessment/$pathId")({
  head: () => ({
    meta: [
      { title: "Final Path Assessment · Forge" },
      {
        name: "description",
        content: "Cumulative learning path certification assessment.",
      },
      { property: "og:title", content: "Path Assessment · Forge" },
    ],
  }),
  component: AssessmentRoute,
});

function AssessmentRoute() {
  const { pathId } = Route.useParams();
  const progress = useProgress();
  const { saveCertificate } = progress;

  const eligibility = checkPathEligibility(pathId, progress.lessonsCompleted, progress.quizResults);

  const existingCert = (progress.certificates || []).find((c) => c.pathId === pathId);

  // Assessment Quiz State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, unknown>>({});
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());
  const [isFinished, setIsFinished] = useState(false);
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(0);
  const [createdCert, setCreatedCert] = useState<CertificateRecord | null>(existingCert || null);

  const activeQuestions = eligibility.assessmentQuestions;

  // Handle Answer Change
  const handleAnswerChange = (questionId: string, answer: unknown) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  // Toggle Flag
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

  // Submit Handler
  const handleSubmitAssessment = useCallback(() => {
    setIsFinished(true);
    toast.success("Final assessment submitted! Calculating score...");
  }, []);

  const handleRetake = () => {
    setUserAnswers({});
    setFlaggedIds(new Set());
    setCurrentIndex(0);
    setIsFinished(false);
    setTimeSpentSeconds(0);
  };

  // Check correctness of answers
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

  const hasSavedRef = useRef(false);

  // Process score when finished
  const totalQuestions = activeQuestions.length;
  const correctCount = activeQuestions.filter((q) => checkQuestionCorrectness(q)).length;
  const scorePercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const isPassed = scorePercent >= 80;

  useEffect(() => {
    if (isFinished && isPassed && !hasSavedRef.current) {
      hasSavedRef.current = true;
      const cert = saveCertificate(pathId, scorePercent);
      if (cert) {
        setCreatedCert(cert);
        toast.success("🎉 Certificate Earned! Added to your profile.");
      }
    }
  }, [isFinished, isPassed, pathId, scorePercent, saveCertificate]);

  if (!eligibility.path) {
    return (
      <div className="space-y-4 py-12 text-center">
        <h2 className="text-xl font-bold">Learning Path Not Found</h2>
        <p className="text-sm text-muted-foreground">The requested learning path does not exist.</p>
        <Button asChild variant="outline">
          <Link to="/learn/paths">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Learning Paths
          </Link>
        </Button>
      </div>
    );
  }

  // Not Eligible View
  if (!eligibility.isEligible) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto">
        <PageHeader
          eyebrow="Final Assessment"
          title={`${eligibility.path.title} · Assessment Locked`}
          description="Complete all required lessons and topic quizzes to unlock the cumulative final assessment and earn your official completion certificate."
          actions={
            <Button asChild variant="outline">
              <Link to="/learn/paths">
                <ArrowLeft className="mr-2 h-4 w-4" /> All Paths
              </Link>
            </Button>
          }
        />

        <Card className="border-border/60 bg-card shadow-elegant">
          <CardHeader className="border-b border-border/40 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg">Prerequisites Pending</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Requirements to unlock: 100% lessons completed & 100% topic quizzes passed (&ge;
                  70%)
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Lessons Progress */}
              <div className="space-y-3 p-4 rounded-xl bg-muted/20 border border-border/40">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" /> Lessons Completed
                  </span>
                  <Badge variant={eligibility.isLessonsComplete ? "default" : "secondary"}>
                    {eligibility.completedLessonsCount} / {eligibility.totalLessonsCount}
                  </Badge>
                </div>
                <Progress
                  value={
                    eligibility.totalLessonsCount > 0
                      ? (eligibility.completedLessonsCount / eligibility.totalLessonsCount) * 100
                      : 0
                  }
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  {eligibility.isLessonsComplete
                    ? "✓ All lessons in this path completed!"
                    : `${eligibility.totalLessonsCount - eligibility.completedLessonsCount} lesson(s) remaining`}
                </p>
              </div>

              {/* Quizzes Progress */}
              <div className="space-y-3 p-4 rounded-xl bg-muted/20 border border-border/40">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-primary" /> Quizzes Passed (&ge; 70%)
                  </span>
                  <Badge variant={eligibility.isQuizzesComplete ? "default" : "secondary"}>
                    {eligibility.passedQuizzesCount} / {eligibility.totalQuizzesCount}
                  </Badge>
                </div>
                <Progress
                  value={
                    eligibility.totalQuizzesCount > 0
                      ? (eligibility.passedQuizzesCount / eligibility.totalQuizzesCount) * 100
                      : 0
                  }
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  {eligibility.isQuizzesComplete
                    ? "✓ All topic quizzes passed!"
                    : `${eligibility.totalQuizzesCount - eligibility.passedQuizzesCount} quiz(zes) left to pass`}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-border/40 flex flex-wrap items-center justify-between gap-4">
              <p className="text-xs text-muted-foreground max-w-md">
                Once you fulfill all prerequisite lessons and quizzes, return here to take your
                final assessment!
              </p>
              <Button asChild className="gap-2">
                <Link to="/learn/modules" search={{ pathId: eligibility.path.id }}>
                  Continue Learning <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render Post-Assessment Results
  if (isFinished) {
    const certToView = createdCert || existingCert;

    return (
      <div className="space-y-8 max-w-4xl mx-auto py-6">
        <Card
          className={`border-border/60 bg-card shadow-glow overflow-hidden ${isPassed ? "border-primary/50" : "border-destructive/50"}`}
        >
          <div className="p-8 text-center space-y-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 border-2 border-primary/30 text-primary animate-bounce">
              {isPassed ? (
                <Award className="h-10 w-10 text-primary" />
              ) : (
                <XCircle className="h-10 w-10 text-destructive" />
              )}
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <Badge variant={isPassed ? "default" : "destructive"} className="px-3 py-1 text-xs">
                {isPassed ? "FINAL ASSESSMENT PASSED" : "ASSESSMENT NOT PASSED"}
              </Badge>
              <h2 className="text-3xl font-extrabold tracking-tight">
                {isPassed ? "Congratulations! Path Mastered" : "Keep Practicing"}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isPassed
                  ? `You achieved ${scorePercent}% on the ${eligibility.path.title} final assessment. You have unlocked your official certificate!`
                  : `You scored ${scorePercent}%. A passing score of 80% or higher is required to receive your certificate.`}
              </p>
            </div>

            <div className="flex items-center justify-center gap-6 py-4 border-y border-border/40 max-w-md mx-auto text-sm">
              <div>
                <div className="text-2xl font-bold text-foreground">{scorePercent}%</div>
                <div className="text-xs text-muted-foreground">Final Score</div>
              </div>
              <div className="h-8 w-px bg-border/60" />
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {correctCount}/{totalQuestions}
                </div>
                <div className="text-xs text-muted-foreground">Correct Answers</div>
              </div>
              <div className="h-8 w-px bg-border/60" />
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {Math.floor(timeSpentSeconds / 60)}m {timeSpentSeconds % 60}s
                </div>
                <div className="text-xs text-muted-foreground">Time Spent</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              {isPassed && certToView ? (
                <Button asChild size="lg" className="gap-2 shadow-glow">
                  <Link to="/certificate/$certificateId" params={{ certificateId: certToView.id }}>
                    <Award className="h-5 w-5" /> View Official Certificate
                  </Link>
                </Button>
              ) : (
                <Button onClick={handleRetake} size="lg" className="gap-2">
                  <RotateCcw className="h-5 w-5" /> Retake Assessment
                </Button>
              )}

              <Button asChild variant="outline" size="lg">
                <Link to="/certificates">
                  <Trophy className="mr-2 h-5 w-5" /> All Certificates
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Active Assessment Test View
  const currentQuestion = activeQuestions[currentIndex] || activeQuestions[0];
  const progressPercent = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-primary font-semibold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" /> Cumulative Path Assessment
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {eligibility.path.title}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <QuizTimer
            totalMinutes={30}
            isPaused={false}
            onTimeExpired={handleSubmitAssessment}
            onTick={(seconds) => setTimeSpentSeconds(seconds)}
          />
          <QuizNavigationDrawer
            questions={activeQuestions}
            currentIndex={currentIndex}
            userAnswers={userAnswers}
            flaggedIds={flaggedIds}
            onSelectQuestion={(idx) => setCurrentIndex(idx)}
            onSubmit={handleSubmitAssessment}
          />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground font-medium">
          <span>
            Question {currentIndex + 1} of {totalQuestions}
          </span>
          <span>{Math.round(progressPercent)}% Complete</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Question Card Render */}
      <div className="min-h-[380px]">
        {currentQuestion.type === "mcq" && (
          <MCQQuestionCard
            question={currentQuestion}
            userAnswer={userAnswers[currentQuestion.id] as number | undefined}
            onChangeAnswer={(ans) => handleAnswerChange(currentQuestion.id, ans)}
            isFlagged={flaggedIds.has(currentQuestion.id)}
            onToggleFlag={() => handleToggleFlag(currentQuestion.id)}
          />
        )}
        {currentQuestion.type === "multiple" && (
          <MultipleQuestionCard
            question={currentQuestion}
            userAnswer={userAnswers[currentQuestion.id] as number[] | undefined}
            onChangeAnswer={(ans) => handleAnswerChange(currentQuestion.id, ans)}
            isFlagged={flaggedIds.has(currentQuestion.id)}
            onToggleFlag={() => handleToggleFlag(currentQuestion.id)}
          />
        )}
        {currentQuestion.type === "ordering" && (
          <OrderingQuestionCard
            question={currentQuestion}
            userAnswer={userAnswers[currentQuestion.id] as string[] | undefined}
            onChangeAnswer={(ans) => handleAnswerChange(currentQuestion.id, ans)}
            isFlagged={flaggedIds.has(currentQuestion.id)}
            onToggleFlag={() => handleToggleFlag(currentQuestion.id)}
          />
        )}
        {currentQuestion.type === "drag_drop" && (
          <DragDropQuestionCard
            question={currentQuestion}
            userAnswer={userAnswers[currentQuestion.id] as Record<string, string> | undefined}
            onChangeAnswer={(ans) => handleAnswerChange(currentQuestion.id, ans)}
            isFlagged={flaggedIds.has(currentQuestion.id)}
            onToggleFlag={() => handleToggleFlag(currentQuestion.id)}
          />
        )}
        {currentQuestion.type === "code" && (
          <CodeQuestionCard
            question={currentQuestion}
            userAnswer={userAnswers[currentQuestion.id] as number | undefined}
            onChangeAnswer={(ans) => handleAnswerChange(currentQuestion.id, ans)}
            isFlagged={flaggedIds.has(currentQuestion.id)}
            onToggleFlag={() => handleToggleFlag(currentQuestion.id)}
          />
        )}
        {currentQuestion.type === "fill_in_blank" && (
          <FillInBlankQuestionCard
            question={currentQuestion}
            userAnswer={userAnswers[currentQuestion.id] as string | undefined}
            onChangeAnswer={(ans) => handleAnswerChange(currentQuestion.id, ans)}
            isFlagged={flaggedIds.has(currentQuestion.id)}
            onToggleFlag={() => handleToggleFlag(currentQuestion.id)}
          />
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between border-t border-border/40 pt-4">
        <Button
          variant="outline"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Previous
        </Button>

        {currentIndex === totalQuestions - 1 ? (
          <Button
            onClick={handleSubmitAssessment}
            variant="default"
            className="shadow-glow bg-primary"
          >
            Submit Assessment <Check className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}>
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
