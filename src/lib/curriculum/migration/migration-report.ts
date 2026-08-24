import type { MigrationReport, MigrationDiagnostic, MigrationStatus } from "./types";
import type { MigrationValidationResult } from "./migration-validator";

/**
 * Compiles a comprehensive migration metrics summary and granular per-lesson details
 * from a batch of single-lesson pipeline results.
 */
export function generateMigrationReport(results: MigrationValidationResult[]): MigrationReport {
  let readyCount = 0;
  let reviewRequiredCount = 0;
  let blockedCount = 0;

  let totalErrors = 0;
  let totalWarnings = 0;
  let totalInfos = 0;

  let unsupportedConstructsCount = 0;
  let evidenceProblemsCount = 0;
  let objectiveProblemsCount = 0;
  let skillProblemsCount = 0;
  let completionRuleProblemsCount = 0;

  const activityConversionCounts: Record<string, number> = {};

  const details = results.map((res) => {
    // Process status counts
    if (res.status === "ready") {
      readyCount++;
    } else if (res.status === "review-required") {
      reviewRequiredCount++;
    } else if (res.status === "blocked") {
      blockedCount++;
    }

    // Process diagnostic tallies
    res.diagnostics.forEach((d) => {
      if (d.severity === "error") {
        totalErrors++;
      } else if (d.severity === "warning") {
        totalWarnings++;
      } else if (d.severity === "info") {
        totalInfos++;
      }

      // Check category indicators
      if (d.code.includes("UNSUPPORTED") || d.code.includes("COMPLEX")) {
        unsupportedConstructsCount++;
      }
      if (d.code.includes("EVIDENCE")) {
        evidenceProblemsCount++;
      }
      if (d.code.includes("OBJECTIVE")) {
        objectiveProblemsCount++;
      }
      if (d.code.includes("SKILL")) {
        skillProblemsCount++;
      }
      if (d.code.includes("COMPLETION") || d.code.includes("RULE")) {
        completionRuleProblemsCount++;
      }
    });

    // Compute activity types conversion volume
    let sourceActivityCount = 0;
    if (res.canonical?.metadata?.rawSource?.sections) {
      sourceActivityCount += (res.canonical.metadata.rawSource.sections as any[]).length;
    }
    if (res.canonical?.metadata?.rawSource?.exercises) {
      sourceActivityCount += (res.canonical.metadata.rawSource.exercises as any[]).length;
    }
    if (res.canonical?.metadata?.rawSource?.quiz) {
      sourceActivityCount += (res.canonical.metadata.rawSource.quiz as any[]).length;
    }

    const canonicalActivityCount = res.canonical?.activities.length || 0;

    if (res.canonical) {
      res.canonical.activities.forEach((act) => {
        activityConversionCounts[act.type] = (activityConversionCounts[act.type] || 0) + 1;
      });
    }

    return {
      sourceLessonId: res.sourceLessonId,
      canonicalLessonId: res.canonicalLessonId,
      sourceActivityCount,
      canonicalActivityCount,
      status: res.status,
      diagnostics: res.diagnostics,
      validation: {
        schema: res.manifest.validation.schema,
        authoring: res.manifest.validation.authoring,
        evidence: res.manifest.validation.evidence,
      },
    };
  });

  return {
    summary: {
      totalLessons: results.length,
      ready: readyCount,
      reviewRequired: reviewRequiredCount,
      blocked: blockedCount,
      errors: totalErrors,
      warnings: totalWarnings,
      infos: totalInfos,
      activityConversionCounts,
      unsupportedConstructs: unsupportedConstructsCount,
      evidenceProblems: evidenceProblemsCount,
      objectiveProblems: objectiveProblemsCount,
      skillProblems: skillProblemsCount,
      completionRuleProblems: completionRuleProblemsCount,
    },
    details,
  };
}

/**
 * Format the compiled migration report into a clean, human-readable CLI-style text block.
 */
export function formatMigrationReportText(report: MigrationReport): string {
  const s = report.summary;
  let text = `============================================================\n`;
  text += `CURRICULUM MIGRATION PIPELINE AUDIT REPORT\n`;
  text += `============================================================\n\n`;

  text += `SUMMARY METRICS:\n`;
  text += `------------------------------------------------------------\n`;
  text += `  Total Lessons Processed: ${s.totalLessons}\n`;
  text += `  Ready (Passes Cleanly):  ${s.ready}  (${(s.totalLessons ? (s.ready / s.totalLessons) * 100 : 0).toFixed(1)}%)\n`;
  text += `  Review Required:         ${s.reviewRequired}  (${(s.totalLessons ? (s.reviewRequired / s.totalLessons) * 100 : 0).toFixed(1)}%)\n`;
  text += `  Blocked (Errors Found):  ${s.blocked}  (${(s.totalLessons ? (s.blocked / s.totalLessons) * 100 : 0).toFixed(1)}%)\n\n`;

  text += `DIAGNOSTIC TOTALS:\n`;
  text += `  Errors:   ${s.errors}\n`;
  text += `  Warnings: ${s.warnings}\n`;
  text += `  Infos:    ${s.infos}\n\n`;

  text += `PEDAGOGICAL & INTEGRITY ISSUES:\n`;
  text += `  Unsupported Constructs:  ${s.unsupportedConstructs}\n`;
  text += `  Evidence Mappings:       ${s.evidenceProblems}\n`;
  text += `  Objective Ambiguity:     ${s.objectiveProblems}\n`;
  text += `  Skill Link Failures:     ${s.skillProblems}\n`;
  text += `  Completion Rule Errors:  ${s.completionRuleProblems}\n\n`;

  text += `CANONICAL ACTIVITY TYPE INVENTORY:\n`;
  Object.entries(s.activityConversionCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      text += `  - ${type}: ${count}\n`;
    });
  text += `\n`;

  text += `============================================================\n`;
  text += `DETAILED LESSON LOG:\n`;
  text += `============================================================\n`;

  report.details.forEach((det) => {
    text += `\nLesson: [${det.sourceLessonId}] -> [${det.canonicalLessonId}]\n`;
    text += `  Status:      ${det.status.toUpperCase()}\n`;
    text += `  Activities:  Source (${det.sourceActivityCount}) -> Canonical (${det.canonicalActivityCount})\n`;
    text += `  Validation:  Schema [${det.validation.schema}] | Authoring [${det.validation.authoring}] | Evidence [${det.validation.evidence}]\n`;

    if (det.diagnostics.length > 0) {
      text += `  Diagnostics:\n`;
      det.diagnostics.forEach((diag) => {
        const pathStr = diag.targetPath || diag.sourcePath || "";
        const location = pathStr ? ` at ${pathStr}` : "";
        text += `    [${diag.severity.toUpperCase()}] [${diag.code}]${location}: ${diag.message}\n`;
        if (diag.suggestion) {
          text += `      Suggestion: ${diag.suggestion}\n`;
        }
      });
    }
  });

  text += `\n============================================================\n`;
  text += `END AUDIT REPORT\n`;
  text += `============================================================\n`;

  return text;
}
