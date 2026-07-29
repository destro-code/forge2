import { useEffect, useRef, useState } from "react";
import { RefreshCw, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlaygroundFile } from "@/lib/types/playground";

interface PlaygroundPreviewProps {
  files: PlaygroundFile[];
  onLogCaptured: (level: "log" | "info" | "warn" | "error", message: string) => void;
}

export function PlaygroundPreview({ files, onLogCaptured }: PlaygroundPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [key, setKey] = useState(0);

  const buildSrcDoc = () => {
    const cssFiles = files.filter((f) => f.name.endsWith(".css"));
    const cssCode = cssFiles.map((f) => f.code).join("\n\n");
    const jsonFiles = files.filter((f) => f.name.endsWith(".json"));

    const codeFiles = files.filter((f) => !f.name.endsWith(".css"));

    const safeFilesJson = JSON.stringify(codeFiles).replace(/<\/script>/g, "<\\/script>");

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Forge Playground Preview</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone@7/babel.min.js" crossorigin></script>
  <style>
    ${cssCode}
    body {
      margin: 0;
      padding: 16px;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0d0e12;
      color: #f8fafc;
    }
    #error-overlay {
      display: none;
      padding: 14px;
      background: #2a1215;
      color: #fca5a5;
      border-radius: 8px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
      margin-bottom: 16px;
      border: 1px solid #ef4444;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    }
    #error-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    #error-title {
      font-weight: 700;
      font-size: 13px;
      color: #f87171;
    }
    #error-badge {
      font-size: 10px;
      background: rgba(239, 68, 68, 0.2);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #fca5a5;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
    }
    #error-message {
      background: rgba(0, 0, 0, 0.4);
      padding: 8px 10px;
      border-radius: 6px;
      white-space: pre-wrap;
      word-break: break-word;
      color: #fee2e2;
      border: 1px solid rgba(239, 68, 68, 0.25);
    }
    #error-stack {
      margin-top: 8px;
      font-size: 11px;
      color: #f87171;
      opacity: 0.85;
      white-space: pre-wrap;
      max-height: 140px;
      overflow-y: auto;
    }
  </style>
</head>
<body>
  <div id="error-overlay">
    <div id="error-header">
      <span id="error-title">Runtime Error</span>
      <span id="error-badge">Error</span>
    </div>
    <div id="error-message"></div>
    <pre id="error-stack"></pre>
  </div>
  <div id="root"></div>

  <script>
    // Console Interceptor
    (function() {
      const origLog = console.log;
      const origWarn = console.warn;
      const origError = console.error;
      const origInfo = console.info;

      function formatArg(a) {
        if (typeof a === 'string') return a;
        if (a instanceof Error) return a.stack || a.message;
        try {
          return JSON.stringify(a, null, 2);
        } catch(e) {
          return String(a);
        }
      }

      function formatArgs(args) {
        return args.map(formatArg).join(' ');
      }

      console.log = function(...args) {
        origLog.apply(console, args);
        window.parent.postMessage({ type: 'PLAYGROUND_CONSOLE', level: 'log', message: formatArgs(args) }, '*');
      };
      console.info = function(...args) {
        origInfo.apply(console, args);
        window.parent.postMessage({ type: 'PLAYGROUND_CONSOLE', level: 'info', message: formatArgs(args) }, '*');
      };
      console.warn = function(...args) {
        origWarn.apply(console, args);
        window.parent.postMessage({ type: 'PLAYGROUND_CONSOLE', level: 'warn', message: formatArgs(args) }, '*');
      };
      console.error = function(...args) {
        origError.apply(console, args);
        window.parent.postMessage({ type: 'PLAYGROUND_CONSOLE', level: 'error', message: formatArgs(args) }, '*');
      };

      window.showErrorOverlay = function(type, message, file, line, col, stack) {
        const overlay = document.getElementById('error-overlay');
        const titleEl = document.getElementById('error-title');
        const badgeEl = document.getElementById('error-badge');
        const msgEl = document.getElementById('error-message');
        const stackEl = document.getElementById('error-stack');

        overlay.style.display = 'block';
        titleEl.textContent = type + (file ? ' in ' + file : '');
        badgeEl.textContent = (line !== undefined && col !== undefined) ? 'Line ' + line + ':' + col : type;
        msgEl.textContent = message;
        stackEl.textContent = stack || '';

        const fullLog = type + (file ? ' [' + file + ']' : '') + ': ' + message;
        window.parent.postMessage({ type: 'PLAYGROUND_CONSOLE', level: 'error', message: fullLog }, '*');
      };

      window.onerror = function(msg, url, line, col, error) {
        window.showErrorOverlay('Runtime Error', msg, '', line, col, error ? error.stack : '');
        return true;
      };

      window.addEventListener('unhandledrejection', function(event) {
        const reason = event.reason;
        const msg = reason ? (reason.message || String(reason)) : 'Unhandled Promise Rejection';
        const stack = reason ? reason.stack : '';
        window.showErrorOverlay('Async Error', msg, '', undefined, undefined, stack);
      });
    })();
  </script>

  <script>
    const FILES = ${safeFilesJson};

    function runCompilerAndExecute() {
      if (!window.Babel) {
        setTimeout(runCompilerAndExecute, 30);
        return;
      }

      const compiledModules = {};
      const moduleCache = {};

      // 1. Transpile all code files using Babel standalone
      for (const file of FILES) {
        if (file.name.endsWith('.json')) {
          compiledModules[file.name] = { type: 'json', content: file.code };
          continue;
        }

        try {
          const transformed = Babel.transform(file.code, {
            presets: [
              ['env', { modules: 'commonjs' }],
              ['react', { runtime: 'classic' }],
              ['typescript', { isTSX: true, allExtensions: true }]
            ],
            filename: file.name
          });
          compiledModules[file.name] = { type: 'code', code: transformed.code };
        } catch (err) {
          const line = err.loc ? err.loc.line : undefined;
          const col = err.loc ? err.loc.column : undefined;
          window.showErrorOverlay('Compile Error', err.message, file.name, line, col, err.stack);
          return;
        }
      }

      // 2. Custom CommonJS Require resolver for browser playground
      function resolvePath(importPath, currentFile) {
        if (importPath.endsWith('.json')) return importPath;

        let clean = importPath.replace(/^\\.\\//, '');
        if (clean.startsWith('./')) clean = clean.substring(2);

        const candidates = [
          clean,
          clean + '.tsx',
          clean + '.ts',
          clean + '.jsx',
          clean + '.js',
          clean + '.json',
          clean + '/index.tsx',
          clean + '/index.ts',
          clean + '/index.jsx',
          clean + '/index.js'
        ];

        for (const cand of candidates) {
          if (compiledModules[cand]) return cand;
        }

        // Try searching by filename ending
        const match = Object.keys(compiledModules).find(k => k === clean || k.endsWith('/' + clean) || k.endsWith('/' + clean + '.tsx') || k.endsWith('/' + clean + '.ts'));
        if (match) return match;

        return null;
      }

      function requireModule(importPath, currentFile) {
        if (importPath === 'react') return window.React;
        if (importPath === 'react-dom' || importPath === 'react-dom/client') return window.ReactDOM;

        // Mock generic icon library if imported
        if (importPath === 'lucide-react' || importPath.includes('icon')) {
          return new Proxy({}, {
            get: function(target, prop) {
              if (prop === '__esModule') return true;
              return function DummyIcon(props) {
                return React.createElement('span', {
                  ...props,
                  style: { display: 'inline-block', width: '1em', height: '1em', ...props.style }
                }, '▪');
              };
            }
          });
        }

        const resolvedName = resolvePath(importPath, currentFile);
        if (!resolvedName) {
          throw new Error('Module Not Found: Cannot resolve "' + importPath + '" imported from "' + currentFile + '". Available files: ' + Object.keys(compiledModules).join(', '));
        }

        if (moduleCache[resolvedName]) {
          return moduleCache[resolvedName].exports;
        }

        const modMeta = compiledModules[resolvedName];

        if (modMeta.type === 'json') {
          let parsed;
          try {
            parsed = JSON.parse(modMeta.content);
          } catch(e) {
            parsed = {};
          }
          moduleCache[resolvedName] = { exports: parsed };
          return parsed;
        }

        const moduleObj = { exports: {} };
        moduleCache[resolvedName] = moduleObj;

        try {
          const fileRequire = function(path) {
            return requireModule(path, resolvedName);
          };

          const factory = new Function(
            'require',
            'module',
            'exports',
            'React',
            'ReactDOM',
            modMeta.code + '\\n//# sourceURL=' + resolvedName
          );

          factory(fileRequire, moduleObj, moduleObj.exports, window.React, window.ReactDOM);
          return moduleObj.exports;
        } catch (err) {
          delete moduleCache[resolvedName];
          throw err;
        }
      }

      // 3. Find main entry point and render React app
      try {
        const entryFile = FILES.find(f => f.name === 'App.tsx' || f.name === 'App.jsx' || f.name === 'index.tsx' || f.name === 'main.tsx') || FILES[0];
        if (!entryFile) return;

        const entryExports = requireModule('./' + entryFile.name, 'root');

        const ComponentToRender = 
          entryExports.default || 
          entryExports.App || 
          entryExports.Counter || 
          entryExports.SearchApp || 
          entryExports.UserFetcher ||
          Object.values(entryExports).find(val => typeof val === 'function' || (val && typeof val === 'object' && val.$$typeof));

        const container = document.getElementById('root');

        if (ComponentToRender) {
          const element = React.isValidElement(ComponentToRender) 
            ? ComponentToRender 
            : React.createElement(ComponentToRender);
          
          const root = ReactDOM.createRoot(container);
          root.render(element);
        } else if (container.children.length === 0) {
          container.innerHTML = '<div style="padding: 16px; color: #a1a1aa; font-size: 13px;">Code executed successfully. No default React component was exported to render.</div>';
        }
      } catch (err) {
        window.showErrorOverlay('Runtime Error', err.message, '', undefined, undefined, err.stack);
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', runCompilerAndExecute);
    } else {
      runCompilerAndExecute();
    }
  </script>
</body>
</html>`;
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "PLAYGROUND_CONSOLE") {
        onLogCaptured(event.data.level, event.data.message);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onLogCaptured]);

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border/60 bg-card/60 px-3 py-2 text-xs">
        <span className="flex items-center gap-1.5 font-medium text-foreground">
          <Monitor className="h-4 w-4 text-primary" /> Live Render Preview
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-[10px] gap-1"
          onClick={() => setKey((k) => k + 1)}
          title="Reload preview iframe"
        >
          <RefreshCw className="h-3 w-3" /> Refresh
        </Button>
      </div>

      <div className="flex-1 relative p-2 bg-card/20">
        <iframe
          key={key}
          ref={iframeRef}
          srcDoc={buildSrcDoc()}
          title="Forge Playground Live Preview"
          sandbox="allow-scripts allow-modals"
          className="h-full w-full rounded-lg border border-border/60 bg-background shadow-inner"
        />
      </div>
    </div>
  );
}
