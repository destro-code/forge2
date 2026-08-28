import type { VisualActivity } from "@/lib/curriculum/types";
import type { ActivityRendererProps } from "../types";
import { ActivityContainer } from "../primitives/activity-container";
import { ActivityHeader } from "../primitives/activity-header";
import { ActivityActions } from "../primitives/activity-actions";
import { getInteractiveVisual } from "./visuals";
import { Layers, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function VisualRenderer({
  activity,
  state,
  onContinue,
}: ActivityRendererProps<VisualActivity>) {
  const { title, visualType, description, visualData, interactive } = activity.content;

  const Interactive = getInteractiveVisual(interactive?.kind);

  const layers =
    (visualData?.layers as Array<{ name: string; role: string; analogy?: string }>) || null;

  const isFlowChart = visualType === "flowchart" || (!!description && description.includes("->"));
  const flowSteps = isFlowChart && description ? description.split("->").map((s) => s.trim()) : [];

  return (
    <ActivityContainer id={`activity-${activity.id}`} variant="wide">
      <ActivityHeader activity={activity} />

      <div className="flex flex-col gap-6 p-5 sm:p-7 md:p-9">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold leading-snug tracking-tight text-lesson-text-primary text-balance md:text-2xl">
            {title}
          </h2>
          {description && !isFlowChart && (
            <p className="max-w-2xl text-[15px] leading-relaxed text-lesson-text-secondary">
              {description}
            </p>
          )}
        </div>

        {/* Interactive model takes priority — a manipulable concept beats a figure. */}
        {Interactive ? (
          <figure className="m-0 space-y-3">
            <Interactive config={interactive?.config} />
            {interactive?.caption && (
              <figcaption className="flex items-start gap-1.5 text-xs leading-relaxed text-lesson-text-muted">
                <Sparkles
                  className="mt-0.5 h-3.5 w-3.5 shrink-0"
                  style={{ color: "var(--m-accent)" }}
                />
                <span>{interactive.caption}</span>
              </figcaption>
            )}
          </figure>
        ) : layers && layers.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {layers.map((layer, idx) => (
              <div
                key={idx}
                className="flex min-h-[168px] flex-col rounded-xl border border-lesson-border bg-lesson-bg/40 p-5 transition-colors hover:border-[var(--m-accent)]/40"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="rounded-md border border-lesson-border bg-lesson-surface-subtle px-2 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-lesson-text-secondary">
                    {layer.name}
                  </span>
                  <span className="font-mono text-[11px] text-lesson-text-muted">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                </div>
                <p className="flex-1 text-[15px] font-medium leading-snug text-lesson-text-primary">
                  {layer.role}
                </p>
                {layer.analogy && (
                  <p className="mt-4 flex items-start gap-1.5 border-t border-lesson-border pt-3 text-xs italic leading-relaxed text-lesson-text-muted">
                    <Layers className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{layer.analogy}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : isFlowChart && flowSteps.length > 0 ? (
          <ol className="flex flex-col gap-2 md:flex-row md:items-stretch">
            {flowSteps.map((step, idx) => {
              const isLast = idx === flowSteps.length - 1;
              return (
                <li key={idx} className="flex flex-col gap-2 md:flex-1 md:flex-row md:items-center">
                  <div className="flex min-h-[76px] flex-1 items-start gap-3 rounded-xl border border-lesson-border bg-lesson-bg/40 p-4">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold"
                      style={{ backgroundColor: "var(--m-soft)", color: "var(--m-accent)" }}
                    >
                      {idx + 1}
                    </span>
                    <span className="pt-0.5 text-sm font-medium leading-relaxed text-lesson-text-primary">
                      {step}
                    </span>
                  </div>
                  {!isLast && (
                    <ArrowRight className="mx-auto h-4 w-4 shrink-0 rotate-90 text-lesson-text-muted md:rotate-0" />
                  )}
                </li>
              );
            })}
          </ol>
        ) : (
          <div
            className={cn(
              "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-lesson-border p-10 text-center",
            )}
          >
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{ backgroundColor: "var(--m-soft)", color: "var(--m-accent)" }}
            >
              <Layers className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-lesson-text-primary">{title}</p>
          </div>
        )}
      </div>

      <ActivityActions
        status={state.status}
        isInteractive={false}
        onContinue={onContinue}
        continueLabel="Continue"
      />
    </ActivityContainer>
  );
}
