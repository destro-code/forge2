import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { CodeBlock } from "@/components/shared/code-block";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { InteractiveBugSimulator } from "@/components/debug-lab/interactive-bug-simulator";
import { useProgress } from "@/lib/hooks/use-progress";
import bugsData from "@/data/bugs.json";
import type { Bug } from "@/lib/types";
import {
  ArrowLeft,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  FileCode,
  Activity,
  Award,
  Terminal,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/debug-lab/$bugId")({
  loader: ({ params }) => {
    const bugExists = (bugsData as Bug[]).some((b) => b.id === params.bugId);
    if (!bugExists) {
      throw notFound();
    }
  },
  head: () => ({
    meta: [
      { title: "Debug challenge · Forge" },
      {
        name: "description",
        content:
          "Investigate, diagnose and fix — Sandpack interactive bug sandbox and solution breakdown.",
      },
      { property: "og:title", content: "Forge debug challenge" },
      { property: "og:description", content: "Diagnose and fix the bug with Sandpack." },
    ],
  }),
  component: BugView,
});

function BugView() {
  const { bugId } = Route.useParams();
  const bug = (bugsData as Bug[]).find((b) => b.id === bugId);

  if (!bug) {
    throw notFound();
  }

  const { solvedBugs = [], completeBug, saveNote, notes } = useProgress();

  const [revealed, setRevealed] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<"broken" | "fixed">("broken");
  const [investigationNote, setInvestigationNote] = useState(notes[`bug:${bugId}`] || "");

  const isSolved = solvedBugs.includes(bug.id);

  const handleMarkSolved = () => {
    completeBug(bug.id);
    toast.success(`Challenge Completed! You solved '${bug.title}' 🎉`);
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

        {isSolved ? (
          <Badge className="bg-emerald-600 hover:bg-emerald-600 gap-1 py-1 px-3">
            <CheckCircle2 className="h-3.5 w-3.5" /> Solved
          </Badge>
        ) : (
          <Button size="sm" onClick={handleMarkSolved} className="gap-2">
            <Award className="h-4 w-4" /> Mark as Solved
          </Button>
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

      {/* Mobile Viewports (<768px / md): Radix UI Tabs */}
      <div className="md:hidden w-full">
        <Tabs defaultValue="editor" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-900 border border-slate-800 p-1 rounded-lg">
            <TabsTrigger
              value="editor"
              className="gap-1.5 text-xs font-semibold text-slate-400 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 data-[state=active]:border data-[state=active]:border-cyan-500/40 data-[state=active]:shadow-sm cursor-pointer"
            >
              <FileCode className="h-3.5 w-3.5 text-cyan-400" />
              Editor
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              className="gap-1.5 text-xs font-semibold text-slate-400 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 data-[state=active]:border data-[state=active]:border-cyan-500/40 data-[state=active]:shadow-sm cursor-pointer"
            >
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              Preview
            </TabsTrigger>
            <TabsTrigger
              value="console"
              className="gap-1.5 text-xs font-semibold text-slate-400 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 data-[state=active]:border data-[state=active]:border-cyan-500/40 data-[state=active]:shadow-sm cursor-pointer"
            >
              <Terminal className="h-3.5 w-3.5 text-purple-400" />
              Console / Tests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="mt-4 space-y-4">
            <InteractiveBugSimulator
              brokenCode={bug.brokenCode}
              fixedCode={bug.fixedCode}
              bugTitle={bug.title}
              bugId={bug.id}
              interactiveType={bug.interactiveType}
              isFixed={activeCodeTab === "fixed"}
              onVerifySuccess={handleMarkSolved}
            />

            <Card className="border-border/60">
              <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-border/40">
                <CardTitle className="text-xs font-medium flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-primary" />
                  Raw Source Code Inspector
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant={activeCodeTab === "broken" ? "secondary" : "ghost"}
                    onClick={() => setActiveCodeTab("broken")}
                    className="text-xs h-7"
                  >
                    Broken
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
                    Fixed
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {activeCodeTab === "broken" ? (
                  <CodeBlock language="tsx" code={bug.brokenCode} />
                ) : (
                  <CodeBlock language="tsx" code={bug.fixedCode} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="mt-4 space-y-4">
            <InteractiveBugSimulator
              brokenCode={bug.brokenCode}
              fixedCode={bug.fixedCode}
              bugTitle={bug.title}
              bugId={bug.id}
              interactiveType={bug.interactiveType}
              isFixed={activeCodeTab === "fixed"}
              onVerifySuccess={handleMarkSolved}
            />
          </TabsContent>

          <TabsContent value="console" className="mt-4 space-y-4">
            {bug.symptoms && bug.symptoms.length > 0 && (
              <Card className="border-border/60">
                <CardHeader className="py-3 px-4 border-b border-border/40">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
                    Observed Runtime Symptoms
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <ul className="space-y-2 text-xs text-muted-foreground">
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

            <Card className="border-border/60">
              <CardHeader className="py-3 px-4 border-b border-border/40">
                <CardTitle className="text-xs font-medium flex items-center gap-2">
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

            <Card className="border-border/60">
              <CardHeader className="py-3 px-4 border-b border-border/40">
                <CardTitle className="text-xs font-medium">Solution & Root Cause</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {revealed ? (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {bug.explanation}
                    </p>
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
                      Try diagnosing and fixing the bug inside the Sandpack editor first!
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

            <Card className="border-border/60">
              <CardHeader className="py-3 px-4 border-b border-border/40">
                <CardTitle className="text-xs font-medium">Investigation Notes</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <Textarea
                  placeholder="Jot down your hypotheses, console trace findings, or fix notes here..."
                  value={investigationNote}
                  onChange={(e) => handleNoteChange(e.target.value)}
                  className="min-h-28 text-xs font-mono"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop Viewports (>=768px / md): Multi-Panel Split View Grid */}
      <div className="hidden md:grid gap-6 lg:grid-cols-12">
        {/* Left Column: Interactive Sandpack Simulator & Code View */}
        <div className="lg:col-span-7 space-y-6">
          {/* Sandpack Interactive Sandbox */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-primary" /> Sandpack Diagnostic Environment
              </span>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={activeCodeTab === "broken" ? "destructive" : "ghost"}
                  onClick={() => setActiveCodeTab("broken")}
                  className="text-xs h-7"
                >
                  Broken Code
                </Button>
                <Button
                  size="sm"
                  variant={activeCodeTab === "fixed" ? "default" : "ghost"}
                  onClick={() => setActiveCodeTab("fixed")}
                  className="text-xs h-7"
                >
                  Reference Fix
                </Button>
              </div>
            </div>

            <InteractiveBugSimulator
              brokenCode={bug.brokenCode}
              fixedCode={bug.fixedCode}
              bugTitle={bug.title}
              bugId={bug.id}
              interactiveType={bug.interactiveType}
              isFixed={activeCodeTab === "fixed"}
              onVerifySuccess={handleMarkSolved}
            />
          </div>

          {/* Code Inspector Tabs */}
          <Card className="border-border/60">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-border/40">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileCode className="h-4 w-4 text-primary" />
                Raw Source Code Inspector
              </CardTitle>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={activeCodeTab === "broken" ? "secondary" : "ghost"}
                  onClick={() => setActiveCodeTab("broken")}
                  className="text-xs h-7"
                >
                  Broken Code
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
                    <AlertTriangle className="h-3.5 w-3.5" /> Broken Code Implementation
                  </div>
                  <CodeBlock language="tsx" code={bug.brokenCode} />
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
                    Try diagnosing and fixing the bug inside the Sandpack editor first!
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
