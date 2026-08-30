export { HookRenderer } from "./renderers/hook-renderer";
export { VisualRenderer } from "./renderers/visual-renderer";
export { PredictionRenderer } from "./renderers/prediction-renderer";
export { SandboxExperimentRenderer } from "./renderers/sandbox-experiment-renderer";
export { ChallengeRenderer } from "./renderers/challenge-renderer";
export { ExplanationRenderer } from "./renderers/explanation-renderer";
export { MasteryCheckRenderer } from "./renderers/mastery-check-renderer";

/**
 * One entry per `ExperienceKind`. `lesson-experience-player.tsx` switches on
 * `experience.kind` (a discriminated union) and delegates to exactly one of
 * these — this file is the single place that documents "kind -> component",
 * while the player keeps each branch fully typed instead of casting through
 * a uniform prop shape the renderers don't actually share.
 */
export const EXPERIENCE_RENDERER_NAMES = {
  hook: "HookRenderer",
  visual: "VisualRenderer",
  prediction: "PredictionRenderer",
  "sandbox-experiment": "SandboxExperimentRenderer",
  challenge: "ChallengeRenderer",
  explanation: "ExplanationRenderer",
  "mastery-check": "MasteryCheckRenderer",
} as const;
