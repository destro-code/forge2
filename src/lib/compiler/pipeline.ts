import type { CompilerInput, CompilerOptions, CompilerReport } from "./types";
import { parseProject } from "./parser";
import { validateProject } from "./validator";
import { generateOutput } from "./generator";
import { writeOutput } from "./writer";
import { reportResults } from "./reporter";

/**
 * Compiler Pipeline Orchestrator
 * Strictly coordinates the compilation lifecycle:
 *
 * 1. Parse
 *    ↓
 * 2. Validate
 *    ↓
 * 3. Generate
 *    ↓
 * 4. Write Output
 *    ↓
 * 5. Report Results
 */
export function runCompilerPipeline(
  input: CompilerInput,
  options: CompilerOptions = {},
): CompilerReport {
  const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();

  // 1. Parse Phase
  const parsed = parseProject(input);

  // 2. Validate Phase
  const validation = validateProject(parsed);

  // 3. Generate Phase
  const generated = generateOutput(parsed, validation, options);

  // 4. Write Output Phase
  const artifact = writeOutput(generated);

  // 5. Report Results Phase
  const report = reportResults(input, parsed, validation, generated, artifact, startTime);

  return report;
}
