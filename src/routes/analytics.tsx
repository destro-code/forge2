import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsPage } from "@/components/statistics-page";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics & Growth Engine · Forge" },
      {
        name: "description",
        content:
          "Deep analytics on study time, quiz accuracy, topic progress trajectory, interview readiness trends, and streak consistency.",
      },
      { property: "og:title", content: "Analytics & Growth Engine · Forge" },
      { property: "og:description", content: "Data-driven insights that show real growth." },
    ],
  }),
  component: AnalyticsPage,
});
