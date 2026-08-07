import type { CompilationArtifact, GeneratedOutput } from "./types";

/**
 * Step 4: Write Output Phase
 * Formats generated assets into final consumable compilation artifact.
 */
export function writeOutput(generated: GeneratedOutput): CompilationArtifact {
  const content = generated.html;
  const mimeType = "text/html";
  const byteSize = new Blob([content]).size;

  return {
    content,
    mimeType,
    byteSize,
  };
}
