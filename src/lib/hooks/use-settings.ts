import { settingsStore, type SettingsState } from "@/lib/providers/settings-provider";

export function useSettings() {
  const [settings, setSettings] = settingsStore.useStore();
  return {
    settings,
    setSettings,
    update<K extends keyof SettingsState>(key: K, value: SettingsState[K]) {
      setSettings((s) => ({ ...s, [key]: value }));
    },
  };
}
