import type { InteractiveCodeActivity } from "@/lib/curriculum/types";
import type { CapabilityRequirement, RuntimeRequest } from "./contracts";
import { BrowserFamilyAdapter, browserCapabilities } from "./browser-family";

export interface CanonicalBrowserRuntimeActivity {
  activityId: string;
  title: string;
  language: "javascript";
  source: string;
  capabilities: readonly CapabilityRequirement[];
  request: RuntimeRequest;
}

export function toCanonicalBrowserRuntimeActivity(
  activity: InteractiveCodeActivity,
  source: string,
): CanonicalBrowserRuntimeActivity {
  if (activity.content.language !== "javascript") {
    throw new Error(
      `Browser runtime integration only supports JavaScript, received ${activity.content.language}.`,
    );
  }
  const adapter = new BrowserFamilyAdapter("canonical-interactive-code");
  return {
    activityId: activity.id,
    title: activity.content.title ?? "Interactive code activity",
    language: "javascript",
    source,
    capabilities: browserCapabilities(),
    request: {
      family: "browser-document",
      deterministic: true,
      network: "deny",
      timeoutMs: adapter.timeoutMs,
    },
  };
}

export function createCanonicalBrowserAdapter(host = "canonical-interactive-code") {
  return new BrowserFamilyAdapter(host);
}
