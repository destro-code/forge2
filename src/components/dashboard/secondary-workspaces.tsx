import { Link } from "@tanstack/react-router";
import { FolderGit2, RotateCcw, BarChart3, ChevronRight } from "lucide-react";
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
    <section
      aria-label="Secondary Studio Workspaces"
      className="pt-6 border-t border-border/40 space-y-2.5"
    >
      <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground/80 mb-1">
        STUDIO WORKSPACES
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {/* Active Portfolio Project */}
        {activeProject ? (
          <Link
            to="/projects/$projectId"
            params={{ projectId: activeProject.id }}
            className="group flex items-center justify-between gap-3 p-3 rounded-lg border border-border/50 bg-card/40 hover:bg-card/80 hover:border-border transition-all text-xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <FolderGit2 className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
              <div className="min-w-0">
                <div className="font-semibold text-foreground truncate">{activeProject.title}</div>
                <div className="text-[11px] text-muted-foreground">Portfolio Project</div>
              </div>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-foreground shrink-0 transition-colors" />
          </Link>
        ) : (
          <Link
            to="/projects"
            className="group flex items-center justify-between gap-3 p-3 rounded-lg border border-border/40 bg-card/30 hover:bg-card/70 hover:border-border transition-all text-xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <FolderGit2 className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
              <div className="min-w-0">
                <div className="font-semibold text-foreground truncate">Portfolio Projects</div>
                <div className="text-[11px] text-muted-foreground">Browse all 12 labs</div>
              </div>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-foreground shrink-0 transition-colors" />
          </Link>
        )}

        {/* Spaced Review Flashcards */}
        <Link
          to="/flashcards"
          className="group flex items-center justify-between gap-3 p-3 rounded-lg border border-border/50 bg-card/40 hover:bg-card/80 hover:border-border transition-all text-xs"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <RotateCcw className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
            <div className="min-w-0">
              <div className="font-semibold text-foreground truncate">Spaced Recall</div>
              <div className="text-[11px] text-muted-foreground">
                {flashcardsDueCount > 0
                  ? `${flashcardsDueCount} cards ready for review`
                  : "Continuous concept retention"}
              </div>
            </div>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-foreground shrink-0 transition-colors" />
        </Link>

        {/* Learning Analytics & Metrics */}
        <Link
          to="/analytics"
          className="group flex items-center justify-between gap-3 p-3 rounded-lg border border-border/50 bg-card/40 hover:bg-card/80 hover:border-border transition-all text-xs sm:col-span-2 lg:col-span-1"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <BarChart3 className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
            <div className="min-w-0">
              <div className="font-semibold text-foreground truncate">Academy Analytics</div>
              <div className="text-[11px] text-muted-foreground font-mono">
                {completedLessonsCount} lessons verified
                {streakDays > 0 ? ` · ${streakDays}d streak` : ""}
              </div>
            </div>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-foreground shrink-0 transition-colors" />
        </Link>
      </div>
    </section>
  );
}
