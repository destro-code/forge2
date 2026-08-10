import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useResources } from "@/lib/hooks/use-content";
import { ExternalLink, Library } from "lucide-react";

export const Route = createFileRoute("/resources")({
  head: () => ({
    meta: [
      { title: "Resources · Forge" },
      {
        name: "description",
        content: "Curated external references — MDN, react.dev, web.dev and more.",
      },
      { property: "og:title", content: "Resources · Forge" },
      { property: "og:description", content: "Curated frontend references." },
    ],
  }),
  component: Resources,
});

function Resources() {
  const resources = useResources();
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Reference"
        title="Resources"
        description="Hand-picked external references — the primary sources we trust."
      />
      {resources.length === 0 ? (
        <EmptyState
          icon={<Library className="h-5 w-5" />}
          title="No resources available"
          description="External references will appear here."
        />
      ) : (
        <div className="grid gap-3">
          {resources.map((r) => (
            <a key={r.id} href={r.url} target="_blank" rel="noreferrer">
              <Card className="border-border/60 transition hover:border-primary/40">
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <Badge variant="secondary">{r.category}</Badge>
                    <h3 className="mt-2 font-semibold">{r.title}</h3>
                    <p className="text-sm text-muted-foreground">{r.description}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
