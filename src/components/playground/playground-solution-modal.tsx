import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Copy, Sparkles, Lightbulb, ArrowRight, Code2, CheckCircle2 } from "lucide-react";
import type { PlaygroundFile, PlaygroundPreset } from "@/lib/types/playground";

interface PlaygroundSolutionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preset: PlaygroundPreset;
  userFiles: PlaygroundFile[];
  onApplySolution: (solutionFiles: PlaygroundFile[]) => void;
}

export function PlaygroundSolutionModal({
  open,
  onOpenChange,
  preset,
  userFiles,
  onApplySolution,
}: PlaygroundSolutionModalProps) {
  const [copied, setCopied] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState(
    preset.solutionFiles[0]?.name || "App.tsx",
  );

  const userFile = userFiles.find((f) => f.name === selectedFileName) || userFiles[0];
  const solutionFile =
    preset.solutionFiles.find((f) => f.name === selectedFileName) || preset.solutionFiles[0];

  const handleCopy = () => {
    if (!solutionFile) return;
    navigator.clipboard.writeText(solutionFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    onApplySolution(preset.solutionFiles);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6 border-border/60 shadow-elegant">
        <DialogHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Reference Solution
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {preset.difficulty}
            </Badge>
          </div>
          <DialogTitle className="text-xl font-bold mt-1">
            Solution & Diff Analysis · {preset.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Compare your current implementation against the production reference code pattern.
          </DialogDescription>
        </DialogHeader>

        {/* Hints & Key takeaways */}
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs space-y-1 text-amber-300">
          <div className="flex items-center gap-1.5 font-semibold text-amber-400">
            <Lightbulb className="h-4 w-4" /> Architectural Hints & Key Concepts
          </div>
          <ul className="list-disc pl-5 space-y-1 text-amber-200/90">
            {preset.hints.map((hint, idx) => (
              <li key={idx}>{hint}</li>
            ))}
          </ul>
        </div>

        {/* File selector tab bar */}
        <div className="flex items-center gap-2 pt-2 border-b border-border/40 pb-2">
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <Code2 className="h-3.5 w-3.5" /> File:
          </span>
          {preset.solutionFiles.map((file) => (
            <Button
              key={file.name}
              variant={selectedFileName === file.name ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setSelectedFileName(file.name)}
            >
              {file.name}
            </Button>
          ))}
        </div>

        {/* Side-by-Side Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-hidden min-h-[300px]">
          {/* User Code */}
          <div className="flex flex-col rounded-lg border border-border/60 bg-card/60 overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/40 px-3 py-1.5 bg-muted/30 text-xs font-semibold text-muted-foreground">
              <span>Your Code ({userFile?.name})</span>
            </div>
            <pre className="flex-1 overflow-auto p-3 font-mono text-xs text-foreground bg-background/50 leading-relaxed scrollbar-thin">
              {userFile?.code || "// File not found"}
            </pre>
          </div>

          {/* Solution Code */}
          <div className="flex flex-col rounded-lg border border-emerald-500/40 bg-card/60 overflow-hidden">
            <div className="flex items-center justify-between border-b border-emerald-500/30 px-3 py-1.5 bg-emerald-500/10 text-xs font-semibold text-emerald-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Reference Solution ({solutionFile?.name})
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] gap-1 text-emerald-300 hover:text-emerald-100"
                onClick={handleCopy}
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied" : "Copy Code"}
              </Button>
            </div>
            <pre className="flex-1 overflow-auto p-3 font-mono text-xs text-emerald-200 bg-background/80 leading-relaxed scrollbar-thin">
              {solutionFile?.code || "// Solution not available"}
            </pre>
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-border/40 flex items-center justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>

          <Button onClick={handleApply} className="gap-1.5 shadow-glow">
            Apply Reference Solution <ArrowRight className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
