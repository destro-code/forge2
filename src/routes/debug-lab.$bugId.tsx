import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CodeBlock } from "@/components/shared/code-block";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { InteractiveBugSimulator } from "@/components/debug-lab/interactive-bug-simulator";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { MonacoEditor } from "@/components/shared/monaco-editor";
import { useBug } from "@/lib/hooks/use-content";
import { useProgress } from "@/lib/hooks/use-progress";
import {
  ArrowLeft,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  FileCode,
  Activity,
  Award,
} from "lucide-react";
import { useState, lazy, Suspense, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/debug-lab/$bugId")({
  head: () => ({
    meta: [
      { title: "Debug challenge · Forge" },
      {
        name: "description",
        content: "Investigate, diagnose and fix — interactive bug sandbox and solution breakdown.",
      },
      { property: "og:title", content: "Forge debug challenge" },
      { property: "og:description", content: "Diagnose and fix the bug." },
    ],
  }),
  component: BugView,
});

function BugView() {
  const { bugId } = Route.useParams();
  const bug = useBug(bugId);
  const { solvedBugs = [], completeBug, saveNote, notes } = useProgress();

  const [revealed, setRevealed] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<"broken" | "fixed">("broken");
  const [investigationNote, setInvestigationNote] = useState(notes[`bug:${bugId}`] || "");
  const [userCode, setUserCode] = useState(bug?.brokenCode || "");

  useEffect(() => {
    if (bug && userCode === "") {
      setUserCode(bug.brokenCode);
    }
  }, [bug, userCode]);

  if (!bug) {
    return (
      <div className="space-y-4 py-12 text-center">
        <h2 className="text-xl font-bold">Bug Not Found</h2>
        <p className="text-sm text-muted-foreground">
          The requested debug challenge could not be found.
        </p>
        <Button asChild variant="outline">
          <Link to="/debug-lab">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Debug Lab
          </Link>
        </Button>
      </div>
    );
  }

  const isSolved = solvedBugs.includes(bug.id);

  const handleTestsPass = () => {
    if (!isSolved) {
      completeBug(bug.id);
      toast.success(`Challenge Completed! You solved '${bug.title}' 🎉`);
    }
  };

  const handleNoteChange = (text: string) => {
    setInvestigationNote(text);
    saveNote(`bug:${bugId}`, text);
  };

  return (
    <div className="space-y-8">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild className="-ml-2">
          <Link to="/debug-lab">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Debug Lab
          </Link>
        </Button>

        {isSolved && (
          <Badge className="bg-emerald-600 hover:bg-emerald-600 gap-1 py-1 px-3">
            <CheckCircle2 className="h-3.5 w-3.5" /> Solved
          </Badge>
        )}
      </div>

      <PageHeader
        eyebrow={`Debug Challenge · ${bug.category.replace("_", " ").toUpperCase()}`}
        title={bug.title}
        description={bug.brief}
        actions={
          <div className="flex items-center gap-2">
            <DifficultyBadge difficulty={bug.difficulty} />
            <Badge variant="outline">{bug.estimatedMinutes} min</Badge>
          </div>
        }
      />

      {/* Main Grid Workspace */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Interactive Simulator & Code View */}
        <div className="lg:col-span-7 space-y-6">
          {/* Live Interactive Sandbox */}
          {bug.interactiveType && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-primary" /> Live Diagnostic Simulation
                </span>
              </div>

              <ErrorBoundary
                title="Interactive Simulator Error"
                description="An unexpected exception occurred inside this bug diagnostic simulator."
              >
                <InteractiveBugSimulator
                  bug={bug}
                  userCode={activeCodeTab === "fixed" ? bug.fixedCode : userCode}
                  onAllTestsPass={handleTestsPass}
                />
              </ErrorBoundary>
            </div>
          )}

          {/* Code Inspector Tabs */}
          <Card className="border-border/60">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-border/40">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileCode className="h-4 w-4 text-primary" />
                Code Inspector
              </CardTitle>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={activeCodeTab === "broken" ? "secondary" : "ghost"}
                  onClick={() => setActiveCodeTab("broken")}
                  className="text-xs h-7"
                >
                  Your Fix
                </Button>
                <Button
                  size="sm"
                  variant={activeCodeTab === "fixed" ? "secondary" : "ghost"}
                  onClick={() => {
                    setActiveCodeTab("fixed");
                    setRevealed(true);
                  }}
                  className="text-xs h-7"
                >
                  Fixed Solution
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {activeCodeTab === "broken" ? (
                <div className="space-y-2">
                  <div className="text-xs text-destructive font-mono flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="h-3.5 w-3.5" /> Your Fix Implementation
                  </div>
                  <div className="h-[400px] mt-2 rounded overflow-hidden border border-border">
                    <Suspense
                      fallback={
                        <div className="p-4 text-xs text-muted-foreground">Loading editor...</div>
                      }
                    >
                      <MonacoEditor
                        height="100%"
                        language="typescript"
                        theme="vs-dark"
                        value={userCode}
                        onChange={(val) => setUserCode(val || "")}
                        options={{
                          minimap: { enabled: false },
                          fontSize: 13,
                          wordWrap: "on",
                          scrollBeyondLastLine: false,
                          padding: { top: 16 },
                        }}
                      />
                    </Suspense>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs text-emerald-400 font-mono flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Corrected Code Implementation
                  </div>
                  <CodeBlock language="tsx" code={bug.fixedCode} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Symptoms Checklist */}
          {bug.symptoms && bug.symptoms.length > 0 && (
            <Card className="border-border/60">
              <CardHeader className="py-3 px-4 border-b border-border/40">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                  Observed Runtime Symptoms
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {bug.symptoms.map((sym, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-destructive font-bold mt-0.5">•</span>
                      <span>{sym}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Hints, Solution, Investigation Notes */}
        <div className="lg:col-span-5 space-y-6">
          {/* Progressive Hints */}
          <Card className="border-border/60">
            <CardHeader className="py-3 px-4 border-b border-border/40">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-400" />
                Diagnostic Hints
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <Accordion type="single" collapsible className="w-full">
                {bug.hints.map((hint, idx) => (
                  <AccordionItem key={idx} value={`hint-${idx}`}>
                    <AccordionTrigger className="text-xs font-medium py-2.5">
                      Hint #{idx + 1}: {hint.title}
                    </AccordionTrigger>
                    <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                      {hint.content}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* Solution & Root Cause Analysis */}
          <Card className="border-border/60">
            <CardHeader className="py-3 px-4 border-b border-border/40">
              <CardTitle className="text-sm font-medium">Solution & Root Cause</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {revealed ? (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">{bug.explanation}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() => setActiveCodeTab("fixed")}
                  >
                    View Fixed Code
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 text-center py-2">
                  <p className="text-xs text-muted-foreground">
                    Try diagnosing the bug yourself first using the live simulator and code
                    inspector!
                  </p>
                  <Button
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() => {
                      setRevealed(true);
                      setActiveCodeTab("fixed");
                    }}
                  >
                    <Eye className="mr-2 h-3.5 w-3.5" /> Reveal Full Solution
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Investigation Notes Scratchpad */}
          <Card className="border-border/60">
            <CardHeader className="py-3 px-4 border-b border-border/40">
              <CardTitle className="text-sm font-medium">Investigation Notes</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <Textarea
                placeholder="Jot down your hypotheses, console trace findings, or fix notes here..."
                value={investigationNote}
                onChange={(e) => handleNoteChange(e.target.value)}
                className="min-h-32 text-xs font-mono"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
