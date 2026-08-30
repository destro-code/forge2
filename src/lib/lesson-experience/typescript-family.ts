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
}

export interface TypeScriptDiagnostic {
  code: number;
  message: string;
  severity: "error" | "warning";
  line?: number;
  character?: number;
}

export interface TypeScriptRunResult {
  execution: ExecutionMetadata;
  diagnostics: readonly TypeScriptDiagnostic[];
  emitted: string | null;
  inferredTypes: Readonly<Record<string, string>>;
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
    line: position?.line === undefined ? undefined : position.line + 1,
    character: position?.character === undefined ? undefined : position.character + 1,
  };
}

function diagnosticsFor(program: ts.Program): TypeScriptDiagnostic[] {
  const all = [...ts.getPreEmitDiagnostics(program)];
  return all.map((diagnostic) => formatDiagnostic(diagnostic, diagnostic.file));
}

function collectInferredTypes(
  program: ts.Program,
  sourceFile: ts.SourceFile,
): Record<string, string> {
  const checker = program.getTypeChecker();
  const inferred: Record<string, string> = {};
  sourceFile.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) return;
    node.declarationList.declarations.forEach((declaration) => {
      if (!ts.isIdentifier(declaration.name)) return;
      inferred[declaration.name.text] = checker.typeToString(
        checker.getTypeAtLocation(declaration.name),
      );
    });
  });
  return inferred;
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
  const inferredTypes = sourceFile ? collectInferredTypes(program, sourceFile) : {};
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
    items: evidenceItems,
  };
  return { execution, diagnostics, emitted, inferredTypes, evidence };
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
