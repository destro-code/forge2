import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sparkles, Bug, FolderGit2, Briefcase, Bot } from "lucide-react";
import type { Lesson, Project, Bug as BugType } from "@/lib/types";

interface QuickResumeBarProps {
  continueLesson?: Lesson;
  activeProject?: Project;
  latestBug?: BugType;
}

export function QuickResumeBar({ continueLesson, activeProject, latestBug }: QuickResumeBarProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur-sm shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Quick Resume</h3>
            <p className="text-xs text-muted-foreground">
              Jump directly back into your active workspace
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {continueLesson && (
            <Button asChild size="sm" className="gap-1.5 shadow-sm text-xs">
              <Link to={`/lesson/${continueLesson.id}`}>
                <Sparkles className="h-3.5 w-3.5" />
                Resume Lesson
              </Link>
            </Button>
          )}

          {activeProject && (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs bg-background/60"
            >
              <Link to="/projects">
                <FolderGit2 className="h-3.5 w-3.5 text-primary" />
                Project
              </Link>
            </Button>
          )}

          {latestBug && (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs bg-background/60"
            >
              <Link to="/debug-lab">
                <Bug className="h-3.5 w-3.5 text-amber-500" />
                Debug Lab
              </Link>
            </Button>
          )}

          <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs bg-background/60">
            <Link to="/interview">
              <Briefcase className="h-3.5 w-3.5 text-emerald-500" />
              Interview Prep
            </Link>
          </Button>

          <Button
            asChild
            size="sm"
            variant="ghost"
            className="gap-1.5 text-xs text-muted-foreground"
          >
            <Link to="/mentor">
              <Bot className="h-3.5 w-3.5 text-primary" />
              Ask AI
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
