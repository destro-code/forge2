import { createFileRoute } from "@tanstack/react-router";
import { BrowserFamilyLab } from "@/components/lesson-experience/browser-family-lab";

export const Route = createFileRoute("/dev/lesson-experience-browser")({
  head: () => ({
    meta: [
      { title: "Browser Runtime Lab · Forge" },
      { name: "description", content: "Development-only browser runtime evidence lab." },
    ],
  }),
  component: BrowserFamilyLab,
});
