import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Calendar, CheckCircle2 } from "lucide-react";
import { useProgress } from "@/lib/hooks/use-progress";
import challengesData from "@/data/challenges.json";
import type { DailyChallenge } from "@/lib/types";

export const Route = createFileRoute("/challenges")({
  head: () => ({
    meta: [
      { title: "Daily Challenges · Forge" },
      {
        name: "description",
        content: "One sharp problem, every day — keep your engineering edge.",
      },
      { property: "og:title", content: "Daily Challenges · Forge" },
      { property: "og:description", content: "A daily rep for your brain." },
    ],
  }),
  component: Challenges,
});

function Challenges() {
  const { challengesCompleted = [], challengeStreakDays = 0, completeChallenge } = useProgress();
  const challenges: DailyChallenge[] = challengesData as DailyChallenge[];

  const todayIso = new Date().toISOString().split("T")[0];

  const todayChallenge = challenges.find((c) => c.date === todayIso) || challenges[0];
  const historyChallenges = challenges.filter((c) => c.id !== todayChallenge?.id);

  const isTodayCompleted = todayChallenge ? challengesCompleted.includes(todayChallenge.id) : false;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Daily"
        title="One sharp problem, every day"
        description="Small, focused reps that keep your engineering edge."
        actions={
          <Badge variant="outline" className="gap-1">
            <Calendar className="h-3 w-3" />
            {challengeStreakDays}-day streak
          </Badge>
        }
      />

      {todayChallenge && (
        <Card
          className={`relative overflow-hidden border-border/60 ${isTodayCompleted ? "bg-muted/30" : ""}`}
        >
          {!isTodayCompleted && <div className="ember-glow absolute inset-0" />}
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-primary">
                Today
              </div>
              {isTodayCompleted && (
                <Badge
                  variant="default"
                  className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20"
                >
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Completed
                </Badge>
              )}
            </div>

            <h2
              className={`mt-1 text-2xl font-bold ${isTodayCompleted ? "text-muted-foreground" : ""}`}
            >
              {todayChallenge.title}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              {todayChallenge.description}
            </p>

            <div className="mt-4 flex gap-2">
              <Button asChild variant={isTodayCompleted ? "outline" : "default"}>
                <Link to={(`/${todayChallenge.linkType === "quiz" ? "quizzes" : todayChallenge.linkType}`) as any}>
                  <Zap className="mr-2 h-4 w-4" />
                  {isTodayCompleted ? "Review challenge" : "Start challenge"}
                </Link>
              </Button>
              {!isTodayCompleted && (
                <Button variant="outline" onClick={() => completeChallenge(todayChallenge.id)}>
                  Mark as complete
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">History</h3>
        <div className="grid gap-2">
          {historyChallenges.map((c) => {
            const isCompleted = challengesCompleted.includes(c.id);
            return (
              <Link key={c.id} to={(`/${c.linkType === "quiz" ? "quizzes" : c.linkType}`) as any}>
                <Card
                  className={`border-border/60 transition hover:border-primary/40 ${isCompleted ? "opacity-70" : ""}`}
                >
                  <CardContent className="flex items-center justify-between gap-4 p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-muted-foreground">{c.date}</div>
                        {isCompleted && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                      </div>
                      <div className={`font-medium ${isCompleted ? "text-muted-foreground" : ""}`}>
                        {c.title}
                      </div>
                      <div className="text-sm text-muted-foreground">{c.description}</div>
                    </div>
                    <Badge variant="outline">{c.difficulty}</Badge>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
