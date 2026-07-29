import { createLocalStore } from "../local-store";

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

export const settingsStore = createLocalStore<SettingsState>("forge:settings:v1", {
  theme: "dark",
  fontSize: "md",
  reduceMotion: false,
  editor: { tabSize: 2, wordWrap: true, fontLigatures: true, theme: "vs-dark" },
  ai: { provider: "mock", model: "forge-tutor-1", coachingMode: true, temperature: 0.4 },
  learning: { dailyGoalMinutes: 30, autoAdvance: false, showHintsFirst: true },
  notifications: { dailyReminder: true, weeklyReport: true },
});
