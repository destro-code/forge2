import type { VisualActivity } from "@/lib/curriculum/types";
import type { ActivityRendererProps } from "../types";
import { ActivityContainer } from "../primitives/activity-container";
import { ActivityHeader } from "../primitives/activity-header";
import { ActivityActions } from "../primitives/activity-actions";
import { Eye, Layers, GitFork, Network, LayoutGrid } from "lucide-react";

export function VisualRenderer({
  activity,
  state,
  onContinue,
}: ActivityRendererProps<VisualActivity>) {
  const { title, visualType, description, visualData } = activity.content;

  // Type-safe rendering of comparison layers if present
  const layers =
    (visualData?.layers as Array<{
      name: string;
      role: string;
      analogy?: string;
    }>) || null;

  return (
    <ActivityContainer id={`activity-${activity.id}`}>
      <ActivityHeader activity={activity} />

      <div className="p-6 md:p-8 flex flex-col gap-6">
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            <span>{title}</span>
          </h2>
          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          )}
        </div>

        {/* Visual Content Display */}
        {layers ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {layers.map((layer, idx) => (
              <div
                key={idx}
                className="flex flex-col p-4 rounded-xl bg-muted/30 border border-border/80 shadow-xs relative overflow-hidden"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono font-bold text-sm text-primary">{layer.name}</span>
                  <Layers className="w-4 h-4 text-muted-foreground/60" />
                </div>
                <p className="text-sm font-semibold text-foreground mb-1">{layer.role}</p>
                {layer.analogy && (
                  <div className="mt-auto pt-3 border-t border-border/50 text-xs text-muted-foreground italic">
                    Analogy: {layer.analogy}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-xl bg-muted/20 border border-dashed border-border flex flex-col items-center justify-center text-center gap-3">
            <LayoutGrid className="w-10 h-10 text-primary/60" />
            <p className="text-sm font-medium text-foreground">{title}</p>
            {description && <p className="text-xs text-muted-foreground max-w-md">{description}</p>}
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
