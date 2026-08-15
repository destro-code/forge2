import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useAchievements, useLessons } from "@/lib/hooks/use-content";
import { useProgress } from "@/lib/hooks/use-progress";
import { evaluateAchievements } from "@/lib/utils/achievements";
import { cn } from "@/lib/utils";
import {
  Trophy,
  Lock,
  Sparkles,
  Flame,
  Briefcase,
  Bug,
  Blocks,
  BookOpen,
  Zap,
  Target,
  GraduationCap,
  Award,
  HelpCircle,
  CheckCircle2,
  Star,
  Timer,
  Clock,
  Code2,
  Terminal,
  Layers,
  Compass,
  ShieldCheck,
  Brain,
  Activity,
  Search,
  Check,
  ChevronRight,
  Filter,
} from "lucide-react";

export const Route = createFileRoute("/achievements")({
  head: () => ({
    meta: [
      { title: "Achievements · Forge" },
      {
        name: "description",
        content: "Milestones and badges you've earned on your way to mastery.",
      },
      { property: "og:title", content: "Achievements · Forge" },
      { property: "og:description", content: "Every badge you can earn on Forge." },
    ],
  }),
  component: Achievements,
});

// Icon component mapper
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  BookOpen,
  Zap,
  Target,
  GraduationCap,
  Trophy,
  Award,
  Flame,
  HelpCircle,
  CheckCircle2,
  Star,
  Timer,
  Clock,
  Briefcase,
  Bug,
  Code2,
  Terminal,
  Layers,
  Compass,
  ShieldCheck,
  Brain,
  Blocks,
  Activity,
};

function AchievementIcon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  const IconComponent = ICON_MAP[name] || Trophy;
  return <IconComponent className={className} />;
}

const tierConfig: Record<
  string,
  {
    label: string;
    bgGlow: string;
    badge: string;
    iconBox: string;
    border: string;
  }
> = {
  bronze: {
    label: "Bronze",
    bgGlow: "from-amber-500/20 via-orange-500/10 to-transparent",
    badge: "bg-amber-500/10 text-amber-500 border-amber-500/30",
    iconBox: "border-amber-500/30 bg-amber-500/10 text-amber-500",
    border: "hover:border-amber-500/40",
  },
  silver: {
    label: "Silver",
    bgGlow: "from-slate-300/20 via-slate-400/10 to-transparent",
    badge: "bg-slate-300/10 text-slate-300 border-slate-300/30",
    iconBox: "border-slate-300/30 bg-slate-300/10 text-slate-300",
    border: "hover:border-slate-300/40",
  },
  gold: {
    label: "Gold",
    bgGlow: "from-yellow-400/20 via-amber-500/10 to-transparent",
    badge: "bg-yellow-400/10 text-yellow-400 border-yellow-400/30",
    iconBox: "border-yellow-400/30 bg-yellow-400/10 text-yellow-400",
    border: "hover:border-yellow-400/40",
  },
  platinum: {
    label: "Platinum",
    bgGlow: "from-cyan-400/20 via-purple-500/10 to-transparent",
    badge: "bg-cyan-400/10 text-cyan-300 border-cyan-400/30",
    iconBox: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
    border: "hover:border-cyan-400/40",
  },
};

const CATEGORIES: { id: string; label: string }[] = [
  { id: "all", label: "All Categories" },
  { id: "learning", label: "Learning Progress" },
  { id: "streaks", label: "Streaks" },
  { id: "quizzes", label: "Quizzes" },
  { id: "interview", label: "Interview" },
  { id: "debug-lab", label: "Debug Lab" },
  { id: "playground", label: "Playground" },
  { id: "curriculum", label: "Curriculum" },
  { id: "depth", label: "Mastery & Depth" },
  { id: "combined", label: "Combined" },
];

const TIERS: { id: string; label: string }[] = [
  { id: "all", label: "All Tiers" },
  { id: "bronze", label: "Bronze" },
  { id: "silver", label: "Silver" },
  { id: "gold", label: "Gold" },
  { id: "platinum", label: "Platinum" },
];

function Achievements() {
  const rawItems = useAchievements();
  const progress = useProgress();
  const lessons = useLessons();

  const [statusFilter, setStatusFilter] = useState<"all" | "unlocked" | "locked">("all");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const items = useMemo(() => {
    return evaluateAchievements(rawItems, progress, lessons);
  }, [rawItems, progress, lessons]);

  // General summary statistics
  const totalCount = items.length;
  const unlockedCount = items.filter((a) => a.unlocked).length;
  const overallPercent = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  // Tier counts
  const tierStats = useMemo(() => {
    const stats: Record<string, { total: number; unlocked: number }> = {
      bronze: { total: 0, unlocked: 0 },
      silver: { total: 0, unlocked: 0 },
      gold: { total: 0, unlocked: 0 },
      platinum: { total: 0, unlocked: 0 },
    };
    items.forEach((a) => {
      if (stats[a.tier]) {
        stats[a.tier].total += 1;
        if (a.unlocked) stats[a.tier].unlocked += 1;
      }
    });
    return stats;
  }, [items]);

  // Closest locked achievement
  const closestNext = useMemo(() => {
    const locked = items.filter((a) => !a.unlocked && (a.progress ?? 0) < 1);
    if (locked.length === 0) return null;
    return [...locked].sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0))[0];
  }, [items]);

  // Filtered achievement list
  const filteredItems = useMemo(() => {
    return items.filter((a) => {
      // Status filter
      if (statusFilter === "unlocked" && !a.unlocked) return false;
      if (statusFilter === "locked" && a.unlocked) return false;

      // Tier filter
      if (tierFilter !== "all" && a.tier !== tierFilter) return false;

      // Category filter
      if (categoryFilter !== "all" && a.category !== categoryFilter) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = a.title.toLowerCase().includes(q);
        const matchDesc = a.description.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }

      return true;
    });
  }, [items, statusFilter, tierFilter, categoryFilter, searchQuery]);

  const unlockedFiltered = filteredItems.filter((a) => a.unlocked);
  const lockedFiltered = filteredItems.filter((a) => !a.unlocked);

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        eyebrow="Learner Recognition"
        title="Achievements"
        description="Every badge and milestone grounded directly in your real learning progress across lessons, quizzes, debugging, and practice."
      />

      {/* OVERALL PROGRESS SUMMARY BOARD */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Total Progress Card */}
        <Card className="relative overflow-hidden border-border/60 bg-card/80 backdrop-blur md:col-span-2">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Trophy className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Overall Milestone Completion
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-3">
                  <h2 className="text-3xl font-bold tracking-tight">
                    {unlockedCount}{" "}
                    <span className="text-xl font-normal text-muted-foreground">
                      / {totalCount}
                    </span>
                  </h2>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    {overallPercent}% Unlocked
                  </span>
                </div>
              </div>

              {/* Tier Badges Mini Overview */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(["bronze", "silver", "gold", "platinum"] as const).map((tierKey) => {
                  const cfg = tierConfig[tierKey];
                  const st = tierStats[tierKey];
                  return (
                    <div
                      key={tierKey}
                      onClick={() => setTierFilter(tierFilter === tierKey ? "all" : tierKey)}
                      className={cn(
                        "cursor-pointer rounded-lg border p-2.5 transition-all hover:scale-105",
                        cfg.badge,
                        tierFilter === tierKey && "ring-2 ring-primary",
                      )}
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider">
                        {cfg.label}
                      </div>
                      <div className="mt-0.5 text-sm font-semibold">
                        {st.unlocked} / {st.total}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Platform Mastery Progress</span>
                <span>{overallPercent}%</span>
              </div>
              <Progress value={overallPercent} className="h-2.5 bg-secondary/60" />
            </div>
          </CardContent>
        </Card>

        {/* Closest Next Milestone Card */}
        <Card className="relative overflow-hidden border-border/60 bg-card/80 backdrop-blur">
          <CardContent className="flex h-full flex-col justify-between p-6">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Next Up
                </span>
                <Target className="h-4 w-4 text-primary" />
              </div>

              {closestNext ? (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "grid h-8 w-8 place-items-center rounded-lg border",
                        tierConfig[closestNext.tier]?.iconBox,
                      )}
                    >
                      <AchievementIcon name={closestNext.icon} className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold">{closestNext.title}</h4>
                      <Badge
                        variant="outline"
                        className={cn("text-[9px] uppercase", tierConfig[closestNext.tier]?.badge)}
                      >
                        {closestNext.tier}
                      </Badge>
                    </div>
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {closestNext.description}
                  </p>
                </div>
              ) : (
                <div className="mt-3 text-sm text-muted-foreground">
                  All available achievements have been unlocked! Fantastic job.
                </div>
              )}
            </div>

            {closestNext && (
              <div className="mt-4 pt-2">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    {closestNext.current} / {closestNext.target}
                  </span>
                  <span>{Math.round((closestNext.progress ?? 0) * 100)}%</span>
                </div>
                <Progress
                  value={(closestNext.progress ?? 0) * 100}
                  className="mt-1 h-1.5 bg-secondary/60"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* FILTER & CONTROL BAR */}
      <div className="space-y-4 rounded-xl border border-border/60 bg-card/50 p-4 backdrop-blur">
        {/* Top Row: Search + Status Tabs */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search achievements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex rounded-lg border border-border/60 bg-background/50 p-1">
            <button
              onClick={() => setStatusFilter("all")}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-all",
                statusFilter === "all"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setStatusFilter("unlocked")}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-all",
                statusFilter === "unlocked"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Unlocked ({unlockedCount})
            </button>
            <button
              onClick={() => setStatusFilter("locked")}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-all",
                statusFilter === "locked"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Locked ({totalCount - unlockedCount})
            </button>
          </div>
        </div>

        {/* Bottom Row: Category Pills + Tier Filters */}
        <div className="space-y-3 pt-2 border-t border-border/40">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 flex items-center text-xs font-medium text-muted-foreground">
              <Filter className="mr-1 h-3 w-3" /> Category:
            </span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs transition-all",
                  categoryFilter === cat.id
                    ? "border-primary/50 bg-primary/10 text-primary font-medium"
                    : "border-border/60 bg-background/30 text-muted-foreground hover:border-border hover:text-foreground",
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Tier Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs font-medium text-muted-foreground">Tier:</span>
            {TIERS.map((tier) => (
              <button
                key={tier.id}
                onClick={() => setTierFilter(tier.id)}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-xs transition-all",
                  tierFilter === tier.id
                    ? "border-primary/50 bg-primary/10 text-primary font-medium"
                    : "border-border/60 bg-background/30 text-muted-foreground hover:border-border hover:text-foreground",
                )}
              >
                {tier.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ACHIEVEMENT CARDS GRID DISPLAY */}
      {filteredItems.length === 0 ? (
        <Card className="p-12 text-center">
          <Trophy className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 text-base font-semibold">No achievements match your filters</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your search query, status, or category filters.
          </p>
          <button
            onClick={() => {
              setStatusFilter("all");
              setTierFilter("all");
              setCategoryFilter("all");
              setSearchQuery("");
            }}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Reset Filters
          </button>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Unlocked Section (when status is "all" and there are unlocked items) */}
          {statusFilter === "all" && unlockedFiltered.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <h3 className="font-semibold text-foreground">
                  Unlocked ({unlockedFiltered.length})
                </h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {unlockedFiltered.map((a) => (
                  <AchievementCard key={a.id} achievement={a} />
                ))}
              </div>
            </div>
          )}

          {/* Locked Section (when status is "all" and there are locked items) */}
          {statusFilter === "all" && lockedFiltered.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-foreground">Locked ({lockedFiltered.length})</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {lockedFiltered.map((a) => (
                  <AchievementCard key={a.id} achievement={a} />
                ))}
              </div>
            </div>
          )}

          {/* Filtered Single List View (when status filter is explicit 'unlocked' or 'locked') */}
          {statusFilter !== "all" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((a) => (
                <AchievementCard key={a.id} achievement={a} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AchievementCard({
  achievement: a,
}: {
  achievement: ReturnType<typeof evaluateAchievements>[number];
}) {
  const cfg = tierConfig[a.tier] || tierConfig.bronze;
  const percent = Math.round((a.progress ?? 0) * 100);

  return (
    <Card
      className={cn(
        "group relative overflow-hidden border transition-all duration-200",
        cfg.border,
        a.unlocked
          ? "border-border/80 bg-card/90 hover:shadow-lg hover:shadow-primary/5"
          : "border-border/40 bg-card/40 opacity-75 hover:opacity-100",
      )}
    >
      {/* Background Tier Gradient Glow */}
      <div
        className={cn("absolute inset-0 bg-gradient-to-br transition-opacity", cfg.bgGlow)}
        style={{ opacity: a.unlocked ? 0.35 : 0.08 }}
      />

      <CardContent className="relative flex h-full flex-col justify-between p-5">
        <div>
          {/* Card Top Row: Icon + Tier Badge */}
          <div className="flex items-start justify-between">
            <div
              className={cn(
                "relative grid h-11 w-11 place-items-center rounded-xl border backdrop-blur transition-transform group-hover:scale-105",
                cfg.iconBox,
              )}
            >
              <AchievementIcon name={a.icon} className="h-5 w-5" />
              {a.unlocked ? (
                <div className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-emerald-500 text-black">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </div>
              ) : (
                <div className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-background border border-border text-muted-foreground">
                  <Lock className="h-2.5 w-2.5" />
                </div>
              )}
            </div>

            <Badge
              variant="outline"
              className={cn("text-[10px] font-bold uppercase tracking-wider", cfg.badge)}
            >
              {a.tier}
            </Badge>
          </div>

          {/* Title & Description */}
          <div className="mt-3.5">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {a.title}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{a.description}</p>
          </div>
        </div>

        {/* Card Footer Progress / Unlocked Status */}
        <div className="mt-5 pt-3 border-t border-border/30">
          {a.unlocked ? (
            <div className="flex items-center justify-between text-xs text-emerald-400 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" /> Unlocked
              </span>
              <span className="text-[10px] text-muted-foreground font-normal">
                {a.unlockedAt || "Completed"}
              </span>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                <span>
                  {a.current} / {a.target}
                </span>
                <span>{percent}%</span>
              </div>
              <Progress value={percent} className="h-1.5 bg-secondary/60" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
