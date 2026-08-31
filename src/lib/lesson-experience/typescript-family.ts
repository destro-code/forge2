import * as ts from "typescript";
import type {
  EvidenceEnvelope,
  ExecutionMetadata,
  RuntimeFamilyDescriptor,
  ValidationReport,
} from "./contracts";
import { RUNTIME_FAMILY_DESCRIPTORS } from "./contracts";

export interface TypeScriptRunRequest {
  source: string;
  fileName?: string;
  revision?: number;
  runId?: string;
  emit?: boolean;
  timeoutMs?: number;
  queryVariables?: readonly string[];
  queryExpressions?: readonly string[];
}

export interface TypeScriptDiagnosticLocation {
  fileName?: string;
  line?: number;
  character?: number;
  length?: number;
}

export interface TypeScriptDiagnostic {
  code: number;
  message: string;
  severity: "error" | "warning";
  location?: TypeScriptDiagnosticLocation;
  related?: readonly TypeScriptDiagnosticLocation[];
  relatedMessages?: readonly string[];
}

export interface TypeScriptTypeQuery {
  variable: string;
  type: string | null;
  line?: number;
  character?: number;
}

export type TypeScriptRunStatus =
  "idle" | "running" | "succeeded" | "failed" | "unavailable" | "disposed";

export interface TypeScriptRunController {
  readonly revision: number;
  readonly disposed: boolean;
  run(request: TypeScriptRunRequest): TypeScriptRunResult | null;
  reset(): number;
  dispose(): void;
}

export interface TypeScriptRunResult {
  execution: ExecutionMetadata;
  diagnostics: readonly TypeScriptDiagnostic[];
  emitted: string | null;
  inferredTypes: Readonly<Record<string, string>>;
  typeQueries: readonly TypeScriptTypeQuery[];
  evidence: EvidenceEnvelope;
}

export const TYPESCRIPT_DESCRIPTOR: RuntimeFamilyDescriptor = RUNTIME_FAMILY_DESCRIPTORS.find(
  ({ family }) => family === "type-compiler",
) ?? {
  family: "type-compiler",
  version: 1,
  security: "compiler-isolation",
  capabilities: [
    { name: "compile.typescript", version: 1 },
    { name: "inspect.type-diagnostics", version: 1 },
    { name: "inspect.inferred-type", version: 1 },
  ],
};

function formatDiagnostic(
  diagnostic: ts.Diagnostic,
  sourceFile?: ts.SourceFile,
): TypeScriptDiagnostic {
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, " ");
  const position =
    sourceFile && diagnostic.start !== undefined
      ? sourceFile.getLineAndCharacterOfPosition(diagnostic.start)
      : undefined;
  return {
    code: diagnostic.code,
    message,
    severity: diagnostic.category === ts.DiagnosticCategory.Warning ? "warning" : "error",
    location:
      position || diagnostic.start !== undefined
        ? {
            fileName: sourceFile?.fileName,
            line: position?.line === undefined ? undefined : position.line + 1,
            character: position?.character === undefined ? undefined : position.character + 1,
            length: diagnostic.length,
          }
        : undefined,
    related: diagnostic.relatedInformation?.map((item) => ({
      fileName: item.file?.fileName,
      ...(item.file && item.start !== undefined
        ? (() => {
            const relatedPosition = item.file.getLineAndCharacterOfPosition(item.start);
            return { line: relatedPosition.line + 1, character: relatedPosition.character + 1 };
          })()
        : {}),
      length: item.length,
    })),
    relatedMessages: diagnostic.relatedInformation?.map((item) =>
      ts.flattenDiagnosticMessageText(item.messageText, " "),
    ),
  };
}

function diagnosticsFor(program: ts.Program): TypeScriptDiagnostic[] {
  const all = [...ts.getPreEmitDiagnostics(program)];
  return all.map((diagnostic) => formatDiagnostic(diagnostic, diagnostic.file));
}

function collectInferredTypes(
  program: ts.Program,
  sourceFile: ts.SourceFile,
  requested: readonly string[] = [],
): Record<string, string> {
  const checker = program.getTypeChecker();
  const inferred: Record<string, string> = {};
  const names = new Set(requested);
  sourceFile.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) return;
    node.declarationList.declarations.forEach((declaration) => {
      if (!ts.isIdentifier(declaration.name)) return;
      if (names.size > 0 && !names.has(declaration.name.text)) return;
      inferred[declaration.name.text] = checker.typeToString(
        checker.getTypeAtLocation(declaration.name),
        undefined,
        ts.TypeFormatFlags.NoTruncation,
      );
    });
  });
  return inferred;
}

function collectTypeQueries(
  program: ts.Program,
  sourceFile: ts.SourceFile,
  inferredTypes: Readonly<Record<string, string>>,
  expressions: readonly string[] = [],
): TypeScriptTypeQuery[] {
  const checker = program.getTypeChecker();
  const queries: TypeScriptTypeQuery[] = [];
  const requested = expressions.length > 0 ? expressions : Object.keys(inferredTypes);
  for (const expression of requested) {
    let match: ts.Node | undefined;
    function visit(node: ts.Node) {
      if (!match && ts.isIdentifier(node) && node.text === expression) match = node;
      ts.forEachChild(node, visit);
    }
    visit(sourceFile);
    if (!match) {
      queries.push({ variable: expression, type: null });
      continue;
    }
    const position = sourceFile.getLineAndCharacterOfPosition(match.getStart(sourceFile));
    queries.push({
      variable: expression,
      type: checker.typeToString(
        checker.getTypeAtLocation(match),
        undefined,
        ts.TypeFormatFlags.NoTruncation,
      ),
      line: position.line + 1,
      character: position.character + 1,
    });
  }
  return queries;
}

export function createTypeScriptRun(request: TypeScriptRunRequest): TypeScriptRunResult {
  const runId = request.runId ?? `ts-${Date.now()}`;
  const revision = request.revision ?? 1;
  const fileName = request.fileName ?? "lesson.ts";
  const startedAt = Date.now();
  if (typeof window !== "undefined") {
    const execution: ExecutionMetadata = {
      schemaVersion: 1,
      runId,
      revision,
      family: "type-compiler",
      phase: "run",
      status: "unavailable",
      startedAt,
      completedAt: Date.now(),
      artifacts: [],
    };
    return {
      execution,
      diagnostics: [],
      emitted: null,
      inferredTypes: {},
      typeQueries: [],
      evidence: {
        schemaVersion: 1,
        runId,
        revision,
        family: "type-compiler",
        phase: "observe",
        timestamp: Date.now(),
        status: "unavailable",
        source: { host: "typescript-compiler-api", artifactIds: [] },
        items: [],
      },
    };
  }
  const options: ts.CompilerOptions = {
    noEmitOnError: false,
    noImplicitAny: true,
    strict: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    skipLibCheck: true,
    ...(request.emit === false ? { noEmit: true } : {}),
  };
  const host = ts.createCompilerHost(options);
  const originalReadFile = host.readFile;
  host.readFile = (name) => (name === fileName ? request.source : originalReadFile(name));
  const originalFileExists = host.fileExists;
  host.fileExists = (name) => name === fileName || originalFileExists(name);
  const program = ts.createProgram([fileName], options, host);
  const sourceFile = program.getSourceFile(fileName);
  const diagnostics = sourceFile ? diagnosticsFor(program) : [];
  let emitted: string | null = null;
  if (request.emit !== false) {
    const emitResult = program.emit(undefined, (_name, text) => {
      if (_name.endsWith(".js")) emitted = text;
    });
    if (emitResult.emitSkipped) emitted = null;
  }
  const evidenceItems = diagnostics.map((diagnostic) => ({
    kind: "type-diagnostic" as const,
    code: String(diagnostic.code),
    message: diagnostic.message,
    severity: diagnostic.severity,
  }));
  const inferredTypes = sourceFile
    ? collectInferredTypes(program, sourceFile, request.queryVariables)
    : {};
  const typeQueries = sourceFile
    ? collectTypeQueries(program, sourceFile, inferredTypes, request.queryExpressions)
    : [];
  const status = diagnostics.some(({ severity }) => severity === "error") ? "failed" : "succeeded";
  const execution: ExecutionMetadata = {
    schemaVersion: 1,
    runId,
    revision,
    family: "type-compiler",
    phase: "run",
    status,
    startedAt,
    completedAt: Date.now(),
    artifacts: [
      {
        kind: "source",
        id: `${runId}:source`,
        name: fileName,
        language: "typescript",
        bytes: request.source.length,
      },
    ],
  };
  const evidence: EvidenceEnvelope = {
    schemaVersion: 1,
    runId,
    revision,
    family: "type-compiler",
    phase: "observe",
    timestamp: Date.now(),
    status: "complete",
    source: { host: "typescript-compiler-api", artifactIds: [`${runId}:source`] },
    items: [
      ...evidenceItems,
      ...typeQueries.map((query) => ({
        kind: "inferred-type" as const,
        code: query.variable,
        message: query.type ?? "unknown",
      })),
    ],
  };
  return { execution, diagnostics, emitted, inferredTypes, typeQueries, evidence };
}

export function typeScriptCapabilities() {
  return TYPESCRIPT_DESCRIPTOR.capabilities;
}

export function resetTypeScriptRevision(revision: number) {
  return revision + 1;
}

export function isCurrentTypeScriptRun(result: TypeScriptRunResult, revision: number) {
  return result.execution.revision === revision;
}

export function disposeTypeScriptRun(_result: TypeScriptRunResult) {
  return undefined;
}

export type TypeScriptValidationReport = ValidationReport;
