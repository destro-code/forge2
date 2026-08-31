import { useEffect, useMemo, useState } from "react";
import type { OrderingActivity } from "@/lib/curriculum/types";
import type { ActivityRendererProps } from "../types";
import { ActivityContainer } from "../primitives/activity-container";
import { ActivityHeader } from "../primitives/activity-header";
import { ActivityFeedback } from "../primitives/activity-feedback";
import { ActivityActions } from "../primitives/activity-actions";
import { Button } from "@/components/ui/button";
import { ListOrdered, ChevronUp, ChevronDown, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function OrderingRenderer({
  activity,
  state,
  onResponse,
  onSubmit,
  onRetry,
  onContinue,
  onRevealHint,
  readOnly,
}: ActivityRendererProps<OrderingActivity, string[]>) {
  const { prompt, items, explanation } = activity.content;

  // Initialize or maintain current order
  const currentItemIds: string[] = useMemo(() => {
    if (Array.isArray(state.response) && state.response.length === items.length) {
      return state.response;
    }
    const initial = [...items].sort((a, b) => (a.initialOrder || 0) - (b.initialOrder || 0));
    return initial.map((i) => i.id);
  }, [state.response, items]);

  // Sync initial response if not set
  useEffect(() => {
    if (!state.response || state.response.length !== items.length) {
      onResponse(currentItemIds);
    }
  }, [currentItemIds, state.response, onResponse, items.length]);

  const isSubmitted =
    state.status === "submitted" || state.status === "correct" || state.status === "incorrect";
  const isCorrect = state.status === "correct" || state.status === "completed";
  const isIncorrect = state.status === "incorrect";

  const hintsRemaining = (activity.feedback?.hints?.length || 0) - state.hintsRevealed;

  // Local drag state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const moveItem = (index: number, direction: "up" | "down") => {
    if (readOnly || (isSubmitted && isCorrect)) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentItemIds.length) return;

    const next = [...currentItemIds];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    onResponse(next);
  };

  const itemMap = useMemo(() => {
    return new Map(items.map((item) => [item.id, item]));
  }, [items]);

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (readOnly || (isSubmitted && isCorrect)) {
      e.preventDefault();
      return;
    }
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const next = [...currentItemIds];
    const draggedId = next[draggedIndex];
    next.splice(draggedIndex, 1);
    next.splice(index, 0, draggedId);
    setDraggedIndex(index);
    onResponse(next);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <ActivityContainer id={`activity-${activity.id}`} variant="standard">
      <ActivityHeader
        activity={activity}
        onRevealHint={onRevealHint}
        hintsRemaining={hintsRemaining}
      />

      <div className="p-6 md:p-10 flex flex-col gap-8">
        {/* Prompt Header */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-primary/80 font-mono">
            Sequence Sorting
          </span>
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-foreground leading-snug">
            {prompt}
          </h2>
          <p className="text-xs text-muted-foreground">
            Drag items into the correct order, or use the focus-accessible buttons to shift items up
            and down.
          </p>
        </div>

        {/* Ordered Item List with Layout Animations */}
        <div className="grid gap-3" role="list" aria-label={prompt}>
          <AnimatePresence initial={false}>
            {currentItemIds.map((id, index) => {
              const item = itemMap.get(id);
              if (!item) return null;

              const isDragging = draggedIndex === index;

              // Style matching submission state
              let cardStyle = "border-lesson-border bg-muted/10 text-foreground hover:bg-muted/15";
              if (isDragging) {
                cardStyle =
                  "border-primary bg-primary/5 ring-1 ring-primary shadow-md opacity-75 scale-[1.01]";
              } else if (isSubmitted) {
                if (isCorrect) {
                  cardStyle = "border-emerald-500 bg-emerald-500/5 text-foreground";
                } else if (isIncorrect) {
                  cardStyle = "border-rose-500 bg-rose-500/5 text-foreground";
                }
              }

              return (
                <motion.div
                  key={item.id}
                  layout
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  role="listitem"
                  draggable={!readOnly && (!isSubmitted || isIncorrect)}
                  onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, index)}
                  onDragOver={(e) => handleDragOver(e as React.DragEvent, index)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "flex items-center justify-between gap-4 p-4 rounded-2xl border text-left transition-all relative overflow-hidden group select-none shadow-xs min-h-[56px] focus-within:ring-2 focus-within:ring-primary",
                    cardStyle,
                    !readOnly &&
                      (!isSubmitted || isIncorrect) &&
                      "cursor-grab active:cursor-grabbing",
                  )}
                >
                  <div className="flex items-center gap-4 flex-1">
                    {/* Position and Drag Handle */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center font-mono">
                        {index + 1}
                      </div>
                      {!readOnly && (!isSubmitted || isIncorrect) && (
                        <GripVertical className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors hidden sm:block shrink-0 cursor-grab" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 font-mono text-sm md:text-base text-foreground/90 leading-relaxed">
                      {item.text}
                    </div>
                  </div>

                  {/* Accessible fallback buttons */}
                  {!readOnly && (!isSubmitted || isIncorrect) && (
                    <div className="flex items-center gap-1 shrink-0 bg-muted/20 p-1 rounded-xl border border-lesson-border opacity-60 group-hover:opacity-100 transition-opacity">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={index === 0}
                        onClick={() => moveItem(index, "up")}
                        aria-label={`Move ${item.text} up to position ${index}`}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={index === currentItemIds.length - 1}
                        onClick={() => moveItem(index, "down")}
                        aria-label={`Move ${item.text} down to position ${index + 2}`}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Feedback Section */}
        <ActivityFeedback
          status={state.status}
          validationResult={state.validationResult}
          hints={activity.feedback?.hints}
          hintsRevealed={state.hintsRevealed}
          explanation={explanation}
        />
      </div>

      <ActivityActions
        status={state.status}
        onSubmit={onSubmit}
        onRetry={onRetry}
        onContinue={onContinue}
        canSubmit={currentItemIds.length === items.length}
      />
    </ActivityContainer>
  );
}
