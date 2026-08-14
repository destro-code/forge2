import { useState, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { Copy, Check, Terminal, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import * as Babel from "@babel/standalone";

interface LessonInteractiveCodeProps {
  language: string;
  code: string;
  title?: string;
  highlightLines?: number[];
  onOpenSandbox?: (code: string) => void;
  lessonId?: string;
  exampleId?: string;
}

function buildInlineJsxPreviewHtml(code: string, lang: string): string {
  // Transpile JSX/TSX via Babel standalone
  const transformed = Babel.transform(code, {
    presets: [
      ["react", { runtime: "classic" }],
      ["typescript", { ignoreExtensions: false }],
    ],
    parserOpts: {
      allowReturnOutsideFunction: true,
    },
    filename: `snippet.${lang === "tsx" ? "tsx" : "jsx"}`,
  });

  const transpiledJs = transformed.code || "";

  // Detect declared PascalCase component names
  const regex =
    /(?:function\s+([A-Z]\w*)|const\s+([A-Z]\w*)\s*=|class\s+([A-Z]\w*)|let\s+([A-Z]\w*)\s*=|var\s+([A-Z]\w*)\s*=)/g;
  const compNames: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(code)) !== null) {
    const name = m[1] || m[2] || m[3] || m[4] || m[5];
    if (name) compNames.push(name);
  }

  // Safe script tag escaping
  const safeJs = transpiledJs.replace(/<\/script>/gi, "<\\/script>");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="/vendor/react.development.js"></script>
  <script src="/vendor/react-dom.development.js"></script>
  <script>
    if (!window.React) {
      document.write('<script src="https://unpkg.com/react@18/umd/react.development.js"><\\/script>');
      document.write('<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\\/script>');
    }
  </script>
  <style>
    body {
      margin: 0;
      padding: 14px;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      font-size: 13px;
      line-height: 1.5;
    }
    * { box-sizing: border-box; }
    h1, h2, h3, h4 { color: #38bdf8; margin-top: 0; margin-bottom: 8px; font-weight: 600; }
    h1 { font-size: 16px; }
    h2 { font-size: 14px; }
    p { margin: 0 0 8px 0; color: #cbd5e1; }
    section, article {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 10px;
    }
    button, .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #3b82f6;
      color: #ffffff;
      border: none;
      border-radius: 6px;
      padding: 6px 14px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s ease, transform 0.1s ease;
    }
    button:hover, .btn:hover {
      background: #2563eb;
    }
    button:active, .btn:active {
      transform: scale(0.98);
    }
    input, select, textarea {
      background: #0f172a;
      border: 1px solid #334155;
      color: #f8fafc;
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 12px;
      outline: none;
    }
    input:focus { border-color: #38bdf8; }
    ul, ol {
      margin: 0 0 8px 0;
      padding-left: 20px;
      color: #cbd5e1;
    }
    li { margin-bottom: 4px; }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      font-size: 11px;
      border-radius: 4px;
      background: #334155;
      color: #94a3b8;
    }
    #runtime-error {
      display: none;
      background: #450a0a;
      border: 1px solid #dc2626;
      color: #fca5a5;
      padding: 10px;
      border-radius: 6px;
      font-family: monospace;
      font-size: 11px;
      white-space: pre-wrap;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <div id="runtime-error"></div>
  <div id="root"></div>

  <script>
    (function() {
      function showErr(msg) {
        var el = document.getElementById('runtime-error');
        if (el) {
          el.style.display = 'block';
          el.textContent = 'Runtime Error: ' + msg;
        }
      }

      window.onerror = function(msg) {
        showErr(msg);
        return true;
      };

      if (!window.React || !window.ReactDOM) {
        showErr('React runtime failed to initialize.');
        return;
      }

      var useState = React.useState;
      var useEffect = React.useEffect;
      var useMemo = React.useMemo;
      var useCallback = React.useCallback;
      var useRef = React.useRef;
      var useContext = React.useContext;
      var createContext = React.createContext;
      var useReducer = React.useReducer;

      var exports = {};
      var module = { exports: exports };

      // Helper mock components & state for curriculum snippets
      var LessonCard = function(props) {
        return React.createElement('article', { className: 'lesson-card' },
          React.createElement('h2', null, props.title || 'Lesson Card'),
          props.duration ? React.createElement('p', null, props.duration + ' mins') : null,
          props.completed !== undefined ? React.createElement('p', null, props.completed ? 'Complete' : 'In progress') : null,
          props.children
        );
      };
      var LessonSkeleton = function() {
        return React.createElement('div', { style: { padding: '8px', color: '#94a3b8', fontStyle: 'italic' } }, 'Loading lesson skeleton…');
      };
      var SaveButton = function() {
        var s = React.useState(false);
        return React.createElement('button', { onClick: function() { s[1](true); } }, s[0] ? 'Saved' : 'Save');
      };

      var initialLessons = [
        { id: '1', title: 'Scope & Closures', duration: 30, completed: true },
        { id: '2', title: 'Prototypes & Objects', duration: 45, completed: false },
        { id: '3', title: 'React Fundamentals', duration: 40, completed: false }
      ];
      var lessons = initialLessons;
      var isSaving = false;
      var isOffline = false;
      var email = 'learner@example.com';
      var handleClick = function() { console.log('Clicked'); };
      var setLesson = function() {};
      var setCount = function() {};

      var defaultProps = {
        title: 'Closures',
        duration: 45,
        completed: true,
        saved: false,
        total: 100,
        status: 'ready',
        loading: false,
        error: null,
        lessons: initialLessons,
        lesson: initialLessons[0],
        onComplete: function() { console.log('Completed'); },
        onClick: function() { console.log('Clicked'); }
      };

      try {
        ${safeJs}

        var candidateComp = null;

        // 1. Check exports
        if (module.exports && (typeof module.exports === 'function' || module.exports.$$typeof)) {
          candidateComp = module.exports;
        } else if (module.exports && module.exports.default) {
          candidateComp = module.exports.default;
        } else if (exports.default) {
          candidateComp = exports.default;
        }

        // 2. Check candidate components detected from code in reverse order
        if (!candidateComp) {
          var names = ${JSON.stringify(compNames.reverse())};
          for (var i = 0; i < names.length; i++) {
            try {
              var fn = eval(names[i]);
              if (typeof fn === 'function') {
                candidateComp = fn;
                break;
              }
            } catch(e) {}
          }
        }

        var rootEl = document.getElementById('root');
        if (candidateComp) {
          var element;
          if (React.isValidElement(candidateComp)) {
            element = candidateComp;
          } else {
            element = React.createElement(candidateComp, defaultProps);
          }

          if (ReactDOM.createRoot) {
            var root = ReactDOM.createRoot(rootEl);
            root.render(element);
          } else if (ReactDOM.render) {
            ReactDOM.render(element, rootEl);
          }
        } else {
          rootEl.innerHTML = '<div style="color: #94a3b8; font-style: italic;">JSX snippet compiled cleanly.</div>';
        }
      } catch (err) {
        showErr(err.message);
      }
    })();
  </script>
</body>
</html>`;
}

function buildInlineHtmlPreview(code: string): string {
  if (code.includes("<html") || code.includes("<!DOCTYPE html>")) {
    return code;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      margin: 0;
      padding: 16px;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      font-size: 13px;
      line-height: 1.6;
    }
    * { box-sizing: border-box; }
    a { color: #38bdf8; text-decoration: underline; }
    img { max-width: 100%; height: auto; border-radius: 6px; }
    h1, h2, h3, h4 { color: #38bdf8; margin-top: 0; margin-bottom: 8px; font-weight: 600; }
    h1 { font-size: 16px; }
    h2 { font-size: 14px; }
    p { margin: 0 0 8px 0; color: #cbd5e1; }
    button, input, select, textarea { font-family: inherit; }
    button, .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #3b82f6;
      color: #ffffff;
      border: none;
      border-radius: 6px;
      padding: 6px 14px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
    }
    button:hover, .btn:hover { background: #2563eb; }
    ul, ol { margin: 0 0 8px 0; padding-left: 20px; color: #cbd5e1; }
    li { margin-bottom: 4px; }
    .card, .container, .box {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 8px;
    }
  </style>
</head>
<body>
  ${code}
</body>
</html>`;
}

function buildInlineCssPreview(code: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      margin: 0;
      padding: 16px;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      font-size: 13px;
      line-height: 1.5;
    }
    * { box-sizing: border-box; }
    .preview-header {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #94a3b8;
      margin-bottom: 12px;
      border-bottom: 1px solid #334155;
      padding-bottom: 4px;
    }
    .preview-stage {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .box, .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 12px;
    }
    .container {
      background: #1e293b;
      border: 1px dashed #475569;
      border-radius: 8px;
      padding: 12px;
      display: flex;
      gap: 8px;
    }
    .item {
      background: #334155;
      padding: 8px 12px;
      border-radius: 4px;
      color: #f8fafc;
    }
    button, .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #3b82f6;
      color: #ffffff;
      border: none;
      border-radius: 6px;
      padding: 6px 14px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
    }

    /* User CSS begins */
    ${code}
    /* User CSS ends */
  </style>
</head>
<body>
  <div class="preview-header">Live CSS Preview Fixture</div>
  <div class="preview-stage">
    <div class="box">
      <div class="title" style="font-weight: 600; margin-bottom: 4px;">.box / .card element</div>
      <p style="margin: 0; color: #94a3b8; font-size: 12px;">Demonstrates box-model, padding, borders, typography, and colors.</p>
    </div>

    <div class="container">
      <div class="item">Flex/Grid Item A</div>
      <div class="item">Flex/Grid Item B</div>
      <div class="item">Flex/Grid Item C</div>
    </div>

    <div>
      <button class="btn">Demo Button (.btn)</button>
    </div>
  </div>
</body>
</html>`;
}

function buildInlineDomJsPreview(code: string, id: string): string {
  const cleanCode = code
    .replace(/^import\s+[\s\S]*?from\s+['"].*?['"];?/gm, "")
    .replace(/^export\s+default\s+/gm, "")
    .replace(/^export\s+/gm, "");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      margin: 0;
      padding: 16px;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      font-size: 13px;
      line-height: 1.5;
    }
    * { box-sizing: border-box; }
    .box, .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 12px;
    }
    button, .btn, #save-button, #submit-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #3b82f6;
      color: #ffffff;
      border: none;
      border-radius: 6px;
      padding: 6px 14px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
    }
    button:hover, .btn:hover { background: #2563eb; }
    input, textarea, select {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 4px;
      color: #f8fafc;
      padding: 6px 10px;
      font-family: inherit;
      font-size: 13px;
    }
    form { margin: 0; }
  </style>
</head>
<body>
  <div class="card container" id="app">
    <h3 id="title" style="margin-top: 0; margin-bottom: 8px; font-size: 16px;">DOM Preview Fixture</h3>
    <p id="message" style="margin: 0 0 12px 0; color: #94a3b8;">Interact with the elements below.</p>
    
    <div style="display: flex; gap: 8px; margin-bottom: 12px;">
      <input type="text" id="input" placeholder="Type here..." />
      <button id="save-button">Save Changes</button>
      <button id="submit-button">Submit</button>
    </div>
    
    <div id="output" style="padding: 8px; background: #000000; color: #a3e635; border-radius: 4px; min-height: 32px; font-family: monospace;"></div>
  </div>

  <script>
    (function() {
      const originalLog = console.log;
      const originalWarn = console.warn;
      const originalError = console.error;

      function sendLog(level, args) {
        try {
          const message = Array.from(args).map(a => {
            if (a instanceof HTMLElement) return \`<\${a.tagName.toLowerCase()}>\`;
            return typeof a === 'object' ? JSON.stringify(a) : String(a);
          }).join(' ');
          window.parent.postMessage({ type: 'CONSOLE_LOG', level, message, id: '${id}' }, '*');
        } catch (e) {
          window.parent.postMessage({ type: 'CONSOLE_LOG', level: 'error', message: String(e), id: '${id}' }, '*');
        }
      }

      console.log = function() { originalLog.apply(console, arguments); sendLog('log', arguments); };
      console.warn = function() { originalWarn.apply(console, arguments); sendLog('warn', arguments); };
      console.error = function() { originalError.apply(console, arguments); sendLog('error', arguments); };
      
      window.onerror = function(msg, url, line) {
        sendLog('error', [msg]);
        return false;
      };
    })();
  </script>
  
  <script>
    try {
      ${cleanCode}
    } catch (e) {
      console.error(e.message || String(e));
    }
  </script>
</body>
</html>`;
}

export function LessonInteractiveCode({
  language,
  code,
  title,
  highlightLines = [],
  onOpenSandbox,
  lessonId,
  exampleId,
}: LessonInteractiveCodeProps) {
  const [copied, setCopied] = useState(false);
  const [outputLog, setOutputLog] = useState<string | null>(null);
  const [isErrorLog, setIsErrorLog] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const previewId = useRef(`preview-${Math.random().toString(36).substr(2, 9)}`).current;

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data && e.data.type === "CONSOLE_LOG" && e.data.id === previewId) {
        const msg = e.data.message;
        const level = e.data.level;

        setOutputLog((prev) => {
          const current = prev || "";
          const prefix = level === "error" ? "[ERROR] " : level === "warn" ? "[WARN] " : "";
          return current ? current + "\n" + prefix + msg : prefix + msg;
        });
        if (level === "error") {
          setIsErrorLog(true);
        }
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [previewId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split("\n");

  const normLang = (language || "").toLowerCase().trim();
  const isQuickRunnable = ["javascript", "js", "jsx", "tsx", "react", "html", "css"].includes(
    normLang,
  );
  const isPlaygroundSupported = ["javascript", "js", "jsx", "tsx", "react", "html", "css"].includes(
    normLang,
  );

  const handleQuickRun = () => {
    if (!isQuickRunnable) {
      return;
    }

    setOutputLog("");
    setIsErrorLog(false);
    setPreviewHtml(null);

    if (normLang === "html") {
      try {
        const previewDoc = buildInlineHtmlPreview(code);
        setPreviewHtml(previewDoc);
        setOutputLog("✓ HTML rendered in live preview.");
        setIsErrorLog(false);
        toast.success("HTML rendered in preview");
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        setOutputLog(`Failed to render HTML:\n${errMsg}`);
        setIsErrorLog(true);
      }
    } else if (normLang === "css") {
      try {
        const previewDoc = buildInlineCssPreview(code);
        setPreviewHtml(previewDoc);
        setOutputLog("✓ CSS applied to live preview fixture.");
        setIsErrorLog(false);
        toast.success("CSS applied to preview");
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        setOutputLog(`Failed to apply CSS:\n${errMsg}`);
        setIsErrorLog(true);
      }
    } else if (normLang === "jsx" || normLang === "tsx" || normLang === "react") {
      // JSX / TSX / React compilation & preview mount path via Babel standalone
      try {
        const previewDoc = buildInlineJsxPreviewHtml(code, normLang);

        const logs: string[] = [];
        const dummyConsole = {
          log: (...args: unknown[]) =>
            logs.push(
              args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" "),
            ),
          warn: (...args: unknown[]) => logs.push(`[WARN] ${args.join(" ")}`),
          error: (...args: unknown[]) => logs.push(`[ERROR] ${args.join(" ")}`),
        };

        // Capture any top-level console output
        try {
          const transformed = Babel.transform(code, {
            presets: [
              ["react", { runtime: "classic" }],
              ["typescript", { ignoreExtensions: false }],
            ],
            parserOpts: { allowReturnOutsideFunction: true },
            filename: `snippet.${normLang === "tsx" ? "tsx" : "jsx"}`,
          });
          const transpiledCode = transformed.code || "";
          if (transpiledCode.includes("console.")) {
            const dummyReact = {
              createElement: (...args: unknown[]) => ({
                type: args[0],
                props: args[1],
                children: args.slice(2),
              }),
              Fragment: Symbol.for("react.fragment"),
              useState: (initial: unknown) => [initial, () => {}],
              useEffect: () => {},
              useMemo: (fn: () => unknown) => fn(),
              useCallback: (fn: unknown) => fn,
              useRef: (initial: unknown) => ({ current: initial }),
            };
            const fn = new Function("React", "console", transpiledCode);
            fn(dummyReact, dummyConsole);
          }
        } catch {
          // Ignore top-level evaluation errors for standalone component declarations
        }

        setPreviewHtml(previewDoc);

        if (logs.length > 0) {
          setOutputLog(
            `✓ JSX compilation successful\nComponent mounted to live preview.\n\nConsole Output:\n${logs.join("\n")}`,
          );
        } else {
          setOutputLog("✓ JSX compilation successful\nComponent mounted to live preview.");
        }
        setIsErrorLog(false);
        toast.success("JSX compiled and rendered successfully");
      } catch (err: unknown) {
        const rawMsg = err instanceof Error ? err.message : String(err);
        const cleanMsg = rawMsg.replace(/^\/?[^:]+:\s*/, "");
        setOutputLog(`✕ JSX/TSX Compilation Error:\n${cleanMsg}`);
        setIsErrorLog(true);
        setPreviewHtml(null);
        toast.error("JSX compilation error");
      }
    } else if (normLang === "javascript" || normLang === "js") {
      const isDomJs =
        /\b(document|window|querySelector|querySelectorAll|getElementById|getElementsByClassName|addEventListener|classList|textContent|innerHTML|style|createElement|appendChild|remove|value)\b/.test(
          code,
        );

      if (isDomJs) {
        const previewDoc = buildInlineDomJsPreview(code, previewId);
        setPreviewHtml(previewDoc);
        setOutputLog("");
        setIsErrorLog(false);
        toast.success("DOM Script loaded in preview");
      } else {
        // Plain JavaScript Fast Path
        try {
          const logs: string[] = [];
          const dummyConsole = {
            log: (...args: unknown[]) =>
              logs.push(
                args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" "),
              ),
            warn: (...args: unknown[]) => logs.push(`[WARN] ${args.join(" ")}`),
            error: (...args: unknown[]) => logs.push(`[ERROR] ${args.join(" ")}`),
          };

          // Strip imports/exports to allow quick eval of basic JS
          const cleanCode = code
            .replace(/^import\s+[\s\S]*?from\s+['"].*?['"];?/gm, "")
            .replace(/^export\s+default\s+/gm, "")
            .replace(/^export\s+/gm, "");

          const fn = new Function("console", cleanCode);
          fn(dummyConsole);

          if (logs.length > 0) {
            setOutputLog(logs.join("\n"));
            toast.success("Snippet executed cleanly");
          } else {
            setOutputLog("✓ Executed cleanly (no console output).");
          }
          setIsErrorLog(false);
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          setOutputLog(`Runtime Error:\n${errMsg}`);
          setIsErrorLog(true);
        }
      }
    }
  };

  return (
    <div className="my-6 rounded-xl border border-border/70 bg-[#0d0e12] overflow-hidden shadow-elegant font-mono text-xs">
      {/* Code Bar Header */}
      <div className="flex items-center justify-between border-b border-border/50 bg-card/60 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
          {title && <span className="ml-2 font-sans text-xs text-muted-foreground">{title}</span>}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-border/60 uppercase">
            {language}
          </Badge>

          {isQuickRunnable && (
            <Button
              size="sm"
              onClick={handleQuickRun}
              className="h-7 px-2.5 text-xs gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 font-medium"
              title="Evaluate console output"
            >
              <Play className="h-3.5 w-3.5 text-emerald-400 fill-emerald-400/20" />
              <span className="hidden sm:inline">Run Quick</span>
              <span className="sm:hidden">Run</span>
            </Button>
          )}

          {isPlaygroundSupported &&
            (onOpenSandbox ? (
              <Button
                size="sm"
                onClick={() => onOpenSandbox(code)}
                className="h-7 px-2.5 text-xs gap-1.5 bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 font-medium"
                title="Edit in live sandbox"
              >
                <Terminal className="h-3.5 w-3.5" />
                <span>Sandbox</span>
              </Button>
            ) : (
              <Button
                size="sm"
                asChild
                className="h-7 px-2.5 text-xs gap-1.5 bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 font-medium"
                title="Open full playground"
              >
                <Link
                  to="/playground"
                  search={{
                    mode: "lesson-inline",
                    lessonId: lessonId || undefined,
                    exampleId: exampleId || undefined,
                    lang: language,
                    title: title || undefined,
                    code: code,
                  }}
                >
                  <Terminal className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Playground</span>
                </Link>
              </Button>
            ))}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50"
            title="Copy code"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Code Lines Body */}
      <div className="p-4 overflow-x-auto text-[13px] leading-relaxed">
        <pre className="grid">
          {lines.map((line, idx) => {
            const lineNum = idx + 1;
            const isHighlighted = highlightLines.includes(lineNum);
            return (
              <div
                key={idx}
                className={`table-row ${
                  isHighlighted
                    ? "bg-primary/15 font-semibold text-primary border-l-2 border-primary"
                    : ""
                }`}
              >
                <span className="table-cell select-none pr-4 text-right text-muted-foreground/40 text-[11px] w-8">
                  {lineNum}
                </span>
                <span className="table-cell text-foreground/90 whitespace-pre">{line}</span>
              </div>
            );
          })}
        </pre>
      </div>

      {/* Console output & preview drawer if quick run executed */}
      {(outputLog !== null || previewHtml !== null) && (
        <div className="border-t border-border/50 bg-[#07080a] p-4 text-[11px] font-mono">
          <div className="flex items-center justify-between text-muted-foreground text-[10px] mb-2 font-sans">
            <span className="flex items-center gap-1 font-semibold text-foreground">
              <Terminal
                className={`h-3 w-3 ${isErrorLog ? "text-rose-400" : "text-emerald-400"}`}
              />{" "}
              Quick Output Log
            </span>
            <button
              onClick={() => {
                setOutputLog(null);
                setPreviewHtml(null);
              }}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              Dismiss
            </button>
          </div>

          <div className="space-y-3">
            {outputLog && (
              <div
                className={`whitespace-pre-wrap p-2.5 rounded border ${
                  isErrorLog
                    ? "bg-rose-950/30 text-rose-300 border-rose-500/30"
                    : "bg-black/40 text-emerald-300 border-border/20"
                }`}
              >
                {outputLog}
              </div>
            )}

            {previewHtml && (
              <div className="space-y-1">
                <div className="text-[10px] text-muted-foreground font-sans uppercase font-semibold">
                  Live Preview
                </div>
                <iframe
                  srcDoc={previewHtml}
                  title="Quick Run HTML/CSS Preview"
                  sandbox="allow-scripts"
                  className="w-full h-44 rounded border border-border/30 bg-[#0f172a]"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
