import type { PlaygroundFile } from "../types/playground";

export interface CompilerOptions {
  isInline?: boolean;
  title?: string;
  theme?: "dark" | "light";
  baseUrl?: string;
}

export type CompilerInput = PlaygroundFile[];

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
