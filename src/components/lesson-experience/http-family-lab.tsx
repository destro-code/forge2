import { useMemo, useState } from "react";
import { FlaskConical, RotateCcw, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { HTTP_SCENARIOS } from "@/lib/lesson-experience/http-scenarios";
import { HttpRuntimeHost, type HttpRequestInput } from "@/lib/lesson-experience/http-runtime-host";
import { validateHttp } from "@/lib/lesson-experience/http-validation-adapter";
import { RUNTIME_FAMILY_DESCRIPTORS } from "@/lib/lesson-experience/contracts";

const requests: Record<string, HttpRequestInput> = {
  "get-success": { method: "GET", path: "/api/profile" },
  "get-not-found": { method: "GET", path: "/api/missing" },
  "controlled-500": { method: "GET", path: "/api/failure" },
  "post-json": { method: "POST", path: "/api/profile", body: '{"name":"Ada"}' },
  login: {
    method: "POST",
    path: "/api/login",
    body: '{"email":"ada@example.com"}',
    sequenceId: "login-profile",
    sequenceIndex: 0,
  },
  "profile-after-login": {
    method: "GET",
    path: "/api/me",
    sequenceId: "login-profile",
    sequenceIndex: 1,
  },
};
export function HttpFamilyLab() {
  const host = useMemo(() => new HttpRuntimeHost(HTTP_SCENARIOS), []);
  const [result, setResult] = useState<ReturnType<HttpRuntimeHost["run"]>>();
  const [selected, setSelected] = useState("get-success");
  const request = requests[selected];
  function run() {
    setResult(host.run(request));
  }
  const descriptor = RUNTIME_FAMILY_DESCRIPTORS.find((item) => item.family === "http-api")!;
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-3 border-b border-border pb-6">
          <Badge variant="outline" className="w-fit gap-2">
            <FlaskConical /> API development lab
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Request, observe, validate.
          </h1>
          <p className="max-w-2xl leading-6 text-muted-foreground">
            A deterministic HTTP family for practicing request contracts, controlled failures, and
            dependent API sequences without network access.
          </p>
        </header>
        <section className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Fixtures</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {HTTP_SCENARIOS.map((scenario) => (
                  <Button
                    key={scenario.id}
                    variant={selected === scenario.id ? "secondary" : "ghost"}
                    className="h-auto justify-start whitespace-normal px-3 py-3 text-left"
                    onClick={() => {
                      setSelected(scenario.id);
                      setResult(undefined);
                    }}
                  >
                    {scenario.method} {scenario.path}
                  </Button>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Architecture</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-xs">
                <Row label="Adapter" value="API validation" />
                <Row label="Host" value="HttpRuntimeHost" />
                <Row label="Matcher" value="Controlled scenarios" />
                <Row label="Network" value="Denied" />
                <Separator />
                {descriptor.capabilities.map((capability) => (
                  <Row key={capability.name} label="Capability" value={capability.name} />
                ))}
              </CardContent>
            </Card>
          </aside>
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>
                  {request.method} {request.path}
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Run the selected fixture and inspect typed evidence.
                </p>
              </div>
              <Button onClick={run}>
                <Send data-icon="inline-start" /> Send request
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {result ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={result.ok ? "default" : "destructive"}>
                      {result.ok
                        ? "Matched"
                        : (result.error?.code ?? `HTTP ${result.response?.status}`)}
                    </Badge>
                    <Badge variant="outline">revision {result.revision}</Badge>
                  </div>
                  <pre className="max-h-72 overflow-auto rounded-md border border-border bg-muted p-4 text-xs leading-6">
                    {JSON.stringify(result.response ?? result.error, null, 2)}
                  </pre>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-medium">Validation report</h2>
                    <Badge
                      variant={
                        validateHttp(result.runId, result.revision, result.evidence.items, [
                          {
                            method: request.method,
                            path: request.path,
                            status: result.response?.status,
                            errorCode: result.error?.code,
                          },
                        ]).status === "pass"
                          ? "default"
                          : "destructive"
                      }
                    >
                      {
                        validateHttp(result.runId, result.revision, result.evidence.items, [
                          {
                            method: request.method,
                            path: request.path,
                            status: result.response?.status,
                            errorCode: result.error?.code,
                          },
                        ]).status
                      }
                    </Badge>
                  </div>
                  <pre className="max-h-56 overflow-auto rounded-md border border-border p-4 text-xs">
                    {JSON.stringify(result.evidence.items, null, 2)}
                  </pre>
                </>
              ) : (
                <div className="flex min-h-72 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                  <p>No request run yet.</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      host.reset();
                      setResult(undefined);
                    }}
                  >
                    <RotateCcw data-icon="inline-start" /> Reset host
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <code className="max-w-[180px] truncate text-right font-mono">{value}</code>
    </div>
  );
}
