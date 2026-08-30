/**
 * Minimal, isolated sandbox for the lesson-experience proof.
 *
 * This intentionally does NOT reuse `src/lib/compiler/*` (the production
 * canonical runtime pipeline). It exists to prove the experience model can
 * host *real* sandboxed code execution — not to replace or share state with
 * the production compiler/validator. It follows the same security posture:
 * a `sandbox="allow-scripts"` iframe (no `allow-same-origin`, so the iframe
 * origin is opaque and cannot reach the parent DOM or cookies) and
 * communication is exclusively via targeted `postMessage`.
 */

export interface SandboxLogEntry {
  level: "log" | "warn" | "error";
  args: string[];
}

export interface SandboxTestCaseResult {
  id: string;
  description: string;
  passed: boolean;
  errorMessage?: string;
}

export interface SandboxRunResult {
  logs: SandboxLogEntry[];
  runtimeError?: string;
  testResults: SandboxTestCaseResult[];
}

interface SandboxTestCase {
  id: string;
  description: string;
  expression: string;
}

const RESPONSE_MESSAGE_TYPE = "DEMO_LESSON_SANDBOX_RESULT";

function escapeForScriptTag(value: string): string {
  return value.replace(/<\/script>/gi, "<\\/script>");
}

function buildSandboxDocument(source: string, testCases: SandboxTestCase[]): string {
  const testRunnerLines = testCases
    .map((testCase) => {
      const id = JSON.stringify(testCase.id);
      const description = JSON.stringify(testCase.description);
      return `
      try {
        __testResults.push({ id: ${id}, description: ${description}, passed: !!(${testCase.expression}) });
      } catch (evalErr) {
        __testResults.push({
          id: ${id},
          description: ${description},
          passed: false,
          errorMessage: evalErr && evalErr.message ? evalErr.message : String(evalErr),
        });
      }`;
    })
    .join("\n");

  // Composed as ONE script and executed via a single `eval()` call so the
  // learner's top-level `let`/`const` bindings stay alive for the test-case
  // expressions below. Indirect eval scopes `let`/`const` to that single
  // eval invocation -- running the source and each test as separate eval
  // calls (as before) silently dropped every non-`var` binding before the
  // tests ran, so `let score = 10` was already gone by check time.
  const combinedEvalSource = `
    var __runtimeError;
    try {
${source}
    } catch (err) {
      __runtimeError = err && err.message ? err.message : String(err);
    }
    var __testResults = [];
    if (!__runtimeError) {
${testRunnerLines}
    }
  `;
  const serializedCombinedEvalSource = JSON.stringify(combinedEvalSource);

  const runnerScript = `
    (function () {
      var logs = [];
      function record(level, args) {
        try {
          logs.push({ level: level, args: args.map(function (a) {
            if (typeof a === "string") return a;
            try { return JSON.stringify(a); } catch (e) { return String(a); }
          }) });
        } catch (e) {}
      }
      console.log = function () { record("log", Array.prototype.slice.call(arguments)); };
      console.warn = function () { record("warn", Array.prototype.slice.call(arguments)); };
      console.error = function () { record("error", Array.prototype.slice.call(arguments)); };

      // Indirect eval (via \`window.eval\`) always runs as non-strict global
      // code, so the \`var __runtimeError\` / \`var __testResults\`
      // declarations inside become real \`window\` properties we can read
      // back immediately below.
      window.eval(${serializedCombinedEvalSource});

      parent.postMessage({
        type: ${JSON.stringify(RESPONSE_MESSAGE_TYPE)},
        logs: logs,
        runtimeError: window.__runtimeError,
        testResults: window.__testResults || [],
      }, "*");
    })();
  `;

  return `<!doctype html>
<html>
  <head><meta charset="utf-8" /></head>
  <body>
    <script>${escapeForScriptTag(runnerScript)}</script>
  </body>
</html>`;
}

/**
 * Executes `source` inside a freshly created, fully isolated sandbox iframe
 * and resolves once results (or a runtime error) come back via
 * `postMessage`. The iframe is detached immediately after resolving.
 */
export function runInSandbox(
  source: string,
  testCases: SandboxTestCase[] = [],
  timeoutMs = 3000,
): Promise<SandboxRunResult> {
  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("sandbox", "allow-scripts");
    iframe.style.display = "none";
    iframe.setAttribute("aria-hidden", "true");

    let settled = false;

    function cleanup() {
      window.removeEventListener("message", onMessage);
      clearTimeout(timeoutId);
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }

    function onMessage(event: MessageEvent) {
      if (event.source !== iframe.contentWindow) return;
      if (!event.data || event.data.type !== RESPONSE_MESSAGE_TYPE) return;
      if (settled) return;
      settled = true;
      const { logs, runtimeError, testResults } = event.data;
      cleanup();
      resolve({ logs: logs ?? [], runtimeError, testResults: testResults ?? [] });
    }

    window.addEventListener("message", onMessage);
    const timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve({
        logs: [],
        runtimeError: "Execution timed out.",
        testResults: testCases.map((tc) => ({
          id: tc.id,
          description: tc.description,
          passed: false,
        })),
      });
    }, timeoutMs);

    // Use `srcdoc` rather than `contentDocument.write()`. With
    // `sandbox="allow-scripts"` and no `allow-same-origin`, the iframe's
    // origin is opaque from the moment it exists, so `contentDocument` is
    // cross-origin and unreachable from the parent — `write()` would never
    // work. Setting `srcdoc` loads the markup into the sandboxed context
    // directly, without the parent ever touching the child's document.
    iframe.srcdoc = buildSandboxDocument(source, testCases);
    document.body.appendChild(iframe);
  });
}
