import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, BookMarked, BarChart3 } from "lucide-react";
import type { Project } from "@/lib/types";

interface SecondaryWorkspacesProps {
  activeProject?: Project;
  flashcardsDueCount?: number;
  completedLessonsCount: number;
  streakDays: number;
}

export function SecondaryWorkspaces({
  activeProject,
  flashcardsDueCount = 0,
  completedLessonsCount,
  streakDays,
}: SecondaryWorkspacesProps) {
  return (
    <section aria-label="Supporting Workspaces" className="flex flex-col gap-4 border-t border-border pt-6">
      <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-muted-foreground px-1">
        <span className="forge-section-label">MOMENTUM</span>
        <span className="forge-section-label">THIS WEEK</span>
      </div>

      {/* Supporting Workspace Register */}
      <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
        {/* Capstone Projects */}
        {activeProject ? (
          <Link
            to="/projects/$projectId"
            params={{ projectId: activeProject.id }}
            className="forge-panel group flex items-center justify-between gap-3 rounded-2xl p-4 transition-colors hover:border-primary/60 sm:px-5"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-7 w-7 rounded bg-primary/10 text-primary grid place-items-center shrink-0">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  Capstone Projects
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {activeProject.title}
                </div>
              </div>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-foreground transition-colors shrink-0" />
          </Link>
        ) : (
          <Link
            to="/projects"
            className="forge-panel group flex items-center justify-between gap-3 rounded-2xl p-4 transition-colors hover:border-primary/60 sm:px-5"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-7 w-7 rounded bg-primary/10 text-primary grid place-items-center shrink-0">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  Capstone Projects
                </div>
                <div className="text-[11px] text-muted-foreground truncate">Portfolio Labs</div>
              </div>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-foreground transition-colors shrink-0" />
          </Link>
        )}

        {/* Flashcards */}
        <Link
          to="/flashcards"
          className="forge-panel group flex items-center justify-between gap-3 rounded-2xl p-4 transition-colors hover:border-primary/60 sm:px-5"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-7 w-7 rounded bg-muted text-muted-foreground group-hover:text-foreground grid place-items-center shrink-0">
              <BookMarked className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                Flashcards
              </div>
              <div className="text-[11px] text-muted-foreground truncate">
                {flashcardsDueCount > 0 ? `${flashcardsDueCount} cards due` : "Active recall"}
              </div>
            </div>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-foreground transition-colors shrink-0" />
        </Link>

        {/* Learning Stats */}
        <Link
          to="/analytics"
          className="forge-panel group flex items-center justify-between gap-3 rounded-2xl p-4 transition-colors hover:border-primary/60 sm:px-5"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-7 w-7 rounded bg-muted text-muted-foreground group-hover:text-foreground grid place-items-center shrink-0">
              <BarChart3 className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                Learning Stats
              </div>
              <div className="text-[11px] text-muted-foreground truncate">
                {completedLessonsCount} verified{streakDays > 0 ? ` · ${streakDays}d streak` : ""}
              </div>
            </div>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-foreground transition-colors shrink-0" />
        </Link>
      </div>
    </section>
  );
}
