import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ActivityType } from "@/lib/curriculum/types";
import { movementForActivityType } from "../lesson-movements";

/**
 * MovementScene
 *
 * The single shared "chapter frame" every canonical activity renders inside.
 * It gives each screen one consistent entrance — a calm rise + fade, keyed off
 * the shell's per-activity remount — so advancing feels like turning to the
 * next movement of one journey rather than swapping unrelated cards.
 *
 * The lesson shell publishes the active movement's `--m-*` custom properties on
 * the player root, so anything inside a scene can reach for `var(--m-accent)`,
 * `var(--m-accent-soft)`, `var(--m-accent-line)` and `var(--m-glow)` directly.
 */
export function MovementScene({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "animate-in fade-in-0 slide-in-from-bottom-3 duration-500 ease-out",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * MovementEyebrow
 *
 * A compact identity line — the movement's icon, name and one-line intent —
 * that ties a scene back to the rail above it. Deliberately quiet: it names
 * *where in the journey* the learner is without a literal "step N of M".
 */
export function MovementEyebrow({
  type,
  className,
  delayMs,
}: {
  type: ActivityType;
  className?: string;
  delayMs?: number;
}) {
  const movement = movementForActivityType(type);
  const Icon = movement.icon;
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2.5",
        delayMs ? "animate-in fade-in-0 duration-500 fill-mode-both" : "",
        className,
      )}
      style={delayMs ? { animationDelay: `${delayMs}ms` } : undefined}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--m-accent-soft)] text-[var(--m-accent)] ring-1 ring-[var(--m-accent-line)]">
        <Icon className="h-4 w-4" strokeWidth={2.25} />
      </span>
      <span className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--m-accent)]">
          {movement.label}
        </span>
        <span className="text-xs font-medium text-lesson-text-muted">{movement.tagline}</span>
      </span>
    </div>
  );
}
