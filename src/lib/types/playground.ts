import type { ExerciseValidationSpec } from "./validation";

export type PlaygroundRuntime = "html-css" | "vanilla-dom" | "react";

export interface PlaygroundFile {
  id: string;
  name: string;
  code: string;
  language: "typescript" | "javascript" | "html" | "css" | "json";
  isReadOnly?: boolean;
}

export interface PlaygroundProjectManifest {
  runtime: PlaygroundRuntime;
  entryFile?: string;
  title?: string;
  files: PlaygroundFile[];
}

export interface PlaygroundConsoleLog {
  id: string;
  level: "log" | "info" | "warn" | "error";
  message: string;
  timestamp: string;
}

export interface PlaygroundPreset {
  id: string;
  title: string;
  category: string;
  runtime?: PlaygroundRuntime;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  files: PlaygroundFile[];
  solutionFiles: PlaygroundFile[];
  hints: string[];
  validation?: ExerciseValidationSpec;
}
