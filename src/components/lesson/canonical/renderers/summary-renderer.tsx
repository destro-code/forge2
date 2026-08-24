import type { SummaryActivity } from "@/lib/curriculum/types";
import type { ActivityRendererProps } from "../types";
import { ActivityContainer } from "../primitives/activity-container";
import { ActivityHeader } from "../primitives/activity-header";
import { ActivityActions } from "../primitives/activity-actions";
import { Award, CheckCircle2, ArrowRight, HelpCircle, BookOpen, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function SummaryRenderer({
  activity,
  state,
  onContinue,
}: ActivityRendererProps<SummaryActivity>) {
  const { title, takeaways = [], nextSteps = [], reviewQuestions = [] } = activity.content;

  return (
    <ActivityContainer id={`activity-${activity.id}`} variant="standard">
      <ActivityHeader activity={activity} />

      <div className="p-6 md:p-10 flex flex-col gap-8">
        {/* Synthesis Milestone Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 select-none">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 text-violet-500 text-xs font-bold font-mono border border-violet-500/20">
              <Award className="w-3.5 h-3.5" />
              <span>Lesson Synthesis</span>
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground leading-snug">
            {title}
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
            You have analyzed, practiced, and verified the core parameters of this concept.
            Let&apos;s review your takeaway standards.
          </p>
        </div>

        {/* Bento Dashboard Layout Grid */}
        <div className="grid gap-6 md:grid-cols-12 items-start">
          {/* Takeaways List (Left Columns - Larger Span) */}
          <div
            className={cn("space-y-4", takeaways.length > 0 ? "md:col-span-7" : "md:col-span-12")}
          >
            {takeaways && takeaways.length > 0 && (
              <div className="space-y-3.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 font-mono flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span>Core Takeaways</span>
                </h3>
                <div className="grid gap-3">
                  {takeaways.map((takeaway, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ x: 2 }}
                      className="flex items-start gap-4 p-4 rounded-2xl border border-lesson-border bg-card shadow-xs group transition-colors hover:bg-muted/5"
                    >
                      <CheckCircle2 className="w-5.5 h-5.5 text-emerald-500 shrink-0 mt-0.5 select-none" />
                      <span className="text-sm md:text-base font-semibold text-foreground/90 leading-relaxed">
                        {takeaway}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar self-check and next steps (Right Columns) */}
          <div className="md:col-span-5 space-y-6">
            {/* Self-Check Review Questions */}
            {reviewQuestions && reviewQuestions.length > 0 && (
              <div className="space-y-3.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 font-mono flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-primary" />
                  <span>Self-Check Questions</span>
                </h3>
                <div className="grid gap-2.5">
                  {reviewQuestions.map((q, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-4 rounded-2xl bg-muted/20 border border-border/60 text-sm"
                    >
                      <span className="font-mono text-xs text-primary font-extrabold select-none mt-0.5 shrink-0">
                        Q{idx + 1}:
                      </span>
                      <span className="text-foreground/90 font-medium leading-relaxed">{q}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Path Progression Steps */}
            {nextSteps && nextSteps.length > 0 && (
              <div className="space-y-3.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 font-mono flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-primary" />
                  <span>Recommended Next Steps</span>
                </h3>
                <div className="grid gap-2.5">
                  {nextSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3.5 rounded-2xl bg-muted/10 border border-border/70 text-xs font-semibold text-foreground/90 shadow-2xs group"
                    >
                      <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold font-mono text-xs select-none shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        {idx + 1}
                      </div>
                      <span className="flex-1 truncate">{step}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/35 group-hover:text-foreground/60 transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ActivityActions
        status={state.status}
        isInteractive={false}
        onContinue={onContinue}
        continueLabel="Proceed to Completion"
      />
    </ActivityContainer>
  );
}
