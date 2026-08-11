import { useEffect, useState } from "react";
import { BookOpen, Clock } from "lucide-react";

interface LessonReadingProgressProps {
  title: string;
  estimatedMinutes: number;
}

export function LessonReadingProgress({ title, estimatedMinutes }: LessonReadingProgressProps) {
  const [completionPercent, setCompletionPercent] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const element = document.documentElement;
      const scrollTop = element.scrollTop || document.body.scrollTop;
      const scrollHeight = element.scrollHeight || document.body.scrollHeight;
      const clientHeight = element.clientHeight || window.innerHeight;

      const totalScrollable = scrollHeight - clientHeight;
      if (totalScrollable <= 0) {
        setCompletionPercent(100);
        return;
      }

      const currentProgress = Math.min(
        100,
        Math.max(0, Math.round((scrollTop / totalScrollable) * 100)),
      );
      setCompletionPercent(currentProgress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const remainingMinutes = Math.max(1, Math.ceil(estimatedMinutes * (1 - completionPercent / 100)));

  return (
    <div className="sticky top-14 z-20 w-full border-b border-border/60 bg-background/95 backdrop-blur-md transition-all">
      {/* Top progress bar indicator */}
      <div className="h-1 w-full bg-muted/40">
        <div
          className="h-full bg-gradient-to-r from-primary via-emerald-400 to-sky-400 transition-all duration-150"
          style={{ width: `${completionPercent}%` }}
        />
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="font-medium text-foreground truncate max-w-[200px] sm:max-w-md">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-4 shrink-0 text-muted-foreground">
          <span className="hidden sm:flex items-center gap-1 text-[11px]">
            <Clock className="h-3 w-3 text-emerald-400" />
            {remainingMinutes}m remaining
          </span>
          <span className="font-mono font-semibold text-primary">{completionPercent}% read</span>
        </div>
      </div>
    </div>
  );
}
