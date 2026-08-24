import type { VisualActivity } from "@/lib/curriculum/types";
import type { ActivityRendererProps } from "../types";
import { ActivityContainer } from "../primitives/activity-container";
import { ActivityHeader } from "../primitives/activity-header";
import { ActivityActions } from "../primitives/activity-actions";
import { Eye, Layers, ChevronRight, Activity, Cpu, Network, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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

  // Check if description implies a sequential pipeline or flow
  const isFlowChart = visualType === "flowchart" || (description && description.includes("->"));
  const flowSteps = isFlowChart && description ? description.split("->").map((s) => s.trim()) : [];

  return (
    <ActivityContainer id={`activity-${activity.id}`} variant="standard">
      <ActivityHeader activity={activity} />

      <div className="p-6 md:p-10 flex flex-col gap-8">
        {/* Header Introduction */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary/80 font-mono flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 animate-pulse text-primary" />
              <span>System Concept Architecture</span>
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-foreground leading-snug flex items-center gap-2.5">
            <Eye className="w-5.5 h-5.5 text-primary shrink-0" />
            <span>{title}</span>
          </h2>
          {description && !isFlowChart && (
            <p className="text-base text-muted-foreground leading-relaxed max-w-3xl">
              {description}
            </p>
          )}
        </div>

        {/* Dynamic Concept Visualizer Panels */}
        {layers && layers.length > 0 ? (
          <div className="relative">
            {/* Soft linking background timeline divider */}
            <div className="absolute top-1/2 left-4 right-4 h-0.5 border-t border-dashed border-primary/20 -translate-y-1/2 hidden md:block select-none" />

            <div className="grid gap-5 md:grid-cols-3 relative z-10">
              {layers.map((layer, idx) => {
                // Style cards with gentle sequential micro-accent tints
                const accentStyles = [
                  "border-sky-500/20 bg-sky-500/5 hover:bg-sky-500/10 hover:border-sky-500/40",
                  "border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40",
                  "border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/40",
                ][idx % 3];

                return (
                  <motion.div
                    key={idx}
                    whileHover={{ y: -4 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className={cn(
                      "flex flex-col p-5 md:p-6 rounded-2xl border transition-all duration-300 shadow-xs relative overflow-hidden group min-h-[180px]",
                      accentStyles,
                    )}
                  >
                    {/* Layer Identifier */}
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <span className="font-mono font-bold text-xs uppercase tracking-wider px-2.5 py-1 rounded-md bg-zinc-950 text-foreground border border-border/40">
                        {layer.name}
                      </span>
                      <Layers className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
                    </div>

                    {/* Role / Description */}
                    <p className="text-base font-bold text-foreground/90 leading-snug mb-3 flex-1">
                      {layer.role}
                    </p>

                    {/* Analogy Box */}
                    {layer.analogy && (
                      <div className="mt-4 pt-3.5 border-t border-border/50 text-xs text-muted-foreground/90 italic flex items-start gap-1.5 font-sans leading-relaxed">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>Analogy: {layer.analogy}</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : isFlowChart && flowSteps.length > 0 ? (
          /* Sequence Step Visualizer */
          <div className="space-y-6">
            <div className="p-4 rounded-xl border border-primary/10 bg-primary/5 text-sm text-primary/90 leading-relaxed font-medium">
              Below is the step-by-step structural architecture mapping the pipeline:
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-2">
              {flowSteps.map((step, idx) => {
                const isLast = idx === flowSteps.length - 1;

                return (
                  <div
                    key={idx}
                    className="flex flex-col gap-2 md:flex-row md:items-center md:flex-1"
                  >
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      className="flex-1 p-5 rounded-2xl border border-lesson-border bg-muted/5 hover:bg-muted/10 text-left flex items-start gap-3.5 min-h-[84px] shadow-xs"
                    >
                      <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary font-bold font-mono text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <span className="text-sm md:text-base font-semibold text-foreground/90 leading-relaxed pt-0.5">
                        {step}
                      </span>
                    </motion.div>

                    {!isLast && (
                      <div className="flex items-center justify-center shrink-0 p-1 md:px-2 select-none">
                        <ChevronRight className="w-5 h-5 text-muted-foreground/30 rotate-90 md:rotate-0" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Sleek Graphic Empty State */
          <div className="p-10 rounded-2xl bg-muted/10 border border-dashed border-lesson-border flex flex-col items-center justify-center text-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1.5 max-w-md">
              <p className="text-base font-bold text-foreground">{title}</p>
              {description && (
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              )}
            </div>
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
