import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { useQuizzes } from "@/lib/hooks/use-content";
import { ArrowRight, Clock } from "lucide-react";

export const Route = createFileRoute("/quizzes/")({
  head: () => ({
    meta: [
      { title: "Quizzes · Forge" },
      { name: "description", content: "Rapid-recall quizzes across the frontend curriculum." },
      { property: "og:title", content: "Quizzes · Forge" },
      { property: "og:description", content: "Test yourself. Track accuracy." },
    ],
  }),
  component: Quizzes,
});

function Quizzes() {
  const quizzes = useQuizzes();
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Quizzes"
        title="Rapid recall"
        description="Short-form quizzes with explanations for every answer."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {quizzes.map((q) => (
          <Link key={q.id} to="/quizzes/$quizId" params={{ quizId: q.id }}>
            <Card className="h-full border-border/60 transition hover:border-primary/40 hover:shadow-glow">
              <CardContent className="p-5">
                <div className="flex items-center gap-2">
                  <DifficultyBadge difficulty={q.difficulty} />
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" />
                    {q.estimatedMinutes}m
                  </Badge>
                </div>
                <h3 className="mt-3 text-base font-semibold">{q.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{q.description}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{q.questions.length} questions</span>
                  <span className="inline-flex items-center gap-1 text-primary">
                    Start
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
