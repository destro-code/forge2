import { createFileRoute } from "@tanstack/react-router";
import { NextFamilyLab } from "@/components/lesson-experience/next-family-lab";
export const Route = createFileRoute("/dev/lesson-experience-next")({
  head: () => ({ meta: [{ title: "Next.js Runtime Family Lab · Forge" }] }),
  component: NextFamilyLab,
});
