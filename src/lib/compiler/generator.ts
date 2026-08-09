import type { CompilerOptions, GeneratedOutput, ParsedProject, ValidationResult } from "./types";

/**
 * Step 3: Generate Phase
 * Combines parsed modules and validation diagnostics into target execution assets.
 */
export function generateOutput(
  parsed: ParsedProject,
  _validation: ValidationResult,
  options: CompilerOptions = {},
): GeneratedOutput {
  const { isInline = false, title = "Forge Playground Preview" } = options;

  const cssBundle = parsed.cssModules.map((m) => m.code).join("\n\n");

  const safeFilesJson = JSON.stringify(
    parsed.codeModules.map((m) => ({
      id: m.id,
      name: m.name,
      code: m.code,
      language: m.language,
    })),
  ).replace(/<\/script>/g, "<\\/script>");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <script src="/vendor/react.development.js"></script>
  <script src="/vendor/react-dom.development.js"></script>
  <script src="/vendor/babel.min.js"></script>
  <style>
    ${cssBundle}
    body {
      margin: 0;
      padding: ${isInline ? "12px" : "16px"};
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0d0e12;
      color: #f8fafc;
      font-size: ${isInline ? "13px" : "14px"};
    }
    #error-overlay {
      display: none;
      padding: 12px 14px;
      background: #2a1215;
      color: #fca5a5;
      border-radius: 8px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
      margin-bottom: 14px;
      border: 1px solid #ef4444;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    }
    #error-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
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
      max-height: 120px;
      overflow-y: auto;
    }
  </style>
</head>
<body>
  <div id="error-overlay">
    <div id="error-header">
      <span id="error-title">Compilation Error</span>
      <span id="error-badge">Diagnostics</span>
    </div>
    <div id="error-message"></div>
    <pre id="error-stack"></pre>
  </div>
  <div id="root"></div>

  <script>
    (function() {
      const origLog = console.log;
      const origWarn = console.warn;
      const origError = console.error;
      const origInfo = console.info;

      function formatArg(a) {
        if (typeof a === 'string') return a;
        if (a instanceof Error) return a.stack || a.message;
        try { return JSON.stringify(a, null, 2); } catch(e) { return String(a); }
      }

      function formatArgs(args) {
        return args.map(formatArg).join(' ');
      }

      console.log = function(...args) {
        origLog.apply(console, args);
        window.parent.postMessage({ type: 'PLAYGROUND_CONSOLE', level: 'log', message: formatArgs(args) }, '*');
        window.parent.postMessage({ type: 'SANDBOX_LOG', level: 'log', msg: formatArgs(args) }, '*');
      };
      console.info = function(...args) {
        origInfo.apply(console, args);
        window.parent.postMessage({ type: 'PLAYGROUND_CONSOLE', level: 'info', message: formatArgs(args) }, '*');
        window.parent.postMessage({ type: 'SANDBOX_LOG', level: 'info', msg: formatArgs(args) }, '*');
      };
      console.warn = function(...args) {
        origWarn.apply(console, args);
        window.parent.postMessage({ type: 'PLAYGROUND_CONSOLE', level: 'warn', message: formatArgs(args) }, '*');
        window.parent.postMessage({ type: 'SANDBOX_LOG', level: 'warn', msg: formatArgs(args) }, '*');
      };
      console.error = function(...args) {
        origError.apply(console, args);
        window.parent.postMessage({ type: 'PLAYGROUND_CONSOLE', level: 'error', message: formatArgs(args) }, '*');
        window.parent.postMessage({ type: 'SANDBOX_LOG', level: 'error', msg: formatArgs(args) }, '*');
      };

      window.showErrorOverlay = function(type, message, file, line, col, stack) {
        const overlay = document.getElementById('error-overlay');
        const titleEl = document.getElementById('error-title');
        const badgeEl = document.getElementById('error-badge');
        const msgEl = document.getElementById('error-message');
        const stackEl = document.getElementById('error-stack');

        if (overlay) overlay.style.display = 'block';
        if (titleEl) titleEl.textContent = type + (file ? ' in ' + file : '');
        if (badgeEl) badgeEl.textContent = (line !== undefined && col !== undefined) ? 'Line ' + line + ':' + col : type;
        if (msgEl) msgEl.textContent = message;
        if (stackEl) stackEl.textContent = stack || '';

        const fullLog = type + (file ? ' [' + file + ']' : '') + (line ? ' Line ' + line + ':' + col : '') + ': ' + message;
        window.parent.postMessage({ type: 'PLAYGROUND_CONSOLE', level: 'error', message: fullLog }, '*');
        window.parent.postMessage({ type: 'SANDBOX_LOG', level: 'error', msg: fullLog }, '*');
      };

      window.onerror = function(msg, url, line, col, error) {
        window.showErrorOverlay('Runtime Error', msg, '', line, col, error ? error.stack : '');
        return true;
      };

      window.addEventListener('unhandledrejection', function(event) {
        const reason = event.reason;
        const msg = reason ? (reason.message || String(reason)) : 'Unhandled Promise Rejection';
        const stack = reason ? reason.stack : '';
        window.showErrorOverlay('Async Runtime Error', msg, '', undefined, undefined, stack);
      });
    })();
  </script>

  <script>
    let FILES = ${safeFilesJson};

    function runCompilerAndExecute(newFiles) {
      if (newFiles) {
        FILES = newFiles;
      }
      if (!window.Babel) {
        setTimeout(function() { runCompilerAndExecute(newFiles); }, 30);
        return;
      }

      const overlay = document.getElementById('error-overlay');
      if (overlay) overlay.style.display = 'none';

      let styleEl = document.getElementById('playground-styles');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'playground-styles';
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = FILES.filter(function(f) { return f.name.endsWith('.css'); }).map(function(f) { return f.code; }).join('\\n\\n');

      const compiledModules = {};
      const moduleCache = {};

      for (const file of FILES) {
        if (file.name.endsWith('.css')) continue;

        if (file.name.endsWith('.json')) {
          compiledModules[file.name] = { type: 'json', content: file.code };
          continue;
        }

        try {
          const transformed = Babel.transform(file.code, {
            presets: [
              ['env', { modules: 'commonjs' }],
              ['react', { runtime: 'classic' }],
              ['typescript', { ignoreExtensions: false }]
            ],
            filename: file.name
          });
          compiledModules[file.name] = { type: 'code', code: transformed.code };
        } catch (err) {
          const line = err.loc ? err.loc.line : undefined;
          const col = err.loc ? err.loc.column : undefined;
          const formattedMsg = file.name + (line ? ' (' + line + ':' + col + ')' : '') + ': ' + err.message;
          window.showErrorOverlay('TypeScript/Babel Compilation Error', formattedMsg, file.name, line, col, err.stack);
          return;
        }
      }

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

        const match = Object.keys(compiledModules).find(k => 
          k === clean || 
          k.endsWith('/' + clean) || 
          k.endsWith('/' + clean + '.tsx') || 
          k.endsWith('/' + clean + '.ts')
        );
        if (match) return match;

        return null;
      }

      if (window.React) {
        window.React.__esModule = true;
        window.React.default = window.React;
      }
      if (window.ReactDOM) {
        window.ReactDOM.__esModule = true;
        window.ReactDOM.default = window.ReactDOM;
      }

      function requireModule(importPath, currentFile) {
        if (importPath === 'react') return window.React;
        if (importPath === 'react-dom' || importPath === 'react-dom/client') return window.ReactDOM;
        if (importPath.endsWith('.css') || importPath.endsWith('.scss')) return {};

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
          const avail = Object.keys(compiledModules).join(', ') || 'none';
          throw new Error('Unresolved Import: Cannot resolve "' + importPath + '" imported from "' + currentFile + '". Available project files: [' + avail + ']');
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
          
          if (!window.__reactRoot && ReactDOM.createRoot) {
            window.__reactRoot = ReactDOM.createRoot(container);
          }
          if (window.__reactRoot) {
            window.__reactRoot.render(element);
          } else if (ReactDOM.render) {
            ReactDOM.render(element, container);
          }
        } else if (container && container.children.length === 0) {
          container.innerHTML = '<div style="padding: 16px; color: #a1a1aa; font-size: 13px;">Code compiled successfully.</div>';
        }
      } catch (err) {
        window.showErrorOverlay('Runtime Execution Error', err.message, '', undefined, undefined, err.stack);
      }
    }

    window.addEventListener('message', function(event) {
      if (event.data && event.data.type === 'PLAYGROUND_UPDATE_FILES' && Array.isArray(event.data.files)) {
        runCompilerAndExecute(event.data.files);
      }
    });

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() { runCompilerAndExecute(); });
    } else {
      runCompilerAndExecute();
    }
  </script>
</body>
</html>`;

  return {
    html,
    cssBundle,
    codeJson: safeFilesJson,
  };
}
