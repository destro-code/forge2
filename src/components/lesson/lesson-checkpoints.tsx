import { CheckCircle2, Circle, HelpCircle, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useProgress } from "@/lib/hooks/use-progress";
import { toast } from "sonner";

interface CheckpointItem {
  id: string;
  label: string;
  hint?: string;
}

interface LessonCheckpointsProps {
  lessonId: string;
  checkpoints: CheckpointItem[];
}

export function LessonCheckpoints({ lessonId, checkpoints }: LessonCheckpointsProps) {
  const { lessonCheckpoints, toggleCheckpoint } = useProgress();

  if (!checkpoints || checkpoints.length === 0) return null;

  const completedCount = checkpoints.filter(
    (c) => lessonCheckpoints?.[`${lessonId}:${c.id}`],
  ).length;
  const isAllDone = completedCount === checkpoints.length;

  const handleToggle = (id: string, label: string) => {
    toggleCheckpoint(lessonId, id);
    const nowDone = !lessonCheckpoints?.[`${lessonId}:${id}`];
    if (nowDone) {
      toast.success(`Checkpoint passed: ${label}`);
    }
  };

  return (
    <div className="my-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-emerald-500/20">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-emerald-400" />
          <span className="font-bold text-sm text-foreground">Lesson Checkpoints</span>
        </div>
        <Badge
          variant="secondary"
          className={`text-xs gap-1 font-mono ${
            isAllDone ? "bg-emerald-500/20 text-emerald-300" : "bg-muted text-muted-foreground"
          }`}
        >
          {completedCount} / {checkpoints.length} Mastered
        </Badge>
      </div>

      <div className="space-y-2">
        {checkpoints.map((item) => {
          const isDone = Boolean(lessonCheckpoints?.[`${lessonId}:${item.id}`]);
          return (
            <div
              key={item.id}
              onClick={() => handleToggle(item.id, item.label)}
              className={`flex items-start gap-3 p-2.5 rounded-lg border transition cursor-pointer select-none ${
                isDone
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                  : "border-border/60 bg-card/60 hover:bg-muted/40 text-foreground/90"
              }`}
            >
              <button className="mt-0.5 shrink-0 focus:outline-none">
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 fill-emerald-400/20" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <span className={`text-sm ${isDone ? "line-through opacity-85" : "font-medium"}`}>
                  {item.label}
                </span>
                {item.hint && (
                  <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1">
                    <HelpCircle className="h-3 w-3 text-sky-400 shrink-0" />
                    {item.hint}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
