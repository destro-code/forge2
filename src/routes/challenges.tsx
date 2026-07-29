import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Calendar } from "lucide-react";

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

const CHALLENGES = [
  {
    date: "Today",
    title: "The counter that lies",
    desc: "Diagnose a stale closure in a React counter.",
    difficulty: "Intermediate",
    to: "/debug-lab",
  },
  {
    date: "Yesterday",
    title: "Flexbox holy grail",
    desc: "Recreate the classic three-column layout with just flex.",
    difficulty: "Beginner",
    to: "/playground",
  },
  {
    date: "Jul 27",
    title: "Debounce it",
    desc: "Implement a debounce function without lodash.",
    difficulty: "Intermediate",
    to: "/playground",
  },
  {
    date: "Jul 26",
    title: "Type it",
    desc: "Write a fully typed `pick` utility in TypeScript.",
    difficulty: "Advanced",
    to: "/playground",
  },
];

function Challenges() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Daily"
        title="One sharp problem, every day"
        description="Small, focused reps that keep your engineering edge."
        actions={
          <Badge variant="outline" className="gap-1">
            <Calendar className="h-3 w-3" />
            30-day streak
          </Badge>
        }
      />
      <Card className="relative overflow-hidden border-border/60">
        <div className="ember-glow absolute inset-0" />
        <CardContent className="relative p-6">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-primary">
            Today
          </div>
          <h2 className="mt-1 text-2xl font-bold">The counter that lies</h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            A React counter increments once and freezes. Diagnose the stale closure without spoiling
            the solution.
          </p>
          <div className="mt-4 flex gap-2">
            <Button asChild>
              <Link to="/debug-lab">
                <Zap className="mr-2 h-4 w-4" />
                Start challenge
              </Link>
            </Button>
            <Button variant="ghost">Skip today</Button>
          </div>
        </CardContent>
      </Card>
      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">History</h3>
        <div className="grid gap-2">
          {CHALLENGES.slice(1).map((c) => (
            <Link key={c.title} to={c.to}>
              <Card className="border-border/60 transition hover:border-primary/40">
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <div className="text-xs text-muted-foreground">{c.date}</div>
                    <div className="font-medium">{c.title}</div>
                    <div className="text-sm text-muted-foreground">{c.desc}</div>
                  </div>
                  <Badge variant="outline">{c.difficulty}</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
