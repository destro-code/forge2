import { createFileRoute } from "@tanstack/react-router";
import { HttpFamilyLab } from "@/components/lesson-experience/http-family-lab";
export const Route = createFileRoute("/dev/lesson-experience-api")({
  head: () => ({ meta: [{ title: "HTTP API Family Lab · Forge" }] }),
  component: HttpFamilyLab,
});
