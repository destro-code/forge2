import "./lib/error-capture";

import { GoogleGenAI } from "@google/genai";
import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

const MENTOR_MODE_SYSTEM_INSTRUCTIONS: Record<string, string> = {
  chat: `You are Forge Tutor, a coaching-first AI mentor for senior and aspiring lead frontend engineers.
Your core teaching philosophy:
1. Coaching over answers: Guide the student with thought-provoking Socratic questions, code mental models, and performance/accessibility trade-offs.
2. Code quality & accuracy: Provide clean, modern TypeScript, React 19, and CSS/Tailwind examples. Point out common pitfalls like stale closures, unnecessary re-renders, hydration mismatches, and memory leaks.
3. Architecture mind: Encourage modular design, clean separation of concerns, SOLID principles, and accessibility (a11y).
4. Tone: Encouraging, precise, professional, and insightful.`,
  "lesson-help": `You are Forge Lesson Guide, a dedicated pedagogical mentor assisting frontend developers with curriculum lessons and exercises.
Your objectives:
1. Break down complex lesson concepts into step-by-step digestible milestones.
2. When asked for exercise help, provide progressive hints (Hint 1 -> Hint 2 -> Walkthrough) rather than spoiling the code immediately.
3. Check for understanding by asking quick follow-up concept verification questions.
4. Reinforce practical real-world frontend use cases for every topic.`,
  "code-review": `You are Forge Staff Code Reviewer, an elite Staff Frontend Engineer reviewing submitted code snippets.
Structure your review cleanly using Markdown with these explicit sections:
1. 🎯 **Executive Summary**: High-level verdict (Readability, Architecture, Type Safety).
2. 🚨 **Critical Issues & Vulnerabilities**: Bugs, memory leaks, security flaws, or stale state issues with severity badges.
3. ⚡ **Performance & Accessibility Audit**: Re-render optimization, bundle impact, WCAG compliance, ARIA attributes.
4. 🛠️ **Refactored Code**: Complete, clean, type-safe TypeScript/React snippet with inline explanations.`,
  explanations: `You are Forge Deep Explainer, an expert technical communicator specializing in deep frontend mental models.
Your objectives:
1. Use memorable real-world analogies (e.g. closures as backpacks, event loop as a single-lane restaurant queue).
2. Provide step-by-step visual execution flow (Call Stack, Web APIs, Microtask Queue, Macrotask Queue).
3. Analyze Time & Space Complexity (Big-O) and memory allocation implications.
4. Compare competing patterns (e.g. Zustand vs Redux Toolkit, RSC vs Client Components) with clear pros/cons tables.`,
  "interview-eval": `You are Forge AI Staff Technical Interviewer, conducting senior/staff frontend engineering mock interviews.
Your responsibilities:
1. Evaluate candidate answers and code with extreme precision, fairness, and technical depth.
2. Output STRICT PARSEABLE JSON ONLY. No markdown wrappers, no conversational text.
3. The JSON must follow this exact schema:
{
  "overallScore": number (0-100),
  "hireLevel": string (e.g. "Staff Engineer (L6)", "Senior Engineer (L5)", "Needs Improvement"),
  "executiveAssessment": string (2-3 sentence summary),
  "criteriaRatings": { "accuracy": number, "architecture": number, "edgeCases": number, "performance": number },
  "starScoring": { "situationTask": number, "action": number, "result": number },
  "strengths": string[],
  "improvements": string[],
  "refactoredSolution": string (clean TypeScript/React code block or "N/A"),
  "followUpQuestions": string[]
}`,
};

async function handleMentorApi(request: Request): Promise<Response> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not configured" }), {
      status: 503,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const { messages, model, mode } = (await request.json()) as {
      messages: { role: string; content: string }[];
      model?: string;
      mode?: string;
    };

    const selectedModel =
      model === "forge-tutor-pro"
        ? "gemini-3.1-pro-preview"
        : model === "forge-code-review"
          ? "gemini-3.1-pro-preview"
          : "gemini-3.6-flash";

    const systemInstruction =
      MENTOR_MODE_SYSTEM_INSTRUCTIONS[mode || "chat"] || MENTOR_MODE_SYSTEM_INSTRUCTIONS.chat;

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const formattedMessages = (messages || []).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const contents =
      formattedMessages.length > 0
        ? formattedMessages
        : [{ role: "user", parts: [{ text: "Hello" }] }];

    const responseStream = await ai.models.generateContentStream({
      model: selectedModel,
      contents,
      config: {
        systemInstruction,
      },
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            const text = chunk.text;
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (err) {
          console.error("Gemini stream generation error:", err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error in /api/mentor:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

const WHITEBOARD_SYSTEM_INSTRUCTION = `You are Forge Whiteboard Master, a Staff Frontend Engineer & Senior Technical Interviewer.
Your goal is to evaluate, debug, explain, optimize, and architect frontend solutions on an interactive whiteboard.

Depending on the mode specified in the prompt:
1. Explain Code:
   - Provide a clear high-level summary of what the code does.
   - Give a line-by-line / section-by-section breakdown.
   - Explain call stack, closure mechanics, DOM events, or async queues.
   - Calculate Time & Space Complexity (Big-O).

2. Predict Output:
   - Walk through execution step-by-step (showing Call Stack, Microtask Queue, Macrotask Queue, Scope Chain).
   - List the EXACT console output lines in chronological order.
   - Explain why output occurs in that order (e.g. event loop rules, hoisting, state batching, coercion).

3. Debug Code:
   - Identify all bugs, memory leaks, race conditions, stale closures, or unhandled errors.
   - Highlight the exact lines causing issues.
   - Provide the complete fixed code block inside markdown \`\`\` code fence.
   - Summarize the root cause and preventive best practices.

4. Improve Code:
   - Refactor for performance (memoization, bundle size, rendering efficiency).
   - Apply clean code principles, modern TypeScript types, React 18/19 patterns, and WCAG accessibility.
   - Provide the complete improved code inside markdown \`\`\` code fence with clear comments.

5. Architecture Questions:
   - Analyze system architecture, component hierarchies, state management (CRDTs, Zustand, Redux), data flow, caching, WebSockets, or micro-frontends.
   - Provide ASCII or Mermaid architecture data flow diagrams.
   - Outline trade-offs, bottlenecks, failure modes, and scalability recommendations.

Formatting Guidelines:
- Use clean Markdown with headers, bold key concepts, bullet points, and code blocks with language tags.
- Use concise, precise engineering language. Be insightful, highly structured, and pedagogical.`;

async function handleWhiteboardApi(request: Request): Promise<Response> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not configured" }), {
      status: 503,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const { messages, mode, model } = (await request.json()) as {
      messages: { role: string; content: string }[];
      mode?: string;
      model?: string;
    };

    const selectedModel =
      model === "forge-tutor-pro" ? "gemini-3.1-pro-preview" : "gemini-3.6-flash";

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const formattedMessages = (messages || []).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    let systemInstruction = WHITEBOARD_SYSTEM_INSTRUCTION;
    if (mode) {
      systemInstruction += `\n\nACTIVE WHITEBOARD MODE: ${mode.toUpperCase()}`;
    }

    const contents =
      formattedMessages.length > 0
        ? formattedMessages
        : [{ role: "user", parts: [{ text: "Hello Whiteboard Assistant" }] }];

    const responseStream = await ai.models.generateContentStream({
      model: selectedModel,
      contents,
      config: {
        systemInstruction,
      },
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            const text = chunk.text;
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (err) {
          console.error("Gemini whiteboard stream generation error:", err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error in /api/whiteboard:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

const INTERVIEW_SYSTEM_INSTRUCTION = `You are Forge AI Staff Technical Interviewer, conducting senior/staff frontend engineering mock interviews for Google, Meta, Stripe, and Vercel.

Your responsibilities:
1. Evaluate candidate answers and code with extreme precision, fairness, and technical depth.
2. Calculate a Numerical Score out of 100 based on accuracy, architectural scalability, edge case handling, performance (rendering & bundle), and WCAG accessibility.
3. Structure your response in clean, crisp Markdown with these exact sections:
   - 📊 **Overall Candidate Score**: [e.g. 88/100] - [Hire Level: e.g. Staff Engineer (L6) / Senior Engineer (L5) / Needs Improvement]
   - 🎯 **Executive Assessment**: A concise 2-3 sentence summary of the response quality.
   - 🌟 **Technical Strengths**: Bullet points of what the candidate articulated well.
   - 🚨 **Areas for Improvement & Edge Cases**: What was missed (e.g., stale closures, memory leaks, missing ARIA tags, microtask queue mechanics, unhandled error states).
   - 🛠️ **Refactored / Ideal Solution**: A clean, modern TypeScript/React snippet demonstrating best practice.
   - ❓ **Targeted Follow-Up Questions**: 2-3 deep, probing follow-up questions specifically testing trade-offs, edge cases, or scalability based on what candidate answered.

Tone: Professional, rigorous, constructive, and direct.`;

async function handleInterviewApi(request: Request): Promise<Response> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not configured" }), {
      status: 503,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const {
      mode,
      question,
      category,
      userAnswer,
      codeDraft,
      rubric,
      followUpQuestion,
      followUpAnswer,
    } = (await request.json()) as {
      mode?: string;
      question?: string;
      category?: string;
      userAnswer?: string;
      codeDraft?: string;
      rubric?: string[];
      followUpQuestion?: string;
      followUpAnswer?: string;
    };

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    let promptText = "";
    if (mode === "followup") {
      promptText = `INTERVIEW FOLLOW-UP RESPONSE EVALUATION:
Original Question: ${question}
Follow-Up Question Asked: ${followUpQuestion}
Candidate's Follow-Up Answer: ${followUpAnswer}

Evaluate the candidate's follow-up answer. Provide an updated score (0-100), concise feedback on their reasoning, and whether they successfully answered the follow-up probe.`;
    } else {
      promptText = `MOCK INTERVIEW CANDIDATE EVALUATION:
Topic/Category: ${category || "Frontend Engineering"}
Question: ${question}

Candidate Written Response:
${userAnswer || "(No written explanation provided)"}

Candidate Code Draft:
\`\`\`
${codeDraft || "// No code draft provided"}
\`\`\`

Expected Evaluation Rubric Criteria:
${(rubric || []).map((r) => `- ${r}`).join("\n")}

Please provide a complete AI Staff Interviewer evaluation following the requested markdown structure with Score, Assessment, Strengths, Areas for Improvement, Refactored Solution, and 2-3 Targeted Follow-Up Questions.`;
    }

    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3.6-flash",
      contents: [{ role: "user", parts: [{ text: promptText }] }],
      config: {
        systemInstruction: INTERVIEW_SYSTEM_INSTRUCTION,
      },
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            const text = chunk.text;
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (err) {
          console.error("Gemini interview stream error:", err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error in /api/interview:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

const CODE_REVIEW_SYSTEM_INSTRUCTION = `You are Forge AI Staff Code Reviewer, performing deep code audits for production frontend applications.
Your review MUST evaluate code across 4 core pillars:
1. ⚛️ **React Best Practices**: Hook rules, stale closures, dependency arrays, state colocation, unnecessary re-renders, useMemo/useCallback discipline.
2. 🔷 **TypeScript & Type Safety**: Strict type assertions, avoiding 'any' or risky casts, proper generic bounds, discriminated unions, narrowing.
3. ♿ **Accessibility (WCAG 2.1 AA)**: Semantic HTML tags, screen reader ARIA support, keyboard focus management, label associations, color contrast awareness.
4. ⚡ **Performance & Optimization**: Virtualization, DOM footprint, bundle efficiency, debouncing, memory leak prevention (unsubscribing listeners/timers).

Output Format:
- 🏆 **Overall Code Quality Score**: [e.g. 92/100] - Grade: [Production Ready / Staff Level / Refactoring Recommended]
- ⚛️ **React Audit**: Strengths & actionable suggestions.
- 🔷 **TypeScript Audit**: Type strictness evaluation & improvements.
- ♿ **Accessibility (WCAG) Audit**: Compliance check & missing ARIA attributes.
- ⚡ **Performance Audit**: Render bottlenecks, memory risks, or bundle overhead.
- 🛠️ **Refactored Code Solution**: Provide a complete, production-grade refactored code solution fixing the identified issues.

Tone: Professional, precise, constructive, and engineering-focused.`;

async function handleCodeReviewApi(request: Request): Promise<Response> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not configured" }), {
      status: 503,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const { files, activeFileName, focusAreas, customInstructions } = (await request.json()) as {
      files?: { name: string; code: string; language: string }[];
      activeFileName?: string;
      focusAreas?: string[];
      customInstructions?: string;
    };

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const fileContentsText = (files || [])
      .map((f) => `--- FILE: ${f.name} (${f.language}) ---\n${f.code}\n`)
      .join("\n\n");

    const promptText = `AI CODE REVIEW REQUEST:
Active Target File: ${activeFileName || "Main Component"}
Focus Dimensions Requested: ${(focusAreas || ["React", "TypeScript", "Accessibility", "Performance"]).join(", ")}
${customInstructions ? `Developer Notes/Context: ${customInstructions}\n` : ""}

Codebase Files To Audit:
${fileContentsText || "// No code files submitted"}

Perform a comprehensive code review covering React, TypeScript, Accessibility (WCAG), and Performance pillars as requested. Provide score out of 100 and complete refactored code.`;

    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3.6-flash",
      contents: [{ role: "user", parts: [{ text: promptText }] }],
      config: {
        systemInstruction: CODE_REVIEW_SYSTEM_INSTRUCTION,
      },
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            const text = chunk.text;
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (err) {
          console.error("Gemini code review stream error:", err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error in /api/code-review:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

const PROJECT_MENTOR_SYSTEM_INSTRUCTION = `You are Forge AI Staff Project Mentor & Principal Systems Architect at Google/Meta.
Your responsibility is to guide candidates building real-world frontend engineering projects.

Depending on the mode requested:
1. **Milestone Reviews**: Review candidate's task progress, milestone status, verified acceptance criteria, and reflection notes. Provide a comprehensive Milestone Review with grade (e.g., 90/100), verified accomplishments, critical remaining gaps, and quality/testing recommendations.
2. **Architecture Advice**: Provide high-level system architecture advice for the project. Detail component hierarchies, state management patterns (Zustand, React Query, Context), data flow, bundle/performance optimization strategies, and 10x scalability blueprints.
3. **Suggestions**: Provide 5-7 actionable suggestions and feature extensions for the project. Include code snippets, refactoring tips, performance enhancements, and interview talking points.

Tone: Professional, architectural, inspiring, direct, and actionable. Structure in clean, crisp Markdown.`;

async function handleProjectMentorApi(request: Request): Promise<Response> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not configured" }), {
      status: 503,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const {
      mode,
      projectTitle,
      projectCategory,
      projectOverview,
      milestonesInfo,
      completedTasksCount,
      totalTasksCount,
      criteriaInfo,
      reflectionInfo,
      userPrompt,
    } = (await request.json()) as {
      mode?: string;
      projectTitle?: string;
      projectCategory?: string;
      projectOverview?: string;
      milestonesInfo?: string;
      completedTasksCount?: number;
      totalTasksCount?: number;
      criteriaInfo?: string;
      reflectionInfo?: {
        challenge?: string;
        solution?: string;
        learned?: string;
        scaleRefactor?: string;
      };
      userPrompt?: string;
    };

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    let promptText = "";
    if (mode === "milestone_review") {
      promptText = `PROJECT MILESTONE REVIEW REQUEST:
Project: ${projectTitle} (${projectCategory})
Overview: ${projectOverview}
Tasks Status: ${completedTasksCount}/${totalTasksCount} completed

Milestones Breakdown:
${milestonesInfo}

Acceptance Criteria Status:
${criteriaInfo}

Developer Reflection Notes:
- Biggest Hurdle: ${reflectionInfo?.challenge || "None recorded"}
- Resolution & Trade-offs: ${reflectionInfo?.solution || "None recorded"}
- Pattern Mastered: ${reflectionInfo?.learned || "None recorded"}
- Scale Blueprint: ${reflectionInfo?.scaleRefactor || "None recorded"}

Provide a detailed Milestone Review evaluating execution quality, milestone thoroughness, edge case coverage, and next steps to reach 100% completion.`;
    } else if (mode === "architecture_advice") {
      promptText = `PROJECT ARCHITECTURE ADVICE REQUEST:
Project: ${projectTitle} (${projectCategory})
Overview: ${projectOverview}

Milestones & Functional Scope:
${milestonesInfo}

Provide comprehensive Staff Architect advice for this project:
1. Recommended Component Hierarchy & File Structure
2. State Management Strategy (Local vs Global vs Server cache)
3. Performance & Rendering Constraints (Memoization, Code splitting, Web Workers)
4. Scale & Resilience Blueprint (10x growth, Error Boundaries, Offline fallback)`;
    } else if (mode === "suggestions") {
      promptText = `PROJECT SUGGESTIONS & IMPROVEMENTS REQUEST:
Project: ${projectTitle} (${projectCategory})
Overview: ${projectOverview}

Provide 5-7 actionable engineering suggestions and feature enhancement ideas to turn this project into an elite portfolio showcase. Include refactoring recommendations, modern React patterns, and technical resume talking points.`;
    } else {
      promptText = `PROJECT MENTOR QUESTION:
Project Context: ${projectTitle} (${projectCategory}) - ${projectOverview}
User Question: ${userPrompt}

Provide direct, actionable architectural guidance and guidance for the developer.`;
    }

    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3.6-flash",
      contents: [{ role: "user", parts: [{ text: promptText }] }],
      config: {
        systemInstruction: PROJECT_MENTOR_SYSTEM_INSTRUCTION,
      },
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            const text = chunk.text;
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (err) {
          console.error("Gemini project mentor stream error:", err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error in /api/project-mentor:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);
      if (url.pathname === "/api/mentor" && request.method === "POST") {
        return await handleMentorApi(request);
      }
      if (url.pathname === "/api/whiteboard" && request.method === "POST") {
        return await handleWhiteboardApi(request);
      }
      if (url.pathname === "/api/interview" && request.method === "POST") {
        return await handleInterviewApi(request);
      }
      if (url.pathname === "/api/code-review" && request.method === "POST") {
        return await handleCodeReviewApi(request);
      }
      if (url.pathname === "/api/project-mentor" && request.method === "POST") {
        return await handleProjectMentorApi(request);
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
