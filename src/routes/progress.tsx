import { createFileRoute } from "@tanstack/react-router";
import { MasteryEnginePage } from "@/components/progress-page";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Mastery Engine · Forge" },
      {
        name: "description",
        content:
          "Track confidence levels, spaced-repetition review dates, weak/strong topics, and interview readiness.",
      },
      { property: "og:title", content: "Mastery Engine · Forge" },
      { property: "og:description", content: "Data-driven frontend skill mastery." },
    ],
  }),
  component: MasteryEnginePage,
});
