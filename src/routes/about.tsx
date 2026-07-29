import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Flame, Sparkles, Blocks, MessagesSquare } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About · Forge" },
      {
        name: "description",
        content: "About Forge — a premium AI-powered frontend engineering academy.",
      },
      { property: "og:title", content: "About · Forge" },
      { property: "og:description", content: "Why Forge exists and how it works." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="About"
        title={
          <>
            Frontend engineering, <span className="text-gradient-primary">forged</span> deliberately
          </>
        }
        description="Forge is a premium AI-powered academy that takes a curious beginner and turns them into a production-ready, interview-ready frontend engineer."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {[
          {
            icon: <Flame className="h-5 w-5 text-primary" />,
            title: "Deliberate practice",
            body: "Every module is engineered for spaced repetition, active recall, and progressive difficulty.",
          },
          {
            icon: <Sparkles className="h-5 w-5 text-primary" />,
            title: "Coaching-first AI",
            body: "The mentor asks questions, not answers. You learn to think like an engineer, not to copy solutions.",
          },
          {
            icon: <Blocks className="h-5 w-5 text-primary" />,
            title: "Architecture matters",
            body: "A dedicated Frontend Architecture Lab teaches you to think in systems, not syntax.",
          },
          {
            icon: <MessagesSquare className="h-5 w-5 text-primary" />,
            title: "Interview ready",
            body: "Timed practice, rubrics, and real question banks — walk into the room prepared.",
          },
        ].map((c) => (
          <Card key={c.title} className="border-border/60">
            <CardContent className="p-5">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10">
                {c.icon}
              </div>
              <h3 className="mt-4 font-semibold">{c.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
