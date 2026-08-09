import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mentorStore } from "@/lib/providers/mentor-store";
import { mentorProvider } from "@/lib/providers/mentor-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Send,
  Plus,
  Square,
  RotateCcw,
  Copy,
  Trash2,
  MessageSquare,
  GraduationCap,
  Code2,
  Lightbulb,
  Bug,
  Code,
  FileCode,
  Check,
  ChevronDown,
  ChevronUp,
  Brain,
  Zap,
  HelpCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { MentorMessage, MentorMode } from "@/lib/types";
import { toast } from "sonner";
import Markdown from "react-markdown";

export const Route = createFileRoute("/mentor")({
  head: () => ({
    meta: [
      { title: "AI Mentor · Forge" },
      {
        name: "description",
        content:
          "AI Mentor with specialized support modes: General Chat, Lesson Help, Staff Code Review, Deep Explanations, and Debug Assistance.",
      },
      { property: "og:title", content: "AI Mentor · Forge" },
      {
        property: "og:description",
        content: "Coaching, code reviews, deep explanations, and debugging.",
      },
    ],
  }),
  component: Mentor,
});

const MODE_DESCRIPTIONS: Record<
  MentorMode,
  { title: string; desc: string; icon: React.ReactNode; badgeColor: string }
> = {
  chat: {
    title: "General Chat & Coaching",
    desc: "Socratic guidance on frontend architecture, career trajectory, and engineering trade-offs.",
    icon: <MessageSquare className="h-4 w-4 text-blue-500" />,
    badgeColor: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  },
  "lesson-help": {
    title: "Lesson & Exercise Help",
    desc: "Progressive hints, concept breakdowns, and exercise walkthroughs without immediate spoilers.",
    icon: <GraduationCap className="h-4 w-4 text-emerald-500" />,
    badgeColor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  },
  "code-review": {
    title: "Staff Code Review",
    desc: "Structured quality analysis covering performance, WCAG accessibility, memory, and clean refactoring.",
    icon: <Code2 className="h-4 w-4 text-purple-500" />,
    badgeColor: "bg-purple-500/10 text-purple-500 border-purple-500/30",
  },
  explanations: {
    title: "Deep Explanations & Analogies",
    desc: "Visual mental models, call-stack execution flows, microtask queues, and Big-O complexity.",
    icon: <Lightbulb className="h-4 w-4 text-amber-500" />,
    badgeColor: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  },
  "debug-help": {
    title: "Debug & Bug Hunting",
    desc: "Root cause diagnostics, stale closure detection, memory leak hunting, and reproduction test cases.",
    icon: <Bug className="h-4 w-4 text-rose-500" />,
    badgeColor: "bg-rose-500/10 text-rose-500 border-rose-500/30",
  },
  "interview-eval": {
    title: "Interview Evaluation",
    desc: "Mock technical interview evaluation, rubric scoring, and structured feedback on code answers.",
    icon: <GraduationCap className="h-4 w-4 text-indigo-500" />,
    badgeColor: "bg-indigo-500/10 text-indigo-500 border-indigo-500/30",
  },
};

const MODE_PROMPTS: Record<MentorMode, string[]> = {
  chat: [
    "Explain closures like I'm a junior dev",
    "How do I transition from Senior to Staff Engineer?",
    "Compare Zustand vs React Context for micro-frontends",
    "When should I use React Server Components over Client Hooks?",
  ],
  "lesson-help": [
    "Explain useEffect dependency arrays & cleanup functions",
    "Walk me through building a custom CSS Grid 2D layout",
    "Quiz me on Event Loop microtasks vs macrotasks",
    "Give me a step-by-step exercise for TypeScript Generics",
  ],
  "code-review": [
    "Review my custom React hook for memory leaks and stale state",
    "Check this fetch effect for race conditions & abort signals",
    "Audit this component for unnecessary re-renders & memo opportunity",
    "Review my form handler for WCAG accessibility & focus management",
  ],
  explanations: [
    "Visual mental model for React 19 Fiber Reconciliation",
    "Explain CRDTs (Conflict-free Replicated Data Types) simply",
    "Step-by-step execution flow of JavaScript Promises & Microtasks",
    "Big-O time and space complexity of common JS Array methods",
  ],
  "debug-help": [
    "Find stale closure bug in my setInterval timer callback",
    "Debug infinite re-render loop caused by object literal props",
    "Fix memory leak in WebSocket listener missing cleanup",
    "Analyze stack trace: Uncaught TypeError: Cannot read properties of undefined",
  ],
  "interview-eval": [
    "Evaluate my response to designing an accessible autocomplete search bar",
    "Score my explanation of virtual DOM diffing algorithm",
    "Review my answer on handling async state with React Query vs Context",
    "Conduct a mock system design review for a live collaboration board",
  ],
};

const CODE_TEMPLATES: Record<MentorMode, string> = {
  chat: "",
  "lesson-help": "",
  "code-review": `// Paste your React component or TypeScript utility here
export function UserDashboard({ userId }: { userId: string }) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch(\`/api/users/\${userId}\`)
      .then((res) => res.json())
      .then((data) => setUser(data));
  }, [userId]);

  return <div>{user ? user.name : "Loading..."}</div>;
}`,
  explanations: "",
  "debug-help": `// Paste broken code or stack trace here
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      // Bug: count is stale!
      setCount(count + 1);
    }, 1000);
  }, []);

  return <div>Count: {count}</div>;
}`,
  "interview-eval": "",
};

export function Mentor() {
  const [state, set] = mentorStore.useStore();
  const active = state.conversations.find((c) => c.id === state.activeId) ?? state.conversations[0];
  const [activeMode, setActiveMode] = useState<MentorMode>(active?.mode || "chat");
  const [input, setInput] = useState("");
  const [codeContext, setCodeContext] = useState("");
  const [showCodeBox, setShowCodeBox] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [model, setModel] = useState(mentorProvider.models[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [active?.messages, streaming]);

  // Update mode when conversation changes
  useEffect(() => {
    if (active?.mode) {
      setActiveMode(active.mode);
    }
  }, [active?.id, active?.mode]);

  const handleModeChange = (mode: MentorMode) => {
    setActiveMode(mode);
    if (active) {
      const updated = { ...active, mode };
      set({
        ...state,
        conversations: state.conversations.map((c) => (c.id === active.id ? updated : c)),
      });
    }
    // Auto toggle code box for code review or debug mode if code template exists
    if ((mode === "code-review" || mode === "debug-help") && CODE_TEMPLATES[mode]) {
      setCodeContext(CODE_TEMPLATES[mode]);
      setShowCodeBox(true);
    }
  };

  const send = async (text?: string) => {
    let mainContent = (text ?? input).trim();
    if (codeContext.trim()) {
      mainContent += `\n\n\`\`\`tsx\n${codeContext.trim()}\n\`\`\``;
    }
    if (!mainContent || streaming) return;

    setInput("");
    setCodeContext("");
    setShowCodeBox(false);

    const userMsg: MentorMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: mainContent,
      createdAt: Date.now(),
      mode: activeMode,
    };
    const asstMsg: MentorMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      createdAt: Date.now(),
      mode: activeMode,
    };

    const next = {
      ...active,
      title: active.messages.length <= 1 ? (text ?? input).slice(0, 30) + "..." : active.title,
      mode: activeMode,
      messages: [...active.messages, userMsg, asstMsg],
      updatedAt: Date.now(),
    };

    set({
      ...state,
      conversations: state.conversations.map((c) => (c.id === active.id ? next : c)),
    });

    setStreaming(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      let acc = "";
      for await (const chunk of mentorProvider.stream([...active.messages, userMsg], {
        model,
        mode: activeMode,
        signal: ctrl.signal,
      })) {
        acc += chunk;
        const cur = mentorStore.read();
        const convo = cur.conversations.find((c) => c.id === active.id)!;
        const updated = {
          ...convo,
          messages: convo.messages.map((m) => (m.id === asstMsg.id ? { ...m, content: acc } : m)),
        };
        mentorStore.write({
          ...cur,
          conversations: cur.conversations.map((c) => (c.id === active.id ? updated : c)),
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const newChat = () => {
    const id = crypto.randomUUID();
    const modeMeta = MODE_DESCRIPTIONS[activeMode];
    set({
      ...state,
      activeId: id,
      conversations: [
        {
          id,
          title: `${modeMeta.title} Session`,
          mode: activeMode,
          messages: [
            {
              id: crypto.randomUUID(),
              role: "assistant",
              mode: activeMode,
              content: `Welcome to **${modeMeta.title}**. ${modeMeta.desc}\n\nHow can I help you today?`,
              createdAt: Date.now(),
            },
          ],
          updatedAt: Date.now(),
        },
        ...state.conversations,
      ],
    });
  };

  const deleteChat = (id: string) => {
    const remaining = state.conversations.filter((c) => c.id !== id);
    set({ ...state, conversations: remaining, activeId: remaining[0]?.id ?? null });
    toast.success("Conversation deleted");
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          eyebrow="Sprint 15 — AI Mentor"
          title="Forge AI Mentor & Coaching Hub"
          description="Your Staff Engineer mentor equipped with Specialized AI Support Modes: Chat, Lesson Help, Code Review, Explanations, and Debug Assistance."
        />
        <div className="flex items-center gap-2">
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger className="h-9 w-60 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {mentorProvider.models.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Support Mode Selector Tabs */}
      <Tabs
        value={activeMode}
        onValueChange={(v) => handleModeChange(v as MentorMode)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto p-1 bg-muted/60 rounded-xl border">
          {(
            [
              { id: "chat", label: "Chat", icon: <MessageSquare className="h-3.5 w-3.5" /> },
              {
                id: "lesson-help",
                label: "Lesson Help",
                icon: <GraduationCap className="h-3.5 w-3.5" />,
              },
              { id: "code-review", label: "Code Review", icon: <Code2 className="h-3.5 w-3.5" /> },
              {
                id: "explanations",
                label: "Explanations",
                icon: <Lightbulb className="h-3.5 w-3.5" />,
              },
              { id: "debug-help", label: "Debug Help", icon: <Bug className="h-3.5 w-3.5" /> },
            ] as const
          ).map((mode) => (
            <TabsTrigger
              key={mode.id}
              value={mode.id}
              className="gap-2 py-2 text-xs font-medium transition-all"
            >
              {mode.icon}
              <span>{mode.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Mode Banner / Context Indicator */}
      <div className="flex items-center justify-between p-3 rounded-xl border bg-card/60 text-xs">
        <div className="flex items-center gap-2.5">
          {MODE_DESCRIPTIONS[activeMode].icon}
          <div>
            <span className="font-semibold">{MODE_DESCRIPTIONS[activeMode].title}:</span>{" "}
            <span className="text-muted-foreground">{MODE_DESCRIPTIONS[activeMode].desc}</span>
          </div>
        </div>
        <Badge
          variant="outline"
          className={`text-[10px] uppercase tracking-wider font-mono ${MODE_DESCRIPTIONS[activeMode].badgeColor}`}
        >
          {activeMode} MODE
        </Badge>
      </div>

      {/* Main Grid: Sidebar & Chat Window */}
      <div className="grid h-[calc(100dvh-18rem)] min-h-[500px] gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Left Sidebar — Conversation History */}
        <aside className="hidden flex-col justify-between overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-3 lg:flex">
          <div className="space-y-3 overflow-y-auto">
            <Button
              size="sm"
              className="w-full justify-start gap-2 text-xs font-semibold"
              onClick={newChat}
            >
              <Plus className="h-4 w-4" />
              New {MODE_DESCRIPTIONS[activeMode].title}
            </Button>
            <div className="space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground px-2 py-1">
                Conversations ({state.conversations.length})
              </div>
              {state.conversations.map((c) => {
                const modeMeta = MODE_DESCRIPTIONS[c.mode || "chat"];
                return (
                  <div
                    key={c.id}
                    className={`group flex items-center justify-between gap-1 rounded-lg px-2.5 py-2 text-xs transition-colors ${
                      c.id === active?.id
                        ? "bg-accent text-accent-foreground font-medium"
                        : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <button
                      className="flex-1 truncate text-left flex items-center gap-2"
                      onClick={() => {
                        set({ ...state, activeId: c.id });
                        if (c.mode) setActiveMode(c.mode);
                      }}
                    >
                      {modeMeta?.icon}
                      <span className="truncate">{c.title}</span>
                    </button>
                    <button
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-500 transition-opacity"
                      onClick={() => deleteChat(c.id)}
                      aria-label="Delete conversation"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-border/50 text-[11px] text-muted-foreground space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <Brain className="h-3.5 w-3.5 text-primary" /> Active Model
            </div>
            <div>{mentorProvider.models.find((m) => m.id === model)?.label}</div>
          </div>
        </aside>

        {/* Right Main Panel — Chat View */}
        <Card className="flex min-h-0 flex-col border-border/60">
          {/* Messages Scroll View */}
          <CardContent
            ref={scrollRef as never}
            className="scrollbar-thin flex-1 space-y-4 overflow-y-auto p-4"
          >
            {active?.messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] rounded-2xl bg-primary px-4 py-3 text-sm text-primary-foreground shadow-sm"
                      : "max-w-[90%] rounded-2xl border border-border/60 bg-muted/30 p-4 text-sm text-foreground/90 shadow-xs space-y-2"
                  }
                >
                  {/* Assistant Header Badge */}
                  {m.role === "assistant" && (
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/40 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-foreground">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        <span>Forge Mentor</span>
                        <Badge variant="outline" className="text-[10px] ml-1">
                          {m.mode || activeMode}
                        </Badge>
                      </div>
                      <span
                        suppressHydrationWarning
                        className="text-[10px] text-muted-foreground font-mono"
                      >
                        {new Date(m.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}

                  {/* Render Message Content with Markdown support */}
                  <div className="markdown-body leading-relaxed space-y-2 text-sm">
                    <Markdown>{m.content || (streaming ? "Thinking and typing..." : "")}</Markdown>
                  </div>

                  {/* Assistant Message Actions */}
                  {m.role === "assistant" && m.content && (
                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-border/40 text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <button
                          className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                          onClick={() => handleCopy(m.id, m.content)}
                        >
                          {copiedId === m.id ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          <span>{copiedId === m.id ? "Copied" : "Copy"}</span>
                        </button>
                        <button
                          className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                          onClick={() =>
                            send(
                              [...active.messages].reverse().find((x) => x.role === "user")
                                ?.content,
                            )
                          }
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Regenerate</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>

          {/* Input & Action Panel */}
          <div className="border-t border-border/50 p-3 space-y-3 bg-card/50">
            {/* Quick Starter Prompts Chips */}
            <div className="flex flex-wrap gap-1.5">
              {MODE_PROMPTS[activeMode].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => send(prompt)}
                  className="rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground hover:bg-accent transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Optional Code Context Input Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowCodeBox(!showCodeBox)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-mono"
                >
                  <Code className="h-3.5 w-3.5 text-primary" />
                  <span>{showCodeBox ? "Hide Code Input Box" : "Attach Code / Error Snippet"}</span>
                  {showCodeBox ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>
                {showCodeBox && (
                  <Button
                    variant="ghost"
                    size="xs"
                    className="text-[10px] text-muted-foreground"
                    onClick={() => setCodeContext("")}
                  >
                    Clear Code
                  </Button>
                )}
              </div>

              {showCodeBox && (
                <Textarea
                  value={codeContext}
                  onChange={(e) => setCodeContext(e.target.value)}
                  placeholder="Paste component code, stack trace, or error log here..."
                  className="min-h-24 font-mono text-xs bg-background/80"
                />
              )}
            </div>

            {/* Main Prompt Textarea and Send Button */}
            <div className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder={`Ask ${MODE_DESCRIPTIONS[activeMode].title.toLowerCase()}... (Shift + Enter for new line)`}
                className="min-h-12 resize-none text-sm"
              />
              {streaming ? (
                <Button variant="outline" size="icon" onClick={() => abortRef.current?.abort()}>
                  <Square className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={() => send()} disabled={!input.trim() && !codeContext.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
