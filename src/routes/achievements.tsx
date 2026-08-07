import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAchievements, useLessons } from "@/lib/hooks/use-content";
import { useProgress } from "@/lib/hooks/use-progress";
import { Trophy, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/achievements")({
  head: () => ({
    meta: [
      { title: "Achievements · Forge" },
      {
        name: "description",
        content: "Milestones and badges you've earned on your way to mastery.",
      },
      { property: "og:title", content: "Achievements · Forge" },
      { property: "og:description", content: "Every badge you can earn." },
    ],
  }),
  component: Achievements,
});

const tierClasses: Record<string, string> = {
  bronze: "from-orange-500/30 to-amber-700/20 text-amber-500",
  silver: "from-slate-300/30 to-slate-500/20 text-slate-300",
  gold: "from-yellow-400/40 to-amber-500/20 text-yellow-400",
  platinum: "from-cyan-300/40 to-purple-500/20 text-cyan-300",
};

function Achievements() {
  const rawItems = useAchievements();
  const progress = useProgress();
  const lessons = useLessons();

  const items = rawItems.map((a) => {
    if (!a.condition) {
      return a;
    }

    let current = 0;
    let target = a.condition.threshold || 1;

    switch (a.condition.type) {
      case "lessonsCompleted":
        current = (progress.lessonsCompleted || []).length;
        break;
      case "streakDays":
        current = progress.streakDays || 0;
        break;
      case "solvedBugs":
        current = (progress.solvedBugs || []).length;
        break;
      case "interviewQuestions":
        current = (progress.interviewResults || []).reduce(
          (acc, r) => acc + (r.questionsAnswered || 1),
          0,
        );
        break;
      case "moduleLessonsCompleted": {
        const moduleLessons = lessons.filter((l) => l.moduleId === a.condition?.moduleId);
        target = moduleLessons.length || 1;
        current = moduleLessons.filter((l) =>
          (progress.lessonsCompleted || []).includes(l.id),
        ).length;
        break;
      }
    }

    const isUnlocked = current >= target;
    const progressRatio = target > 0 ? Math.min(1, Math.max(0, current / target)) : 0;

    return {
      ...a,
      unlocked: isUnlocked,
      progress: progressRatio,
      unlockedAt: isUnlocked ? a.unlockedAt || "Unlocked" : undefined,
    };
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Milestones"
        title="Achievements"
        description="Recognition for real progress."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((a) => (
          <Card
            key={a.id}
            className={cn("relative overflow-hidden border-border/60", !a.unlocked && "opacity-70")}
          >
            <div
              className={cn("absolute inset-0 bg-gradient-to-br", tierClasses[a.tier])}
              style={{ opacity: a.unlocked ? 0.35 : 0.1 }}
            />
            <CardContent className="relative p-5">
              <div className="flex items-start justify-between">
                <div
                  className={cn(
                    "grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-black/20",
                    tierClasses[a.tier],
                  )}
                >
                  {a.unlocked ? <Trophy className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                </div>
                <Badge variant="outline" className="uppercase">
                  {a.tier}
                </Badge>
              </div>
              <h3 className="mt-3 font-semibold">{a.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>
              {!a.unlocked && a.progress != null && (
                <div className="mt-3">
                  <Progress value={a.progress * 100} className="h-1.5" />
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    {Math.round(a.progress * 100)}%
                  </div>
                </div>
              )}
              {a.unlocked && (
                <div className="mt-3 text-[10px] text-muted-foreground">
                  Unlocked{a.unlockedAt ? ` · ${a.unlockedAt}` : ""}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
