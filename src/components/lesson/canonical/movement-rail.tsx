import { cn } from "@/lib/utils";
import { movementForActivityType, movementVars, type Movement } from "./lesson-movements";
import type { ActivityType } from "@/lib/curriculum/types";

export interface RailNode {
  id: string;
  type: ActivityType;
  title?: string;
}

export interface MovementRailProps {
  nodes: RailNode[];
  currentIndex: number;
  completedIds: string[];
  onSelect: (index: number) => void;
}

/**
 * The forge rail: a spatial map of the lesson's movements. Each segment is a
 * single activity, tinted by the movement it belongs to. The active segment
 * swells and glows in its movement hue; completed segments read as solid,
 * upcoming ones stay quiet. This is the learner's sense of *where they are*
 * inside the journey — no "Step 3 of 7" required.
 */
export function MovementRail({ nodes, currentIndex, completedIds, onSelect }: MovementRailProps) {
  return (
    <div
      className="flex items-stretch gap-1"
      role="tablist"
      aria-label="Lesson movements"
    >
      {nodes.map((node, index) => {
        const movement = movementForActivityType(node.type);
        const isCurrent = index === currentIndex;
        const isDone = completedIds.includes(node.id) && !isCurrent;
        const isPast = index < currentIndex;

        return (
          <button
            key={node.id}
            type="button"
            role="tab"
            aria-selected={isCurrent}
            aria-label={`${movement.label}${node.title ? `: ${node.title}` : ""}${
              isDone ? " (done)" : ""
            }`}
            onClick={() => onSelect(index)}
            style={movementVars(movement)}
            className={cn(
              "group relative min-h-7 rounded-full outline-none transition-[flex-grow] duration-300 focus-visible:ring-2 focus-visible:ring-[var(--m-accent)]",
              isCurrent ? "grow-[2.4]" : "grow",
            )}
          >
            <span
              className={cn(
                "block h-1.5 w-full rounded-full transition-all duration-300",
                isCurrent
                  ? "h-2 bg-[var(--m-accent)] shadow-[0_0_16px_var(--m-glow)]"
                  : isDone || isPast
                    ? "bg-[var(--m-accent-line)]"
                    : "bg-lesson-surface-subtle group-hover:bg-lesson-text-muted/25",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

/** The movement identity block: icon chip + label + tagline for the active movement. */
export function MovementBadge({
  movement,
  compact = false,
}: {
  movement: Movement;
  compact?: boolean;
}) {
  const Icon = movement.icon;
  return (
    <div className="flex items-center gap-3" style={movementVars(movement)}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--m-accent-soft)] text-[var(--m-accent)] ring-1 ring-[var(--m-accent-line)]">
        <Icon className="h-4.5 w-4.5" strokeWidth={2.25} />
      </span>
      <div className="min-w-0 leading-tight">
        <p className="text-[13px] font-semibold tracking-tight text-lesson-text-primary">
          {movement.label}
        </p>
        {!compact && (
          <p className="truncate text-[11px] font-medium text-lesson-text-muted">
            {movement.tagline}
          </p>
        )}
      </div>
    </div>
  );
}
