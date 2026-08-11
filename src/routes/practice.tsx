import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Terminal, Bug, FolderKanban, ListChecks, MessagesSquare, Zap } from "lucide-react";
import type { ReactNode } from "react";

export const Route = createFileRoute("/practice")({
  head: () => ({
    meta: [
      { title: "Practice · Forge" },
      {
        name: "description",
        content:
          "Every hands-on surface in Forge — playground, debug lab, projects, quizzes and daily challenges.",
      },
      { property: "og:title", content: "Practice · Forge" },
      { property: "og:description", content: "The practice arena." },
    ],
  }),
  component: Practice,
});

function Tile({
  to,
  icon,
  title,
  desc,
}: {
  to: string;
  icon: ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link to={to} className="group">
      <Card className="h-full border-border/60 transition hover:border-primary/40 hover:shadow-glow">
        <CardContent className="p-5">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          <h3 className="mt-4 font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function Practice() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Practice"
        title="Learning ends when the muscle exists"
        description="Build the reps."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Tile
          to="/playground"
          icon={<Terminal className="h-5 w-5" />}
          title="Code Playground"
          desc="Write, run and preview code in a full editor."
        />
        <Tile
          to="/debug-lab"
          icon={<Bug className="h-5 w-5" />}
          title="Debug Lab"
          desc="Real bugs. Diagnose without spoiling yourself."
        />
        <Tile
          to="/projects"
          icon={<FolderKanban className="h-5 w-5" />}
          title="Projects"
          desc="Portfolio-grade builds with milestones and specs."
        />
        <Tile
          to="/quizzes"
          icon={<ListChecks className="h-5 w-5" />}
          title="Quizzes"
          desc="Rapid recall. Track your accuracy over time."
        />
        <Tile
          to="/interview"
          icon={<MessagesSquare className="h-5 w-5" />}
          title="Mock Interviews"
          desc="Formal timed interview evaluation."
        />
        <Tile
          to="/challenges"
          icon={<Zap className="h-5 w-5" />}
          title="Daily Challenges"
          desc="One sharp problem, every single day."
        />
      </div>
    </div>
  );
}
