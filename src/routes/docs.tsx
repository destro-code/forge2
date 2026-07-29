import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Callout } from "@/components/shared/callout";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Documentation · Forge" },
      {
        name: "description",
        content:
          "How Forge works — mastery states, streaks, coaching mode, and using the AI mentor effectively.",
      },
      { property: "og:title", content: "Documentation · Forge" },
      { property: "og:description", content: "How to get the most out of Forge." },
    ],
  }),
  component: Docs,
});

function Docs() {
  return (
    <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="hidden lg:block">
        <div className="sticky top-20 space-y-1 text-sm">
          {[
            "Getting started",
            "Mastery system",
            "Coaching mode",
            "Break My Code",
            "Shortcuts",
            "Data & privacy",
          ].map((s) => (
            <a
              key={s}
              href={`#${s}`}
              className="block rounded px-2 py-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              {s}
            </a>
          ))}
        </div>
      </aside>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Handbook"
          title="Documentation"
          description="Everything you need to know about how Forge works."
        />
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Getting started</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert text-sm">
            <p>
              Start on the Dashboard, pick a module in Learn, or open the Command Palette with ⌘K.
            </p>
            <Callout variant="tip">
              Enable coaching mode in Settings for the mentor to ask questions instead of giving
              answers.
            </Callout>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Mastery system</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Every lesson tracks one of: Not Started, Learning, Practicing, Needs Review, Interview
            Ready, Mastered. Mastery drives recommendations — not just completion.
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Shortcuts</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <ul className="grid gap-2 text-muted-foreground">
              <li>
                <kbd className="rounded border px-1.5 py-0.5">⌘K</kbd> Command Palette
              </li>
              <li>
                <kbd className="rounded border px-1.5 py-0.5">?</kbd> Show all shortcuts
              </li>
              <li>
                <kbd className="rounded border px-1.5 py-0.5">[</kbd> /{" "}
                <kbd className="rounded border px-1.5 py-0.5">]</kbd> Previous/next lesson
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
