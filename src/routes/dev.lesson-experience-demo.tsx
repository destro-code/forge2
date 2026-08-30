import { createFileRoute } from "@tanstack/react-router";
import { LessonExperiencePlayer } from "@/components/lesson-experience/lesson-experience-player";
import { DEMO_LESSON } from "@/lib/lesson-experience/demo-lesson";

/**
 * Isolated proof-of-concept route for the content-agnostic lesson-experience
 * engine. Renders a single synthetic demo lesson (`DEMO_LESSON`) through
 * `LessonExperiencePlayer`. Does not read from `lessons.json`, does not use
 * `/lesson/$lessonId`, and does not touch the production canonical learning
 * engine in any way — this exists purely to demonstrate the architecture.
 */
export const Route = createFileRoute("/dev/lesson-experience-demo")({
  head: () => ({
    meta: [{ title: "Lesson Experience Engine · Proof of Concept" }],
  }),
  component: DevLessonExperienceDemo,
});

function DevLessonExperienceDemo() {
  return (
    <div className="min-h-screen bg-lesson-bg">
      <div className="mx-auto w-full max-w-2xl px-4 pt-8">
        <p className="font-mono text-xs uppercase tracking-wide text-lesson-text-muted">
          Proof of concept — content-agnostic lesson experience engine
        </p>
        <h1 className="mt-1 font-serif text-lg font-semibold text-lesson-text-primary">
          {DEMO_LESSON.lesson.title}
        </h1>
      </div>
      <LessonExperiencePlayer definition={DEMO_LESSON} />
    </div>
  );
}
