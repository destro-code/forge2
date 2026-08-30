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
  const serializedSource = JSON.stringify(source);
  const serializedTestCases = JSON.stringify(testCases);

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

      var __source__ = ${serializedSource};
      window.__source__ = __source__;
      var runtimeError;

      try {
        // Runs at top level so 'let'/'const' declarations join the shared
        // global lexical environment and remain visible to the test-case
        // script tag injected immediately after this one.
        window.eval(__source__);
      } catch (err) {
        runtimeError = err && err.message ? err.message : String(err);
      }

      var testCases = ${serializedTestCases};
      var testResults = [];
      if (!runtimeError) {
        for (var i = 0; i < testCases.length; i++) {
          var testCase = testCases[i];
          try {
            var passed = !!window.eval("(" + testCase.expression + ")");
            testResults.push({ id: testCase.id, description: testCase.description, passed: passed });
          } catch (evalErr) {
            testResults.push({
              id: testCase.id,
              description: testCase.description,
              passed: false,
              errorMessage: evalErr && evalErr.message ? evalErr.message : String(evalErr),
            });
          }
        }
      }

      parent.postMessage({
        type: ${JSON.stringify(RESPONSE_MESSAGE_TYPE)},
        logs: logs,
        runtimeError: runtimeError,
        testResults: testResults,
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

    document.body.appendChild(iframe);
    const doc = iframe.contentDocument;
    if (!doc) {
      resolve({ logs: [], runtimeError: "Unable to create sandbox document.", testResults: [] });
      cleanup();
      return;
    }
    doc.open();
    doc.write(buildSandboxDocument(source, testCases));
    doc.close();
  });
}
