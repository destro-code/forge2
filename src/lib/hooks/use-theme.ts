import { useEffect } from "react";
import { settingsStore } from "@/lib/providers/settings-provider";

export function useTheme() {
  const [settings, setSettings] = settingsStore.useStore();
  const theme = settings.theme;

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.remove("dark", "light");
    const resolved =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;
    root.classList.add(resolved);
    root.style.colorScheme = resolved;
  }, [theme]);

  return {
    theme,
    setTheme: (t: "dark" | "light" | "system") => setSettings((s) => ({ ...s, theme: t })),
    toggle: () => setSettings((s) => ({ ...s, theme: s.theme === "dark" ? "light" : "dark" })),
  };
}
