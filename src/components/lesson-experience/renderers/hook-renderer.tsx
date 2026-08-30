import type { HookExperience } from "@/lib/lesson-experience/types";

export function HookRenderer({ experience }: { experience: HookExperience }) {
  const { heading, body, punchline } = experience.content;
  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-serif text-2xl font-semibold text-lesson-text-primary text-balance md:text-3xl">
        {heading}
      </h2>
      <p className="text-base leading-relaxed text-lesson-text-secondary">{body}</p>
      {punchline ? (
        <p className="rounded-lg border border-lesson-accent/30 bg-lesson-accent/10 px-4 py-3 font-mono text-sm text-lesson-accent">
          {punchline}
        </p>
      ) : null}
    </div>
  );
}
