import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  Compass,
  Lightbulb,
  Layers,
  Send,
  Bot,
  Award,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import Markdown from "react-markdown";
import type { Project } from "@/lib/types";

interface AIProjectMentorCardProps {
  project: Project;
  completedTasksCount: number;
  totalTasksCount: number;
  projectTasks: Record<string, boolean>;
  projectCriteria: Record<string, boolean>;
  reflectionInfo: {
    challenge?: string;
    solution?: string;
    learned?: string;
    scaleRefactor?: string;
  };
}

export function AIProjectMentorCard({
  project,
  completedTasksCount,
  totalTasksCount,
  projectTasks,
  projectCriteria,
  reflectionInfo,
}: AIProjectMentorCardProps) {
  const [activeMode, setActiveMode] = useState<
    "milestone_review" | "architecture_advice" | "suggestions"
  >("milestone_review");
  const [mentorResponse, setMentorResponse] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userPrompt, setUserPrompt] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "assistant"; text: string }[]>(
    [],
  );

  // Format milestones breakdown
  const milestonesInfo = project.milestones
    .map((m) => {
      const done = m.tasks.filter((t) => projectTasks[`${project.id}:${t.id}`]).length;
      return `- Milestone "${m.title}": ${done}/${m.tasks.length} completed. Description: ${m.description}`;
    })
    .join("\n");

  // Format acceptance criteria
  const criteriaInfo = (project.acceptanceCriteria || [])
    .map((c) => {
      const isVerified = projectCriteria[`${project.id}:${c.id}`];
      return `- Criteria [${c.category}] "${c.title}": ${isVerified ? "VERIFIED" : "PENDING"}`;
    })
    .join("\n");

  const handleFetchMentorGuidance = async (
    mode: "milestone_review" | "architecture_advice" | "suggestions",
    customQuestion?: string,
  ) => {
    setIsLoading(true);
    setActiveMode(mode);
    setMentorResponse("");

    try {
      const res = await fetch("/api/project-mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          projectTitle: project.title,
          projectCategory: project.category,
          projectOverview: project.overview || project.description,
          milestonesInfo,
          completedTasksCount,
          totalTasksCount,
          criteriaInfo,
          reflectionInfo,
          userPrompt: customQuestion,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ error: "AI Project Mentor failed" }));
        toast.error(errJson.error || "Project mentor unavailable");
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let streamText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          streamText += chunk;
          setMentorResponse(streamText);
        }
      }

      if (customQuestion) {
        setChatHistory((prev) => [
          ...prev,
          { role: "user", text: customQuestion },
          { role: "assistant", text: streamText },
        ]);
        setUserPrompt("");
      }

      toast.success(
        mode === "milestone_review"
          ? "Milestone Review generated!"
          : mode === "architecture_advice"
            ? "Architecture Advice generated!"
            : "Project Suggestions generated!",
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to connect to AI Project Mentor service.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAskCustomQuestion = () => {
    if (!userPrompt.trim()) {
      toast.warning("Please enter a question for the mentor.");
      return;
    }
    handleFetchMentorGuidance(activeMode, userPrompt.trim());
  };

  return (
    <div className="space-y-6">
      {/* Mode Switcher Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card
          onClick={() => handleFetchMentorGuidance("milestone_review")}
          className={`cursor-pointer transition-all border ${
            activeMode === "milestone_review"
              ? "bg-primary/10 border-primary shadow-sm"
              : "bg-card border-border/60 hover:border-primary/40"
          }`}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-400 grid place-items-center shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">Milestone Reviews</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Evaluate task progress & reflection completeness.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => handleFetchMentorGuidance("architecture_advice")}
          className={`cursor-pointer transition-all border ${
            activeMode === "architecture_advice"
              ? "bg-primary/10 border-primary shadow-sm"
              : "bg-card border-border/60 hover:border-primary/40"
          }`}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 text-indigo-400 grid place-items-center shrink-0">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">Architecture Advice</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Component structure, state & 10x scale design.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => handleFetchMentorGuidance("suggestions")}
          className={`cursor-pointer transition-all border ${
            activeMode === "suggestions"
              ? "bg-primary/10 border-primary shadow-sm"
              : "bg-card border-border/60 hover:border-primary/40"
          }`}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-400 grid place-items-center shrink-0">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">Project Suggestions</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Refactoring tips, portfolio talking points & features.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Mentor Guidance Panel */}
      <Card className="border-border/60 overflow-hidden">
        <CardHeader className="py-4 px-5 border-b border-border/40 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary grid place-items-center">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  Sprint 18 — AI Project Mentor
                  <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                    {activeMode.replace("_", " ")}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Principal Architect insights tailored specifically to {project.title}.
                </CardDescription>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => handleFetchMentorGuidance(activeMode)}
              disabled={isLoading}
              className="gap-1.5 text-xs self-start sm:self-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" /> Refresh{" "}
                  {activeMode.split("_")[0]} Analysis
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-4">
          {mentorResponse || isLoading ? (
            <div className="markdown-body text-xs text-foreground leading-relaxed max-h-[500px] overflow-y-auto pr-2 bg-card p-4 rounded-xl border border-border/50">
              {mentorResponse ? (
                <Markdown>{mentorResponse}</Markdown>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-3">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-xs">
                    Gathering milestone progress, architecture patterns, and scale blueprints...
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-10 space-y-3 bg-muted/20 rounded-xl border border-dashed border-border/60 p-6">
              <Sparkles className="h-8 w-8 mx-auto text-primary opacity-60" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">Ready for Architectural Guidance</h4>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Select a mode above (Milestone Review, Architecture Advice, or Suggestions) to
                  analyze {project.title}.
                </p>
              </div>
              <Button
                onClick={() => handleFetchMentorGuidance("milestone_review")}
                size="sm"
                className="gap-1.5 text-xs mt-2"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Launch Milestone Review
              </Button>
            </div>
          )}

          {/* Ask Project Mentor Custom Question */}
          <div className="pt-4 border-t border-border/40 space-y-3">
            <h5 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Send className="h-3.5 w-3.5 text-primary" /> Ask AI Project Mentor Custom Question
            </h5>

            <div className="flex gap-2">
              <Textarea
                placeholder={`Ask a specific question about ${project.title} (e.g., 'How should I structure state between the form and list component?')`}
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                className="text-xs min-h-[55px] bg-background border-border/60"
              />
              <Button
                onClick={handleAskCustomQuestion}
                disabled={isLoading}
                className="self-end text-xs h-[55px] px-4 gap-1.5 shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Ask Mentor
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
