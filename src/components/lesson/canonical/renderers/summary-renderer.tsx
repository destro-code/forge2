import type { SummaryActivity } from "@/lib/curriculum/types";
import type { ActivityRendererProps } from "../types";
import { ActivityContainer } from "../primitives/activity-container";
import { ActivityHeader } from "../primitives/activity-header";
import { ActivityActions } from "../primitives/activity-actions";
import { CheckCircle2, ArrowRight, HelpCircle, BookOpen } from "lucide-react";

export function SummaryRenderer({ activity, state, onContinue }: ActivityRendererProps<SummaryActivity>) {
  const { title, takeaways = [], nextSteps = [], reviewQuestions = [] } = activity.content;

  return (
    <ActivityContainer id={`activity-${activity.id}`} variant="immersive">
      <ActivityHeader activity={activity} />
      <div className="mx-auto w-full max-w-4xl px-5 py-9 sm:px-8 sm:py-12">
        <header className="max-w-3xl">
          <p className="text-sm font-medium text-lesson-accent">Lesson synthesis</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-lesson-text-primary sm:text-4xl">{title}</h2>
          <p className="mt-4 text-base leading-7 text-lesson-text-secondary">
            A concise review of the concepts and skills covered in this lesson.
          </p>
        </header>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(250px,0.65fr)]">
          {takeaways.length > 0 && (
            <section>
              <div className="mb-4 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-lesson-accent" />
                <h3 className="text-sm font-semibold text-lesson-text-primary">Key takeaways</h3>
              </div>
              <ul className="space-y-2">
                {takeaways.map((takeaway, idx) => (
                  <li key={idx} className="flex items-start gap-3 rounded-xl bg-lesson-surface-subtle px-4 py-3.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span className="text-sm leading-6 text-lesson-text-secondary">{takeaway}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="space-y-8">
            {reviewQuestions.length > 0 && (
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-lesson-text-muted" />
                  <h3 className="text-sm font-semibold text-lesson-text-primary">Self-check</h3>
                </div>
                <ul className="space-y-2">
                  {reviewQuestions.map((question, idx) => (
                    <li key={idx} className="text-sm leading-6 text-lesson-text-secondary">{question}</li>
                  ))}
                </ul>
              </section>
            )}

            {nextSteps.length > 0 && (
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-lesson-accent" />
                  <h3 className="text-sm font-semibold text-lesson-text-primary">Next steps</h3>
                </div>
                <ul className="space-y-2">
                  {nextSteps.map((step, idx) => (
                    <li key={idx} className="text-sm leading-6 text-lesson-text-secondary">{step}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      </div>
      <ActivityActions status={state.status} isInteractive={false} onContinue={onContinue} continueLabel="Continue" />
    </ActivityContainer>
  );
}
