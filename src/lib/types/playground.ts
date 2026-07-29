export interface PlaygroundFile {
  id: string;
  name: string;
  code: string;
  language: "typescript" | "javascript" | "html" | "css" | "json";
  isReadOnly?: boolean;
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
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  files: PlaygroundFile[];
  solutionFiles: PlaygroundFile[];
  hints: string[];
}
