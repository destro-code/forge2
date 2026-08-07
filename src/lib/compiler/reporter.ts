import type {
  CompilationArtifact,
  CompilerInput,
  CompilerReport,
  GeneratedOutput,
  ParsedProject,
  ValidationResult,
} from "./types";

/**
 * Step 5: Report Results Phase
 * Assembles diagnostics, metrics, and artifact output into structured CompilerReport.
 */
export function reportResults(
  input: CompilerInput,
  _parsed: ParsedProject,
  validation: ValidationResult,
  _generated: GeneratedOutput,
  artifact: CompilationArtifact,
  startTime: number,
): CompilerReport {
  const endTime = typeof performance !== "undefined" ? performance.now() : Date.now();
  const durationMs = Math.round((endTime - startTime) * 100) / 100;
  const fileCount = input ? input.length : 0;

  return {
    success: validation.isValid,
    durationMs,
    fileCount,
    diagnostics: validation.diagnostics,
    artifact,
    outputHtml: artifact.content,
  };
}
