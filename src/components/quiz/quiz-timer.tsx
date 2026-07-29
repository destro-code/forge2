import { useEffect, useState } from "react";
import { Clock, Pause, Play, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface QuizTimerProps {
  durationMinutes: number;
  onTimeExpired: () => void;
  isPaused: boolean;
  onTogglePause: () => void;
  onTick?: (secondsRemaining: number) => void;
}

export function QuizTimer({
  durationMinutes,
  onTimeExpired,
  isPaused,
  onTogglePause,
  onTick,
}: QuizTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60);

  useEffect(() => {
    if (isPaused || secondsLeft <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        const next = prev - 1;
        if (onTick) onTick(next);
        if (next <= 0) {
          clearInterval(interval);
          onTimeExpired();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, secondsLeft, onTimeExpired, onTick]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isWarning = secondsLeft <= 120 && secondsLeft > 0; // Less than 2 mins

  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-sm font-semibold transition ${
          isWarning
            ? "border-rose-500/50 bg-rose-500/10 text-rose-400 animate-pulse"
            : "border-border/60 bg-muted/30 text-foreground"
        }`}
      >
        {isWarning ? (
          <AlertTriangle className="h-4 w-4 text-rose-400" />
        ) : (
          <Clock className="h-4 w-4 text-primary" />
        )}
        <span>{formattedTime}</span>
        {isWarning && (
          <span className="text-[10px] text-rose-400 uppercase tracking-wide">Ending Soon</span>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-foreground"
        onClick={onTogglePause}
        title={isPaused ? "Resume Timer" : "Pause Timer"}
      >
        {isPaused ? (
          <Play className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <Pause className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
  );
}
