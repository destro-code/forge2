import { useState, useEffect } from "react";
import { ArrowRight, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DragDropQuestion } from "@/lib/types";

interface DragDropQuestionProps {
  question: DragDropQuestion;
  currentMatches: Record<string, string> | undefined; // leftId -> rightText
  onMatchChange: (matches: Record<string, string>) => void;
  isReadOnly?: boolean;
}

export function DragDropQuestionCard({
  question,
  currentMatches = {},
  onMatchChange,
  isReadOnly = false,
}: DragDropQuestionProps) {
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>(currentMatches);

  // Shuffle right options initially so they aren't pre-matched
  const [availableRights, setAvailableRights] = useState<string[]>([]);

  useEffect(() => {
    const rights = question.pairs.map((p) => p.right);
    // Sort pseudo-deterministically or keep consistent
    setAvailableRights([...rights].sort(() => 0.5 - Math.random()));
  }, [question]);

  useEffect(() => {
    setMatches(currentMatches);
  }, [currentMatches]);

  const handleLeftClick = (id: string) => {
    if (isReadOnly) return;
    setSelectedLeftId(selectedLeftId === id ? null : id);
  };

  const handleRightClick = (rightText: string) => {
    if (isReadOnly || !selectedLeftId) return;
    const newMatches = { ...matches, [selectedLeftId]: rightText };
    setMatches(newMatches);
    onMatchChange(newMatches);
    setSelectedLeftId(null);
  };

  const handleClearMatch = (leftId: string) => {
    if (isReadOnly) return;
    const newMatches = { ...matches };
    delete newMatches[leftId];
    setMatches(newMatches);
    onMatchChange(newMatches);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
            Matching / Drag & Drop
          </span>
        </div>
        <h3 className="text-base font-semibold text-foreground leading-snug">
          {question.question}
        </h3>
        <p className="text-xs text-muted-foreground">
          Click an item on the left, then click its corresponding match on the right.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column (Items) */}
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
            Concepts (Select first)
          </span>
          {question.pairs.map((pair) => {
            const isSelected = selectedLeftId === pair.id;
            const matchedRight = matches[pair.id];

            return (
              <div
                key={pair.id}
                onClick={() => handleLeftClick(pair.id)}
                className={`flex flex-col p-3 rounded-lg border text-sm transition cursor-pointer ${
                  isSelected
                    ? "border-purple-500 bg-purple-500/20 ring-1 ring-purple-500"
                    : matchedRight
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                      : "border-border/60 bg-card/60 text-foreground hover:border-border"
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span>{pair.left}</span>
                  {matchedRight && (
                    <Button
                      variant="ghost"
                      size="xs"
                      className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-rose-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearMatch(pair.id);
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
                {matchedRight ? (
                  <div className="mt-1 text-xs text-emerald-300 flex items-center gap-1 font-mono">
                    <ArrowRight className="h-3 w-3" /> {matchedRight}
                  </div>
                ) : (
                  <div className="mt-1 text-[11px] text-muted-foreground italic">
                    {isSelected ? "Now click match on right →" : "Click to select"}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Column (Matches) */}
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
            Definitions / Matches
          </span>
          {availableRights.map((rightText, idx) => {
            // Check if already assigned to any left
            const assignedLeftId = Object.keys(matches).find((k) => matches[k] === rightText);

            return (
              <div
                key={rightText + idx}
                onClick={() => handleRightClick(rightText)}
                className={`p-3 rounded-lg border text-xs transition ${
                  assignedLeftId
                    ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300/80 cursor-default"
                    : selectedLeftId
                      ? "border-purple-500/60 bg-purple-500/10 text-purple-200 cursor-pointer hover:bg-purple-500/20"
                      : "border-border/40 bg-muted/20 text-muted-foreground cursor-pointer"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="flex-1 leading-relaxed">{rightText}</span>
                  {assignedLeftId && <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
