import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { VisualExperience } from "@/lib/lesson-experience/types";

interface VisualRendererProps {
  experience: VisualExperience;
  interactedTargetIds: string[];
  onInteract: (targetId: string) => void;
}

export function VisualRenderer({
  experience,
  interactedTargetIds,
  onInteract,
}: VisualRendererProps) {
  const { heading, description, frames } = experience.content;
  const [activeId, setActiveId] = useState(frames[0]?.id ?? "");
  const activeFrame = frames.find((frame) => frame.id === activeId) ?? frames[0];
  const firstFrameId = frames[0]?.id;

  // The first frame is visible immediately without a click, so it must be
  // marked interacted on mount — otherwise an "interact-all" completion rule
  // can never be satisfied because the user never explicitly selects it.
  useEffect(() => {
    if (firstFrameId) {
      onInteract(firstFrameId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstFrameId]);

  function selectFrame(id: string) {
    setActiveId(id);
    onInteract(id);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="font-serif text-2xl font-semibold text-lesson-text-primary text-balance">
          {heading}
        </h2>
        <p className="text-sm leading-relaxed text-lesson-text-secondary">{description}</p>
      </div>

      <div className="flex gap-2" role="tablist" aria-label="Steps">
        {frames.map((frame, index) => {
          const isActive = frame.id === activeFrame?.id;
          const isSeen = interactedTargetIds.includes(frame.id);
          return (
            <button
              key={frame.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => selectFrame(frame.id)}
              className={cn(
                "flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md border font-mono text-xs font-medium transition-colors",
                isActive
                  ? "border-lesson-accent bg-lesson-accent/15 text-lesson-accent"
                  : "border-lesson-border bg-lesson-surface text-lesson-text-muted hover:text-lesson-text-secondary",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  isSeen ? "bg-lesson-accent" : "bg-lesson-text-muted/40",
                )}
              />
              {frame.label ?? `Step ${index + 1}`}
            </button>
          );
        })}
      </div>

      {activeFrame ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-lesson-border bg-lesson-surface-elevated p-4">
            <pre className="overflow-x-auto font-mono text-sm text-lesson-text-primary">
              <code>{activeFrame.code}</code>
            </pre>
          </div>
          <div className="flex flex-col gap-3 rounded-lg border border-lesson-border bg-lesson-surface-subtle p-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-lesson-text-muted">
                mood
              </span>
              <span className="rounded border border-lesson-border bg-lesson-surface px-2 py-1 font-mono text-sm text-lesson-text-primary">
                {activeFrame.memoryValue}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-lesson-text-secondary">
              {activeFrame.description}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
