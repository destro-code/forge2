import { z } from "zod";

/**
 * Explicit, validated description of the executable learner experience for
 * an activity. This replaces inferring runtime behavior from
 * `content.language` scattered across renderers and the compiler service.
 * See v0_plans/sharp-plan.md (Phase A) for the directive this implements.
 *
 * Scope note: the plan referenced a distinct "html-css" (dual-file HTML +
 * CSS authoring) experience kind. The actual compiler runtime
 * (`canonical-code-runtime.ts`) has no dual-authoring capability today — its
 * "html-css" runtime kind is CSS-only editing against a fixed HTML fixture,
 * which is exactly what `css` below represents. Rather than declare an
 * `html-css` experience kind with no distinct implementation behind it,
 * this file only models the four experiences the repository can actually
 * execute (`markup`, `css`, `javascript`, `debug`). A genuine multi-file
 * HTML+CSS authoring experience is deferred to the Experience Controller
 * phase, alongside TypeScript and React.
 */

export interface MarkupExperience {
  kind: "markup";
  language: "html";
  editor: { starterSource: string };
  output: { preview: true; console: false };
}

export interface CssExperience {
  kind: "css";
  language: "css";
  editor: { starterSource: string };
  environment: { htmlFixture: string };
  output: { preview: true; console: false; computedStyles: true };
}

export interface JavaScriptExperience {
  kind: "javascript";
  language: "javascript";
  editor: { starterSource: string };
  environment?: { htmlFixture?: string };
  output: { preview: boolean; console: true; runtimeErrors: true };
}

export interface DebugExperience {
  kind: "debug";
  language: "javascript";
  editor: { starterSource: string };
  environment?: { htmlFixture?: string };
  output: { preview: boolean; console: true; runtimeErrors: true; diagnostics: false };
}

/**
 * NOT YET IMPLEMENTED — see PRO IMPLEMENTATION DIRECTIVE §TYPESCRIPT.
 * Declared for forward documentation only. `resolveActivityExperience` and
 * the runtime-manifest builder below reject this kind. Do not construct or
 * rely on it until a real compiler-diagnostics + runtime pipeline backs it.
 */
export interface TypeScriptExperience {
  kind: "typescript";
  language: "typescript";
  editor: { starterSource: string };
  environment?: { htmlFixture?: string };
  output: { preview: boolean; console: true; runtimeErrors: true; diagnostics: true };
}

/**
 * NOT YET IMPLEMENTED — see PRO IMPLEMENTATION DIRECTIVE §REACT.
 * Declared for forward documentation only; no runtime/module-loading
 * strategy has been designed or verified yet.
 */
export interface ReactExperience {
  kind: "react";
  language: "jsx" | "tsx";
  editor: { starterSource: string };
  environment: { entrypoint: string };
  output: { preview: true; console: boolean; runtimeErrors: true };
}

/** Experience kinds this session's resolver and runtime-manifest builder actually support. */
export type ImplementedActivityExperience =
  | MarkupExperience
  | CssExperience
  | JavaScriptExperience
  | DebugExperience;

/** The full conceptual union, including not-yet-implemented forward declarations. */
export type ActivityExperience =
  | ImplementedActivityExperience
  | TypeScriptExperience
  | ReactExperience;

const IMPLEMENTED_EXPERIENCE_KINDS = ["markup", "css", "javascript", "debug"] as const;

function isImplementedExperience(
  experience: ActivityExperience,
): experience is ImplementedActivityExperience {
  return (IMPLEMENTED_EXPERIENCE_KINDS as readonly string[]).includes(experience.kind);
}

/**
 * Schema for the full conceptual union (including `typescript`/`react`) so
 * authored data can be validated for shape even before those runtimes
 * exist. `resolveActivityExperience` additionally rejects not-yet-
 * implemented kinds after shape validation succeeds.
 */
export const activityExperienceSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("markup"),
    language: z.literal("html"),
    editor: z.object({ starterSource: z.string() }),
    output: z.object({ preview: z.literal(true), console: z.literal(false) }),
  }),
  z.object({
    kind: z.literal("css"),
    language: z.literal("css"),
    editor: z.object({ starterSource: z.string() }),
    environment: z.object({ htmlFixture: z.string().min(1) }),
    output: z.object({
      preview: z.literal(true),
      console: z.literal(false),
      computedStyles: z.literal(true),
    }),
  }),
  z.object({
    kind: z.literal("javascript"),
    language: z.literal("javascript"),
    editor: z.object({ starterSource: z.string() }),
    environment: z.object({ htmlFixture: z.string().min(1).optional() }).optional(),
    output: z.object({
      preview: z.boolean(),
      console: z.literal(true),
      runtimeErrors: z.literal(true),
    }),
  }),
  z.object({
    kind: z.literal("debug"),
    language: z.literal("javascript"),
    editor: z.object({ starterSource: z.string() }),
    environment: z.object({ htmlFixture: z.string().min(1).optional() }).optional(),
    output: z.object({
      preview: z.boolean(),
      console: z.literal(true),
      runtimeErrors: z.literal(true),
      diagnostics: z.literal(false),
    }),
  }),
  z.object({
    kind: z.literal("typescript"),
    language: z.literal("typescript"),
    editor: z.object({ starterSource: z.string() }),
    environment: z.object({ htmlFixture: z.string().min(1).optional() }).optional(),
    output: z.object({
      preview: z.boolean(),
      console: z.literal(true),
      runtimeErrors: z.literal(true),
      diagnostics: z.literal(true),
    }),
  }),
  z.object({
    kind: z.literal("react"),
    language: z.enum(["jsx", "tsx"]),
    editor: z.object({ starterSource: z.string() }),
    environment: z.object({ entrypoint: z.string().min(1) }),
    output: z.object({
      preview: z.literal(true),
      console: z.boolean(),
      runtimeErrors: z.literal(true),
    }),
  }),
]);

export type ExperienceSource = "explicit" | "legacy-inferred";

export interface ResolvedExperience {
  experience: ImplementedActivityExperience;
  source: ExperienceSource;
}

/**
 * Default HTML fixture used only when a `css` experience is legacy-inferred
 * and curriculum data supplies no `content.htmlFixture`. Curriculum JSON is
 * not migrated this session, so this default preserves today's rendered
 * behavior. New/updated curriculum content should supply its own fixture.
 */
export const DEFAULT_CSS_PREVIEW_FIXTURE =
  `<nav class="navbar"><span>Forge</span><span>Lessons</span></nav><div class="modal-backdrop"><div class="modal">Modal</div></div>`;

export class ExperienceResolutionError extends Error {
  readonly code = "UNSUPPORTED_ACTIVITY_EXPERIENCE" as const;

  constructor(message: string) {
    super(message);
    this.name = "ExperienceResolutionError";
  }
}

interface ResolvableActivityContent {
  language?: string;
  starterCode?: string;
  buggyCode?: string;
  htmlFixture?: string;
}

interface ResolvableActivity {
  id: string;
  type: string;
  experience?: unknown;
  content: ResolvableActivityContent;
}

/**
 * Single entry point for turning an activity into a validated,
 * implemented `ActivityExperience`.
 *
 * - Returns `activity.experience` directly when explicitly present and
 *   schema-valid, provided its kind is one this session actually
 *   implements a runtime for.
 * - Otherwise derives a legacy experience from `content.language` +
 *   `activity.type`, tagging the result `source: "legacy-inferred"`.
 * - Throws `ExperienceResolutionError` for invalid or unsupported
 *   combinations rather than silently producing a broken manifest.
 */
export function resolveActivityExperience(activity: ResolvableActivity): ResolvedExperience {
  if (activity.experience !== undefined) {
    const parsed = activityExperienceSchema.safeParse(activity.experience);
    if (!parsed.success) {
      throw new ExperienceResolutionError(
        `Activity "${activity.id}" declares an invalid experience: ${parsed.error.message}`,
      );
    }
    if (!isImplementedExperience(parsed.data)) {
      throw new ExperienceResolutionError(
        `Activity "${activity.id}" declares experience kind "${parsed.data.kind}", which has no implemented runtime yet.`,
      );
    }
    return { experience: parsed.data, source: "explicit" };
  }

  return { experience: inferLegacyExperience(activity), source: "legacy-inferred" };
}

function inferLegacyExperience(activity: ResolvableActivity): ImplementedActivityExperience {
  const language = activity.content.language;
  const starterSource =
    activity.type === "debug" ? activity.content.buggyCode : activity.content.starterCode;

  if (starterSource === undefined) {
    throw new ExperienceResolutionError(
      `Activity "${activity.id}" has no source available to resolve an experience from.`,
    );
  }

  if (activity.type === "debug") {
    if (language !== undefined && language !== "javascript") {
      throw new ExperienceResolutionError(
        `Activity "${activity.id}" is a debug activity with language "${language}", which has no implemented debug runtime yet.`,
      );
    }
    const htmlFixture = activity.content.htmlFixture;
    return {
      kind: "debug",
      language: "javascript",
      editor: { starterSource },
      ...(htmlFixture ? { environment: { htmlFixture } } : {}),
      output: { preview: Boolean(htmlFixture), console: true, runtimeErrors: true, diagnostics: false },
    };
  }

  if (language === "html") {
    return {
      kind: "markup",
      language: "html",
      editor: { starterSource },
      output: { preview: true, console: false },
    };
  }

  if (language === "css") {
    return {
      kind: "css",
      language: "css",
      editor: { starterSource },
      environment: { htmlFixture: activity.content.htmlFixture ?? DEFAULT_CSS_PREVIEW_FIXTURE },
      output: { preview: true, console: false, computedStyles: true },
    };
  }

  if (language === "javascript" || language === undefined) {
    const htmlFixture = activity.content.htmlFixture;
    return {
      kind: "javascript",
      language: "javascript",
      editor: { starterSource },
      ...(htmlFixture ? { environment: { htmlFixture } } : {}),
      output: { preview: Boolean(htmlFixture), console: true, runtimeErrors: true },
    };
  }

  throw new ExperienceResolutionError(
    `Activity "${activity.id}" declares language "${language}", which has no implemented runtime yet.`,
  );
}
