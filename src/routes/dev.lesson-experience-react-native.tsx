import { createFileRoute } from "@tanstack/react-router";
import { ReactNativeFamilyLab } from "@/components/lesson-experience/react-native-family-lab";
export const Route = createFileRoute("/dev/lesson-experience-react-native")({
  head: () => ({ meta: [{ title: "React Native Runtime Family Lab · Forge" }] }),
  component: ReactNativeFamilyLab,
});
