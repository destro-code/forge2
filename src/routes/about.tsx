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
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-2xl border border-border/60 bg-muted/20 p-6">
        <img
          src="/forge-logo.png"
          alt="Forge Frontend Academy"
          width={64}
          height={64}
          className="h-16 w-16 rounded-2xl object-contain shadow-md shrink-0 border border-primary/20"
        />
        <div className="space-y-1">
          <div className="text-xs font-bold uppercase tracking-widest text-primary">
            Official Brand & Mission
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Forge Frontend Academy
          </h2>
          <p className="text-sm text-muted-foreground">
            The deliberate path to master frontend craftsmanship, architecture, and interview
            execution.
          </p>
        </div>
      </div>

      <PageHeader
        eyebrow="Philosophy"
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
