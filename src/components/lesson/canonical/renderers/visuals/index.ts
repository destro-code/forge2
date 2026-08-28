import type { ComponentType } from "react";
import { LayerStack } from "./layer-stack";
import { RequestFlow } from "./request-flow";

/**
 * Interactive visual registry.
 *
 * A canonical `visual` activity may declare an `interactive` block in its
 * content. When present, the visual renderer mounts the matching component
 * below (a genuinely manipulable model) instead of falling back to a static
 * figure. Keeping this a small, explicit registry — rather than eval'd config
 * — means every interactive is a real, reviewed React component.
 *
 * Each registered component declares its own strongly-typed `config` shape
 * (e.g. `LayerStackData`, `RequestFlowData`). The registry itself is typed
 * loosely (`ComponentType<any>`) because it stores components with different
 * prop shapes side by side under one map — correctness is enforced by the
 * `kind` string pairing each activity's `interactive.config` with the right
 * component, not by the registry's storage type.
 */
export const INTERACTIVE_VISUALS: Record<string, ComponentType<any>> = {
  "layer-stack": LayerStack,
  "request-flow": RequestFlow,
};

export function getInteractiveVisual(kind: string | undefined) {
  if (!kind) return null;
  return INTERACTIVE_VISUALS[kind] ?? null;
}
