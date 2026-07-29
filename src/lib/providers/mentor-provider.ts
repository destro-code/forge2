import type { MentorMessage, MentorMode } from "../types";

/**
 * MentorProvider — UI calls provider.stream(...).
 */
export interface MentorProvider {
  id: string;
  models: { id: string; label: string }[];
  stream(
    messages: MentorMessage[],
    opts?: { model?: string; mode?: MentorMode; signal?: AbortSignal },
  ): AsyncIterable<string>;
}

const CANNED_REPLIES: Record<string, string> = {
  closure:
    "A closure is a function bundled with the variables it saw when it was defined. Think of it as a portable environment.\n\nTry this exercise: write `counter()` that returns a function which increments a private count. That private count only exists inside the closure.",
  useeffect:
    "Effects synchronize your component to something outside React — a subscription, a timer, a document title. If you can describe your effect as *setup* and *cleanup*, you're on the right track.\n\nA useful heuristic: if the effect is doing derived state, you probably don't need one.",
  code_review:
    '### 🔍 Code Review Summary\n\n- **Quality**: Good structure overall.\n- **Performance**: Consider memoizing heavy calculations using `useMemo` or moving static handlers outside render.\n- **Accessibility**: Ensure interactive elements have explicit `aria-label` or visible text labels.\n\n```tsx\n// Refactored example\nexport const RefactoredComponent = React.memo(function RefactoredComponent() {\n  return <button aria-label="Action">Click Me</button>;\n});\n```',
  debug:
    "### 🐞 Root Cause Analysis\n\n1. **The Issue**: Stale closure in `useEffect` dependency array.\n2. **Why it occurs**: The callback captures the initial state variable without updating.\n3. **Fix**: Pass a functional updater `setCount(prev => prev + 1)` or add `count` to the dependency array.",
  default:
    "Great question — let's break it down. First, tell me what you already tried. What did you expect to happen, and what actually happened? I'll guide from there.",
};

function pickReply(text: string, mode?: MentorMode) {
  if (mode === "code-review") return CANNED_REPLIES.code_review;
  if (mode === "debug-help") return CANNED_REPLIES.debug;
  const lower = text.toLowerCase();
  if (lower.includes("closure")) return CANNED_REPLIES.closure;
  if (lower.includes("useeffect") || lower.includes("effect")) return CANNED_REPLIES.useeffect;
  return CANNED_REPLIES.default;
}

export const mockMentorProvider: MentorProvider = {
  id: "mock",
  models: [
    { id: "forge-tutor-1", label: "Forge Tutor · Gemini 3.6 Flash" },
    { id: "forge-tutor-pro", label: "Forge Tutor Pro · Gemini 3.1 Pro" },
    { id: "forge-code-review", label: "Forge Code Review Specialist" },
  ],
  async *stream(messages, opts) {
    const last = [...messages].reverse().find((m) => m.role === "user");
    const reply = pickReply(last?.content ?? "", opts?.mode);
    const chunks = reply.match(/.{1,4}/g) ?? [reply];
    for (const chunk of chunks) {
      if (opts?.signal?.aborted) return;
      await new Promise((r) => setTimeout(r, 18));
      yield chunk;
    }
  },
};

export const geminiMentorProvider: MentorProvider = {
  id: "gemini",
  models: [
    { id: "forge-tutor-1", label: "Forge Tutor · Gemini 3.6 Flash" },
    { id: "forge-tutor-pro", label: "Forge Tutor Pro · Gemini 3.1 Pro" },
    { id: "forge-code-review", label: "Forge Code Review Specialist" },
  ],
  async *stream(messages, opts) {
    try {
      const response = await fetch("/api/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, model: opts?.model, mode: opts?.mode }),
        signal: opts?.signal,
      });

      if (!response.ok || !response.body) {
        yield* mockMentorProvider.stream(messages, opts);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (opts?.signal?.aborted) {
          await reader.cancel();
          return;
        }
        const text = decoder.decode(value, { stream: true });
        if (text) yield text;
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      yield* mockMentorProvider.stream(messages, opts);
    }
  },
};

export const mentorProvider: MentorProvider = geminiMentorProvider;
