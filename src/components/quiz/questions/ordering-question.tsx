import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrderingQuestion } from "@/lib/types";

interface OrderingQuestionProps {
  question: OrderingQuestion;
  currentOrder: string[] | undefined;
  onOrderChange: (order: string[]) => void;
  isReadOnly?: boolean;
}

export function OrderingQuestionCard({
  question,
  currentOrder,
  onOrderChange,
  isReadOnly = false,
}: OrderingQuestionProps) {
  const [items, setItems] = useState<string[]>(
    currentOrder && currentOrder.length === question.items.length ? currentOrder : question.items,
  );

  useEffect(() => {
    if (currentOrder && currentOrder.length === question.items.length) {
      setItems(currentOrder);
    } else {
      setItems(question.items);
    }
  }, [currentOrder, question.items]);

  const moveItem = (index: number, direction: "up" | "down") => {
    if (isReadOnly) return;
    const newItems = [...items];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    setItems(newItems);
    onOrderChange(newItems);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Ordering / Sequence
          </span>
        </div>
        <h3 className="text-base font-semibold text-foreground leading-snug">
          {question.question}
        </h3>
        <p className="text-xs text-muted-foreground">
          Arrange the steps in the correct chronological order from top (1st) to bottom.
        </p>
      </div>

      <div className="space-y-2">
        {items.map((item, idx) => (
          <div
            key={item + idx}
            className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/60 p-3 text-sm text-foreground transition hover:border-primary/40"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted font-mono text-xs font-bold text-primary">
              {idx + 1}
            </span>

            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />

            <span className="flex-1 min-w-0 font-medium leading-normal">{item}</span>

            {!isReadOnly && (
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  disabled={idx === 0}
                  onClick={() => moveItem(idx, "up")}
                  title="Move Up"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  disabled={idx === items.length - 1}
                  onClick={() => moveItem(idx, "down")}
                  title="Move Down"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
