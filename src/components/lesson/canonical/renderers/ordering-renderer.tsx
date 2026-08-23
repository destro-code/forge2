import { useEffect, useMemo } from "react";
import type { OrderingActivity } from "@/lib/curriculum/types";
import type { ActivityRendererProps } from "../types";
import { ActivityContainer } from "../primitives/activity-container";
import { ActivityHeader } from "../primitives/activity-header";
import { ActivityFeedback } from "../primitives/activity-feedback";
import { ActivityActions } from "../primitives/activity-actions";
import { Button } from "@/components/ui/button";
import { ListOrdered, ChevronUp, ChevronDown, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

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
    // Default initial order from items (or sorted by initialOrder)
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

  const hintsRemaining = (activity.hints?.length || 0) - state.hintsRevealed;

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

  return (
    <ActivityContainer id={`activity-${activity.id}`}>
      <ActivityHeader
        activity={activity}
        onRevealHint={onRevealHint}
        hintsRemaining={hintsRemaining}
      />

      <div className="p-6 md:p-8 flex flex-col gap-6">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <ListOrdered className="w-5 h-5 text-primary" />
            <span>{prompt}</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Use the up/down controls to arrange the items into the correct sequence from top to
            bottom.
          </p>
        </div>

        {/* Ordered Item List */}
        <div className="grid gap-2.5" role="list" aria-label={prompt}>
          {currentItemIds.map((id, index) => {
            const item = itemMap.get(id);
            if (!item) return null;

            return (
              <div
                key={item.id}
                role="listitem"
                className={cn(
                  "flex items-center gap-3 p-3.5 rounded-xl border bg-card text-foreground transition-all",
                  isCorrect && "border-emerald-500 bg-emerald-500/5",
                  isIncorrect && "border-rose-500 bg-rose-500/5",
                  !isSubmitted && "border-border/80 hover:border-border shadow-xs",
                )}
              >
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center font-mono">
                    {index + 1}
                  </div>
                  <GripVertical className="w-4 h-4 text-muted-foreground/40 hidden sm:block" />
                </div>

                <div className="flex-1 font-mono text-sm text-foreground/90 leading-relaxed select-none">
                  {item.text}
                </div>

                {/* Accessible Reorder Controls */}
                {!readOnly && (!isSubmitted || isIncorrect) && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={index === 0}
                      onClick={() => moveItem(index, "up")}
                      aria-label={`Move ${item.text} up to position ${index}`}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
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
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Feedback Section */}
        <ActivityFeedback
          status={state.status}
          validationResult={state.validationResult}
          hints={activity.hints}
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
