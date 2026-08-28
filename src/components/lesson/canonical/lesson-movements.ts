import type { ActivityType } from "@/lib/curriculum/types";
import {
  Compass,
  Eye,
  BookOpen,
  GitBranch,
  Hammer,
  Target,
  Feather,
  Award,
  type LucideIcon,
} from "lucide-react";

/**
 * Forge "movements".
 *
 * A lesson is not a flat sequence of cards — it flows through a small set of
 * distinct *movements*, each with its own intent, verb, icon and secondary
 * hue. The ember/graphite Forge identity stays dominant everywhere; each
 * movement contributes a recognizable accent so the learner can *feel* where
 * they are (calm study vs. hands-on forging vs. a knowledge check) without a
 * literal "Step 3 of 7" label.
 *
 * Hues are expressed as raw oklch triples so the shell can compose them into
 * CSS custom properties for ambient tinting, rails and glows.
 */
export type MovementId =
  | "orient"
  | "see"
  | "grasp"
  | "predict"
  | "forge"
  | "prove"
  | "reflect"
  | "temper";

export interface Movement {
  id: MovementId;
  /** Short noun shown as the movement identity, e.g. "Discover". */
  label: string;
  /** One-line intent shown under the label. */
  tagline: string;
  icon: LucideIcon;
  /** oklch triple "L C H" for the movement accent. */
  hue: string;
  /** Perceptual "energy" of the movement — drives ambient intensity. */
  energy: "calm" | "active" | "hot";
}

export const MOVEMENTS: Record<MovementId, Movement> = {
  orient: {
    id: "orient",
    label: "Orient",
    tagline: "Get your bearings",
    icon: Compass,
    hue: "0.72 0.19 45",
    energy: "calm",
  },
  see: {
    id: "see",
    label: "Discover",
    tagline: "See the system work",
    icon: Eye,
    hue: "0.74 0.13 220",
    energy: "active",
  },
  grasp: {
    id: "grasp",
    label: "Understand",
    tagline: "Build the mental model",
    icon: BookOpen,
    hue: "0.72 0.045 250",
    energy: "calm",
  },
  predict: {
    id: "predict",
    label: "Predict",
    tagline: "Reason before you run it",
    icon: GitBranch,
    hue: "0.70 0.16 300",
    energy: "active",
  },
  forge: {
    id: "forge",
    label: "Forge",
    tagline: "Build it with your hands",
    icon: Hammer,
    hue: "0.70 0.20 38",
    energy: "hot",
  },
  prove: {
    id: "prove",
    label: "Prove",
    tagline: "Show what you know",
    icon: Target,
    hue: "0.80 0.15 85",
    energy: "active",
  },
  reflect: {
    id: "reflect",
    label: "Reflect",
    tagline: "Make it your own",
    icon: Feather,
    hue: "0.72 0.13 162",
    energy: "calm",
  },
  temper: {
    id: "temper",
    label: "Temper",
    tagline: "Set the skill",
    icon: Award,
    hue: "0.76 0.17 55",
    energy: "hot",
  },
};

const ACTIVITY_TO_MOVEMENT: Record<ActivityType, MovementId> = {
  intro: "orient",
  visual: "see",
  explanation: "grasp",
  "code-example": "grasp",
  summary: "grasp",
  "output-prediction": "predict",
  "interactive-code": "forge",
  debug: "forge",
  "multiple-choice": "prove",
  "multi-select": "prove",
  "fill-blank": "prove",
  ordering: "prove",
  judgment: "prove",
  reflection: "reflect",
  completion: "temper",
};

export function movementForActivityType(type: ActivityType): Movement {
  return MOVEMENTS[ACTIVITY_TO_MOVEMENT[type] ?? "grasp"];
}

/** CSS custom properties a movement contributes to the shell / a renderer. */
export function movementVars(movement: Movement): Record<string, string> {
  return {
    "--m-accent": `oklch(${movement.hue})`,
    "--m-accent-soft": `oklch(${movement.hue} / 0.14)`,
    "--m-accent-line": `oklch(${movement.hue} / 0.32)`,
    "--m-glow": `oklch(${movement.hue} / ${movement.energy === "hot" ? "0.20" : movement.energy === "active" ? "0.14" : "0.08"})`,
  };
}
