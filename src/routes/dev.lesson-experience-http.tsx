import { createFileRoute } from "@tanstack/react-router";
import { HttpFamilyLab } from "@/components/lesson-experience/http-family-lab";

export const Route = createFileRoute("/dev/lesson-experience-http")({
  head: () => ({
    meta: [
      { title: "HTTP Runtime Lab · Forge" },
      { name: "description", content: "Development-only HTTP runtime evidence lab." },
    ],
  }),
  component: HttpFamilyLab,
});
