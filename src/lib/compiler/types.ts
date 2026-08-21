import type {
  PlaygroundFile,
  PlaygroundRuntime,
  PlaygroundProjectManifest,
} from "../types/playground";

export type { PlaygroundRuntime, PlaygroundProjectManifest };

export interface CompilerOptions {
  runtime?: PlaygroundRuntime;
  entryFile?: string;
  isInline?: boolean;
  title?: string;
  theme?: "dark" | "light";
  baseUrl?: string;
  workspaceRevision?: number;
}

export type CompilerInput = PlaygroundFile[] | PlaygroundProjectManifest;

export interface ParsedModule {
  id: string;
  name: string;
  code: string;
  language: string;
  extension: string;
  isEntry: boolean;
  isCss: boolean;
  isJson: boolean;
}

export interface ParsedProject {
  runtime: PlaygroundRuntime;
  files: PlaygroundFile[];
  modules: ParsedModule[];
  entryModule?: ParsedModule;
  cssModules: ParsedModule[];
  codeModules: ParsedModule[];
  jsonModules: ParsedModule[];
}

export interface Diagnostic {
  id: string;
  severity: "error" | "warning" | "info";
  message: string;
  file?: string;
  line?: number;
  column?: number;
}

export interface ValidationResult {
  isValid: boolean;
  diagnostics: Diagnostic[];
  hasEntry: boolean;
}

export interface GeneratedOutput {
  html: string;
  cssBundle: string;
  codeJson: string;
}

export interface CompilationArtifact {
  content: string;
  mimeType: string;
  byteSize: number;
}

export interface CompilerReport {
  success: boolean;
  durationMs: number;
  fileCount: number;
  diagnostics: Diagnostic[];
  artifact: CompilationArtifact;
  outputHtml: string;
}
