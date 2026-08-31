import { createFileRoute } from "@tanstack/react-router";
import { ReactFamilyLab } from "@/components/lesson-experience/react-family-lab";

export const Route = createFileRoute("/dev/lesson-experience-react")({
  head: () => ({ meta: [{ title: "React Family Lab · Forge" }] }),
  component: ReactFamilyLab,
});
