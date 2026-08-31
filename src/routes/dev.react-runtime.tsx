import { createFileRoute } from "@tanstack/react-router";
import { ReactSandboxRuntime } from "@/lib/lesson-experience/react-sandbox/runtime";

export const Route = createFileRoute("/dev/react-runtime")({
  component: ReactSandboxRuntime,
});
