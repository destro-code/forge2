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
      className="pt-6 border-t border-[#E3DDD6] dark:border-border/40 space-y-3"
    >
      <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.08em] text-[#78746E] dark:text-muted-foreground/70 px-1">
        <span>STUDIO WORKSPACES</span>
        <span className="text-[10px] lowercase text-[#B0A89D] dark:text-muted-foreground/50 hidden sm:inline">
          supporting modules & review
        </span>
      </div>

      {/* Unified Single Structural Studio Dock */}
      <div className="rounded-xl border border-[#E9E4DD] dark:border-border/30 bg-[#FCFBF9] dark:bg-card/20 divide-y sm:divide-y-0 sm:divide-x divide-[#E9E4DD] dark:divide-border/40 grid grid-cols-1 sm:grid-cols-3 overflow-hidden text-xs">
        {/* 1. Active Portfolio Project */}
        {activeProject ? (
          <Link
            to="/projects/$projectId"
            params={{ projectId: activeProject.id }}
            className="group flex items-center justify-between gap-3 p-3.5 sm:px-4 hover:bg-[#F6F3EE] dark:hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <FolderGit2 className="h-3.5 w-3.5 text-[#B0A89D] group-hover:text-[#2C2A27] dark:text-muted-foreground dark:group-hover:text-foreground shrink-0 transition-colors" />
              <div className="min-w-0">
                <div className="font-medium text-[#5C5852] truncate group-hover:text-[#2C2A27] dark:text-foreground dark:group-hover:text-primary transition-colors">
                  {activeProject.title}
                </div>
                <div className="text-[11px] text-[#B0A89D] dark:text-muted-foreground/80 font-mono">
                  Portfolio Lab
                </div>
              </div>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-[#B0A89D] group-hover:text-[#2C2A27] dark:text-muted-foreground/40 dark:group-hover:text-foreground group-hover:translate-x-0.5 shrink-0 transition-all" />
          </Link>
        ) : (
          <Link
            to="/projects"
            className="group flex items-center justify-between gap-3 p-3.5 sm:px-4 hover:bg-[#F6F3EE] dark:hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <FolderGit2 className="h-3.5 w-3.5 text-[#B0A89D] group-hover:text-[#2C2A27] dark:text-muted-foreground dark:group-hover:text-foreground shrink-0 transition-colors" />
              <div className="min-w-0">
                <div className="font-medium text-[#5C5852] truncate group-hover:text-[#2C2A27] dark:text-foreground dark:group-hover:text-primary transition-colors">
                  Portfolio Projects
                </div>
                <div className="text-[11px] text-[#B0A89D] dark:text-muted-foreground/80 font-mono">
                  12 Capstone Labs
                </div>
              </div>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-[#B0A89D] group-hover:text-[#2C2A27] dark:text-muted-foreground/40 dark:group-hover:text-foreground group-hover:translate-x-0.5 shrink-0 transition-all" />
          </Link>
        )}

        {/* 2. Spaced Review Flashcards */}
        <Link
          to="/flashcards"
          className="group flex items-center justify-between gap-3 p-3.5 sm:px-4 hover:bg-[#F6F3EE] dark:hover:bg-muted/40 transition-colors"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <RotateCcw className="h-3.5 w-3.5 text-[#B0A89D] group-hover:text-[#2C2A27] dark:text-muted-foreground dark:group-hover:text-foreground shrink-0 transition-colors" />
            <div className="min-w-0">
              <div className="font-medium text-[#5C5852] truncate group-hover:text-[#2C2A27] dark:text-foreground dark:group-hover:text-primary transition-colors">
                Spaced Recall
              </div>
              <div className="text-[11px] text-[#B0A89D] dark:text-muted-foreground/80 font-mono">
                {flashcardsDueCount > 0 ? `${flashcardsDueCount} cards due` : "Retention active"}
              </div>
            </div>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-[#B0A89D] group-hover:text-[#2C2A27] dark:text-muted-foreground/40 dark:group-hover:text-foreground group-hover:translate-x-0.5 shrink-0 transition-all" />
        </Link>

        {/* 3. Learning Analytics & Metrics */}
        <Link
          to="/analytics"
          className="group flex items-center justify-between gap-3 p-3.5 sm:px-4 hover:bg-[#F6F3EE] dark:hover:bg-muted/40 transition-colors"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <BarChart3 className="h-3.5 w-3.5 text-[#B0A89D] group-hover:text-[#2C2A27] dark:text-muted-foreground dark:group-hover:text-foreground shrink-0 transition-colors" />
            <div className="min-w-0">
              <div className="font-medium text-[#5C5852] truncate group-hover:text-[#2C2A27] dark:text-foreground dark:group-hover:text-primary transition-colors">
                Academy Analytics
              </div>
              <div className="text-[11px] text-[#B0A89D] dark:text-muted-foreground/80 font-mono">
                {completedLessonsCount} verified
                {streakDays > 0 ? ` · ${streakDays}d` : ""}
              </div>
            </div>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-[#B0A89D] group-hover:text-[#2C2A27] dark:text-muted-foreground/40 dark:group-hover:text-foreground group-hover:translate-x-0.5 shrink-0 transition-all" />
        </Link>
      </div>
    </section>
  );
}
