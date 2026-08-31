import { useMemo, useState } from "react";
import {
  ReactNativeRuntimeHost,
  type NativeScenario,
} from "@/lib/lesson-experience/react-native-runtime-host";
import { validateReactNativeEvidence } from "@/lib/lesson-experience/react-native-validation-adapter";

const scenario: NativeScenario = {
  id: "counter",
  version: 1,
  screen: { width: 390, height: 844, scale: 3 },
  initialState: { count: 0 },
  transitions: [{ action: { type: "press", targetId: "increment" }, state: { count: 1 } }],
  root: {
    id: "root",
    type: "View",
    props: { testID: "counter-screen" },
    layout: { x: 0, y: 0, width: 390, height: 844 },
    children: [
      {
        id: "title",
        type: "Text",
        props: { text: "Native counter" },
        layout: { x: 24, y: 32, width: 220, height: 40 },
        accessibility: { role: "header", label: "Native counter", focusable: false },
      },
      {
        id: "increment",
        type: "Pressable",
        props: { accessibilityRole: "button" },
        layout: { x: 24, y: 120, width: 160, height: 48 },
        accessibility: { role: "button", label: "Increment count", focusable: true },
      },
    ],
  },
};

export function ReactNativeFamilyLab() {
  const [profile, setProfile] = useState("ios");
  const [result, setResult] = useState<ReturnType<ReactNativeRuntimeHost["run"]> | null>(null);
  const host = useMemo(() => new ReactNativeRuntimeHost(scenario), []);
  const run = () => setResult(host.run());
  const act = () => setResult(host.act({ type: "press", targetId: "increment" }));
  const report =
    result &&
    validateReactNativeEvidence({
      runId: result.runId,
      revision: result.revision,
      evidence: result.evidence,
      expected: {
        nodeId: result.revision === 1 ? "increment" : undefined,
        state: result.revision > 1 ? { count: 1 } : undefined,
        eventType: result.revision > 1 ? "press" : undefined,
      },
    });
  return (
    <main className="min-h-screen bg-background p-4 text-foreground md:p-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Development-only architecture proof
          </p>
          <h1 className="text-balance text-3xl font-semibold">React Native runtime family</h1>
          <p className="max-w-2xl leading-6 text-muted-foreground">
            A deterministic declarative simulation of native trees, layout, state, events,
            accessibility, and platform profiles. No React Native app or device code executes.
          </p>
        </header>
        <section className="flex flex-wrap items-end gap-4 rounded-lg border bg-card p-4">
          <label className="flex flex-col gap-2 text-sm">
            Platform profile
            <select
              className="rounded-md border bg-background p-2"
              value={profile}
              onChange={(event) => setProfile(event.target.value)}
            >
              <option value="ios">iOS · deterministic device</option>
              <option value="android">Android · deterministic device</option>
            </select>
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
              onClick={run}
            >
              Mount scenario
            </button>
            <button className="rounded-md border px-4 py-2" onClick={act}>
              Press increment
            </button>
            <button
              className="rounded-md border px-4 py-2"
              onClick={() => {
                host.reset();
                setResult(null);
              }}
            >
              Reset
            </button>
            <button
              className="rounded-md border px-4 py-2"
              onClick={() => {
                host.dispose();
                setResult(null);
              }}
            >
              Dispose
            </button>
          </div>
        </section>
        <section className="grid gap-4 md:grid-cols-2">
          {[
            ["Platform", { profile, screen: scenario.screen }],
            ["Evidence", result?.evidence.items],
            ["Validation", report],
          ].map(([title, value]) => (
            <section
              key={title as string}
              className="flex min-h-32 flex-col gap-3 rounded-lg border bg-card p-4"
            >
              <h2 className="font-medium">{title as string}</h2>
              <pre className="max-h-80 overflow-auto text-xs">
                {value
                  ? JSON.stringify(value, null, 2)
                  : "Run the declared native scenario to inspect evidence."}
              </pre>
            </section>
          ))}
        </section>
        <section className="rounded-lg border bg-card p-4">
          <h2 className="font-medium">Lifecycle</h2>
          <p className="font-mono text-sm">
            {result
              ? `${result.status} · ${result.runId} · revision ${result.revision}`
              : "idle · ready"}
          </p>
        </section>
      </div>
    </main>
  );
}
