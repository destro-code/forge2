import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowUpRight,
  Award,
  Blocks,
  BookOpen,
  Brain,
  Briefcase,
  Bug,
  CheckCircle2,
  Clock,
  Code2,
  Compass,
  Flame,
  GraduationCap,
  HelpCircle,
  Layers,
  Lock,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Terminal,
  Timer,
  Trophy,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Win {
  id: string;
  title: string;
  icon: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
}

interface RecentWinsProps {
  wins: Win[];
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Activity,
  Award,
  Blocks,
  BookOpen,
  Brain,
  Briefcase,
  Bug,
  CheckCircle2,
  Clock,
  Code2,
  Compass,
  Flame,
  GraduationCap,
  HelpCircle,
  Layers,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Terminal,
  Timer,
  Trophy,
  Zap,
};

const TIER_RING: Record<Win["tier"], string> = {
  bronze: "border-warning/45 text-warning",
  silver: "border-muted-foreground/40 text-muted-foreground",
  gold: "border-primary/50 text-primary",
  platinum: "border-info/50 text-info",
};

export function RecentWins({ wins }: RecentWinsProps) {
  return (
    <section aria-label="Recent wins" className="rounded-lg border border-border bg-card">
      <div className="flex items-start justify-between gap-3 border-b border-border/60 px-5 pt-5 sm:px-6">
        <div>
          <div className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Recent wins
          </div>
          <h2 className="mt-1.5 font-serif text-2xl font-medium tracking-tight text-foreground">
            Proof of work.
          </h2>
        </div>
        <Link
          to="/achievements"
          className="mt-1 inline-flex shrink-0 items-center gap-1 font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
        >
          View all
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      <div className="px-5 py-5 sm:px-6">
        {wins.length > 0 ? (
          <ul className="flex flex-wrap gap-x-6 gap-y-4">
            {wins.map((win) => {
              const Icon = ICONS[win.icon] || Trophy;
              return (
                <li key={win.id} className="flex w-16 flex-col items-center gap-2 text-center">
                  <span
                    className={cn(
                      "grid h-12 w-12 place-items-center rounded-full border bg-secondary/40",
                      TIER_RING[win.tier],
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-[11px] leading-tight text-muted-foreground">
                    {win.title}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-dashed border-border text-muted-foreground/50">
              <Lock className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="text-pretty">
              Your first badge is one lesson away. Finish a node to forge your first proof of work.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
