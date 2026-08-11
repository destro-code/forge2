import { createFileRoute } from "@tanstack/react-router";
import { MasteryEnginePage } from "./progress";

export const Route = createFileRoute("/mastery")({
  head: () => ({
    meta: [
      { title: "Skill Mastery · Forge" },
      {
        name: "description",
        content:
          "Track confidence levels, spaced-repetition review dates, weak/strong topics, and interview readiness.",
      },
      { property: "og:title", content: "Skill Mastery · Forge" },
      { property: "og:description", content: "Data-driven frontend skill mastery." },
    ],
  }),
  component: MasteryEnginePage,
});
