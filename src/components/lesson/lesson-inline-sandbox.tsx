import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, RefreshCw, Terminal, ExternalLink, Code2 } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface LessonInlineSandboxProps {
  initialCode: string;
  title?: string;
  instructions?: string;
}

export function LessonInlineSandbox({
  initialCode,
  title = "Interactive Mini Sandbox",
  instructions,
}: LessonInlineSandboxProps) {
  const [code, setCode] = useState(initialCode);
  const [key, setKey] = useState(0);
  const [consoleLogs, setConsoleLogs] = useState<{ level: string; msg: string }[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const buildSrcDoc = () => {
    const safeCode = JSON.stringify(code).replace(/<\/script>/g, "<\\/script>");

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone@7/babel.min.js" crossorigin></script>
  <style>
    body {
      margin: 0;
      padding: 12px;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #090a0f;
      color: #f8fafc;
      font-size: 13px;
    }
    #error-box {
      display: none;
      padding: 10px;
      background: #3b1318;
      color: #fca5a5;
      border-radius: 6px;
      font-family: monospace;
      font-size: 11px;
      margin-bottom: 10px;
      border: 1px solid #ef4444;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <div id="error-box"></div>
  <div id="root"></div>

  <script>
    (function() {
      function sendLog(level, args) {
        const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
        window.parent.postMessage({ type: 'SANDBOX_LOG', level: level, msg: msg }, '*');
      }
      console.log = function(...args) { sendLog('log', args); };
      console.info = function(...args) { sendLog('info', args); };
      console.warn = function(...args) { sendLog('warn', args); };
      console.error = function(...args) { sendLog('error', args); };

      window.onerror = function(msg) {
        const errEl = document.getElementById('error-box');
        errEl.style.display = 'block';
        errEl.textContent = 'Runtime Error: ' + msg;
        sendLog('error', [msg]);
      };
    })();
  </script>

  <script>
    const userCode = ${safeCode};

    function runCode() {
      if (!window.Babel) {
        setTimeout(runCode, 30);
        return;
      }
      try {
        const transformed = Babel.transform(userCode, {
          presets: [
            ['env', { modules: 'commonjs' }],
            ['react', { runtime: 'classic' }],
            ['typescript', { isTSX: true, allExtensions: true }]
          ]
        }).code;

        const exports = {};
        const module = { exports: exports };

        const factory = new Function(
          'require',
          'module',
          'exports',
          'React',
          'ReactDOM',
          transformed
        );

        factory(
          function(pkg) {
            if (pkg === 'react') return window.React;
            if (pkg === 'react-dom' || pkg === 'react-dom/client') return window.ReactDOM;
            return {};
          },
          module,
          exports,
          window.React,
          window.ReactDOM
        );

        const Component = module.exports.default || module.exports.App || Object.values(module.exports)[0];
        if (Component && typeof Component === 'function') {
          const root = ReactDOM.createRoot(document.getElementById('root'));
          root.render(React.createElement(Component));
        }
      } catch (err) {
        const errEl = document.getElementById('error-box');
        errEl.style.display = 'block';
        errEl.textContent = 'Compile Error: ' + err.message;
        console.error(err.message);
      }
    }

    runCode();
  </script>
</body>
</html>`;
  };

  useEffect(() => {
    const handleMsg = (e: MessageEvent) => {
      if (e.data && e.data.type === "SANDBOX_LOG") {
        setConsoleLogs((prev) => [...prev.slice(-10), { level: e.data.level, msg: e.data.msg }]);
      }
    };
    window.addEventListener("message", handleMsg);
    return () => window.removeEventListener("message", handleMsg);
  }, []);

  const handleRun = () => {
    setConsoleLogs([]);
    setKey((k) => k + 1);
  };

  return (
    <Card className="my-6 border-primary/40 bg-card/80 overflow-hidden shadow-elegant">
      <CardHeader className="pb-3 border-b border-border/50 bg-muted/30">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-mono border-primary/30">
              Live Inline Runner
            </Badge>

            <Button size="sm" onClick={handleRun} className="h-7 px-2.5 text-xs gap-1 shadow-glow">
              <Play className="h-3 w-3 fill-current" /> Run Code
            </Button>

            <Button size="sm" variant="outline" asChild className="h-7 px-2.5 text-xs gap-1">
              <Link to="/playground">
                Full Playground <ExternalLink className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>

        {instructions && (
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{instructions}</p>
        )}
      </CardHeader>

      <CardContent className="p-0 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/50">
        {/* Code Input */}
        <div className="flex flex-col bg-[#0b0c10] p-3 font-mono text-xs">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase mb-2 flex items-center justify-between">
            <span>Editable TypeScript / TSX</span>
            <button
              onClick={() => setCode(initialCode)}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <RefreshCw className="h-2.5 w-2.5" /> Reset
            </button>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            className="w-full h-56 bg-transparent text-foreground resize-none focus:outline-none leading-relaxed text-xs font-mono"
          />
        </div>

        {/* Live Output & Console */}
        <div className="flex flex-col bg-background p-3">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">
            Live DOM Preview & Console
          </div>
          <iframe
            key={key}
            ref={iframeRef}
            srcDoc={buildSrcDoc()}
            title="Lesson Inline Sandbox Preview"
            sandbox="allow-scripts"
            className="w-full h-40 rounded-lg border border-border/50 bg-[#090a0f]"
          />

          {/* Console Log area */}
          <div className="mt-2 rounded-lg border border-border/40 bg-black/60 p-2 font-mono text-[11px] max-h-24 overflow-y-auto">
            <div className="text-[10px] font-semibold text-muted-foreground mb-1 flex items-center gap-1">
              <Terminal className="h-3 w-3 text-emerald-400" /> Output Log
            </div>
            {consoleLogs.length === 0 ? (
              <span className="text-muted-foreground/50 italic text-[10px]">
                No console logs yet.
              </span>
            ) : (
              consoleLogs.map((log, i) => (
                <div key={i} className="text-emerald-300">
                  {log.msg}
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
