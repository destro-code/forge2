import { Link } from "@tanstack/react-router";
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
          supporting workspaces
        </span>
      </div>

      {/* Technical Workspace Register Dock */}
      <div className="rounded-[6px] border border-[#E9E4DD] dark:border-border/30 bg-[#FCFBF9] dark:bg-card/20 divide-y sm:divide-y-0 sm:divide-x divide-[#E9E4DD] dark:divide-border/40 grid grid-cols-1 sm:grid-cols-3 overflow-hidden text-xs">
        {/* W1: Portfolio Labs */}
        {activeProject ? (
          <Link
            to="/projects/$projectId"
            params={{ projectId: activeProject.id }}
            className="group flex items-center justify-between gap-3 p-3.5 sm:px-4 hover:bg-[#F6F3EE] dark:hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="font-mono text-xs font-semibold text-[#78746E] dark:text-muted-foreground shrink-0 w-6">
                W1
              </span>
              <div className="min-w-0">
                <div className="font-medium text-[#5C5852] truncate group-hover:text-[#2C2A27] dark:text-foreground/90 transition-colors">
                  {activeProject.title}
                </div>
                <div className="text-[11px] text-[#B0A89D] dark:text-muted-foreground/70 font-mono truncate">
                  Portfolio Lab
                </div>
              </div>
            </div>
            <span className="font-mono text-[10px] text-[#78746E] dark:text-muted-foreground/60 shrink-0 font-medium">
              [LAB]
            </span>
          </Link>
        ) : (
          <Link
            to="/projects"
            className="group flex items-center justify-between gap-3 p-3.5 sm:px-4 hover:bg-[#F6F3EE] dark:hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="font-mono text-xs font-semibold text-[#78746E] dark:text-muted-foreground shrink-0 w-6">
                W1
              </span>
              <div className="min-w-0">
                <div className="font-medium text-[#5C5852] truncate group-hover:text-[#2C2A27] dark:text-foreground/90 transition-colors">
                  Portfolio Projects
                </div>
                <div className="text-[11px] text-[#B0A89D] dark:text-muted-foreground/70 font-mono truncate">
                  12 Capstone Labs
                </div>
              </div>
            </div>
            <span className="font-mono text-[10px] text-[#78746E] dark:text-muted-foreground/60 shrink-0 font-medium">
              [LAB]
            </span>
          </Link>
        )}

        {/* W2: Spaced Recall */}
        <Link
          to="/flashcards"
          className="group flex items-center justify-between gap-3 p-3.5 sm:px-4 hover:bg-[#F6F3EE] dark:hover:bg-muted/40 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono text-xs font-semibold text-[#78746E] dark:text-muted-foreground shrink-0 w-6">
              W2
            </span>
            <div className="min-w-0">
              <div className="font-medium text-[#5C5852] truncate group-hover:text-[#2C2A27] dark:text-foreground/90 transition-colors">
                Spaced Recall
              </div>
              <div className="text-[11px] text-[#B0A89D] dark:text-muted-foreground/70 font-mono truncate">
                {flashcardsDueCount > 0 ? `${flashcardsDueCount} cards due` : "Retention active"}
              </div>
            </div>
          </div>
          <span className="font-mono text-[10px] text-[#78746E] dark:text-muted-foreground/60 shrink-0 font-medium">
            [SYNC]
          </span>
        </Link>

        {/* W3: Academy Analytics */}
        <Link
          to="/analytics"
          className="group flex items-center justify-between gap-3 p-3.5 sm:px-4 hover:bg-[#F6F3EE] dark:hover:bg-muted/40 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono text-xs font-semibold text-[#78746E] dark:text-muted-foreground shrink-0 w-6">
              W3
            </span>
            <div className="min-w-0">
              <div className="font-medium text-[#5C5852] truncate group-hover:text-[#2C2A27] dark:text-foreground/90 transition-colors">
                Academy Analytics
              </div>
              <div className="text-[11px] text-[#B0A89D] dark:text-muted-foreground/70 font-mono truncate">
                {completedLessonsCount} verified{streakDays > 0 ? ` · ${streakDays}d` : ""}
              </div>
            </div>
          </div>
          <span className="font-mono text-[10px] text-[#78746E] dark:text-muted-foreground/60 shrink-0 font-medium">
            [METRICS]
          </span>
        </Link>
      </div>
    </section>
  );
}
