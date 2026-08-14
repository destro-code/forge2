import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { useBugs } from "@/lib/hooks/use-content";
import { useProgress } from "@/lib/hooks/use-progress";
import { Bug, Clock, ArrowRight, Search, CheckCircle2, ShieldAlert } from "lucide-react";
import { useState } from "react";
import type { BugCategory } from "@/lib/types";

export const Route = createFileRoute("/debug-lab/")({
  head: () => ({
    meta: [
      { title: "Debug Lab · Forge" },
      {
        name: "description",
        content: "Real bugs. Real diagnostics. Master defensive engineering.",
      },
      { property: "og:title", content: "Debug Lab · Forge" },
      {
        property: "og:description",
        content: "Learn defensive engineering by fixing broken things.",
      },
    ],
  }),
  component: DebugLab,
});

const CATEGORIES: { id: BugCategory | "all"; label: string }[] = [
  { id: "all", label: "All Categories" },
  { id: "react_app", label: "Broken React Apps" },
  { id: "console_error", label: "Console Errors" },
  { id: "network", label: "Network Bugs" },
  { id: "css", label: "CSS Bugs" },
  { id: "a11y", label: "Accessibility Bugs" },
  { id: "performance", label: "Performance Bugs" },
  { id: "memory_leak", label: "Memory Leak Bugs" },
  { id: "hooks", label: "Hooks Bugs" },
];

function getCategoryBadge(category: BugCategory) {
  switch (category) {
    case "react_app":
      return (
        <Badge variant="outline" className="border-indigo-500/40 text-indigo-400">
          Broken React App
        </Badge>
      );
    case "console_error":
      return (
        <Badge variant="outline" className="border-rose-500/40 text-rose-400">
          Console Error
        </Badge>
      );
    case "network":
      return (
        <Badge variant="outline" className="border-cyan-500/40 text-cyan-400">
          Network Bug
        </Badge>
      );
    case "css":
      return (
        <Badge variant="outline" className="border-emerald-500/40 text-emerald-400">
          CSS / CLS
        </Badge>
      );
    case "a11y":
      return (
        <Badge variant="outline" className="border-purple-500/40 text-purple-400">
          Accessibility (A11y)
        </Badge>
      );
    case "performance":
      return (
        <Badge variant="outline" className="border-amber-500/40 text-amber-400">
          Performance
        </Badge>
      );
    case "memory_leak":
      return (
        <Badge variant="outline" className="border-orange-500/40 text-orange-400">
          Memory Leak
        </Badge>
      );
    case "hooks":
      return (
        <Badge variant="outline" className="border-blue-500/40 text-blue-400">
          Hooks
        </Badge>
      );
  }
}

function DebugLab() {
  const bugs = useBugs();
  const { solvedBugs = [] } = useProgress();
  const [selectedCategory, setSelectedCategory] = useState<BugCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBugs = bugs.filter((b) => {
    const matchesCategory = selectedCategory === "all" || b.category === selectedCategory;
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.brief.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const solvedCount = bugs.filter((b) => solvedBugs.includes(b.id)).length;
  const completionPercent = Math.round((solvedCount / Math.max(bugs.length, 1)) * 100);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Debug Lab"
        title="Defensive Engineering & Diagnostics"
        description="Master front-end debugging. Diagnose React lifecycle crashes, memory leaks, CSS shifts, accessibility flaws, and async race conditions."
      />

      {/* Stats Banner */}
      <Card className="border-border/60 bg-gradient-to-r from-card to-muted/30">
        <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold">Debug Lab Progress</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {solvedCount} of {bugs.length} challenges solved ({completionPercent}% complete)
              </p>
            </div>
          </div>
          <div className="w-full sm:w-48 bg-secondary h-2.5 rounded-full overflow-hidden border border-border">
            <div
              className="bg-primary h-full transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by bug name, tag, or symptom..."
              className="pl-9 text-sm"
            />
          </div>

          {/* Mobile Select Category Dropdown */}
          <div className="w-full md:hidden">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Desktop Category Badges */}
          <div className="hidden md:flex flex-wrap gap-1.5 w-auto">
            {CATEGORIES.map((cat) => (
              <Badge
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "secondary"}
                className="cursor-pointer py-1 px-2.5 text-xs transition"
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.label}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Bug List */}
      <div className="grid gap-3">
        {filteredBugs.length === 0 ? (
          bugs.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <Bug className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <h4 className="font-semibold text-sm">No debugging challenges available</h4>
              <p className="text-xs text-muted-foreground mt-1">
                There are currently no bug challenges in the debug lab.
              </p>
            </Card>
          ) : (
            <Card className="p-8 text-center border-dashed">
              <Bug className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <h4 className="font-semibold text-sm">No debugging challenges found</h4>
              <p className="text-xs text-muted-foreground mt-1">
                No bug challenges match your current category filter or search terms.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCategory("all");
                  setSearchQuery("");
                }}
                className="mt-4"
              >
                Reset Filters
              </Button>
            </Card>
          )
        ) : (
          filteredBugs.map((b) => {
            const isSolved = solvedBugs.includes(b.id);
            return (
              <Link key={b.id} to="/debug-lab/$bugId" params={{ bugId: b.id }}>
                <Card className="border-border/60 transition hover:border-primary/40 relative overflow-hidden group">
                  <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <div
                          className={`grid h-8 w-8 place-items-center rounded-lg border ${
                            isSolved
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-destructive/10 text-destructive border-destructive/20"
                          }`}
                        >
                          {isSolved ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Bug className="h-4 w-4" />
                          )}
                        </div>
                        <DifficultyBadge difficulty={b.difficulty} />
                        {getCategoryBadge(b.category)}
                        <Badge variant="outline" className="gap-1 text-xs">
                          <Clock className="h-3 w-3" />
                          {b.estimatedMinutes}m
                        </Badge>
                        {isSolved && (
                          <Badge
                            variant="default"
                            className="bg-emerald-600 hover:bg-emerald-600 text-xs"
                          >
                            Solved
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold group-hover:text-primary transition-colors">
                        {b.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{b.brief}</p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {b.tags.map((t) => (
                          <Badge key={t} variant="secondary" className="text-[10px] py-0">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <ArrowRight className="hidden sm:block text-muted-foreground group-hover:text-primary transition-colors group-hover:translate-x-1 duration-200" />
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
