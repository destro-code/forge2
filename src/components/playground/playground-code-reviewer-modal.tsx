import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ShieldCheck,
  Sparkles,
  Loader2,
  Atom,
  FileCode2,
  Accessibility,
  Zap,
  Award,
  Copy,
  Check,
  Wand2,
} from "lucide-react";
import Markdown from "react-markdown";
import type { PlaygroundFile } from "@/lib/types/playground";

interface PlaygroundCodeReviewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: PlaygroundFile[];
  activeFile: PlaygroundFile;
  onApplyRefactoredCode: (newCode: string) => void;
}

export function PlaygroundCodeReviewerModal({
  open,
  onOpenChange,
  files,
  activeFile,
  onApplyRefactoredCode,
}: PlaygroundCodeReviewerModalProps) {
  const [focusAreas, setFocusAreas] = useState<{
    react: boolean;
    typescript: boolean;
    accessibility: boolean;
    performance: boolean;
  }>({
    react: true,
    typescript: true,
    accessibility: true,
    performance: true,
  });

  const [notes, setNotes] = useState("");
  const [reviewResult, setReviewResult] = useState<string>("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const handleStartReview = async () => {
    const selectedAreas = Object.entries(focusAreas)
      .filter(([_, enabled]) => enabled)
      .map(([key]) => key.toUpperCase());

    if (selectedAreas.length === 0) {
      toast.warning("Please select at least one audit dimension.");
      return;
    }

    setIsReviewing(true);
    setReviewResult("");
    setScore(null);

    try {
      const res = await fetch("/api/code-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: files.map((f) => ({ name: f.name, code: f.code, language: f.language })),
          activeFileName: activeFile.name,
          focusAreas: selectedAreas,
          customInstructions: notes.trim(),
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ error: "Code review request failed" }));
        toast.error(errJson.error || "Review service unavailable");
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
          setReviewResult(streamText);
        }
      }

      // Extract numerical score from stream (e.g. 92/100 or Score: 92)
      const scoreMatch = streamText.match(
        /(?:score|overall code quality score).*?(\d{1,3})\s*(?:\/100|%)/i,
      );
      if (scoreMatch && scoreMatch[1]) {
        const extracted = Math.min(100, Math.max(0, parseInt(scoreMatch[1], 10)));
        setScore(extracted);
      }

      toast.success("AI Code Review completed successfully!");
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during AI Code Review.");
    } finally {
      setIsReviewing(false);
    }
  };

  // Extract refactored code block if present
  const extractRefactoredCode = (): string | null => {
    if (!reviewResult) return null;
    const match = reviewResult.match(/```(?:tsx|typescript|jsx|js)?\n([\s\S]*?)```/);
    return match ? match[1].trim() : null;
  };

  const refactoredSnippet = extractRefactoredCode();

  const handleCopyCode = () => {
    if (!refactoredSnippet) return;
    navigator.clipboard.writeText(refactoredSnippet);
    setCopied(true);
    toast.success("Refactored code snippet copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyRefactored = () => {
    if (!refactoredSnippet) return;
    onApplyRefactoredCode(refactoredSnippet);
    toast.success(`Applied refactored code to ${activeFile.name}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6 overflow-hidden bg-card border-border/80">
        <DialogHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  Sprint 17 — AI Code Reviewer
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    Staff Engineer Bar
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Automated structural audit for React, TypeScript, Accessibility (WCAG 2.1 AA), and
                  Performance.
                </DialogDescription>
              </div>
            </div>

            {score !== null && (
              <Badge
                variant="outline"
                className={`text-xs font-mono py-1 px-3 ${
                  score >= 85
                    ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                    : score >= 70
                      ? "border-amber-500/30 text-amber-400 bg-amber-500/10"
                      : "border-rose-500/30 text-rose-400 bg-rose-500/10"
                }`}
              >
                <Award className="h-3.5 w-3.5 mr-1 inline" /> Audit Score: {score}%
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-5 py-4 pr-1">
          {/* Audit Dimension Checkboxes */}
          <div className="bg-muted/30 p-4 rounded-xl border border-border/60 space-y-3">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Select Audit Dimensions
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-border/50 bg-card hover:border-primary/50 transition-colors cursor-pointer text-xs font-medium">
                <Checkbox
                  checked={focusAreas.react}
                  onCheckedChange={(c) => setFocusAreas((prev) => ({ ...prev, react: !!c }))}
                />
                <Atom className="h-4 w-4 text-cyan-400 shrink-0" />
                <span>React Hooks</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-border/50 bg-card hover:border-primary/50 transition-colors cursor-pointer text-xs font-medium">
                <Checkbox
                  checked={focusAreas.typescript}
                  onCheckedChange={(c) => setFocusAreas((prev) => ({ ...prev, typescript: !!c }))}
                />
                <FileCode2 className="h-4 w-4 text-blue-400 shrink-0" />
                <span>TypeScript</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-border/50 bg-card hover:border-primary/50 transition-colors cursor-pointer text-xs font-medium">
                <Checkbox
                  checked={focusAreas.accessibility}
                  onCheckedChange={(c) =>
                    setFocusAreas((prev) => ({ ...prev, accessibility: !!c }))
                  }
                />
                <Accessibility className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Accessibility</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-border/50 bg-card hover:border-primary/50 transition-colors cursor-pointer text-xs font-medium">
                <Checkbox
                  checked={focusAreas.performance}
                  onCheckedChange={(c) => setFocusAreas((prev) => ({ ...prev, performance: !!c }))}
                />
                <Zap className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Performance</span>
              </label>
            </div>

            <Textarea
              placeholder="Optional: Enter context or specific concerns (e.g., 'Is my useEffect re-rendering on filter change?')"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs min-h-[50px] bg-background border-border/60"
            />
          </div>

          {/* Trigger Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleStartReview}
              disabled={isReviewing}
              className="gap-2 shadow-glow text-xs"
            >
              {isReviewing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Auditing Codebase...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" /> Run AI Code Review ({activeFile.name})
                </>
              )}
            </Button>
          </div>

          {/* Review Results Panel */}
          {(reviewResult || isReviewing) && (
            <div className="space-y-4 pt-2">
              <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" /> Comprehensive Audit Report
                  </h4>
                  {refactoredSnippet && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyCode}
                        className="h-7 text-[11px] gap-1"
                      >
                        {copied ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        {copied ? "Copied" : "Copy Refactored Code"}
                      </Button>

                      <Button
                        size="sm"
                        onClick={handleApplyRefactored}
                        className="h-7 text-[11px] gap-1 shadow-sm"
                      >
                        <Wand2 className="h-3 w-3" /> Apply to {activeFile.name}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="text-xs text-foreground leading-relaxed markdown-body max-h-[420px] overflow-y-auto pr-2">
                  {reviewResult ? (
                    <Markdown>{reviewResult}</Markdown>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-3">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <p className="text-xs">
                        Analyzing hook rules, type constraints, WCAG standards, and render trees...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
