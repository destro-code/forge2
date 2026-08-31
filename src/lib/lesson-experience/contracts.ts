export const LESSON_EXPERIENCE_SCHEMA_VERSION = 1 as const;

export type SchemaVersion = typeof LESSON_EXPERIENCE_SCHEMA_VERSION;
export type RuntimeFamily =
  | "browser-document"
  | "type-compiler"
  | "component-browser"
  | "mobile-native"
  | "http-api"
  | "server"
  | "framework-server";
export type InstructionalKind =
  | "hook"
  | "visual"
  | "prediction"
  | "workspace"
  | "challenge"
  | "explanation"
  | "debugging"
  | "mastery-check"
  | "sandbox-experiment";

export type CapabilityName =
  | "execute.javascript"
  | "render.dom"
  | "inspect.dom"
  | "inspect.console"
  | "inspect.computed-style"
  | "inspect.geometry"
  | "compile.typescript"
  | "inspect.type-diagnostics"
  | "inspect.inferred-type"
  | "execute.react"
  | "inspect.component-tree"
  | "inspect.component-state"
  | "inspect.render-trace"
  | "inspect.http-request"
  | "inspect.http-response"
  | "inspect.server-log"
  | "inspect.route"
  | "inspect.render"
  | "inspect.middleware-trace"
  | "execute.server"
  | "validate.http"
  | "inspect.cache"
  | "inspect.server-client-boundary"
  | "execute.react-native"
  | "render.native"
  | "inspect.native-tree"
  | "inspect.native-layout"
  | "inspect.native-events"
  | "inspect.native-state"
  | "inspect.native-accessibility"
  | "inspect.native-platform"
  | "inspect.native-navigation"
  | "visualize.layout"
  | "visualize.state-transition"
  | "visualize.request-lifecycle";

export interface CapabilityRequirement {
  name: CapabilityName;
  version: 1;
}
export interface RuntimeFamilyDescriptor {
  family: RuntimeFamily;
  version: 1;
  capabilities: readonly CapabilityRequirement[];
  security: "browser-sandbox" | "compiler-isolation" | "not-yet-available";
}

export interface RuntimeRequest {
  family?: RuntimeFamily;
  deterministic: boolean;
  network: "deny" | "mocked" | "controlled";
  timeoutMs: number;
}
export interface CompletionRequirement {
  id: string;
  requires: "validation.pass" | `evidence.${EvidenceItem["kind"]}`;
}
export interface ExperienceContract {
  schemaVersion: SchemaVersion;
  id: string;
  kind: InstructionalKind;
  capabilities: readonly CapabilityRequirement[];
  runtime: RuntimeRequest;
  completionRequirements: readonly CompletionRequirement[];
}

export type ArtifactMetadata =
  | { kind: "source"; id: string; name: string; language: string; bytes: number }
  | { kind: "document"; id: string; mimeType: string; bytes: number }
  | { kind: "trace"; id: string; eventCount: number };

export interface ExecutionMetadata {
  schemaVersion: SchemaVersion;
  runId: string;
  revision: number;
  family: RuntimeFamily;
  phase: "create" | "run" | "observe" | "validate" | "reset";
  status: "idle" | "running" | "succeeded" | "failed" | "timeout" | "unavailable";
  startedAt: number;
  completedAt?: number;
  artifacts: readonly ArtifactMetadata[];
}

export type EvidenceItem =
  | { kind: "console"; level: "log" | "info" | "warn" | "error"; message: string }
  | { kind: "runtime-error"; message: string }
  | { kind: "dom-snapshot"; html: string }
  | { kind: "computed-style"; target: string; property: string; value: string }
  | { kind: "geometry"; target: string; x: number; y: number; width: number; height: number }
  | { kind: "js-value"; expression: string; value: string | number | boolean | null }
  | { kind: "type-diagnostic"; code: string; message: string; severity: "error" | "warning" }
  | { kind: "inferred-type"; expression: string; type: string }
  | { kind: "http-request"; method: string; url: string }
  | { kind: "http-response"; status: number; headers: Record<string, string>; body: string }
  | { kind: "server-log"; level: "info" | "warn" | "error"; message: string }
  | { kind: "route"; path: string; matched: boolean }
  | { kind: "http-error"; code: string; message: string }
  | { kind: "http-sequence"; sequenceId: string; index: number; status: string }
  | { kind: "http-timing"; durationMs: number }
  | { kind: "next-request"; method: string; path: string }
  | {
      kind: "next-route";
      routeId: string;
      path: string;
      matched: boolean;
      routeKind: "static" | "dynamic" | "unmatched";
      params?: Record<string, string>;
    }
  | {
      kind: "next-render";
      mode: "server-rendered" | "client-rendered" | "static" | "dynamic";
      routeId: string;
    }
  | {
      kind: "next-middleware";
      middlewareId: string;
      order: number;
      action: "continue" | "rewrite" | "redirect" | "reject";
      routeId: string;
    }
  | {
      kind: "next-boundary";
      boundary: "server" | "client";
      serverAvailable: boolean;
      clientAvailable: boolean;
    }
  | { kind: "next-cache"; state: "hit" | "miss" | "revalidate"; logicalRevision: number }
  | { kind: "next-error"; code: string; message: string }
  | {
      kind: "native-platform";
      platform: "ios" | "android";
      profile: string;
      screen: { width: number; height: number; scale: number };
    }
  | {
      kind: "native-tree";
      id: string;
      type: string;
      props: Record<string, string | number | boolean>;
      children: string[];
      parentId?: string;
    }
  | { kind: "native-layout"; id: string; x: number; y: number; width: number; height: number }
  | {
      kind: "native-event";
      type: "press" | "text-change" | "focus" | "blur" | "scroll";
      targetId: string;
      order: number;
    }
  | {
      kind: "native-state";
      key: string;
      value: string | number | boolean;
      previous?: string | number | boolean;
    }
  | {
      kind: "native-accessibility";
      id: string;
      role: string;
      label: string;
      enabled: boolean;
      focusable: boolean;
    }
  | { kind: "native-navigation"; from: string; to: string }
  | { kind: "native-unavailable"; code: string; message: string };

export interface EvidenceEnvelope {
  schemaVersion: SchemaVersion;
  runId: string;
  revision: number;
  family: RuntimeFamily;
  phase: ExecutionMetadata["phase"];
  timestamp: number;
  status: "partial" | "complete" | "unavailable";
  source: { host: string; artifactIds: readonly string[] };
  items: readonly EvidenceItem[];
}

export type ValidationReportStatus =
  "pass" | "fail" | "runtime-error" | "compile-error" | "timeout" | "unavailable";
export interface ValidationAssertionResult {
  id: string;
  status: "passed" | "failed" | "skipped";
  message: string;
  evidenceKinds: readonly EvidenceItem["kind"][];
}
export interface ValidationReport {
  schemaVersion: SchemaVersion;
  runId: string;
  family: RuntimeFamily;
  revision: number;
  status: ValidationReportStatus;
  assertions: readonly ValidationAssertionResult[];
  evidence: EvidenceEnvelope;
  diagnostics: readonly string[];
}

export interface ResolutionSuccess {
  ok: true;
  family: RuntimeFamilyDescriptor;
  capabilities: readonly CapabilityRequirement[];
}
export interface ResolutionFailure {
  ok: false;
  code: "UNSUPPORTED_CAPABILITY_COMBINATION";
  missing: readonly CapabilityRequirement[];
  eligibleFamilies: readonly RuntimeFamily[];
  message: string;
}
export type CapabilityResolution = ResolutionSuccess | ResolutionFailure;

export const BROWSER_DOCUMENT_DESCRIPTOR: RuntimeFamilyDescriptor = {
  family: "browser-document",
  version: 1,
  security: "browser-sandbox",
  capabilities: [
    { name: "execute.javascript", version: 1 },
    { name: "render.dom", version: 1 },
    { name: "inspect.dom", version: 1 },
    { name: "inspect.console", version: 1 },
    { name: "inspect.computed-style", version: 1 },
    { name: "inspect.geometry", version: 1 },
  ],
};

export const REACT_NATIVE_DESCRIPTOR: RuntimeFamilyDescriptor = {
  family: "mobile-native",
  version: 1,
  security: "compiler-isolation",
  capabilities: [
    { name: "execute.react-native", version: 1 },
    { name: "render.native", version: 1 },
    { name: "inspect.native-tree", version: 1 },
    { name: "inspect.native-layout", version: 1 },
    { name: "inspect.native-events", version: 1 },
    { name: "inspect.native-state", version: 1 },
    { name: "inspect.native-accessibility", version: 1 },
    { name: "inspect.native-platform", version: 1 },
  ],
};

export const RUNTIME_FAMILY_DESCRIPTORS: readonly RuntimeFamilyDescriptor[] = [
  BROWSER_DOCUMENT_DESCRIPTOR,
  REACT_NATIVE_DESCRIPTOR,
  {
    family: "type-compiler",
    version: 1,
    security: "compiler-isolation",
    capabilities: [
      { name: "compile.typescript", version: 1 },
      { name: "inspect.type-diagnostics", version: 1 },
      { name: "inspect.inferred-type", version: 1 },
    ],
  },
  {
    family: "component-browser",
    version: 1,
    security: "not-yet-available",
    capabilities: [{ name: "execute.react", version: 1 }],
  },
  {
    family: "framework-server",
    version: 1,
    security: "compiler-isolation",
    capabilities: [
      { name: "execute.server", version: 1 },
      { name: "inspect.route", version: 1 },
      { name: "inspect.render", version: 1 },
      { name: "inspect.middleware-trace", version: 1 },
      { name: "inspect.http-response", version: 1 },
      { name: "inspect.http-request", version: 1 },
      { name: "inspect.server-log", version: 1 },
      { name: "inspect.cache", version: 1 },
      { name: "inspect.server-client-boundary", version: 1 },
    ],
  },
  {
    family: "http-api",
    version: 1,
    security: "compiler-isolation",
    capabilities: [
      { name: "inspect.http-request", version: 1 },
      { name: "inspect.http-response", version: 1 },
      { name: "inspect.server-log", version: 1 },
      { name: "validate.http", version: 1 },
      { name: "visualize.request-lifecycle", version: 1 },
    ],
  },
];

export function resolveCapabilities(
  required: readonly CapabilityRequirement[],
  descriptors = RUNTIME_FAMILY_DESCRIPTORS,
): CapabilityResolution {
  const family = descriptors.find((descriptor) =>
    required.every((capability) =>
      descriptor.capabilities.some(
        (supported) =>
          supported.name === capability.name && supported.version >= capability.version,
      ),
    ),
  );
  if (family) return { ok: true, family, capabilities: required };
  const eligibleFamilies = descriptors
    .filter((descriptor) =>
      required.some((capability) =>
        descriptor.capabilities.some((supported) => supported.name === capability.name),
      ),
    )
    .map((descriptor) => descriptor.family);
  const missing = required.filter(
    (capability) =>
      !descriptors.some((descriptor) =>
        descriptor.capabilities.some(
          (supported) =>
            supported.name === capability.name && supported.version >= capability.version,
        ),
      ),
  );
  return {
    ok: false,
    code: "UNSUPPORTED_CAPABILITY_COMBINATION",
    missing,
    eligibleFamilies,
    message: `No runtime family supports: ${required.map(({ name }) => name).join(", ")}.`,
  };
}

export function createBrowserCompatibilityContract(
  capabilities: readonly CapabilityRequirement[] = BROWSER_DOCUMENT_DESCRIPTOR.capabilities,
): ExperienceContract {
  const resolution = resolveCapabilities(capabilities, [BROWSER_DOCUMENT_DESCRIPTOR]);
  if (!resolution.ok) throw new Error(resolution.message);
  return {
    schemaVersion: LESSON_EXPERIENCE_SCHEMA_VERSION,
    id: "browser-compatibility",
    kind: "workspace",
    capabilities,
    runtime: { family: "browser-document", deterministic: true, network: "deny", timeoutMs: 10000 },
    completionRequirements: [{ id: "validated", requires: "validation.pass" }],
  };
}

export function createValidationReport(
  input: Omit<ValidationReport, "schemaVersion">,
): ValidationReport {
  return { schemaVersion: LESSON_EXPERIENCE_SCHEMA_VERSION, ...input };
}
export function createEvidenceEnvelope(
  input: Omit<EvidenceEnvelope, "schemaVersion">,
): EvidenceEnvelope {
  return { schemaVersion: LESSON_EXPERIENCE_SCHEMA_VERSION, ...input };
}
