import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInterviewQuestions } from "@/lib/hooks/use-content";
import { useProgress } from "@/lib/hooks/use-progress";
import type { InterviewQuestion, InterviewSessionResult } from "@/lib/types";
import {
  Play,
  Clock,
  CheckCircle2,
  Sparkles,
  Code2,
  Palette,
  FileCode,
  Layers,
  ShieldCheck,
  Zap,
  Bug,
  GitBranch,
  Building2,
  UserCheck,
  Search,
  Filter,
  BarChart3,
  Trophy,
  History,
  Eye,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Flame,
  Check,
  AlertCircle,
  X,
} from "lucide-react";
import { useState, useMemo } from "react";
import Markdown from "react-markdown";
import { toast } from "sonner";

export const Route = createFileRoute("/interview")({
  head: () => ({
    meta: [
      { title: "Interview Academy · Forge" },
      {
        name: "description",
        content:
          "Timed interview loops across HTML, CSS, JavaScript, React, TypeScript, Accessibility, Performance, Debugging, Git, Architecture, and Behavioral topics.",
      },
      { property: "og:title", content: "Interview Academy · Forge" },
      {
        property: "og:description",
        content: "Calibrated interview loops with rubrics and self-evaluation.",
      },
    ],
  }),
  component: InterviewAcademy,
});

// Topic Icon and Color Mappings
const TOPIC_METADATA: Record<
  string,
  { icon: typeof Code2; color: string; border: string; bg: string; description: string }
> = {
  HTML: {
    icon: FileCode,
    color: "text-orange-400",
    border: "border-orange-500/20",
    bg: "bg-orange-500/10",
    description: "DOM parsing, responsive images, semantics, and resource loading execution.",
  },
  CSS: {
    icon: Palette,
    color: "text-blue-400",
    border: "border-blue-500/20",
    bg: "bg-blue-500/10",
    description: "BFC, stacking contexts, z-index, Container Queries, and Grid vs Flex algorithms.",
  },
  JavaScript: {
    icon: Code2,
    color: "text-amber-400",
    border: "border-amber-500/20",
    bg: "bg-amber-500/10",
    description: "Event Loop, microtasks, closures, garbage collection, and V8 heap mechanics.",
  },
  React: {
    icon: Layers,
    color: "text-cyan-400",
    border: "border-cyan-500/20",
    bg: "bg-cyan-500/10",
    description: "Fiber reconciliation, concurrent transitions, RSC boundaries, and custom hooks.",
  },
  TypeScript: {
    icon: FileCode,
    color: "text-sky-400",
    border: "border-sky-500/20",
    bg: "bg-sky-500/10",
    description: "Discriminated unions, type guards, infer keyword, and generic type narrowing.",
  },
  Accessibility: {
    icon: ShieldCheck,
    color: "text-purple-400",
    border: "border-purple-500/20",
    bg: "bg-purple-500/10",
    description: "WCAG 2.2 AA compliance, focus traps, aria-live regions, and screen reader UX.",
  },
  Performance: {
    icon: Zap,
    color: "text-emerald-400",
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/10",
    description: "Core Web Vitals (LCP, INP, CLS), long task yielding, and bundler tree-shaking.",
  },
  Debugging: {
    icon: Bug,
    color: "text-rose-400",
    border: "border-rose-500/20",
    bg: "bg-rose-500/10",
    description: "Chrome DevTools heap snapshots, memory leak isolation, and AbortController.",
  },
  Git: {
    icon: GitBranch,
    color: "text-red-400",
    border: "border-red-500/20",
    bg: "bg-red-500/10",
    description:
      "Interactive rebase, merge conflict resolution, and git bisect regression hunting.",
  },
  Architecture: {
    icon: Building2,
    color: "text-indigo-400",
    border: "border-indigo-500/20",
    bg: "bg-indigo-500/10",
    description: "CRDTs, state normalization, micro-frontends, and offline-first client engines.",
  },
  Behavioral: {
    icon: UserCheck,
    color: "text-teal-400",
    border: "border-teal-500/20",
    bg: "bg-teal-500/10",
    description:
      "STAR framework, handling technical disagreements, and deadline scope negotiation.",
  },
};

const DEFAULT_META = {
  icon: BookOpen,
  color: "text-primary",
  border: "border-primary/20",
  bg: "bg-primary/10",
  description: "Core engineering interview topics.",
};

function InterviewAcademy() {
  const navigate = useNavigate();
  const allQuestions = useInterviewQuestions();
  const { interviewResults = [], clearInterviewResults } = useProgress();

  // Search & Filter State
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("All");
  const [selectedDifficultyFilter, setSelectedDifficultyFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>("All");

  // Modal State for Quick Question Preview
  const [previewQuestion, setPreviewQuestion] = useState<InterviewQuestion | null>(null);

  // Custom Mock Loop Generator State
  const [mockPreset, setMockPreset] = useState("mixed");
  const [mockDuration, setMockDuration] = useState("30");

  // Get list of distinct categories & companies
  const categoriesList = useMemo(() => {
    return Array.from(new Set(allQuestions.map((q) => q.category)));
  }, [allQuestions]);

  const companiesList = useMemo(() => {
    const set = new Set<string>();
    allQuestions.forEach((q) => {
      (q.companyTags || []).forEach((c) => set.add(c));
    });
    return Array.from(set).sort();
  }, [allQuestions]);

  // Filtered Questions list
  const filteredQuestions = useMemo(() => {
    return allQuestions.filter((q) => {
      const matchCat = selectedCategoryFilter === "All" || q.category === selectedCategoryFilter;
      const matchDiff =
        selectedDifficultyFilter === "All" || q.difficulty === selectedDifficultyFilter;
      const matchCompany =
        selectedCompanyFilter === "All" ||
        (q.companyTags && q.companyTags.includes(selectedCompanyFilter));

      const query = searchQuery.toLowerCase().trim();
      const matchQuery =
        !query ||
        q.question.toLowerCase().includes(query) ||
        q.category.toLowerCase().includes(query) ||
        (q.companyTags && q.companyTags.some((c) => c.toLowerCase().includes(query)));

      return matchCat && matchDiff && matchCompany && matchQuery;
    });
  }, [
    allQuestions,
    selectedCategoryFilter,
    selectedDifficultyFilter,
    selectedCompanyFilter,
    searchQuery,
  ]);

  // Analytics Stats
  const stats = useMemo(() => {
    const totalCompleted = interviewResults.length;
    const avgScore =
      totalCompleted > 0
        ? Math.round(
            interviewResults.reduce((acc, curr) => acc + curr.scorePercent, 0) / totalCompleted,
          )
        : 0;
    const totalMinutes = Math.round(
      interviewResults.reduce((acc, curr) => acc + curr.timeSpentSeconds, 0) / 60,
    );

    return { totalCompleted, avgScore, totalMinutes };
  }, [interviewResults]);

  // Handler to launch session
  const handleStartSession = (category?: string) => {
    if (category) {
      navigate({ to: "/interview/session", search: { category, mode: "single" } });
    } else {
      navigate({
        to: "/interview/session",
        search: { mode: "mock", preset: mockPreset, duration: mockDuration },
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        eyebrow="Sprint 16 — AI Interviewer"
        title="Engineering Interview Prep"
        description="Timed mock loops calibrated to Meta, Google, Stripe, Vercel, and Amazon interview standards. Practice with real-time AI Staff Interviewer evaluation, follow-up probes, score badges, and structured feedback."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => handleStartSession()} className="gap-2 shadow-sm">
              <Play className="h-4 w-4 fill-current" /> Launch AI Mock Loop
            </Button>
          </div>
        }
      />

      {/* Top Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60 bg-card/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase font-semibold text-muted-foreground">
                Question Bank
              </p>
              <h4 className="text-2xl font-extrabold font-mono mt-0.5">{allQuestions.length}</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">Across 11 Core Domains</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
              <BookOpen className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase font-semibold text-muted-foreground">
                Sessions Completed
              </p>
              <h4 className="text-2xl font-extrabold font-mono text-cyan-400 mt-0.5">
                {stats.totalCompleted}
              </h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {stats.totalMinutes} mins practiced
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 text-cyan-400 grid place-items-center">
              <History className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase font-semibold text-muted-foreground">
                Avg Rubric Score
              </p>
              <h4 className="text-2xl font-extrabold font-mono text-emerald-400 mt-0.5">
                {stats.avgScore}%
              </h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Self-evaluated preparedness
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 grid place-items-center">
              <Trophy className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase font-semibold text-muted-foreground">
                Target Companies
              </p>
              <h4 className="text-2xl font-extrabold font-mono text-purple-400 mt-0.5">
                {companiesList.length}
              </h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Meta, Google, Vercel, Stripe...
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-400 grid place-items-center">
              <Building2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QUICK LAUNCH MOCK LOOP GENERATOR */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card p-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" /> Timed Interview Simulator
            </div>
            <h3 className="text-xl font-extrabold tracking-tight">Generate Custom Mock Loop</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Select an interview template or duration. The simulator will assemble calibrated
              questions with countdown timers, code draft areas, and rubric checklists.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground">Loop Preset</label>
              <Select value={mockPreset} onValueChange={setMockPreset}>
                <SelectTrigger className="w-full sm:w-48 text-xs">
                  <SelectValue placeholder="Select preset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mixed">Mixed Staff Loop (All Topics)</SelectItem>
                  <SelectItem value="frontend">Frontend Deep Dive (JS, CSS, React)</SelectItem>
                  <SelectItem value="architecture">Architecture & Performance</SelectItem>
                  <SelectItem value="behavioral">Behavioral & Leadership</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground">
                Session Length
              </label>
              <Select value={mockDuration} onValueChange={setMockDuration}>
                <SelectTrigger className="w-full sm:w-32 text-xs">
                  <SelectValue placeholder="Duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 Minutes</SelectItem>
                  <SelectItem value="30">30 Minutes</SelectItem>
                  <SelectItem value="45">45 Minutes</SelectItem>
                  <SelectItem value="60">60 Minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => handleStartSession()}
              className="sm:self-end text-xs gap-1.5 h-9"
            >
              Start Session <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* TABS: Topic Matrix, Question Bank, Practice History */}
      <Tabs defaultValue="topics" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md h-9">
          <TabsTrigger value="topics" className="text-xs">
            Topic Domains ({categoriesList.length})
          </TabsTrigger>
          <TabsTrigger value="bank" className="text-xs">
            Question Bank ({allQuestions.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs">
            History ({interviewResults.length})
          </TabsTrigger>
        </TabsList>

        {/* --- TAB 1: TOPIC DOMAINS GRID --- */}
        <TabsContent value="topics" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categoriesList.map((catName) => {
              const meta = TOPIC_METADATA[catName] || DEFAULT_META;
              const Icon = meta.icon;
              const questionsInCat = allQuestions.filter((q) => q.category === catName);

              return (
                <Card
                  key={catName}
                  className={`border-border/60 transition-all hover:border-primary/50 flex flex-col justify-between group overflow-hidden ${meta.border}`}
                >
                  <CardHeader className="p-5 pb-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div
                        className={`h-9 w-9 rounded-lg ${meta.bg} ${meta.color} grid place-items-center`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {questionsInCat.length} Questions
                      </Badge>
                    </div>

                    <CardTitle className="text-base font-bold group-hover:text-primary transition-colors">
                      {catName}
                    </CardTitle>

                    <CardDescription className="text-xs line-clamp-2 leading-relaxed">
                      {meta.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-5 pt-0 space-y-3">
                    {/* Tags preview */}
                    <div className="flex flex-wrap gap-1">
                      {questionsInCat.slice(0, 2).map((q) => (
                        <Badge key={q.id} variant="secondary" className="text-[10px] py-0">
                          {q.difficulty}
                        </Badge>
                      ))}
                      {questionsInCat[0]?.companyTags?.slice(0, 2).map((c) => (
                        <Badge key={c} variant="outline" className="text-[10px] py-0 font-mono">
                          {c}
                        </Badge>
                      ))}
                    </div>

                    <Button
                      onClick={() => handleStartSession(catName)}
                      variant="secondary"
                      size="sm"
                      className="w-full text-xs gap-1.5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" /> Practice {catName}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* --- TAB 2: QUESTION BANK EXPLORER --- */}
        <TabsContent value="bank" className="space-y-4">
          {/* Controls Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-card p-3 rounded-lg border border-border/60">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs h-8"
              />
            </div>

            <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
              <SelectTrigger className="text-xs h-8">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {categoriesList.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedDifficultyFilter} onValueChange={setSelectedDifficultyFilter}>
              <SelectTrigger className="text-xs h-8">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Difficulties</SelectItem>
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCompanyFilter} onValueChange={setSelectedCompanyFilter}>
              <SelectTrigger className="text-xs h-8">
                <SelectValue placeholder="Company Tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Companies</SelectItem>
                {companiesList.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtered Question Cards */}
          <div className="grid gap-3">
            {filteredQuestions.length === 0 ? (
              <Card className="border-border/60 py-10 text-center">
                <CardContent className="space-y-2">
                  <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto opacity-50" />
                  <p className="text-sm font-medium">No interview questions match your filters.</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategoryFilter("All");
                      setSelectedDifficultyFilter("All");
                      setSelectedCompanyFilter("All");
                    }}
                    className="text-xs"
                  >
                    Reset Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredQuestions.map((q) => (
                <Card
                  key={q.id}
                  className="border-border/60 transition-all hover:border-primary/40"
                >
                  <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">
                          {q.category}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            q.difficulty === "Hard"
                              ? "text-rose-400 border-rose-500/20"
                              : q.difficulty === "Medium"
                                ? "text-amber-400 border-amber-500/20"
                                : "text-emerald-400 border-emerald-500/20"
                          }`}
                        >
                          {q.difficulty}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] gap-1 font-mono">
                          <Clock className="h-3 w-3" /> ~{q.estimatedMinutes}m
                        </Badge>
                        {q.companyTags?.map((c) => (
                          <Badge
                            key={c}
                            variant="outline"
                            className="text-[10px] font-mono bg-muted/30"
                          >
                            {c}
                          </Badge>
                        ))}
                      </div>

                      <h4 className="text-sm font-semibold text-foreground line-clamp-2">
                        {q.question}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewQuestion(q)}
                        className="text-xs gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" /> Preview Rubric
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleStartSession(q.category)}
                        className="text-xs gap-1"
                      >
                        <Play className="h-3.5 w-3.5 fill-current" /> Practice
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* --- TAB 3: PRACTICE HISTORY --- */}
        <TabsContent value="history" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Saved Session Log
            </h3>
            {interviewResults.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  clearInterviewResults();
                  toast.success("Interview history cleared");
                }}
                className="text-xs text-muted-foreground hover:text-destructive gap-1"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Clear History
              </Button>
            )}
          </div>

          {interviewResults.length === 0 ? (
            <Card className="border-border/60 py-12 text-center">
              <CardContent className="space-y-3">
                <Trophy className="h-10 w-10 text-muted-foreground mx-auto opacity-40" />
                <h4 className="text-base font-bold">No Completed Interview Sessions Yet</h4>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Launch a timed practice loop, evaluate your response against the rubric, and save
                  your result to track progress over time.
                </p>
                <Button onClick={() => handleStartSession()} size="sm" className="gap-1.5 mt-2">
                  <Play className="h-4 w-4 fill-current" /> Start Practice Loop
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {interviewResults.map((res) => {
                const targetQ = allQuestions.find((q) => q.id === res.questionId);
                return (
                  <Card key={res.id} className="border-border/60">
                    <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px]">
                            {res.category}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-mono ${
                              res.scorePercent >= 80
                                ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
                                : res.scorePercent >= 50
                                  ? "text-amber-400 border-amber-500/20 bg-amber-500/10"
                                  : "text-rose-400 border-rose-500/20 bg-rose-500/10"
                            }`}
                          >
                            Score: {res.scorePercent}%
                          </Badge>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {Math.round(res.timeSpentSeconds / 60)} mins
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-foreground truncate">
                          {targetQ ? targetQ.question : `Question ID: ${res.questionId}`}
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          Completed on {new Date(res.completedAt).toLocaleString()}
                        </p>
                      </div>

                      {res.notes && (
                        <div className="text-xs bg-muted/40 p-2.5 rounded border border-border/40 max-w-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">Reflection Note:</span>{" "}
                          {res.notes}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* --- PREVIEW QUESTION DIALOG --- */}
      {previewQuestion && (
        <Dialog open={!!previewQuestion} onOpenChange={(open) => !open && setPreviewQuestion(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader className="space-y-2 border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{previewQuestion.category}</Badge>
                <Badge variant="outline">{previewQuestion.difficulty}</Badge>
                {previewQuestion.companyTags?.map((c) => (
                  <Badge key={c} variant="outline" className="font-mono text-[10px]">
                    {c}
                  </Badge>
                ))}
              </div>
              <DialogTitle className="text-lg font-bold">{previewQuestion.question}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-3 text-xs">
              {/* Rubric Points */}
              {previewQuestion.rubric && (
                <div className="space-y-2 bg-muted/30 p-3 rounded-lg border border-border/50">
                  <h5 className="font-bold uppercase tracking-wider text-primary text-[11px] flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Evaluation Rubric Criteria
                  </h5>
                  <ul className="space-y-1 pl-4 list-disc text-muted-foreground">
                    {previewQuestion.rubric.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sample Answer */}
              {previewQuestion.sampleAnswer && (
                <div className="space-y-2">
                  <h5 className="font-bold uppercase tracking-wider text-emerald-400 text-[11px]">
                    Model Response & Explanation
                  </h5>
                  <div className="p-3.5 rounded-lg bg-card border border-border text-foreground space-y-2">
                    <div className="markdown-body">
                      <Markdown>{previewQuestion.sampleAnswer}</Markdown>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setPreviewQuestion(null)}
                className="text-xs"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  const cat = previewQuestion.category;
                  setPreviewQuestion(null);
                  handleStartSession(cat);
                }}
                className="text-xs gap-1"
              >
                <Play className="h-3.5 w-3.5 fill-current" /> Practice This Topic
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
