import type { ExplanationExperience } from "@/lib/lesson-experience/types";

export function ExplanationRenderer({ experience }: { experience: ExplanationExperience }) {
  const { heading, paragraphs } = experience.content;
  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-serif text-2xl font-semibold text-lesson-text-primary text-balance">
        {heading}
      </h2>
      <div className="flex flex-col gap-3">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="text-sm leading-relaxed text-lesson-text-secondary">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}
