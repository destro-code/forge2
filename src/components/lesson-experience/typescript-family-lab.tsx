import { useState } from "react";
import { CheckCircle2, Code2, RotateCcw, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  createTypeScriptRun,
  typeScriptCapabilities,
} from "@/lib/lesson-experience/typescript-family";
import { validateTypeScriptRun } from "@/lib/lesson-experience/typescript-validation-adapter";

const STARTER = `const greeting = "hello";
const count = 3;
const message = greeting + " " + count;`;

export function TypeScriptFamilyLab() {
  const [source, setSource] = useState(STARTER);
  const [result, setResult] = useState(() =>
    createTypeScriptRun({ source: STARTER, runId: "lab-1" }),
  );
  const [revision, setRevision] = useState(1);
  const report = validateTypeScriptRun(result, [
    { id: "compiled", kind: "compiled", expected: true },
    { id: "no-errors", kind: "has-error", expected: false },
    { id: "message-type", kind: "inferred-type", expression: "message", expected: "string" },
  ]);

  function run() {
    const nextRevision = revision + 1;
    setRevision(nextRevision);
    setResult(
      createTypeScriptRun({ source, revision: nextRevision, runId: `lab-${nextRevision}` }),
    );
  }

  function reset() {
    setSource(STARTER);
    setRevision(1);
    setResult(createTypeScriptRun({ source: STARTER, runId: "lab-1" }));
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-3 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <Badge variant="outline" className="w-fit gap-2">
              <Code2 /> TypeScript family
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
              Make types visible.
            </h1>
            <p className="max-w-2xl leading-6 text-muted-foreground">
              Compile an isolated lesson artifact, inspect real diagnostics, and see what the
              TypeChecker infers.
            </p>
          </div>
          <Button variant="outline" onClick={reset}>
            <RotateCcw data-icon="inline-start" /> Reset
          </Button>
        </header>
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Card>
            <CardHeader>
              <CardTitle>Lesson workspace</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Textarea
                value={source}
                onChange={(event) => setSource(event.target.value)}
                className="min-h-56 font-mono text-sm"
                aria-label="TypeScript source"
              />
              <Button onClick={run}>Compile and inspect</Button>
              <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">Validation</span>
                  <Badge variant={report.status === "pass" ? "secondary" : "destructive"}>
                    {report.status}
                  </Badge>
                </div>
                {report.assertions.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 text-sm">
                    {item.status === "passed" ? (
                      <CheckCircle2 className="text-primary" />
                    ) : (
                      <TriangleAlert className="text-destructive" />
                    )}
                    <span>{item.message}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <aside className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Diagnostics</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                {result.diagnostics.length === 0 ? (
                  <p className="text-muted-foreground">
                    No diagnostics. This artifact compiles cleanly.
                  </p>
                ) : (
                  result.diagnostics.map((item, index) => (
                    <div
                      key={`${item.code}-${index}`}
                      className="rounded-md border border-border p-3"
                    >
                      <code className="font-mono">TS{item.code}</code>
                      <p className="mt-1 text-muted-foreground">{item.message}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Inferred types</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {Object.entries(result.inferredTypes).map(([name, type]) => (
                  <div key={name} className="flex justify-between gap-3 text-sm">
                    <code className="font-mono">{name}</code>
                    <Badge variant="outline">{type}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Capability contract</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-xs">
                {typeScriptCapabilities().map((capability) => (
                  <div key={capability.name} className="flex justify-between gap-3">
                    <code className="font-mono text-muted-foreground">{capability.name}</code>
                    <Badge variant="secondary">available</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </aside>
        </section>
      </div>
    </main>
  );
}
