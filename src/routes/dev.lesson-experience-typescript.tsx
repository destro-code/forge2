import { createFileRoute } from "@tanstack/react-router";
import { TypeScriptFamilyLab } from "@/components/lesson-experience/typescript-family-lab";

export const Route = createFileRoute("/dev/lesson-experience-typescript")({
  head: () => ({ meta: [{ title: "TypeScript Family Lab · Forge" }] }),
  component: TypeScriptFamilyLab,
});
