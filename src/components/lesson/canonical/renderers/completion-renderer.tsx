import type { CompletionActivity } from "@/lib/curriculum/types";
import type { ActivityRendererProps } from "../types";
import { ActivityContainer } from "../primitives/activity-container";
import { ActivityHeader } from "../primitives/activity-header";
import { ActivityActions } from "../primitives/activity-actions";
import { Award, Sparkles, CheckCircle2, Bookmark, Flame, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function CompletionRenderer({
  activity,
  state,
  onContinue,
}: ActivityRendererProps<CompletionActivity>) {
  const { title, message, badgeId, congratulations } = activity.content;

  return (
    <ActivityContainer id={`activity-${activity.id}`} variant="immersive">
      <div className="bg-lesson-surface border border-lesson-border rounded-3xl shadow-xl overflow-hidden relative">
        {/* Soft decorative radial gradient background for celebration feel */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-60 select-none pointer-events-none" />

        <ActivityHeader activity={activity} />

        <div className="p-8 sm:p-14 flex flex-col items-center text-center gap-8 relative z-10">
          {/* Animated Celebration Icon Container */}
          <div className="relative">
            {/* Outer pulsating radial ring */}
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full bg-primary/10 blur-xl opacity-50"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="w-16 h-16 rounded-3xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-lg relative z-10"
            >
              <Award className="w-8 h-8 text-primary animate-pulse" />
            </motion.div>
          </div>

          {/* Celebration Text Header */}
          <div className="space-y-3 max-w-xl">
            <h2 className="text-2xl sm:text-4.5xl font-extrabold tracking-tight text-foreground leading-tight">
              {title || "Lesson Completed!"}
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed font-medium">
              {message ||
                "You have successfully finished all activities and validated your structural engineering skills."}
            </p>
            {congratulations && (
              <p className="text-emerald-600 dark:text-emerald-400 text-sm font-semibold tracking-wide bg-emerald-500/10 px-4 py-2 rounded-xl inline-block mt-2">
                {congratulations}
              </p>
            )}
          </div>

          {/* Badge Display block if Badge Unlocked */}
          {badgeId && (
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 shadow-xs flex items-center gap-4.5 max-w-md w-full relative overflow-hidden group select-none"
            >
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/25 flex items-center justify-center shrink-0">
                <Sparkles className="w-5.5 h-5.5 animate-pulse" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 font-mono">
                  Badge Unlocked
                </span>
                <p className="font-extrabold text-base text-foreground leading-snug truncate">
                  {badgeId}
                </p>
              </div>
            </motion.div>
          )}
        </div>

        <ActivityActions
          status={state.status}
          isInteractive={false}
          onContinue={onContinue}
          continueLabel="Complete Lesson"
        />
      </div>
    </ActivityContainer>
  );
}
