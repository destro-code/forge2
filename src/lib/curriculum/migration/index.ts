import { validateMigrationPipeline, type MigrationValidationResult } from "./migration-validator";
import { generateMigrationReport, formatMigrationReportText } from "./migration-report";
import type { MigrationReport } from "./types";

export * from "./types";
export * from "./migration-contract";
export * from "./legacy-adapter";
export * from "./canonical-transformer";
export * from "./migration-validator";
export * from "./migration-report";

export interface DryRunResult {
  report: MigrationReport;
  formattedText: string;
  results: MigrationValidationResult[];
}

/**
 * Executes a complete, sandboxed dry-run of the curriculum migration pipeline.
 * Takes legacy lesson feeds, validates them, and produces a complete audit report.
 * Guaranteed to have zero side-effects on the actual filesystem or live databases.
 */
export function executeMigrationDryRun(legacyLessons: any[], version = "1.0.0"): DryRunResult {
  const results = legacyLessons.map((lesson) => validateMigrationPipeline(lesson, version));

  const report = generateMigrationReport(results);
  const formattedText = formatMigrationReportText(report);

  return {
    report,
    formattedText,
    results,
  };
}
