import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface SettingsState {
  theme: "dark" | "light" | "system";
  fontSize: "sm" | "md" | "lg";
  reduceMotion: boolean;
  editor: {
    tabSize: number;
    wordWrap: boolean;
    fontLigatures: boolean;
    theme: "vs-dark" | "light";
  };
  ai: {
    provider: "mock" | "openai" | "anthropic" | "gemini" | "openrouter";
    model: string;
    coachingMode: boolean;
    temperature: number;
  };
  learning: {
    dailyGoalMinutes: number;
    autoAdvance: boolean;
    showHintsFirst: boolean;
  };
  notifications: {
    dailyReminder: boolean;
    weeklyReport: boolean;
  };
}

const DEFAULT_SETTINGS_STATE: SettingsState = {
  theme: "dark",
  fontSize: "md",
  reduceMotion: false,
  editor: { tabSize: 2, wordWrap: true, fontLigatures: true, theme: "vs-dark" },
  ai: { provider: "mock", model: "forge-tutor-1", coachingMode: true, temperature: 0.4 },
  learning: { dailyGoalMinutes: 30, autoAdvance: false, showHintsFirst: true },
  notifications: { dailyReminder: true, weeklyReport: true },
};

export const useSettingsZustandStore = create<
  SettingsState & {
    setSettings: (data: SettingsState) => void;
  }
>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS_STATE,
      setSettings: (data) => set(data),
    }),
    {
      name: "forge:settings:v1",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export const settingsStore = {
  read: (): SettingsState => useSettingsZustandStore.getState(),
  write: (data: SettingsState) => useSettingsZustandStore.getState().setSettings(data),
  set: (data: SettingsState) => useSettingsZustandStore.getState().setSettings(data),
  useStore: (): [
    SettingsState,
    (updater: SettingsState | ((prev: SettingsState) => SettingsState)) => void,
  ] => {
    const state = useSettingsZustandStore();
    return [
      state,
      (updater) => {
        const current = useSettingsZustandStore.getState();
        const next = typeof updater === "function" ? updater(current) : updater;
        useSettingsZustandStore.getState().setSettings(next);
      },
    ];
  },
};
