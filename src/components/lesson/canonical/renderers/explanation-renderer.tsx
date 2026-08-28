import type { ExplanationActivity } from "@/lib/curriculum/types";
import type { ActivityRendererProps } from "../types";
import { ActivityContainer } from "../primitives/activity-container";
import { MovementScene, MovementEyebrow } from "../primitives/movement-scene";
import { Callout } from "@/components/shared/callout";
import { Sparkles } from "lucide-react";

/**
 * A parsed unit of an explanation. Authors write plain text, but many
 * explanations are implicitly structured — an enumerated set of concepts,
 * often with an inline `Example:` line. We surface that structure visually
 * instead of rendering an undifferentiated wall of prose. Anything without
 * detectable structure falls back to calm, well-set prose.
 */
type ExplanationBlock =
  | { kind: "concept"; index: string; title: string; body: string[]; example?: string }
  | { kind: "prose"; text: string };

function parseExplanation(text: string): ExplanationBlock[] {
  return text
    .split("\n\n")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((para): ExplanationBlock => {
      const lines = para
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const first = lines[0] ?? "";
      const numbered = first.match(/^(\d+)\.\s+(.*)$/);

      if (numbered) {
        const rest = lines.slice(1);
        const exampleLine = rest.find((l) => /^example:/i.test(l));
        const body = rest.filter((l) => !/^example:/i.test(l));
        return {
          kind: "concept",
          index: numbered[1],
          title: numbered[2],
          body,
          example: exampleLine ? exampleLine.replace(/^example:\s*/i, "") : undefined,
        };
      }

      return { kind: "prose", text: para };
    });
}

export function ExplanationRenderer({ activity }: ActivityRendererProps<ExplanationActivity>) {
  const { title, text, callout, keyTakeaway } = activity.content;
  const blocks = parseExplanation(text);

  return (
    <ActivityContainer id={`activity-${activity.id}`} variant="immersive">
      <MovementScene className="mx-auto w-full max-w-3xl">
        <article className="flex flex-col gap-8 py-2 sm:py-6">
          <header className="space-y-4">
            <MovementEyebrow type={activity.type} />
            {title && (
              <h2 className="text-2xl font-bold leading-tight tracking-tight text-balance text-lesson-text-primary sm:text-3xl">
                {title}
              </h2>
            )}
          </header>

          <div className="flex flex-col gap-4">
            {blocks.map((block, idx) =>
              block.kind === "concept" ? (
                <section
                  key={idx}
                  className="rounded-2xl border border-lesson-border bg-lesson-surface/60 p-5 transition-colors duration-300 hover:border-[var(--m-accent-line)] sm:p-6 animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-both duration-500"
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-bold"
                      style={{
                        backgroundColor: "var(--m-accent-soft)",
                        color: "var(--m-accent)",
                      }}
                    >
                      {block.index}
                    </span>
                    <h3 className="text-base font-semibold leading-snug text-lesson-text-primary sm:text-lg">
                      {block.title}
                    </h3>
                  </div>

                  {block.body.length > 0 && (
                    <div className="mt-3 space-y-2 pl-11">
                      {block.body.map((line, j) => (
                        <p
                          key={j}
                          className="text-[15px] leading-relaxed text-lesson-text-secondary"
                        >
                          {line}
                        </p>
                      ))}
                    </div>
                  )}

                  {block.example && (
                    <div className="mt-4 pl-11">
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-lesson-text-muted">
                        Example
                      </p>
                      <pre className="overflow-x-auto rounded-lg border border-lesson-border bg-lesson-bg/70 px-3.5 py-2.5">
                        <code className="font-mono text-[13px] leading-relaxed text-lesson-text-primary">
                          {block.example}
                        </code>
                      </pre>
                    </div>
                  )}
                </section>
              ) : (
                <p
                  key={idx}
                  className="text-base leading-8 text-lesson-text-secondary sm:text-[17px]"
                >
                  {block.text}
                </p>
              ),
            )}
          </div>

          {callout && (
            <div>
              <Callout variant={callout.variant}>{callout.text}</Callout>
            </div>
          )}

          {keyTakeaway && (
            <aside
              className="relative overflow-hidden rounded-2xl border border-lesson-border bg-lesson-surface/70 p-5 sm:p-6"
              style={{ boxShadow: "0 8px 30px -18px var(--m-glow)" }}
            >
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-px"
                style={{ background: "var(--m-accent-line)" }}
              />
              <div className="flex items-start gap-3">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: "var(--m-accent-soft)", color: "var(--m-accent)" }}
                >
                  <Sparkles className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-lesson-text-muted">
                    The insight to carry forward
                  </p>
                  <p className="mt-1.5 text-[15px] font-medium leading-relaxed text-lesson-text-primary">
                    {keyTakeaway}
                  </p>
                </div>
              </div>
            </aside>
          )}
        </article>
      </MovementScene>
    </ActivityContainer>
  );
}
