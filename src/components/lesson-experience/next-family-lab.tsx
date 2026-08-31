import { useMemo, useState } from "react";
import {
  NEXT_DESCRIPTOR,
  NextRuntimeHost,
  type NextScenario,
} from "@/lib/lesson-experience/next-runtime-host";
import { validateNextEvidence } from "@/lib/lesson-experience/next-validation-adapter";

const scenarios: NextScenario[] = [
  {
    id: "static",
    version: 1,
    pathname: "/docs",
    routeId: "docs",
    kind: "static",
    renderMode: "server-rendered",
    boundary: "server",
    response: { status: 200, body: "Server-rendered documentation" },
    cache: "hit",
  },
  {
    id: "dynamic",
    version: 1,
    pathname: "/users/[id]",
    routeId: "user",
    kind: "dynamic",
    renderMode: "dynamic",
    boundary: "server",
    response: { status: 200, body: "User profile" },
    cache: "miss",
  },
  {
    id: "protected",
    version: 1,
    pathname: "/dashboard",
    routeId: "dashboard",
    kind: "static",
    renderMode: "server-rendered",
    boundary: "server",
    middleware: [{ id: "auth", action: "redirect", target: "/login" }],
    response: { status: 200, body: "Protected dashboard" },
  },
  {
    id: "client",
    version: 1,
    pathname: "/interactive",
    routeId: "interactive",
    kind: "static",
    renderMode: "client-rendered",
    boundary: "client",
    response: { status: 200, body: "Client boundary" },
  },
];
export function NextFamilyLab() {
  const [selected, setSelected] = useState("static");
  const [path, setPath] = useState("/docs");
  const [result, setResult] = useState<ReturnType<NextRuntimeHost["run"]> | null>(null);
  const host = useMemo(() => new NextRuntimeHost(scenarios), []);
  const scenario = scenarios.find((item) => item.id === selected) ?? scenarios[0];
  const run = () => setResult(host.run({ path }));
  const report =
    result &&
    validateNextEvidence({
      runId: result.runId,
      revision: result.revision,
      evidence: result.evidence,
      expected: { routeId: result.ok ? scenario.routeId : undefined },
    });
  return (
    <main className="min-h-screen bg-background p-4 text-foreground md:p-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Development-only architecture proof
          </p>
          <h1 className="text-balance text-3xl font-semibold">Next.js runtime family</h1>
          <p className="max-w-2xl leading-6 text-muted-foreground">
            A declarative framework model for route resolution, middleware, rendering, boundaries,
            and deterministic cache state. No Next.js application code executes.
          </p>
        </header>
        <section className="flex flex-col gap-4 rounded-lg border bg-card p-4">
          <label className="flex flex-col gap-2 text-sm">
            Scenario
            <select
              className="rounded-md border bg-background p-2"
              value={selected}
              onChange={(e) => {
                const next = scenarios.find((s) => s.id === e.target.value)!;
                setSelected(next.id);
                setPath(next.pathname);
              }}
              aria-label="Scenario"
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} · {s.renderMode}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm">
            Request path
            <input
              className="rounded-md border bg-background p-2 font-mono"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              aria-label="Request path"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
              onClick={run}
            >
              Resolve and render
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
          <Panel title="Architecture">
            <pre className="overflow-auto text-xs">
              {JSON.stringify(
                {
                  family: NEXT_DESCRIPTOR.family,
                  capabilities: NEXT_DESCRIPTOR.capabilities.map((c) => c.name),
                  security: NEXT_DESCRIPTOR.security,
                },
                null,
                2,
              )}
            </pre>
          </Panel>
          <Panel title="Evidence">
            <pre className="max-h-96 overflow-auto text-xs">
              {result
                ? JSON.stringify(result.evidence.items, null, 2)
                : "Run a declared scenario to inspect typed evidence."}
            </pre>
          </Panel>
          <Panel title="Validation">
            <pre className="text-xs">
              {report
                ? JSON.stringify({ status: report.status, assertions: report.assertions }, null, 2)
                : "Validation consumes host evidence."}
            </pre>
          </Panel>
          <Panel title="Lifecycle">
            <p className="font-mono text-sm">
              {result
                ? `${result.status} · ${result.runId} · revision ${result.revision}`
                : "idle · ready"}
            </p>
          </Panel>
        </section>
      </div>
    </main>
  );
}
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex min-h-32 flex-col gap-3 rounded-lg border bg-card p-4">
      <h2 className="font-medium">{title}</h2>
      {children}
    </section>
  );
}
