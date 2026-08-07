import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { RotateCcw, Sparkles, ShieldCheck, Code2, Lightbulb } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

import type { PlaygroundFile } from "@/lib/types/playground";
import { PLAYGROUND_PRESETS } from "@/lib/playground-data";
import { PlaygroundEditor } from "@/components/playground/playground-editor";
import { PlaygroundSolutionModal } from "@/components/playground/playground-solution-modal";
import { PlaygroundCodeReviewerModal } from "@/components/playground/playground-code-reviewer-modal";

export const Route = createFileRoute("/playground")({
  head: () => ({
    meta: [
      { title: "Playground · Forge" },
      {
        name: "description",
        content:
          "Sandpack browser-based execution environment, live React TS component preview, reference solution comparison, and AI code review.",
      },
      { property: "og:title", content: "Playground · Forge" },
      { property: "og:description", content: "Secure Sandpack React playground workspace." },
    ],
  }),
  component: Playground,
});

function Playground() {
  const [currentPresetId, setCurrentPresetId] = useState<string>(PLAYGROUND_PRESETS[0].id);
  const activePreset =
    PLAYGROUND_PRESETS.find((p) => p.id === currentPresetId) || PLAYGROUND_PRESETS[0];

  const [files, setFiles] = useState<PlaygroundFile[]>(() => {
    if (typeof window === "undefined") return activePreset.files;
    const key = `forge_playground_files_${activePreset.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // Fallback to active preset default files
      }
    }
    return activePreset.files;
  });

  const [solutionOpen, setSolutionOpen] = useState(false);
  const [codeReviewOpen, setCodeReviewOpen] = useState(false);

  const activeFile = files[0] || activePreset.files[0];

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `forge_playground_files_${currentPresetId}`;
    localStorage.setItem(key, JSON.stringify(files));
  }, [files, currentPresetId]);

  const handleSelectPreset = (presetId: string) => {
    const nextPreset = PLAYGROUND_PRESETS.find((p) => p.id === presetId);
    if (!nextPreset) return;
    setCurrentPresetId(presetId);

    let nextFiles = nextPreset.files;
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`forge_playground_files_${presetId}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) nextFiles = parsed;
        } catch {
          // Fallback to preset defaults
        }
      }
    }

    setFiles(nextFiles);
    toast.success(`Loaded lab preset: ${nextPreset.title}`);
  };

  const handleCodeChange = useCallback((fileName: string, newCode: string) => {
    setFiles((prev) => {
      let changed = false;
      const next = prev.map((f) => {
        const cleanName = f.name.startsWith("/") ? f.name.slice(1) : f.name;
        const targetCleanName = fileName.startsWith("/") ? fileName.slice(1) : fileName;
        if (cleanName === targetCleanName && f.code !== newCode) {
          changed = true;
          return { ...f, code: newCode };
        }
        return f;
      });
      return changed ? next : prev;
    });
  }, []);

  const handleReset = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(`forge_playground_files_${currentPresetId}`);
    }
    setFiles(activePreset.files);
    toast.info("Playground code reset to lab defaults.");
  };

  const handleApplySolution = (solutionFiles: PlaygroundFile[]) => {
    setFiles(solutionFiles);
    toast.success("Applied reference solution code!");
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Page Header */}
      <PageHeader
        eyebrow="Browser Execution Sandbox"
        title="Sandpack Playground"
        description="Isolated browser runtime powered by Sandpack. Edit React TypeScript components with live hot-reloading preview and instant syntax diagnostics."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCodeReviewOpen(true)}
              className="gap-1.5 text-xs border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Explain / AI Code Review
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSolutionOpen(true)}
              className="gap-1.5 text-xs"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Compare Solution
            </Button>

            <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5 text-xs">
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Lab
            </Button>
          </div>
        }
      />

      {/* Lab Preset Selector & Context Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm w-full max-w-full overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Code2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground text-sm">{activePreset.title}</h3>
              <Badge variant="secondary" className="text-[10px]">
                {activePreset.difficulty}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{activePreset.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
            Lab Presets:
          </span>
          <select
            value={currentPresetId}
            onChange={(e) => handleSelectPreset(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
          >
            {PLAYGROUND_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.title} ({preset.category})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Workspace Layout (Sandpack Editor & Preview) */}
      <div className="w-full max-w-full overflow-hidden">
        <PlaygroundEditor
          files={files}
          activeFileId={files[0]?.id}
          onCodeChange={handleCodeChange}
        />
      </div>

      {/* Architectural Hints & Learning Tips */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2 text-xs w-full max-w-full overflow-hidden">
        <div className="flex items-center gap-2 font-semibold text-amber-400">
          <Lightbulb className="h-4 w-4" /> Lab Hints & Key Concepts
        </div>
        <ul className="list-disc pl-5 space-y-1 text-amber-200/90 leading-relaxed">
          {activePreset.hints.map((hint, idx) => (
            <li key={idx}>{hint}</li>
          ))}
        </ul>
      </div>

      {/* Compare Solution Modal */}
      <PlaygroundSolutionModal
        open={solutionOpen}
        onOpenChange={setSolutionOpen}
        preset={activePreset}
        userFiles={files}
        onApplySolution={handleApplySolution}
      />

      {/* AI Code Reviewer Modal */}
      <PlaygroundCodeReviewerModal
        open={codeReviewOpen}
        onOpenChange={setCodeReviewOpen}
        files={files}
        activeFile={activeFile}
        onApplyRefactoredCode={(newCode) => {
          if (activeFile) {
            handleCodeChange(activeFile.name, newCode);
          }
        }}
      />
    </div>
  );
}
