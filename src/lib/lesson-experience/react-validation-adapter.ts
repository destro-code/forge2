import type { ReactRunResult } from "./react-family";

export type ReactValidation =
  | { kind: "dom-contains"; text: string }
  | { kind: "component"; name: string }
  | { kind: "prop"; name: string; value: string }
  | { kind: "render-count"; min: number };

export function validateReactResult(
  result: ReactRunResult | null,
  checks: readonly ReactValidation[],
) {
  const failures: string[] = [];
  for (const check of checks) {
    if (!result) {
      failures.push("React run is stale or unavailable.");
      continue;
    }
    if (check.kind === "dom-contains" && !result.dom.includes(check.text))
      failures.push(`DOM does not contain ${check.text}.`);
    if (check.kind === "component" && !result.dom.includes(`data-component="${check.name}"`))
      failures.push(`Component ${check.name} was not observed.`);
    if (check.kind === "prop" && !result.dom.includes(`${check.name}="${check.value}"`))
      failures.push(`Prop ${check.name} did not equal ${check.value}.`);
    if (check.kind === "render-count" && result.renderCount < check.min)
      failures.push(`Expected at least ${check.min} render commits.`);
  }
  return { passed: failures.length === 0, failures };
}
