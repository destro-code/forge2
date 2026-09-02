import type { CompilerOptions, GeneratedOutput, ParsedProject, ValidationResult } from "./types";
import * as Babel from "@babel/standalone";
import { VALIDATION_RUNNER_SCRIPT } from "./validation-runner";

/**
 * Step 3: Generate Phase
 * Combines parsed modules and validation diagnostics into target execution assets.
 */
export function generateOutput(
  parsed: ParsedProject,
  _validation: ValidationResult,
  options: CompilerOptions = {},
): GeneratedOutput {
  const {
    isInline = false,
    title = "Forge Playground Preview",
    baseUrl = "",
    workspaceRevision,
  } = options;

  const isReact = parsed.runtime === "react";
  const isHtmlCss = parsed.runtime === "html-css";
  const isVanillaDom = parsed.runtime === "vanilla-dom";

  const cssBundle = parsed.cssModules.map((m) => m.code).join("\n\n");

  // Pre-compile code modules on parent side using @babel/standalone
  const precompiledCodeModules = parsed.codeModules.map((m) => {
    if (
      m.name.endsWith(".css") ||
      m.name.endsWith(".json") ||
      m.name.endsWith(".html") ||
      m.language === "html" ||
      m.language === "css"
    ) {
      return { id: m.id, name: m.name, code: m.code, language: m.language, compiled: m.code };
    }
    try {
      const transformed = Babel.transform(m.code, {
        presets: [
          ["env", { modules: "commonjs" }],
          ["react", { runtime: "classic" }],
          ["typescript", { ignoreExtensions: false }],
        ],
        filename: m.name,
      });
      return {
        id: m.id,
        name: m.name,
        code: m.code,
        language: m.language,
        compiled: transformed.code || m.code,
      };
    } catch {
      return { id: m.id, name: m.name, code: m.code, language: m.language, compiled: m.code };
    }
  });

  const safeFilesJson = JSON.stringify(precompiledCodeModules).replace(
    /<\/script>/g,
    "<\\/script>",
  );

  const vendorBase = (baseUrl || "").replace(/\/$/, "");
  const baseTag = vendorBase ? `<base href="${vendorBase}/" />` : `<base href="/" />`;

  const vendorScripts = !isReact
    ? ""
    : `
  <script src="${vendorBase ? vendorBase : ""}/vendor/react.development.js?v=18.3.1" onerror="window.__reactLoadError=true"></script>
  <script src="${vendorBase ? vendorBase : ""}/vendor/react-dom.development.js?v=18.3.1" onerror="window.__reactDomLoadError=true"></script>
  <script>
    if (!window.React) {
      document.write('<script src="https://unpkg.com/react@18/umd/react.development.js"><\\/script>');
      document.write('<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\\/script>');
    }
  </script>
  `;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  ${baseTag}
  <title>${title}</title>
  ${vendorScripts}
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
      window.parent.postMessage({ type: 'PLAYGROUND_RUNTIME_DOCUMENT_STARTUP', workspaceRevision: window.__WORKSPACE_REVISION__ }, '*');
      window.parent.postMessage({ type: 'PLAYGROUND_RUNTIME_ENVIRONMENT', userAgent: navigator.userAgent, hasParent: !!window.parent, hasWindow: !!window, hasDocument: !!document, workspaceRevision: window.__WORKSPACE_REVISION__ }, '*');
      window.parent.postMessage({ type: 'PLAYGROUND_RUNTIME_CONSOLE_BRIDGE_STARTING', workspaceRevision: window.__WORKSPACE_REVISION__ }, '*');
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
        window.parent.postMessage({ type: 'PLAYGROUND_CONSOLE', level: 'log', message: formatArgs(args), workspaceRevision: window.__WORKSPACE_REVISION__ }, '*');
        window.parent.postMessage({ type: 'SANDBOX_LOG', level: 'log', msg: formatArgs(args) }, '*');
      };
      console.info = function(...args) {
        origInfo.apply(console, args);
        window.parent.postMessage({ type: 'PLAYGROUND_CONSOLE', level: 'info', message: formatArgs(args), workspaceRevision: window.__WORKSPACE_REVISION__ }, '*');
        window.parent.postMessage({ type: 'SANDBOX_LOG', level: 'info', msg: formatArgs(args) }, '*');
      };
      console.warn = function(...args) {
        origWarn.apply(console, args);
        window.parent.postMessage({ type: 'PLAYGROUND_CONSOLE', level: 'warn', message: formatArgs(args), workspaceRevision: window.__WORKSPACE_REVISION__ }, '*');
        window.parent.postMessage({ type: 'SANDBOX_LOG', level: 'warn', msg: formatArgs(args) }, '*');
      };
      console.error = function(...args) {
        origError.apply(console, args);
        window.parent.postMessage({ type: 'PLAYGROUND_CONSOLE', level: 'error', message: formatArgs(args), workspaceRevision: window.__WORKSPACE_REVISION__ }, '*');
        window.parent.postMessage({ type: 'SANDBOX_LOG', level: 'error', msg: formatArgs(args) }, '*');
      };

      window.showErrorOverlay = function(type, message, file, line, col, stack) {
        window.__hasInitError = true;
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
        window.parent.postMessage({ type: 'PLAYGROUND_CONSOLE', level: 'error', message: fullLog, workspaceRevision: window.__WORKSPACE_REVISION__ }, '*');
        window.parent.postMessage({ type: 'SANDBOX_LOG', level: 'error', msg: fullLog }, '*');
        window.parent.postMessage({
          type: 'PLAYGROUND_BUILD_ERROR',
          message: fullLog,
          errorType: type,
          file: file,
          line: line,
          column: col,
          workspaceRevision: typeof window.__WORKSPACE_REVISION__ === 'number' ? window.__WORKSPACE_REVISION__ : undefined
        }, '*');
      };

      window.onerror = function(msg, url, line, col, error) {
        window.parent.postMessage({ type: 'PLAYGROUND_RUNTIME_UNCAUGHT_ERROR', name: error && error.name || 'Error', message: String(msg), source: url || '', line: line, column: col, workspaceRevision: window.__WORKSPACE_REVISION__ }, '*');
        window.showErrorOverlay('Runtime Error', msg, '', line, col, error ? error.stack : '');
        return true;
      };

      window.addEventListener('unhandledrejection', function(event) {
        const reason = event.reason;
        window.parent.postMessage({ type: 'PLAYGROUND_RUNTIME_UNHANDLED_REJECTION', name: reason && reason.name || 'Error', message: reason ? (reason.message || String(reason)) : 'Unhandled Promise Rejection', workspaceRevision: window.__WORKSPACE_REVISION__ }, '*');
        const msg = reason ? (reason.message || String(reason)) : 'Unhandled Promise Rejection';
        const stack = reason ? reason.stack : '';
        window.showErrorOverlay('Async Runtime Error', msg, '', undefined, undefined, stack);
      });
    })();
  </script>

  <script>
    window.__WORKSPACE_REVISION__ = ${typeof workspaceRevision === "number" ? workspaceRevision : "undefined"};
      window.parent.postMessage({ type: 'PLAYGROUND_RUNTIME_START', workspaceRevision: window.__WORKSPACE_REVISION__ }, '*');
      window.parent.postMessage({ type: 'PLAYGROUND_RUNTIME_BOOTSTRAP_ENTERED', workspaceRevision: window.__WORKSPACE_REVISION__ }, '*');
      window.__hasInitError = false;
    let FILES = ${safeFilesJson};
    const RUNTIME = "${parsed.runtime}";
    const DEFAULT_ENTRY_NAME = "${parsed.entryModule?.name || ""}";

    function runCompilerAndExecute(newFiles, startTime, revision) {
      window.__hasInitError = false;
      if (typeof revision === 'number') {
        window.__WORKSPACE_REVISION__ = revision;
      }
      if (newFiles) {
        FILES = newFiles;
      }
      // Atomically tear down the previous app before compiling the new revision.
      // This prevents old React effects, DOM listeners, and module state from leaking.
      if (window.__reactRoot && typeof window.__reactRoot.unmount === 'function') {
        window.parent.postMessage({ type: 'PLAYGROUND_RUNTIME_CLEANUP_STARTING', workspaceRevision: window.__WORKSPACE_REVISION__ }, '*');
        window.__reactRoot.unmount();
        window.parent.postMessage({ type: 'PLAYGROUND_RUNTIME_CLEANUP_COMPLETED', workspaceRevision: window.__WORKSPACE_REVISION__ }, '*');
      }
      window.__reactRoot = null;
      const previousRoot = document.getElementById('root');
      if (previousRoot) previousRoot.replaceChildren();
      if (!startTime) startTime = Date.now();

      const isReact = RUNTIME === 'react';
      const isHtmlCss = RUNTIME === 'html-css';
      const isVanillaDom = RUNTIME === 'vanilla-dom';

      if (isReact) {
        const missing = [];
        if (!window.React) missing.push('React');
        if (!window.ReactDOM) missing.push('ReactDOM');

        const needsBabel = FILES.some(function(f) { return !f.compiled && !f.name.endsWith('.css') && !f.name.endsWith('.json') && !f.name.endsWith('.html'); });
        if (needsBabel && !window.Babel) {
          missing.push('Babel');
        }

        if (missing.length > 0) {
          if (Date.now() - startTime < 3500) {
            setTimeout(function() { runCompilerAndExecute(newFiles, startTime, revision); }, 50);
            return;
          } else {
            console.error('[Forge Preview] React runtime could not be loaded');
            window.showErrorOverlay(
              'Runtime Dependency Error',
              'Preview unavailable: the React runtime could not be loaded. Please check script load permissions or network.'
            );
            return;
          }
        }
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
        if (file.name.endsWith('.css') || file.name.endsWith('.html')) continue;

        if (file.name.endsWith('.json')) {
          compiledModules[file.name] = { type: 'json', content: file.code };
          continue;
        }

        try {
          let codeToUse = file.compiled;
          if (!codeToUse && window.Babel) {
            const transformed = Babel.transform(file.code, {
              presets: [
                ['env', { modules: 'commonjs' }],
                ['react', { runtime: 'classic' }],
                ['typescript', { ignoreExtensions: false }]
              ],
              filename: file.name
            });
            codeToUse = transformed.code;
          }
          if (!codeToUse) {
            codeToUse = file.code;
          }
          compiledModules[file.name] = { type: 'code', code: codeToUse };
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
        const container = document.getElementById('root');

        if (isHtmlCss) {
          const htmlFile = FILES.find(function(f) {
            return f.name === DEFAULT_ENTRY_NAME || f.name.endsWith('.html') || f.language === 'html';
          });

          if (htmlFile) {
            const codeLower = htmlFile.code.toLowerCase();
            const isFullDoc = codeLower.indexOf('<!doctype') !== -1 || codeLower.indexOf('<html') !== -1 || codeLower.indexOf('<body') !== -1;
            
            let htmlToRender = htmlFile.code;
            if (isFullDoc) {
              const bodyMatch = htmlFile.code.match(/<body[^>]*>([\\s\\S]*)<\\/body>/i);
              htmlToRender = bodyMatch ? bodyMatch[1] : htmlFile.code;
            }

            if (container) {
              container.innerHTML = htmlToRender;

              // Execute script tags inside HTML if any
              const scripts = container.querySelectorAll('script');
              scripts.forEach(function(oldScript) {
                const newScript = document.createElement('script');
                Array.from(oldScript.attributes).forEach(function(attr) {
                  newScript.setAttribute(attr.name, attr.value);
                });
                newScript.appendChild(document.createTextNode(oldScript.innerHTML));
                if (oldScript.parentNode) {
                  oldScript.parentNode.replaceChild(newScript, oldScript);
                }
              });
            }
          } else {
            // CSS only
            if (container) {
              container.innerHTML = '<div style="padding: 24px; text-align: center; color: #a1a1aa;"><p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 500;">CSS Sandbox</p><p style="margin: 0; font-size: 13px; opacity: 0.8;">Styles are active and applied directly to this preview area.</p></div>';
            }
          }

  if (!window.__hasInitError) {
  window.parent.postMessage({ type: 'PLAYGROUND_RUNTIME_READY_SENDING', workspaceRevision: window.__WORKSPACE_REVISION__ }, '*');
  window.parent.postMessage({ type: 'PLAYGROUND_RUNTIME_READY_SEND', workspaceRevision: window.__WORKSPACE_REVISION__ }, '*');
  window.parent.postMessage({
  type: 'PLAYGROUND_READY',
              workspaceRevision: typeof window.__WORKSPACE_REVISION__ === 'number' ? window.__WORKSPACE_REVISION__ : undefined
            }, '*');
          }
        } else if (isVanillaDom) {
          const htmlFile = FILES.find(function(f) {
            return f.name.endsWith('.html') || f.language === 'html';
          });

          if (htmlFile && container) {
            const codeLower = htmlFile.code.toLowerCase();
            const isFullDoc = codeLower.indexOf('<!doctype') !== -1 || codeLower.indexOf('<html') !== -1 || codeLower.indexOf('<body') !== -1;
            let htmlToRender = htmlFile.code;
            if (isFullDoc) {
              const bodyMatch = htmlFile.code.match(/<body[^>]*>([\\s\\S]*)<\\/body>/i);
              htmlToRender = bodyMatch ? bodyMatch[1] : htmlFile.code;
            }
            container.innerHTML = htmlToRender;
          } else if (container && container.children.length === 0 && FILES.some(function(f) { return f.name.endsWith('.html') || f.language === 'html'; })) {
            container.innerHTML = '<div style="padding: 14px; background: #161b22; border: 1px solid #30363d; border-radius: 8px; font-family: system-ui, sans-serif;">' +
              '<h3 id="title" style="margin: 0 0 10px 0; font-size: 14px; color: #58a6ff;">Interactive DOM Sandbox</h3>' +
              '<div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px;">' +
                '<button id="save-button" class="btn" style="background: #238636; color: #fff; border: 1px solid rgba(240,246,252,0.1); padding: 5px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">Save</button>' +
                '<button id="submit-button" class="btn" style="background: #1f6feb; color: #fff; border: 1px solid rgba(240,246,252,0.1); padding: 5px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">Submit</button>' +
                '<button id="action-btn" class="btn" style="background: #30363d; color: #c9d1d9; border: 1px solid rgba(240,246,252,0.1); padding: 5px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">Action</button>' +
              '</div>' +
              '<input id="input" placeholder="Type here..." style="background: #0d1117; border: 1px solid #30363d; color: #c9d1d9; padding: 5px 10px; border-radius: 6px; font-size: 12px; width: 100%; max-width: 240px; margin-bottom: 8px;" />' +
              '<div id="output" style="color: #8b949e; font-size: 12px; font-style: italic;">DOM elements ready. Check console output below.</div>' +
            '</div>';
          }

          // Execute JS/TS code modules
          const jsEntry = FILES.find(function(f) {
            return f.name === DEFAULT_ENTRY_NAME || f.name === 'App.js' || f.name === 'main.js' || f.name === 'index.js' || f.name === 'script.js' || f.name.endsWith('.js') || f.name.endsWith('.ts');
          });
          if (jsEntry && !jsEntry.name.endsWith('.json') && !jsEntry.name.endsWith('.html')) {
            if (RUNTIME === 'vanilla-dom' && jsEntry.language === 'javascript') {
              // Execute canonical JavaScript as a classic script so function declarations
              // are visible to the iframe validation runner in the same global realm.
              const scriptEl = document.createElement('script');
              scriptEl.textContent = jsEntry.code + '\\n//# sourceURL=' + jsEntry.name;
              document.head.appendChild(scriptEl);
            } else {
              requireModule('./' + jsEntry.name, 'root');
            }
          }

  if (!window.__hasInitError) {
  window.parent.postMessage({ type: 'PLAYGROUND_RUNTIME_READY_SENDING', workspaceRevision: window.__WORKSPACE_REVISION__ }, '*');
  window.parent.postMessage({ type: 'PLAYGROUND_RUNTIME_READY_SEND', workspaceRevision: window.__WORKSPACE_REVISION__ }, '*');
  window.parent.postMessage({
  type: 'PLAYGROUND_READY',
              workspaceRevision: typeof window.__WORKSPACE_REVISION__ === 'number' ? window.__WORKSPACE_REVISION__ : undefined
            }, '*');
          }
        } else {
          // React Runtime Execution
          const entryFile = FILES.find(function(f) {
            return f.name === DEFAULT_ENTRY_NAME || f.name === 'App.tsx' || f.name === 'App.jsx' || f.name === 'index.tsx' || f.name === 'main.tsx' || f.name === 'App.ts' || f.name === 'App.js' || f.name === 'index.ts' || f.name === 'main.ts';
          }) || FILES[0];
          if (!entryFile) return;

          const entryExports = requireModule('./' + entryFile.name, 'root');

          if (window.React) {
            const ComponentToRender = 
              entryExports.default || 
              entryExports.App || 
              entryExports.Counter || 
              entryExports.SearchApp || 
              entryExports.UserFetcher ||
              Object.values(entryExports).find(function(val) { return typeof val === 'function' || (val && typeof val === 'object' && val.$$typeof); });

            if (ComponentToRender && container) {
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
            }
          }

          if (!window.__hasInitError) {
            if (typeof requestAnimationFrame === 'function') {
              requestAnimationFrame(function() {
                if (!window.__hasInitError) {
                  window.parent.postMessage({
                    type: 'PLAYGROUND_READY',
                    workspaceRevision: typeof window.__WORKSPACE_REVISION__ === 'number' ? window.__WORKSPACE_REVISION__ : undefined
                  }, '*');
                }
              });
            } else {
              window.parent.postMessage({
                type: 'PLAYGROUND_READY',
                workspaceRevision: typeof window.__WORKSPACE_REVISION__ === 'number' ? window.__WORKSPACE_REVISION__ : undefined
              }, '*');
            }
          }
        }
      } catch (err) {
        window.parent.postMessage({ type: 'PLAYGROUND_RUNTIME_STARTUP_ERROR', name: err && err.name || 'Error', message: err && err.message ? err.message : String(err), workspaceRevision: window.__WORKSPACE_REVISION__ }, '*');
        window.showErrorOverlay('Runtime Execution Error', err.message, '', undefined, undefined, err.stack);
      }
    }


  window.parent.postMessage({ type: 'PLAYGROUND_RUNTIME_CONSOLE_BRIDGE_INITIALIZED', workspaceRevision: window.__WORKSPACE_REVISION__ }, '*');

  window.addEventListener('message', function(event) {
  window.parent.postMessage({ type: 'PLAYGROUND_RUNTIME_MESSAGE_RECEIVED', command: event.data && event.data.type, revision: event.data && event.data.workspaceRevision, workspaceRevision: window.__WORKSPACE_REVISION__ }, '*');
  if (event.data && event.data.type === 'PLAYGROUND_UPDATE_FILES') {
    window.parent.postMessage({ type: 'PLAYGROUND_RUNTIME_EXECUTION_COMMAND_RECEIVED', command: event.data.type, revision: event.data.workspaceRevision, workspaceRevision: window.__WORKSPACE_REVISION__ }, '*');
  }
  if (event.data && event.data.type === 'PLAYGROUND_UPDATE_FILES' && Array.isArray(event.data.files)) {
      window.parent.postMessage({ type: 'PLAYGROUND_RUNTIME_EXECUTION_COMMAND_RECEIVED', command: event.data.type, workspaceRevision: event.data.workspaceRevision }, '*');
      window.parent.postMessage({ type: 'PLAYGROUND_RUNTIME_COMMAND_RECEIVED', command: event.data.type, workspaceRevision: event.data.workspaceRevision }, '*');
      runCompilerAndExecute(event.data.files, undefined, event.data.workspaceRevision);
  }
  });
  window.parent.postMessage({ type: 'PLAYGROUND_RUNTIME_LISTENER_REGISTERED', workspaceRevision: window.__WORKSPACE_REVISION__ }, '*');

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() { runCompilerAndExecute(); });
    } else {
      runCompilerAndExecute();
    }
  </script>

  <script id="forge-validation-runner">
    ${VALIDATION_RUNNER_SCRIPT}
  </script>
</body>
</html>`;

  return {
    html,
    cssBundle,
    codeJson: safeFilesJson,
  };
}
