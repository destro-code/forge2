import type { CompletionActivity } from "@/lib/curriculum/types";
import type { ActivityRendererProps } from "../types";
import { ActivityContainer } from "../primitives/activity-container";
import { MovementScene } from "../primitives/movement-scene";
import { movementForActivityType } from "../lesson-movements";
import { Check } from "lucide-react";

/**
 * CompletionRenderer — the earned milestone (Temper).
 *
 * Deliberately restrained: no confetti, no neon, no cartoon gamification. A
 * single forged medallion in the movement's warm accent, a soft glow, and a
 * calm settle-in animation communicate "you set this skill" without spectacle.
 */
export function CompletionRenderer({ activity }: ActivityRendererProps<CompletionActivity>) {
  const { title, message, badgeId, congratulations } = activity.content;
  const movement = movementForActivityType(activity.type);
  const Icon = movement.icon;

  return (
    <ActivityContainer id={`activity-${activity.id}`} variant="immersive">
      <MovementScene className="mx-auto w-full max-w-2xl">
        <div className="flex flex-col items-center py-10 text-center sm:py-14">
          {/* Forged medallion */}
          <div
            className="relative flex h-24 w-24 items-center justify-center animate-in fade-in-0 zoom-in-95 fill-mode-both duration-700"
            style={{ animationDelay: "80ms" }}
          >
            <span
              aria-hidden
              className="absolute inset-0 rounded-full blur-2xl"
              style={{ background: "var(--m-glow)" }}
            />
            <span
              aria-hidden
              className="absolute inset-0 rounded-full"
              style={{ backgroundColor: "var(--m-accent-soft)" }}
            />
            <span
              className="relative flex h-16 w-16 items-center justify-center rounded-full ring-1"
              style={{
                backgroundColor: "var(--m-accent)",
                color: "var(--lesson-bg)",
                boxShadow: "0 10px 30px -8px var(--m-glow)",
              }}
            >
              <Icon className="h-7 w-7" strokeWidth={2.25} />
            </span>
            {/* Small confirmation mark */}
            <span
              className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-lesson-bg"
              style={{ backgroundColor: "var(--m-accent)", color: "var(--lesson-bg)" }}
            >
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
          </div>

          <p
            className="mt-7 text-[11px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: "var(--m-accent)" }}
          >
            {movement.tagline}
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance text-lesson-text-primary sm:text-4xl">
            {title || "Skill set"}
          </h2>

          {message && (
            <p className="mt-4 max-w-xl text-base leading-relaxed text-pretty text-lesson-text-secondary sm:text-lg">
              {message}
            </p>
          )}
          {congratulations && (
            <p className="mt-3 max-w-xl text-sm font-medium leading-relaxed text-lesson-text-secondary">
              {congratulations}
            </p>
          )}

          {badgeId && (
            <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-lesson-border bg-lesson-surface/70 py-2 pl-2 pr-4">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full"
                style={{ backgroundColor: "var(--m-accent-soft)", color: "var(--m-accent)" }}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
              </span>
              <span className="text-left">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-lesson-text-muted">
                  Mark earned
                </span>
                <span className="block text-sm font-semibold text-lesson-text-primary">
                  {badgeId}
                </span>
              </span>
            </div>
          )}
        </div>
      </MovementScene>
    </ActivityContainer>
  );
}
