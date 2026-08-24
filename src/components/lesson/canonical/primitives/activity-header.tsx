import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ActivityIntent, CanonicalActivity } from "@/lib/curriculum/types";
import {
  Compass,
  BookOpen,
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
    color: "text-blue-600 dark:text-blue-400 bg-blue-500/5 border-blue-500/15",
  },
  understanding: {
    label: "Concept Study",
    icon: BookOpen,
    color: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 border-indigo-500/15",
  },
  recognition: {
    label: "Visual Model",
    icon: Eye,
    color: "text-purple-600 dark:text-purple-400 bg-purple-500/5 border-purple-500/15",
  },
  retrieval: {
    label: "Active Recall",
    icon: HelpCircle,
    color: "text-amber-600 dark:text-amber-400 bg-amber-500/5 border-amber-500/15",
  },
  prediction: {
    label: "Output Prediction",
    icon: Sparkles,
    color: "text-orange-600 dark:text-orange-400 bg-orange-500/5 border-orange-500/15",
  },
  application: {
    label: "Coding Practice",
    icon: Terminal,
    color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 border-emerald-500/15",
  },
  debugging: {
    label: "Debug Challenge",
    icon: Bug,
    color: "text-rose-600 dark:text-rose-400 bg-rose-500/5 border-rose-500/15",
  },
  assessment: {
    label: "Knowledge Check",
    icon: CheckSquare,
    color: "text-teal-600 dark:text-teal-400 bg-teal-500/5 border-teal-500/15",
  },
  reflection: {
    label: "Self Reflection",
    icon: Brain,
    color: "text-sky-600 dark:text-sky-400 bg-sky-500/5 border-sky-500/15",
  },
  synthesis: {
    label: "Synthesis Practice",
    icon: Award,
    color: "text-violet-600 dark:text-violet-400 bg-violet-500/5 border-violet-500/15",
  },
  reinforcement: {
    label: "Reinforcement",
    icon: ListOrdered,
    color: "text-zinc-600 dark:text-zinc-400 bg-zinc-500/5 border-zinc-500/15",
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
        "flex items-center justify-between gap-3 px-6 py-4 border-b border-lesson-border bg-lesson-surface-subtle/30",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <Badge
          variant="outline"
          className={cn(
            "px-2.5 py-1 text-xs font-medium border flex items-center gap-1.5 shadow-none rounded-md",
            meta.color,
          )}
        >
          <Icon className="w-3.5 h-3.5" />
          <span>{meta.label}</span>
        </Badge>
        {title && (
          <span className="text-sm font-medium text-lesson-text-secondary hidden sm:inline truncate max-w-xs">
            {title}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {onRevealHint && typeof hintsRemaining === "number" && hintsRemaining > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRevealHint}
            className="h-8 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-500/5 focus-visible:ring-2 focus-visible:ring-lesson-focus-ring gap-1.5 px-3 rounded-md font-medium"
          >
            <Lightbulb className="w-4 h-4 shrink-0" />
            <span>Hint ({hintsRemaining})</span>
          </Button>
        )}
      </div>
    </div>
  );
}
