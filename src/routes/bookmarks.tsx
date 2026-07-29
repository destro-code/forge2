import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProgress } from "@/lib/hooks/use-progress";
import { useLessons } from "@/lib/hooks/use-content";
import { Bookmark, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/bookmarks")({
  head: () => ({
    meta: [
      { title: "Bookmarks · Forge" },
      { name: "description", content: "Your saved lessons, ready to revisit." },
      { property: "og:title", content: "Bookmarks · Forge" },
      { property: "og:description", content: "Everything you saved for later." },
    ],
  }),
  component: Bookmarks,
});

function Bookmarks() {
  const { bookmarks } = useProgress();
  const lessons = useLessons().filter((l) => bookmarks.includes(l.id));
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Saved"
        title="Bookmarks"
        description="Everything you flagged to revisit."
      />
      {lessons.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="h-5 w-5" />}
          title="No bookmarks yet"
          description="Tap the bookmark icon on any lesson to save it here."
        />
      ) : (
        <div className="grid gap-3">
          {lessons.map((l) => (
            <Link key={l.id} to={`/lesson/${l.id}`}>
              <Card className="border-border/60 transition hover:border-primary/40">
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <Badge variant="outline">{l.difficulty}</Badge>
                    <h3 className="mt-2 font-semibold">{l.title}</h3>
                    <p className="text-sm text-muted-foreground">{l.description}</p>
                  </div>
                  <ArrowRight className="text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
