import type { IntroActivity } from "@/lib/curriculum/types";
import type { ActivityRendererProps } from "../types";
import { ActivityContainer } from "../primitives/activity-container";
import { MovementScene, MovementEyebrow } from "../primitives/movement-scene";
import { ArrowUpRight } from "lucide-react";

/**
 * IntroRenderer — the trailhead of the journey (Orient).
 *
 * Establishes context and creates curiosity: a large movement identity, the
 * hook as an emotional lead, an optional "scene" brief, and goals framed as
 * forward-looking outcomes the learner is about to earn. Goals use accent
 * glyph markers rather than numbers — they are parallel outcomes, not a
 * sequence.
 */
export function IntroRenderer({ activity }: ActivityRendererProps<IntroActivity>) {
  const { title, hook, context, goals } = activity.content;

  const contextBlocks = context
    ? context
        .split("\n\n")
        .map((b) => b.trim())
        .filter(Boolean)
    : [];

  return (
    <ActivityContainer id={`activity-${activity.id}`} variant="immersive">
      <MovementScene className="mx-auto w-full max-w-3xl">
        <div className="flex flex-col gap-9 py-2 sm:py-6">
          {/* Opening identity */}
          <MovementEyebrow type={activity.type} />

          {/* Title + hook */}
          <div className="space-y-5">
            <h1 className="text-3xl font-bold leading-[1.08] tracking-tight text-balance text-lesson-text-primary sm:text-4xl lg:text-[2.75rem]">
              {title}
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-pretty text-lesson-text-secondary">
              {hook}
            </p>
          </div>

          {/* The scene — orienting context */}
          {contextBlocks.length > 0 && (
            <section
              aria-label="Lesson context"
              className="rounded-2xl border border-lesson-border bg-lesson-surface/60 p-5 sm:p-6"
            >
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-lesson-text-muted">
                Set the scene
              </p>
              <div className="space-y-4">
                {contextBlocks.map((block, i) => {
                  const lines = block.split("\n").map((l) => l.trim());
                  const bullets = lines.filter((l) => l.startsWith("•"));
                  // A block written as bullet points renders as a spatial list;
                  // anything else stays as calm prose.
                  if (bullets.length > 0 && bullets.length === lines.filter(Boolean).length) {
                    return (
                      <ul key={i} className="space-y-2.5">
                        {bullets.map((b, j) => (
                          <li key={j} className="flex items-start gap-3">
                            <span
                              aria-hidden
                              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{ backgroundColor: "var(--m-accent)" }}
                            />
                            <span className="text-[15px] leading-relaxed text-lesson-text-secondary">
                              {b.replace(/^•\s*/, "")}
                            </span>
                          </li>
                        ))}
                      </ul>
                    );
                  }
                  return (
                    <p key={i} className="text-[15px] leading-relaxed text-lesson-text-secondary">
                      {block}
                    </p>
                  );
                })}
              </div>
            </section>
          )}

          {/* Forward-looking outcomes — anticipation, not a checklist */}
          {goals && goals.length > 0 && (
            <div>
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-lesson-text-muted">
                By the end, you&apos;ll be able to
              </p>
              <ul className="space-y-2.5">
                {goals.map((goal, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-both duration-500"
                    style={{ animationDelay: `${150 + idx * 90}ms` }}
                  >
                    <span
                      aria-hidden
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                      style={{
                        backgroundColor: "var(--m-accent-soft)",
                        color: "var(--m-accent)",
                      }}
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </span>
                    <span className="text-[15px] leading-relaxed text-lesson-text-primary">
                      {goal}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </MovementScene>
    </ActivityContainer>
  );
}
