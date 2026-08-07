import type { Diagnostic, ParsedProject, ValidationResult } from "./types";

/**
 * Step 2: Validate Phase
 * Inspects parsed project structure, files, and syntax for errors.
 */
export function validateProject(parsed: ParsedProject): ValidationResult {
  const diagnostics: Diagnostic[] = [];

  if (parsed.modules.length === 0) {
    diagnostics.push({
      id: "diag-empty-project",
      severity: "error",
      message: "No files found in project payload.",
    });
  }

  const hasEntry = Boolean(parsed.entryModule);
  if (!hasEntry) {
    diagnostics.push({
      id: "diag-missing-entry",
      severity: "warning",
      message:
        "No standard entry file (App.tsx, index.tsx, main.tsx) detected. Defaulting to first file.",
    });
  }

  // Validate JSON files
  for (const m of parsed.jsonModules) {
    try {
      JSON.parse(m.code);
    } catch (err) {
      diagnostics.push({
        id: `diag-json-parse-${m.id}`,
        severity: "error",
        message: `Invalid JSON syntax in ${m.name}: ${err instanceof Error ? err.message : String(err)}`,
        file: m.name,
      });
    }
  }

  const hasErrors = diagnostics.some((d) => d.severity === "error");

  return {
    isValid: !hasErrors,
    diagnostics,
    hasEntry,
  };
}
