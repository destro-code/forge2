import { useMemo, useRef, useState } from "react";
import { CheckCircle2, FlaskConical, Play, RotateCcw, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SandboxRuntimeHost } from "@/lib/compiler/sandbox-runtime-host";
import {
  BrowserFamilyAdapter,
  type BrowserRuntimeMessage,
} from "@/lib/lesson-experience/browser-family";
import {
  validateBrowserEvidence,
  type BrowserValidationDefinition,
} from "@/lib/lesson-experience/browser-validation-adapter";

const fixture = `<!doctype html><html><body style="font-family: sans-serif; color: #16324f"><main id="app"><h1>Runtime lab ready</h1><p id="status">Deterministic browser fixture</p></main><script>
const revision = 1;
console.log = (message) => parent.postMessage({ type: "CONSOLE_OUTPUT", level: "log", message, workspaceRevision: revision }, "*");
window.onerror = (message, source, line, column, error) => parent.postMessage({ type: "RUNTIME_ERROR", error: { message, line, column }, workspaceRevision: revision }, "*");
parent.postMessage({ type: "DOM_SNAPSHOT", html: document.body.innerHTML, workspaceRevision: revision }, "*");
parent.postMessage({ type: "COMPUTED_STYLE", target: "#status", property: "color", value: getComputedStyle(document.querySelector("#status")).color, workspaceRevision: revision }, "*");
console.log("fixture-mounted");
</script></body></html>`;

const assertions: BrowserValidationDefinition[] = [
  {
    id: "has-heading",
    kind: "dom-text" as const,
    target: "#app",
    expected: "Runtime lab ready",
    message: "The fixture heading should be present.",
  },
  {
    id: "has-status",
    kind: "dom-exists" as const,
    target: 'id="status"',
    message: "The status node should exist.",
  },
  {
    id: "mounted-log",
    kind: "console" as const,
    expected: "fixture-mounted",
    message: "The fixture should report its mount lifecycle.",
  },
  {
    id: "no-errors",
    kind: "no-runtime-error" as const,
    message: "The fixture should run without runtime errors.",
  },
];

export function BrowserFamilyLab() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hostRef = useRef<SandboxRuntimeHost | null>(null);
  const adapter = useMemo(() => new BrowserFamilyAdapter("sandbox://browser-fixture"), []);
  const [messages, setMessages] = useState<BrowserRuntimeMessage[]>([]);
  const [result, setResult] = useState<ReturnType<BrowserFamilyAdapter["collect"]>>();
  const [running, setRunning] = useState(false);
  const [revision, setRevision] = useState(0);

  function run() {
    const iframe = iframeRef.current;
    if (!iframe) return;
    hostRef.current?.dispose();
    const runInfo = adapter.beginRun();
    const collected: BrowserRuntimeMessage[] = [];
    const host = new SandboxRuntimeHost({
      iframe,
      workspaceRevision: 1,
      onMessage: (event) => {
        const message = event.data as BrowserRuntimeMessage;
        collected.push(message);
        setMessages([...collected]);
        if (message.type === "CONSOLE_OUTPUT") {
          setResult(adapter.collect(runInfo.runId, runInfo.revision, collected));
          setRunning(false);
        }
      },
    });
    host.mount();
    hostRef.current = host;
    setMessages([]);
    setResult(undefined);
    setRevision(runInfo.revision);
    setRunning(true);
    iframe.srcdoc = fixture;
  }

  function reset() {
    hostRef.current?.dispose();
    adapter.reset();
    setResult(undefined);
    setMessages([]);
    setRunning(false);
    setRevision(adapter.currentRevision);
    if (iframeRef.current) iframeRef.current.srcdoc = "";
  }

  const report = result ? validateBrowserEvidence(result.evidence, assertions) : undefined;
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-3 border-b border-border pb-6">
          <Badge variant="outline" className="w-fit gap-2">
            <FlaskConical /> Browser development lab
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
            Run the browser. Inspect the evidence.
          </h1>
          <p className="max-w-2xl leading-6 text-muted-foreground">
            A real sandboxed iframe exercises the browser protocol without network access, then
            turns lifecycle messages into typed validation evidence.
          </p>
        </header>
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="flex min-w-0 flex-col gap-4">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle>Sandbox preview</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Canonical sandbox: scripts and modals only.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={run} disabled={running}>
                    <Play data-icon="inline-start" /> {running ? "Running" : "Run fixture"}
                  </Button>
                  <Button variant="outline" onClick={reset}>
                    <RotateCcw data-icon="inline-start" /> Reset
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <iframe
                  ref={iframeRef}
                  title="Forge browser fixture"
                  className="min-h-64 w-full rounded-md border border-border bg-card"
                  sandbox="allow-scripts allow-modals"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Evidence stream</CardTitle>
              </CardHeader>
              <CardContent>
                {messages.length ? (
                  <pre className="max-h-72 overflow-auto rounded-md border border-border bg-muted p-4 text-xs leading-6">
                    {JSON.stringify(messages, null, 2)}
                  </pre>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Run the fixture to collect console, DOM, and computed-style messages.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
          <aside className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Runtime state</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-xs">
                <Row
                  label="Host"
                  value={hostRef.current?.isDisposed ? "disposed" : running ? "mounted" : "ready"}
                />
                <Row label="Revision" value={String(revision)} />
                <Row label="Messages" value={String(messages.length)} />
                <Row label="Network" value="denied" />
                <Separator />
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ShieldCheck className="size-4" /> Authenticated revision filter
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-base">Validation</CardTitle>
                {report && (
                  <Badge variant={report.status === "pass" ? "default" : "destructive"}>
                    {report.status}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {report ? (
                  report.assertions.map((item) => (
                    <div key={item.id} className="flex items-start gap-2 text-sm">
                      <CheckCircle2
                        className={
                          item.status === "passed"
                            ? "mt-0.5 size-4 text-primary"
                            : "mt-0.5 size-4 text-destructive"
                        }
                      />
                      <span>
                        {item.status === "passed" ? "Passed" : "Failed"}: {item.id}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No validation report yet.</p>
                )}
              </CardContent>
            </Card>
          </aside>
        </section>
      </div>
    </main>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <code className="font-mono">{value}</code>
    </div>
  );
}
