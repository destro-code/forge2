import { Badge } from "@/components/ui/badge";
import type { Difficulty } from "@/lib/types";
import { cn } from "@/lib/utils";

const styles: Record<Difficulty, string> = {
  Beginner: "border-success/40 bg-success/10 text-success",
  Intermediate: "border-warning/40 bg-warning/10 text-warning",
  Advanced: "border-destructive/40 bg-destructive/10 text-destructive",
};

export function DifficultyBadge({
  difficulty,
  className,
}: {
  difficulty: Difficulty;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn("border font-medium", styles[difficulty], className)}>
      {difficulty}
    </Badge>
  );
}
