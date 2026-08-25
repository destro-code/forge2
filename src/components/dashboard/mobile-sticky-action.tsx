import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Play, ArrowRight } from "lucide-react";
import type { Lesson } from "@/lib/types";

interface MobileStickyActionProps {
  lesson: Lesson;
  isNewLearner?: boolean;
}

export function MobileStickyAction({ lesson, isNewLearner = false }: MobileStickyActionProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky bar when scrolled past 260px (past hero action floor)
      if (window.scrollY > 260) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="sm:hidden fixed bottom-4 inset-x-4 z-40 animate-in fade-in slide-in-from-bottom-3 duration-200">
      <Link
        to="/lesson/$lessonId"
        params={{ lessonId: lesson.id }}
        search={{ mode: "curriculum" }}
        className="flex items-center justify-between gap-3 w-full p-3.5 rounded-[4px] bg-[#D35C37] hover:bg-[#B84B2A] dark:bg-[#C8441B] dark:hover:bg-[#A83410] text-white font-semibold text-sm shadow-md active:scale-[0.985] transition-all"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-6 w-6 rounded-[3px] bg-white/20 grid place-items-center shrink-0">
            <Play className="h-3 w-3 fill-current ml-0.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-[0.06em] text-white/80 font-medium">
              {isNewLearner ? "First Challenge" : "Active Frontier"}
            </div>
            <div className="text-xs truncate font-bold text-white">{lesson.title}</div>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-1 text-xs font-semibold bg-white/15 px-2.5 py-1 rounded-[3px]">
          <span>{lesson.estimatedMinutes}m</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </Link>
    </div>
  );
}
