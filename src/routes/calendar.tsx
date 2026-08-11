import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { useProgress } from "@/lib/hooks/use-progress";
import { DayButton } from "react-day-picker";
import {
  Calendar as CalendarIcon,
  Flame,
  CheckCircle2,
  ListChecks,
  BookOpenText,
  MessagesSquare,
  Clock,
  Sparkles,
  Bug,
  Code,
  PenTool,
  Award,
  Layers,
} from "lucide-react";
import quizzesData from "@/data/quizzes.json";
import lessonsData from "@/data/lessons.json";
import bugsData from "@/data/bugs.json";
import type { Quiz, Lesson, Bug as BugType } from "@/lib/types";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar · Forge" },
      {
        name: "description",
        content: "Track your daily study activity, quizzes, and learning history.",
      },
      { property: "og:title", content: "Calendar · Forge" },
      { property: "og:description", content: "Track your daily study activity and streaks." },
    ],
  }),
  component: CalendarPage,
});

function formatDateToYYYYMMDD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function CalendarPage() {
  const progress = useProgress();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Collect all dates with activity
  const activityDatesSet = new Set<string>();
  (progress.activityDates || []).forEach((d) => activityDatesSet.add(d.slice(0, 10)));
  (progress.heatmap || []).forEach((h) => {
    if (h.value > 0) activityDatesSet.add(h.date);
  });
  (progress.quizResults || []).forEach((q) => {
    if (q.completedAt) activityDatesSet.add(q.completedAt.slice(0, 10));
  });
  (progress.journalEntries || []).forEach((j) => {
    if (j.createdAt) activityDatesSet.add(j.createdAt.slice(0, 10));
  });
  (progress.interviewResults || []).forEach((i) => {
    if (i.completedAt) activityDatesSet.add(i.completedAt.slice(0, 10));
  });

  const selectedDateStr = selectedDate ? formatDateToYYYYMMDD(selectedDate) : "";
  const todayStr = formatDateToYYYYMMDD(new Date());
  const isToday = selectedDateStr === todayStr;

  // Filter activities for selected date
  const quizzesTaken = (progress.quizResults || []).filter(
    (q) => q.completedAt && q.completedAt.slice(0, 10) === selectedDateStr,
  );

  const journalsForDate = (progress.journalEntries || []).filter(
    (j) => j.createdAt && j.createdAt.slice(0, 10) === selectedDateStr,
  );

  const interviewsForDate = (progress.interviewResults || []).filter(
    (i) => i.completedAt && i.completedAt.slice(0, 10) === selectedDateStr,
  );

  const playgroundsForDate = (progress.playgroundCompletions || []).filter(
    (p) => p.completedAt && p.completedAt.slice(0, 10) === selectedDateStr,
  );

  const whiteboardsForDate = (progress.whiteboardSnapshots || []).filter(
    (w) => w.updatedAt && w.updatedAt.slice(0, 10) === selectedDateStr,
  );

  const certificatesForDate = (progress.certificates || []).filter(
    (c) => c.issuedAt && c.issuedAt.slice(0, 10) === selectedDateStr,
  );

  const flashcardDailyForDate =
    progress.flashcardDailyReviews &&
    progress.flashcardDailyReviews.date &&
    progress.flashcardDailyReviews.date.slice(0, 10) === selectedDateStr &&
    progress.flashcardDailyReviews.count > 0
      ? progress.flashcardDailyReviews.count
      : 0;

  const flashcardReviewsForDateCount = Object.values(progress.flashcardReviews || {}).filter(
    (r) => r.lastReviewedAt && r.lastReviewedAt.slice(0, 10) === selectedDateStr,
  ).length;

  const flashcardsReviewedCount = Math.max(flashcardDailyForDate, flashcardReviewsForDateCount);

  const hasRecordedActivity =
    activityDatesSet.has(selectedDateStr) ||
    quizzesTaken.length > 0 ||
    journalsForDate.length > 0 ||
    interviewsForDate.length > 0 ||
    playgroundsForDate.length > 0 ||
    whiteboardsForDate.length > 0 ||
    certificatesForDate.length > 0 ||
    flashcardsReviewedCount > 0;

  const quizzesList = quizzesData as Quiz[];

  // Custom DayButton to render a colored dot for dates with activity
  function CustomDayButton({
    day,
    modifiers,
    children,
    ...props
  }: React.ComponentProps<typeof DayButton>) {
    const dateStr = formatDateToYYYYMMDD(day.date);
    const hasAct = activityDatesSet.has(dateStr);

    return (
      <CalendarDayButton day={day} modifiers={modifiers} {...props}>
        <div className="relative flex flex-col items-center justify-center w-full h-full py-1">
          <span>{children}</span>
          {hasAct && <span className="absolute bottom-0.5 h-1.5 w-1.5 rounded-full bg-primary" />}
        </div>
      </CalendarDayButton>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Activity & Schedule"
        title="Study Calendar"
        description="View your learning activity history, streak tracking, and daily milestones."
      />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Calendar Month View */}
        <Card className="lg:col-span-7 border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  Activity Calendar
                </CardTitle>
                <CardDescription>
                  Dates with a dot indicate recorded learning activity.
                </CardDescription>
              </div>
              <Badge variant="outline" className="flex items-center gap-1.5 py-1 px-3">
                <Flame className="h-3.5 w-3.5 text-primary fill-primary/20" />
                <span className="font-semibold text-foreground">{progress.streakDays}</span> Day
                Streak
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex justify-center p-4 sm:p-6">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-xl border border-border/60 p-4 bg-card/50 shadow-xs"
              components={{
                DayButton: CustomDayButton,
              }}
            />
          </CardContent>
        </Card>

        {/* Selected Date Activity Side Panel */}
        <Card className="lg:col-span-5 border-border/60 flex flex-col">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {isToday ? "Today's Log" : "Activity Log"}
                </span>
                <CardTitle className="text-lg mt-0.5">
                  {selectedDate
                    ? selectedDate.toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Select a date"}
                </CardTitle>
              </div>
              {hasRecordedActivity ? (
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  Rest Day
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-5 space-y-5">
            {!hasRecordedActivity && !isToday && (
              <div className="py-8 text-center text-muted-foreground space-y-3">
                <Clock className="h-8 w-8 mx-auto opacity-40" />
                <p className="text-sm">No recorded study activity for this date.</p>
                <p className="text-xs text-muted-foreground/80">
                  Select another date with a dot to inspect completed tasks, or start practice
                  today.
                </p>
              </div>
            )}

            {/* Quizzes Taken on Selected Date */}
            {quizzesTaken.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <ListChecks className="h-3.5 w-3.5 text-primary" />
                  Quizzes Completed ({quizzesTaken.length})
                </div>
                <div className="space-y-2">
                  {quizzesTaken.map((q) => {
                    const meta = quizzesList.find((qz) => qz.id === q.quizId);
                    return (
                      <div
                        key={q.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-accent/30 text-xs"
                      >
                        <div className="space-y-0.5">
                          <p className="font-semibold text-foreground">
                            {meta ? meta.title : q.quizId}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Score:{" "}
                            <span className="font-medium text-foreground">{q.scorePercent}%</span>
                          </p>
                        </div>
                        <Badge
                          variant={q.scorePercent >= 80 ? "default" : "secondary"}
                          className="text-[10px]"
                        >
                          {q.scorePercent >= 80 ? "Passed" : "Completed"}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Playground Exercises Completed on Selected Date */}
            {playgroundsForDate.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <Code className="h-3.5 w-3.5 text-primary" />
                  Playground Lab ({playgroundsForDate.length})
                </div>
                <div className="space-y-2">
                  {playgroundsForDate.map((p) => {
                    const cleanName = p.templateId
                      .split("-")
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(" ");
                    return (
                      <div
                        key={p.templateId}
                        className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-accent/30 text-xs"
                      >
                        <div className="space-y-0.5">
                          <p className="font-semibold text-foreground">{cleanName}</p>
                          <p className="text-[11px] text-muted-foreground">Exercise Completed</p>
                        </div>
                        <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary">
                          Lab Solved
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Whiteboard Sketches on Selected Date */}
            {whiteboardsForDate.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <PenTool className="h-3.5 w-3.5 text-primary" />
                  Whiteboard Sketches ({whiteboardsForDate.length})
                </div>
                <div className="space-y-2">
                  {whiteboardsForDate.map((w) => (
                    <div
                      key={w.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-accent/30 text-xs"
                    >
                      <div className="space-y-0.5">
                        <p className="font-semibold text-foreground">
                          {w.title || "Untitled Sketch"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">Architectural Design</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">
                        Saved
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Flashcard Reviews on Selected Date */}
            {flashcardsReviewedCount > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  Flashcard Reviews
                </div>
                <div className="p-3 rounded-lg border border-border/50 bg-accent/30 text-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-foreground">Spaced Repetition Review</p>
                    <p className="text-[11px] text-muted-foreground">
                      Reviewed{" "}
                      <span className="font-medium text-foreground">{flashcardsReviewedCount}</span>{" "}
                      cards
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-amber-500/5 text-amber-500 border-amber-500/15"
                  >
                    Active Recall
                  </Badge>
                </div>
              </div>
            )}

            {/* Certificates Earned on Selected Date */}
            {certificatesForDate.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <Award className="h-3.5 w-3.5 text-primary" />
                  Certificates Earned ({certificatesForDate.length})
                </div>
                <div className="space-y-2">
                  {certificatesForDate.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-primary/5 text-xs"
                    >
                      <div className="space-y-0.5">
                        <p className="font-semibold text-foreground">{c.pathTitle}</p>
                        <p className="text-[11px] text-muted-foreground">
                          Score: <span className="font-medium text-foreground">{c.score}%</span>
                        </p>
                      </div>
                      <Badge className="text-[10px] bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/25 border-0">
                        Certified
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Journal Entries on Selected Date */}
            {journalsForDate.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <BookOpenText className="h-3.5 w-3.5 text-primary" />
                  Journal Reflection
                </div>
                <div className="space-y-2">
                  {journalsForDate.map((j) => (
                    <div
                      key={j.id}
                      className="p-3 rounded-lg border border-border/50 bg-accent/30 text-xs space-y-1"
                    >
                      <p className="font-semibold text-foreground">{j.title || "Reflections"}</p>
                      <p className="text-muted-foreground line-clamp-2">{j.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interview Sessions on Selected Date */}
            {interviewsForDate.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <MessagesSquare className="h-3.5 w-3.5 text-primary" />
                  Interview Practice
                </div>
                <div className="space-y-2">
                  {interviewsForDate.map((i) => (
                    <div
                      key={i.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-accent/30 text-xs"
                    >
                      <div>
                        <p className="font-semibold text-foreground">{i.topicTitle || "Session"}</p>
                        <p className="text-[11px] text-muted-foreground">Score: {i.score}/100</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {i.feedbackGrade || "Reviewed"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* If today or active date with general learning */}
            {(isToday ||
              (hasRecordedActivity &&
                quizzesTaken.length === 0 &&
                journalsForDate.length === 0 &&
                interviewsForDate.length === 0 &&
                playgroundsForDate.length === 0 &&
                whiteboardsForDate.length === 0 &&
                certificatesForDate.length === 0 &&
                flashcardsReviewedCount === 0)) && (
              <div className="space-y-3 pt-1">
                <div className="p-3.5 rounded-lg border border-primary/20 bg-primary/5 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                    <Sparkles className="h-4 w-4" />
                    Overall Progress Overview
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-background/60 border border-border/40">
                      <p className="text-muted-foreground text-[10px]">Lessons Completed</p>
                      <p className="text-sm font-bold">{progress.lessonsCompleted.length}</p>
                    </div>
                    <div className="p-2 rounded bg-background/60 border border-border/40">
                      <p className="text-muted-foreground text-[10px]">Bugs Solved</p>
                      <p className="text-sm font-bold">{progress.solvedBugs.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions Footer */}
            <div className="pt-4 border-t border-border/40 space-y-2 mt-auto">
              <p className="text-xs font-medium text-muted-foreground">Quick Practice</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="w-full text-xs gap-1.5 justify-start"
                >
                  <Link to="/quizzes">
                    <ListChecks className="h-3.5 w-3.5 text-primary" />
                    Take Quiz
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="w-full text-xs gap-1.5 justify-start"
                >
                  <Link to="/debug-lab">
                    <Bug className="h-3.5 w-3.5 text-primary" />
                    Debug Bug
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
