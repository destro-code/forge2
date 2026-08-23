import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ActivityIntent, CanonicalActivity } from "@/lib/curriculum/types";
import {
  Compass,
  BookOpen,
  Code2,
  Eye,
  HelpCircle,
  CheckSquare,
  Sparkles,
  Terminal,
  Bug,
  Brain,
  Award,
  ListOrdered,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActivityHeaderProps {
  activity: CanonicalActivity;
  title?: string;
  onRevealHint?: () => void;
  hintsRemaining?: number;
  className?: string;
}

const INTENT_METADATA: Record<
  ActivityIntent,
  { label: string; icon: typeof BookOpen; color: string }
> = {
  orientation: {
    label: "Orientation",
    icon: Compass,
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  understanding: {
    label: "Concept",
    icon: BookOpen,
    color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  },
  recognition: {
    label: "Visual Model",
    icon: Eye,
    color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  },
  retrieval: {
    label: "Active Recall",
    icon: HelpCircle,
    color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
  prediction: {
    label: "Prediction",
    icon: Sparkles,
    color: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  },
  application: {
    label: "Coding Practice",
    icon: Terminal,
    color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  debugging: {
    label: "Debug Challenge",
    icon: Bug,
    color: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  },
  assessment: {
    label: "Knowledge Check",
    icon: CheckSquare,
    color: "bg-teal-500/10 text-teal-500 border-teal-500/20",
  },
  reflection: {
    label: "Reflection",
    icon: Brain,
    color: "bg-sky-500/10 text-sky-500 border-sky-500/20",
  },
  synthesis: {
    label: "Synthesis",
    icon: Award,
    color: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  },
  reinforcement: {
    label: "Reinforcement",
    icon: ListOrdered,
    color: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
  },
};

export function ActivityHeader({
  activity,
  title,
  onRevealHint,
  hintsRemaining,
  className,
}: ActivityHeaderProps) {
  const meta = INTENT_METADATA[activity.intent] || INTENT_METADATA.understanding;
  const Icon = meta.icon;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 px-6 py-4 border-b border-border/60 bg-muted/20",
        className,
      )}
    >
      <div className="flex items-center gap-2.5 flex-wrap">
        <Badge
          variant="outline"
          className={cn(
            "px-2.5 py-0.5 text-xs font-medium border flex items-center gap-1.5",
            meta.color,
          )}
        >
          <Icon className="w-3.5 h-3.5" />
          <span>{meta.label}</span>
        </Badge>
        <span className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
          {activity.type}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {onRevealHint && typeof hintsRemaining === "number" && hintsRemaining > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRevealHint}
            className="h-7 text-xs text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 gap-1.5"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Hint ({hintsRemaining})</span>
          </Button>
        )}
      </div>
    </div>
  );
}
