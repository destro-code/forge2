import { createFileRoute } from "@tanstack/react-router";
import { LessonExperienceLab } from "@/components/lesson-experience/lesson-experience-lab";

export const Route = createFileRoute("/dev/lesson-experience-lab")({
  head: () => ({
    meta: [
      { title: "Lesson Experience Lab · Forge" },
      { name: "description", content: "A development-only Forge lesson experience design lab." },
    ],
  }),
  component: LessonExperienceLab,
});
