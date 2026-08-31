import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  REACT_COMPONENT_BROWSER_DESCRIPTOR,
  runReactComponent,
} from "@/lib/lesson-experience/react-family";
import { validateReactResult } from "@/lib/lesson-experience/react-validation-adapter";

const starter = `function App({ label = "React works" }) {
  return <div data-component="App" label={label}><h2>{label}</h2><button data-component="Button">Inspect me</button></div>;
}`;
export function ReactFamilyLab() {
  const [source, setSource] = useState(starter);
  const [result, setResult] = useState<Awaited<ReturnType<typeof runReactComponent>>>(null);
  const validation = useMemo(
    () =>
      result
        ? validateReactResult(result, [
            { kind: "component", name: "App" },
            { kind: "dom-contains", text: "React works" },
          ])
        : null,
    [result],
  );
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge>Phase D</Badge>
          <Badge variant="outline">{REACT_COMPONENT_BROWSER_DESCRIPTOR.family}</Badge>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">React component browser</h1>
        <p className="text-muted-foreground">
          Execute a real React component and inspect its bounded browser evidence.
        </p>
      </header>
      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Component source</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Textarea
              value={source}
              onChange={(event) => setSource(event.target.value)}
              className="min-h-64 font-mono text-sm"
              aria-label="React source"
            />
            <Button
              onClick={async () =>
                setResult(await runReactComponent({ source, props: { label: "React works" } }))
              }
            >
              Run component
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Evidence inspector</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            <div className="rounded-md border bg-muted/30 p-3 font-mono">
              {result?.dom || "Run the component to inspect DOM evidence."}
            </div>
            {result && (
              <div className="flex flex-col gap-2">
                <div>
                  Status:{" "}
                  <Badge variant={result.runtimeError ? "destructive" : "secondary"}>
                    {result.execution.status}
                  </Badge>
                </div>
                <div>Render commits: {result.renderCount}</div>
                <div>
                  Validation: {validation?.passed ? "passed" : validation?.failures.join(" ")}
                </div>
                {result.runtimeError && (
                  <div className="text-destructive">{result.runtimeError}</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
