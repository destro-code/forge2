import { useState, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { Copy, Check, Terminal, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import * as Babel from "@babel/standalone";

import { LessonRuntimeConfig } from "@/lib/types";

interface LessonInteractiveCodeProps {
  language: string;
  code: string;
  title?: string;
  highlightLines?: number[];
  onOpenSandbox?: (code: string) => void;
  lessonId?: string;
  exampleId?: string;
  runtime?: LessonRuntimeConfig;
}

function checkCodeNeedsReact(code: string, lang: string): boolean {
  // 1. Direct check for React keywords / imports / hooks
  if (
    /\b(React|ReactDOM|useState|useEffect|useContext|useReducer|useCallback|useMemo|useRef)\b/.test(
      code,
    ) ||
    /from\s+['"]react['"]/.test(code) ||
    /from\s+['"]react-dom/.test(code)
  ) {
    return true;
  }

  // 2. Transpile via Babel with React preset and check if createElement was produced
  try {
    const transformed = Babel.transform(code, {
      presets: [
        ["react", { runtime: "classic" }],
        ["typescript", { ignoreExtensions: false }],
      ],
      parserOpts: { allowReturnOutsideFunction: true },
      filename: `snippet.${lang === "tsx" || lang === "ts" || lang === "typescript" ? "tsx" : "jsx"}`,
    });
    const compiled = transformed.code || "";
    if (
      compiled.includes("React.createElement") ||
      compiled.includes("React.") ||
      compiled.includes('require("react")') ||
      compiled.includes("require('react')")
    ) {
      return true;
    }
  } catch {
    // If Babel transform fails, fallback to simple JSX pattern check
    if (/<[A-Za-z][^>]*>[\s\S]*<\/[A-Za-z]+>/.test(code) || /<[A-Za-z][^>]*\/>/.test(code)) {
      return true;
    }
  }

  return false;
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
        showErr('Preview unavailable: the React runtime could not be loaded.');
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

interface CssPreviewResult {
  previewHtml: string;
  matchedElementCount: number;
}

interface ElementSpec {
  tag: string;
  id?: string;
  classes: string[];
  attributes: Record<string, string>;
}

interface TreeElementNode {
  spec: ElementSpec;
  children: TreeElementNode[];
}

function extractCssSelectors(cssCode: string): string[] {
  const cleaned = cssCode.replace(/\/\*[\s\S]*?\*\//g, "");
  const mediaUnwrapped = cleaned.replace(/@media[^{]*\{([\s\S]*?)\}\s*\}/gi, "$1");
  const stripped = mediaUnwrapped.replace(/@[a-z-]+[^{]*\{[\s\S]*?\}/gi, "");

  const selectorGroups: string[] = [];
  const ruleRegex = /([^{}]+)\{([^{}]*)\}/g;
  let match: RegExpExecArray | null;

  while ((match = ruleRegex.exec(stripped)) !== null) {
    const rawGroup = match[1].trim();
    if (rawGroup && !rawGroup.startsWith("@")) {
      const selectors = rawGroup
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      selectorGroups.push(...selectors);
    }
  }

  return selectorGroups;
}

function inferTag(
  explicitTag: string,
  classes: string[],
  id: string | undefined,
  attributes: Record<string, string>,
): string {
  const allNames = [...classes, id || ""].join(" ").toLowerCase();

  if (attributes.type === "submit" || attributes.type === "button" || attributes.type === "reset") {
    return "button";
  }
  if (
    attributes.type &&
    ["text", "password", "email", "number", "search", "checkbox", "radio"].includes(attributes.type)
  ) {
    return "input";
  }

  if (
    /\b(button|btn|cta|submit|save|cancel|action|toggle|chip)\b|(-button|-btn|btn-|button-)/i.test(
      allNames,
    )
  ) {
    return "button";
  }
  if (/\b(input|textbox|field|search|searchbar)\b|(-input|-field)/i.test(allNames)) {
    return "input";
  }
  if (/\b(textarea)\b/i.test(allNames)) {
    return "textarea";
  }
  if (/\b(select|dropdown)\b/i.test(allNames)) {
    return "select";
  }
  if (/\b(header)\b/i.test(allNames) && !/\b(h1|h2|h3|heading|title)\b/i.test(allNames)) {
    return "header";
  }
  if (/\b(footer)\b/i.test(allNames)) {
    return "footer";
  }
  if (/\b(nav|navbar|menu)\b/i.test(allNames)) {
    return "nav";
  }
  if (/\b(hero|banner|section)\b/i.test(allNames)) {
    return "section";
  }
  if (/\b(title|heading|headline)\b/i.test(allNames)) {
    return "h2";
  }
  if (/\b(subtitle|caption|desc|description)\b/i.test(allNames)) {
    return "p";
  }
  if (/\b(link)\b/i.test(allNames)) {
    return "a";
  }
  if (/\b(badge|tag|pill|status|label)\b/i.test(allNames)) {
    return "span";
  }
  if (/\b(avatar|image|photo|pic|thumbnail|img)\b/i.test(allNames)) {
    return "img";
  }
  if (/\b(list)\b/i.test(allNames)) {
    return "ul";
  }
  if (/\b(item|list-item)\b/i.test(allNames)) {
    return "li";
  }

  return "div";
}

function parseSingleCompoundSelector(part: string): ElementSpec | null {
  if (!part) return null;

  const attributes: Record<string, string> = {};
  let workingPart = part.replace(/\[([a-zA-Z0-9_-]+)(?:=([^{}\]\s"']+))?\]/g, (_, name, val) => {
    attributes[name] = val ? val.replace(/["']/g, "") : "true";
    return "";
  });

  let id: string | undefined;
  workingPart = workingPart.replace(/#([a-zA-Z0-9_-]+)/g, (_, matchId) => {
    id = matchId;
    return "";
  });

  const classes: string[] = [];
  workingPart = workingPart.replace(/\.([a-zA-Z0-9_-]+)/g, (_, matchClass) => {
    classes.push(matchClass);
    return "";
  });

  const explicitTag = workingPart.trim().toLowerCase();
  const knownTags = new Set([
    "a",
    "article",
    "aside",
    "b",
    "button",
    "canvas",
    "caption",
    "code",
    "div",
    "footer",
    "form",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "header",
    "img",
    "input",
    "label",
    "li",
    "main",
    "nav",
    "ol",
    "p",
    "section",
    "select",
    "span",
    "strong",
    "table",
    "td",
    "textarea",
    "th",
    "tr",
    "ul",
  ]);

  let tag = "";
  if (knownTags.has(explicitTag)) {
    tag = explicitTag;
  } else {
    tag = inferTag(explicitTag, classes, id, attributes);
  }

  return { tag, id, classes, attributes };
}

function parseSelectorString(selectorStr: string): ElementSpec[] {
  let cleaned = selectorStr
    .replace(
      /:(hover|focus|active|visited|focus-within|focus-visible|disabled|checked|first-child|last-child|nth-child\([^)]*\)|not\([^)]*\)|before|after|placeholder|root|empty|target|lang\([^)]*\))/gi,
      "",
    )
    .trim();

  if (!cleaned) return [];

  cleaned = cleaned.replace(/\s*([>+~])\s*/g, " ");

  const parts = cleaned.split(/\s+/).filter(Boolean);
  const specs: ElementSpec[] = [];

  for (const part of parts) {
    const spec = parseSingleCompoundSelector(part);
    if (spec) {
      specs.push(spec);
    }
  }

  return specs;
}

function formatName(name: string): string {
  if (!name) return "";
  let clean = name.replace(/[-_]+/g, " ").trim();
  if (
    /^(save|submit|cancel|confirm|action|login|signup|reset|close|open|delete|edit|add)\s+(button|btn)$/i.test(
      clean,
    )
  ) {
    clean = clean.replace(/\s+(button|btn)$/i, "");
  }
  return clean.replace(/\b[a-z]/g, (char) => char.toUpperCase());
}

function generateLabelForSpec(spec: ElementSpec): string {
  const mainName = spec.classes[0] || spec.id || "";
  const formatted = formatName(mainName);

  if (formatted) {
    if (spec.tag === "button" && !/button/i.test(formatted)) {
      return formatted;
    }
    return formatted;
  }

  switch (spec.tag) {
    case "button":
      return "Example Button";
    case "h1":
      return "Example Heading 1";
    case "h2":
      return "Example Heading 2";
    case "h3":
      return "Example Heading 3";
    case "p":
      return "Example paragraph text demonstrating applied styles.";
    case "a":
      return "Navigation Link";
    case "span":
      return "Sample Badge";
    case "li":
      return "List Item";
    case "header":
      return "Header Section";
    case "footer":
      return "Footer Section";
    case "nav":
      return "Navigation Menu";
    default:
      return "Example Container";
  }
}

function renderSpecNodeToHtml(node: TreeElementNode): string {
  const { spec, children } = node;
  const tag = spec.tag || "div";

  const attrParts: string[] = [];
  if (spec.id) {
    attrParts.push(`id="${spec.id}"`);
  }
  if (spec.classes.length > 0) {
    attrParts.push(`class="${spec.classes.join(" ")}"`);
  }
  for (const [k, v] of Object.entries(spec.attributes)) {
    if (v === "true") {
      attrParts.push(k);
    } else {
      attrParts.push(`${k}="${v}"`);
    }
  }

  if (tag === "input") {
    if (!spec.attributes.type) {
      attrParts.push('type="text"');
    }
    if (!spec.attributes.placeholder) {
      const phLabel = generateLabelForSpec(spec);
      attrParts.push(`placeholder="${phLabel}..."`);
    }
  } else if (tag === "a" && !spec.attributes.href) {
    attrParts.push('href="#"');
  } else if (tag === "img") {
    if (!spec.attributes.src) {
      attrParts.push(
        "src=\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='80' fill='%23334155'><rect width='120' height='80' rx='6'/><text x='50%25' y='50%25' fill='%2394a3b8' font-size='12' text-anchor='middle' dy='.3em'>Image</text></svg>\"",
      );
    }
    if (!spec.attributes.alt) {
      attrParts.push('alt="Sample Image"');
    }
  }

  const attrStr = attrParts.length > 0 ? " " + attrParts.join(" ") : "";

  if (tag === "input" || tag === "img" || tag === "br" || tag === "hr") {
    return `<${tag}${attrStr} />`;
  }

  if (children.length > 0) {
    const childHtmls = children.map((c) => renderSpecNodeToHtml(c)).join("\n");
    return `<${tag}${attrStr}>\n${childHtmls}\n</${tag}>`;
  }

  const isContainer =
    spec.classes.some((c) =>
      /\b(container|grid|flex|row|gallery|list|wrapper|box|card)\b/i.test(c),
    ) ||
    tag === "ul" ||
    tag === "ol" ||
    tag === "nav";

  if (tag === "ul" || tag === "ol") {
    return `<${tag}${attrStr}>\n  <li>List Item 1</li>\n  <li>List Item 2</li>\n  <li>List Item 3</li>\n</${tag}>`;
  }

  if (tag === "nav") {
    return `<${tag}${attrStr}>\n  <a href="#">Home</a>\n  <a href="#">About</a>\n  <a href="#">Contact</a>\n</${tag}>`;
  }

  if (isContainer && tag === "div") {
    const label = generateLabelForSpec(spec);
    if (spec.classes.some((c) => /\b(container|grid|flex|row|gallery)\b/i.test(c))) {
      return `<${tag}${attrStr}>\n  <div class="item">${label} Item A</div>\n  <div class="item">${label} Item B</div>\n  <div class="item">${label} Item C</div>\n</${tag}>`;
    }
  }

  const labelText = generateLabelForSpec(spec);
  return `<${tag}${attrStr}>${labelText}</${tag}>`;
}

function countNodes(nodes: TreeElementNode[]): number {
  let count = 0;
  for (const node of nodes) {
    count += 1;
    if (node.children && node.children.length > 0) {
      count += countNodes(node.children);
    }
  }
  return count;
}

function buildInlineCssPreview(code: string): CssPreviewResult {
  const hasHtml =
    /<(button|div|p|h[1-6]|input|span|article|section|a|header|footer|nav|ul|ol|li|form|table|img|textarea|select)\b/i.test(
      code,
    );

  let cssPart = code;
  let htmlPart = "";

  if (hasHtml) {
    const styleMatch = code.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    if (styleMatch) {
      cssPart = styleMatch[1];
      htmlPart = code.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").trim();
    } else {
      const lines = code.split("\n");
      const cssLines: string[] = [];
      const htmlLines: string[] = [];

      for (const line of lines) {
        if (/<[a-z0-9_-]+/i.test(line) || htmlLines.length > 0) {
          htmlLines.push(line);
        } else {
          cssLines.push(line);
        }
      }
      cssPart = cssLines.join("\n");
      htmlPart = htmlLines.join("\n");
    }

    const htmlTagMatches = htmlPart.match(/<([a-z0-9_-]+)\b/gi) || [];
    const matchedElementCount = Math.max(1, htmlTagMatches.length);

    const previewHtml = `<!DOCTYPE html>
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
    ${cssPart}
  </style>
</head>
<body>
  <div class="preview-header">Live CSS Preview (${matchedElementCount} target ${matchedElementCount === 1 ? "element" : "elements"})</div>
  <div class="preview-stage">
    ${htmlPart}
  </div>
</body>
</html>`;

    return { previewHtml, matchedElementCount };
  }

  const rawSelectors = extractCssSelectors(code);
  const rootNodes: TreeElementNode[] = [];
  const nodeKeyMap = new Map<string, TreeElementNode>();

  for (const selectorStr of rawSelectors) {
    const specChain = parseSelectorString(selectorStr);
    if (specChain.length === 0) continue;

    const parentSpec = specChain[0];
    const parentKey = `${parentSpec.tag}#${parentSpec.id || ""}.${parentSpec.classes.sort().join(".")}`;

    let parentNode = nodeKeyMap.get(parentKey);
    if (!parentNode) {
      parentNode = { spec: parentSpec, children: [] };
      nodeKeyMap.set(parentKey, parentNode);
      rootNodes.push(parentNode);
    }

    if (specChain.length > 1) {
      for (let i = 1; i < specChain.length; i++) {
        const childSpec = specChain[i];
        const childKey = `${childSpec.tag}#${childSpec.id || ""}.${childSpec.classes.sort().join(".")}`;
        const existingChild = parentNode.children.find((c) => {
          const k = `${c.spec.tag}#${c.spec.id || ""}.${c.spec.classes.sort().join(".")}`;
          return k === childKey;
        });

        if (!existingChild) {
          parentNode.children.push({ spec: childSpec, children: [] });
        }
      }
    }
  }

  const matchedElementCount = countNodes(rootNodes);

  let renderedStageHtml = "";
  if (matchedElementCount > 0) {
    renderedStageHtml = rootNodes.map((node) => renderSpecNodeToHtml(node)).join("\n");
  } else {
    renderedStageHtml = `
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
    </div>`;
  }

  const previewHtml = `<!DOCTYPE html>
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
    button {
      font-family: inherit;
      font-size: 13px;
      padding: 6px 14px;
      background: #334155;
      color: #f8fafc;
      border: 1px solid #475569;
      border-radius: 6px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    input, textarea, select {
      font-family: inherit;
      font-size: 13px;
      padding: 6px 12px;
      background: #1e293b;
      color: #f8fafc;
      border: 1px solid #334155;
      border-radius: 6px;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 0;
      margin-bottom: 8px;
      color: #f8fafc;
    }
    p {
      margin: 0 0 8px 0;
      color: #cbd5e1;
    }
    a {
      color: #38bdf8;
      text-decoration: underline;
    }
    header, footer, nav, section, article {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 12px;
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

    /* User CSS begins */
    ${code}
    /* User CSS ends */
  </style>
</head>
<body>
  <div class="preview-header">Live CSS Preview ${
    matchedElementCount > 0
      ? `(${matchedElementCount} target ${matchedElementCount === 1 ? "element" : "elements"})`
      : "Fixture"
  }</div>
  <div class="preview-stage">
    ${renderedStageHtml}
  </div>
</body>
</html>`;

  return { previewHtml, matchedElementCount };
}

function getFixtureContent(fixtureName?: string): { title: string; html: string } {
  const norm = (fixtureName || "basic").toLowerCase().trim();

  switch (norm) {
    case "button":
    case "events":
      return {
        title: "Event Listener Demo",
        html: `
    <div class="stage-card">
      <div class="stage-header">
        <span class="stage-tag">Event Listener Demo</span>
        <span class="stage-pill">#button</span>
      </div>
      <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 6px;">
        <button id="button" class="btn btn-primary">Click Me</button>
      </div>
      <div class="status-bar">
        <span class="status-dot"></span>
        <span class="status-label">Status:</span>
        <span id="status-text" class="status-val">Waiting for click...</span>
      </div>
    </div>`,
      };

    case "form":
      return {
        title: "Form Submission Demo",
        html: `
    <div class="stage-card">
      <div class="stage-header">
        <span class="stage-tag">Form Submission Demo</span>
        <span class="stage-pill">#form</span>
      </div>
      <form id="form" class="stage-form" style="display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <input type="text" id="input" name="name" placeholder="Enter text..." style="flex: 1; min-width: 140px;" />
          <button type="submit" id="button" class="btn btn-primary">Submit</button>
        </div>
      </form>
      <div class="status-bar">
        <span class="status-dot"></span>
        <span class="status-label">Status:</span>
        <span id="status-text" class="status-val">Waiting for submission...</span>
      </div>
    </div>`,
      };

    case "input":
      return {
        title: "Input Event Demo",
        html: `
    <div class="stage-card">
      <div class="stage-header">
        <span class="stage-tag">Input Event Demo</span>
        <span class="stage-pill">#input</span>
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <label for="input" style="font-size: 11px; color: #94a3b8;">Type something:</label>
        <input type="text" id="input" placeholder="Type here..." style="width: 100%;" />
        <div style="padding: 6px 10px; background: #090b10; border: 1px solid #232a3b; border-radius: 6px; font-size: 12px; display: flex; gap: 6px; align-items: center;">
          <span style="color: #64748b; font-size: 11px;">Live value:</span>
          <span id="live-value" style="color: #38bdf8; font-weight: 500;">(empty)</span>
        </div>
      </div>
    </div>`,
      };

    case "counter":
      return {
        title: "Counter State Demo",
        html: `
    <div class="stage-card">
      <div class="stage-header">
        <span class="stage-tag">Counter State Demo</span>
        <span class="stage-pill">#count</span>
      </div>
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
        <div style="display: flex; align-items: baseline; gap: 8px;">
          <span style="font-size: 12px; color: #94a3b8;">Count:</span>
          <span id="count" style="font-size: 24px; font-weight: 700; font-family: ui-monospace, monospace; color: #38bdf8; min-width: 36px;">0</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <button id="decrement" class="btn btn-secondary" style="width: 32px; height: 32px; padding: 0; font-size: 16px; font-weight: 600;">−</button>
          <button id="increment" class="btn btn-primary" style="width: 32px; height: 32px; padding: 0; font-size: 16px; font-weight: 600;">+</button>
          <button id="reset" class="btn btn-ghost" style="padding: 4px 8px; font-size: 11px;">Reset</button>
        </div>
      </div>
    </div>`,
      };

    case "list":
      return {
        title: "Dynamic List Demo",
        html: `
    <div class="stage-card">
      <div class="stage-header">
        <span class="stage-tag">Dynamic List Demo</span>
        <span class="stage-pill">#list</span>
      </div>
      <div style="display: flex; gap: 6px; margin-bottom: 8px;">
        <input type="text" id="input" placeholder="New item label..." style="flex: 1; min-width: 120px;" />
        <button id="button" class="btn btn-primary" style="padding: 6px 12px;">Add</button>
      </div>
      <ul id="list" style="margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 4px;">
        <li class="item" style="padding: 5px 8px; background: #090b10; border: 1px solid #1f2535; border-radius: 4px; color: #cbd5e1; font-size: 12px;">
          <span>• Learn HTML</span>
        </li>
        <li class="item" style="padding: 5px 8px; background: #090b10; border: 1px solid #1f2535; border-radius: 4px; color: #cbd5e1; font-size: 12px;">
          <span>• Learn CSS</span>
        </li>
        <li class="item" style="padding: 5px 8px; background: #090b10; border: 1px solid #1f2535; border-radius: 4px; color: #cbd5e1; font-size: 12px;">
          <span>• Learn JavaScript</span>
        </li>
      </ul>
    </div>`,
      };

    case "dom-inspector":
      return {
        title: "Profile Card Demo",
        html: `
    <div class="stage-card" id="profile-card">
      <div class="stage-header">
        <span class="stage-tag">Profile Card</span>
        <span class="stage-pill">#profile-card</span>
      </div>
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
        <div id="avatar" style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px;">JD</div>
        <div style="flex: 1; min-width: 0;">
          <h4 id="name" style="margin: 0; font-size: 13px; font-weight: 600; color: #f8fafc;">Jane Developer</h4>
          <p id="title" style="margin: 0; font-size: 11px; color: #38bdf8;">Frontend Learner</p>
        </div>
        <button id="button" class="btn btn-primary" style="padding: 4px 10px; font-size: 11px;">Follow</button>
      </div>
      <p id="bio" style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.4;">Building interactive web apps with semantic DOM and modern JavaScript.</p>
    </div>`,
      };

    case "request-response":
    case "network":
      return {
        title: "API Request / Response",
        html: `
    <div class="stage-card">
      <div class="stage-header">
        <span class="stage-tag">API Request / Response</span>
        <span id="status-badge" class="badge ok">200 OK</span>
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 4px 8px; background: #090b10; border: 1px solid #1f2535; border-radius: 4px; font-family: ui-monospace, monospace; font-size: 11px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="color: #38bdf8; font-weight: 600;">GET</span>
            <span style="color: #cbd5e1;">/api/users/current</span>
          </div>
          <button id="button" class="btn btn-primary" style="padding: 2px 8px; font-size: 10px;">Fetch</button>
        </div>
        <div style="text-align: center; color: #64748b; font-size: 10px; line-height: 1;">↓</div>
        <pre id="response-body" style="margin: 0; padding: 8px; background: #090b10; border: 1px solid #1f2535; border-radius: 4px; color: #34d399; font-family: ui-monospace, monospace; font-size: 11px; line-height: 1.4; max-height: 64px; overflow-y: auto;">{
  "id": 1,
  "name": "Alex",
  "role": "Frontend Engineer"
}</pre>
      </div>
    </div>`,
      };

    case "timer":
    case "async":
      return {
        title: "Async Timer & Timeline",
        html: `
    <div class="stage-card">
      <div class="stage-header">
        <span class="stage-tag">Async Timer & Timeline</span>
        <span id="timer-display" style="font-family: ui-monospace, monospace; font-size: 13px; font-weight: 700; color: #38bdf8;">00:00.0</span>
      </div>
      <div style="margin: 6px 0 8px 0;">
        <div style="width: 100%; height: 6px; background: #1a202c; border-radius: 3px; overflow: hidden;">
          <div id="progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #3b82f6, #38bdf8); transition: width 0.1s linear;"></div>
        </div>
      </div>
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <button id="button" class="btn btn-primary" style="padding: 4px 10px; font-size: 11px;">Start</button>
          <button id="stop-btn" class="btn btn-ghost" style="padding: 4px 10px; font-size: 11px;">Stop</button>
          <button id="reset-btn" class="btn btn-ghost" style="padding: 4px 10px; font-size: 11px;">Reset</button>
        </div>
        <span id="status-text" style="font-size: 11px; color: #94a3b8;">Ready</span>
      </div>
    </div>`,
      };

    case "storage":
      return {
        title: "localStorage Inspector",
        html: `
    <div class="stage-card">
      <div class="stage-header">
        <span class="stage-tag">localStorage Inspector</span>
        <span id="storage-count" class="stage-pill">2 items</span>
      </div>
      <div id="storage-entries" style="display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; max-height: 64px; overflow-y: auto;">
        <div class="storage-row" style="display: flex; align-items: center; justify-content: space-between; padding: 4px 8px; background: #090b10; border: 1px solid #1f2535; border-radius: 4px; font-family: ui-monospace, monospace; font-size: 11px;">
          <span style="color: #38bdf8;">theme</span>
          <span style="color: #64748b;">→</span>
          <span style="color: #facc15;">"dark"</span>
        </div>
        <div class="storage-row" style="display: flex; align-items: center; justify-content: space-between; padding: 4px 8px; background: #090b10; border: 1px solid #1f2535; border-radius: 4px; font-family: ui-monospace, monospace; font-size: 11px;">
          <span style="color: #38bdf8;">username</span>
          <span style="color: #64748b;">→</span>
          <span style="color: #facc15;">"Alex"</span>
        </div>
      </div>
      <div style="display: flex; gap: 6px; flex-wrap: wrap;">
        <input type="text" id="key-input" placeholder="key..." style="flex: 1; min-width: 60px;" />
        <input type="text" id="value-input" placeholder="value..." style="flex: 1; min-width: 60px;" />
        <button id="button" class="btn btn-primary" style="padding: 4px 10px; font-size: 11px;">Set</button>
      </div>
    </div>`,
      };

    case "none":
    case "empty":
      return {
        title: "Clean Canvas",
        html: `<div id="output" style="padding: 8px; background: #090b10; color: #38bdf8; border-radius: 6px; min-height: 32px; font-family: ui-monospace, monospace; font-size: 11px;">[Ready]</div>`,
      };

    case "basic":
    default:
      return {
        title: "Interactive DOM Stage",
        html: `
    <div class="stage-card">
      <div class="stage-header">
        <span class="stage-tag">Interactive DOM Stage</span>
        <span class="stage-pill">#button</span>
      </div>
      <h4 id="title" style="margin: 0 0 4px 0; font-size: 13px; font-weight: 600; color: #f1f5f9;">DOM Element Stage</h4>
      <p id="message" style="margin: 0 0 10px 0; font-size: 11px; color: #94a3b8; line-height: 1.4;">JavaScript controls live elements in this isolated document.</p>
      <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 6px;">
        <input type="text" id="input" placeholder="Type here..." style="flex: 1; min-width: 120px;" />
        <button id="button" class="btn btn-primary">Click Me</button>
      </div>
      <div class="status-bar">
        <span class="status-dot"></span>
        <span class="status-label">Status:</span>
        <span id="status-text" class="status-val">Ready</span>
      </div>
    </div>`,
      };
  }
}

function buildInlineFixtureDomPreview(
  code: string,
  id: string,
  mode?: string,
  fixture?: string,
  bindings?: Record<string, string>,
): string {
  const cleanCode = code
    .replace(/^import\s+[\s\S]*?from\s+['"].*?['"];?/gm, "")
    .replace(/^export\s+default\s+/gm, "")
    .replace(/^export\s+/gm, "")
    .replace(/<\/script>/gi, "<\\/script>");

  const fixtureInfo = getFixtureContent(fixture || "basic");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 10px;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #090a0f;
      color: #f8fafc;
      font-size: 12px;
      line-height: 1.5;
    }
    .stage-card {
      background: #11141e;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
    .stage-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .stage-tag {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #94a3b8;
    }
    .stage-pill {
      font-size: 10px;
      font-family: ui-monospace, monospace;
      background: rgba(255, 255, 255, 0.06);
      color: #38bdf8;
      padding: 1px 6px;
      border-radius: 4px;
      border: 1px solid rgba(56, 189, 248, 0.2);
    }
    button, .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #2563eb;
      color: #ffffff;
      border: 1px solid #3b82f6;
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: inherit;
    }
    button:hover, .btn:hover { background: #1d4ed8; filter: brightness(1.05); }
    button:active, .btn:active { transform: scale(0.98); }
    .btn-secondary {
      background: #1e2433;
      color: #cbd5e1;
      border: 1px solid #333d52;
    }
    .btn-secondary:hover { background: #283042; }
    .btn-ghost {
      background: transparent;
      color: #94a3b8;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .btn-ghost:hover { background: rgba(255, 255, 255, 0.06); color: #f8fafc; }
    input, select, textarea {
      background: #090b10;
      border: 1px solid #232a3b;
      border-radius: 6px;
      color: #f8fafc;
      padding: 6px 10px;
      font-family: inherit;
      font-size: 12px;
      outline: none;
      transition: border-color 0.15s;
    }
    input:focus, select:focus, textarea:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 1px #3b82f6;
    }
    .status-bar {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: #94a3b8;
      margin-top: 10px;
      padding-top: 8px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #3b82f6;
      flex-shrink: 0;
    }
    .status-val {
      color: #38bdf8;
      font-family: ui-monospace, monospace;
    }
    .badge {
      font-size: 10px;
      font-family: ui-monospace, monospace;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .badge.ok { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .badge.wait { background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); }
    .badge.err { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
  </style>
</head>
<body>
  <div id="app">
    ${fixtureInfo.html}
  </div>

  <script>
    (function() {
      // 1. Console interceptor
      const originalLog = console.log;
      const originalWarn = console.warn;
      const originalError = console.error;

      function sendLog(level, args) {
        try {
          const message = Array.from(args).map(function(a) {
            if (a instanceof HTMLElement) return '<' + a.tagName.toLowerCase() + (a.id ? '#' + a.id : (a.className ? '.' + a.className.split(' ')[0] : '')) + '>';
            if (typeof a === 'object' && a !== null) {
              try { return JSON.stringify(a); } catch(e) { return String(a); }
            }
            return String(a);
          }).join(' ');
          window.parent.postMessage({ type: 'CONSOLE_LOG', level: level, message: message, id: '${id}' }, '*');
        } catch (e) {
          window.parent.postMessage({ type: 'CONSOLE_LOG', level: 'error', message: String(e), id: '${id}' }, '*');
        }
      }

      console.log = function() { originalLog.apply(console, arguments); sendLog('log', arguments); };
      console.warn = function() { originalWarn.apply(console, arguments); sendLog('warn', arguments); };
      console.error = function() { originalError.apply(console, arguments); sendLog('error', arguments); };
      console.table = function(data) {
        originalLog.apply(console, arguments);
        try {
          sendLog('log', [typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data)]);
        } catch (e) {
          sendLog('log', [String(data)]);
        }
      };

      window.onerror = function(msg, url, line) {
        sendLog('error', [msg]);
        return false;
      };

      // 2. Mock storage & live UI sync
      var memStore = { theme: 'dark', username: 'Alex' };
      function updateStorageUI() {
        var el = document.getElementById('storage-entries');
        var cnt = document.getElementById('storage-count');
        if (!el) return;
        var keys = Object.keys(memStore);
        if (cnt) cnt.textContent = keys.length + (keys.length === 1 ? ' item' : ' items');
        if (keys.length === 0) {
          el.innerHTML = '<div style="color: #64748b; font-size: 11px; padding: 4px;">Storage is empty</div>';
          return;
        }
        el.innerHTML = keys.map(function(k) {
          return '<div class="storage-row" style="display: flex; align-items: center; justify-content: space-between; padding: 4px 8px; background: #090b10; border: 1px solid #1f2535; border-radius: 4px; font-family: ui-monospace, monospace; font-size: 11px;"><span style="color: #38bdf8;">' + k + '</span><span style="color: #64748b;">→</span><span style="color: #facc15;">"' + String(memStore[k]).replace(/"/g, '&quot;') + '"</span></div>';
        }).join('');
      }

      var mockStorage = {
        getItem: function(k) { return memStore[k] !== undefined ? memStore[k] : null; },
        setItem: function(k, v) { memStore[k] = String(v); updateStorageUI(); },
        removeItem: function(k) { delete memStore[k]; updateStorageUI(); },
        clear: function() { memStore = {}; updateStorageUI(); },
        key: function(i) { return Object.keys(memStore)[i] || null; },
        get length() { return Object.keys(memStore).length; }
      };

      try {
        window.localStorage.getItem('test');
        var origSet = window.localStorage.setItem.bind(window.localStorage);
        var origRemove = window.localStorage.removeItem.bind(window.localStorage);
        var origClear = window.localStorage.clear.bind(window.localStorage);
        window.localStorage.setItem = function(k, v) { origSet(k, v); updateStorageUI(); };
        window.localStorage.removeItem = function(k) { origRemove(k); updateStorageUI(); };
        window.localStorage.clear = function() { origClear(); updateStorageUI(); };
      } catch(e) {
        try {
          Object.defineProperty(window, 'localStorage', { value: mockStorage, configurable: true });
          Object.defineProperty(window, 'sessionStorage', { value: mockStorage, configurable: true });
        } catch(err) {}
      }

      // 3. Mock fetch & API simulator
      var origFetch = window.fetch;
      window.fetch = function(url, opts) {
        var statusBadge = document.getElementById('status-badge');
        var resBody = document.getElementById('response-body');
        if (statusBadge) { statusBadge.textContent = 'FETCHING...'; statusBadge.className = 'badge wait'; }

        var responseData = {
          success: true,
          status: 200,
          url: String(url),
          timestamp: new Date().toISOString(),
          data: { id: 1, name: 'Alex', role: 'Frontend Engineer' }
        };

        if (origFetch) {
          return origFetch(url, opts).then(function(res) {
            if (statusBadge) { statusBadge.textContent = res.status + ' ' + res.statusText; statusBadge.className = 'badge ' + (res.ok ? 'ok' : 'err'); }
            return res;
          }).catch(function() {
            if (statusBadge) { statusBadge.textContent = '200 OK (Simulated)'; statusBadge.className = 'badge ok'; }
            if (resBody) { resBody.textContent = JSON.stringify(responseData, null, 2); }
            return Promise.resolve({
              ok: true,
              status: 200,
              statusText: 'OK',
              json: function() { return Promise.resolve(responseData); },
              text: function() { return Promise.resolve(JSON.stringify(responseData)); }
            });
          });
        }

        if (statusBadge) { statusBadge.textContent = '200 OK (Simulated)'; statusBadge.className = 'badge ok'; }
        if (resBody) { resBody.textContent = JSON.stringify(responseData, null, 2); }
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: function() { return Promise.resolve(responseData); },
          text: function() { return Promise.resolve(JSON.stringify(responseData)); }
        });
      };

      // 4. Global DOM binding exposure
      var hasExplicitBindings = ${Boolean(bindings && Object.keys(bindings).length > 0)};
      var explicitBindings = ${JSON.stringify(bindings || {})};

      if (hasExplicitBindings) {
        Object.keys(explicitBindings).forEach(function(varName) {
          var selector = explicitBindings[varName];
          if (typeof selector === 'string') {
            try {
              var el = document.querySelector(selector);
              if (el) {
                window[varName] = el;
              } else {
                console.error('Runtime Fixture Error:\\nBinding "' + varName + '" could not find "' + selector + '".');
              }
            } catch(err) {
              console.error('Runtime Fixture Error:\\nInvalid selector "' + selector + '" for binding "' + varName + '".');
            }
          }
        });
      } else {
        // Fallback for legacy lessons without explicit runtime.bindings
        var fixtureType = ${JSON.stringify(fixture || "basic")};
        if (fixtureType === "button" || fixtureType === "events") {
          var btnEl = document.querySelector('#button');
          if (btnEl) window.button = btnEl;
        } else if (fixtureType === "counter") {
          var countEl = document.querySelector('#count');
          var incEl = document.querySelector('#increment');
          var decEl = document.querySelector('#decrement');
          if (countEl) window.count = countEl;
          if (incEl) window.increment = incEl;
          if (decEl) window.decrement = decEl;
        } else if (fixtureType === "form") {
          var formEl = document.querySelector('#form');
          var inputEl = document.querySelector('#input');
          var btnEl = document.querySelector('#button');
          if (formEl) window.form = formEl;
          if (inputEl) window.input = inputEl;
          if (btnEl) window.button = btnEl;
        } else if (fixtureType === "input") {
          var inputEl = document.querySelector('#input');
          if (inputEl) window.input = inputEl;
        } else if (fixtureType === "list") {
          var listEl = document.querySelector('#list');
          var inputEl = document.querySelector('#input');
          var btnEl = document.querySelector('#button');
          if (listEl) window.list = listEl;
          if (inputEl) window.input = inputEl;
          if (btnEl) window.button = btnEl;
        } else if (fixtureType === "dom-inspector") {
          var cardEl = document.querySelector('#profile-card');
          if (cardEl) window.card = cardEl;
        } else if (fixtureType === "timer" || fixtureType === "async") {
          var btnEl = document.querySelector('#button');
          if (btnEl) window.button = btnEl;
        } else if (fixtureType === "storage") {
          var btnEl = document.querySelector('#button');
          if (btnEl) window.button = btnEl;
        } else if (fixtureType === "basic") {
          var btnEl = document.querySelector('#button');
          var inputEl = document.querySelector('#input');
          if (btnEl) window.button = btnEl;
          if (inputEl) window.input = inputEl;
        }
      }

      // 5. Default stage interactivity
      var defaultBtn = document.querySelector('#button');
      var defaultForm = document.querySelector('#form');
      var defaultInput = document.querySelector('#input');
      var defaultStatusText = document.querySelector('#status-text');

      if (defaultBtn) {
        defaultBtn.addEventListener('click', function() {
          if (defaultStatusText && defaultStatusText.textContent.indexOf('Waiting') !== -1) {
            defaultStatusText.textContent = '✓ Button clicked';
            defaultStatusText.style.color = '#34d399';
          }
        });
      }
      if (defaultForm) {
        defaultForm.addEventListener('submit', function(e) {
          e.preventDefault();
          if (defaultStatusText) {
            var val = defaultInput ? defaultInput.value : '';
            defaultStatusText.textContent = val ? '✓ Submitted: "' + val + '"' : '✓ Form submitted';
            defaultStatusText.style.color = '#34d399';
          }
        });
      }
      if (primaryInput) {
        primaryInput.addEventListener('input', function() {
          var liveVal = document.getElementById('live-value');
          if (liveVal) {
            liveVal.textContent = primaryInput.value || '(empty)';
          }
        });
      }
      if (primaryInc && primaryCount) {
        primaryInc.addEventListener('click', function() {
          var curr = parseInt(primaryCount.textContent || '0', 10);
          if (!isNaN(curr)) primaryCount.textContent = String(curr + 1);
        });
      }
      if (primaryDec && primaryCount) {
        primaryDec.addEventListener('click', function() {
          var curr = parseInt(primaryCount.textContent || '0', 10);
          if (!isNaN(curr)) primaryCount.textContent = String(curr - 1);
        });
      }
      var resetBtn = document.getElementById('reset');
      if (resetBtn && primaryCount) {
        resetBtn.addEventListener('click', function() {
          primaryCount.textContent = '0';
        });
      }
      var saveStorageBtn = document.getElementById('save-btn');
      if (saveStorageBtn) {
        saveStorageBtn.addEventListener('click', function() {
          var k = document.getElementById('key-input');
          var v = document.getElementById('value-input');
          if (k && v && k.value) {
            mockStorage.setItem(k.value, v.value);
            k.value = '';
            v.value = '';
          }
        });
      }
      var startTimerBtn = document.getElementById('start-btn');
      var stopTimerBtn = document.getElementById('stop-btn');
      var resetTimerBtn = document.getElementById('reset-btn');
      var timerDisplay = document.getElementById('timer-display');
      var progressBar = document.getElementById('progress-bar');
      var timerInterval = null;
      var timerStart = null;
      if (startTimerBtn) {
        startTimerBtn.addEventListener('click', function() {
          if (!timerInterval) {
            timerStart = Date.now();
            if (primaryStatusText) primaryStatusText.textContent = 'Timer Running';
            timerInterval = setInterval(function() {
              var elapsed = Date.now() - timerStart;
              var secs = Math.floor(elapsed / 1000);
              var tenths = Math.floor((elapsed % 1000) / 100);
              var mins = Math.floor(secs / 60);
              var secStr = String(secs % 60).padStart(2, '0');
              var minStr = String(mins).padStart(2, '0');
              if (timerDisplay) timerDisplay.textContent = minStr + ':' + secStr + '.' + tenths;
              if (progressBar) progressBar.style.width = Math.min(100, (elapsed % 10000) / 100) + '%';
            }, 100);
          }
        });
      }
      if (stopTimerBtn) {
        stopTimerBtn.addEventListener('click', function() {
          if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
            if (primaryStatusText) primaryStatusText.textContent = 'Timer Stopped';
          }
        });
      }
      if (resetTimerBtn) {
        resetTimerBtn.addEventListener('click', function() {
          if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
          }
          timerStart = null;
          if (timerDisplay) timerDisplay.textContent = '00:00.0';
          if (progressBar) progressBar.style.width = '0%';
          if (primaryStatusText) primaryStatusText.textContent = 'Timer Reset';
        });
      }
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
  runtime,
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
  const isQuickRunnable = [
    "javascript",
    "js",
    "jsx",
    "tsx",
    "react",
    "html",
    "css",
    "typescript",
    "ts",
  ].includes(normLang);
  const isPlaygroundSupported = [
    "javascript",
    "js",
    "jsx",
    "tsx",
    "react",
    "html",
    "css",
    "typescript",
    "ts",
  ].includes(normLang);

  const handleQuickRun = () => {
    if (!isQuickRunnable) {
      return;
    }

    setOutputLog("");
    setIsErrorLog(false);
    setPreviewHtml(null);

    // Resolution priority:
    // 1. Explicit runtime metadata
    // 2. Automatic code/language detection
    // 3. Console fallback
    const explicitMode = runtime?.mode?.toLowerCase()?.trim();
    const explicitFixture = runtime?.fixture?.toLowerCase()?.trim();

    let resolvedMode = explicitMode;
    if (!resolvedMode) {
      if (normLang === "html") {
        resolvedMode = "html";
      } else if (normLang === "css") {
        resolvedMode = "css";
      } else if (checkCodeNeedsReact(code, normLang)) {
        resolvedMode = "react";
      } else if (
        /\b(document|window|querySelector|querySelectorAll|getElementById|getElementsByClassName|addEventListener|classList|textContent|innerHTML|style|createElement|appendChild|remove|value)\b/.test(
          code,
        )
      ) {
        resolvedMode = "dom";
      } else {
        resolvedMode = "console";
      }
    }

    if (resolvedMode === "console") {
      // Pure console mode — evaluate code, capture console output, do not generate DOM preview
      try {
        const logs: string[] = [];
        const appendLog = (level: "log" | "warn" | "error", args: unknown[]) => {
          const msg = args
            .map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a)))
            .join(" ");
          const formatted =
            level === "error" ? `[ERROR] ${msg}` : level === "warn" ? `[WARN] ${msg}` : msg;
          logs.push(formatted);
          setOutputLog((prev) =>
            prev && prev !== "✓ Executed cleanly in console mode (no console output)."
              ? prev + "\n" + formatted
              : formatted,
          );
        };

        const dummyConsole = {
          log: (...args: unknown[]) => appendLog("log", args),
          warn: (...args: unknown[]) => appendLog("warn", args),
          error: (...args: unknown[]) => appendLog("error", args),
          table: (data: unknown) =>
            appendLog("log", [
              typeof data === "object" ? JSON.stringify(data, null, 2) : String(data),
            ]),
        };

        let cleanCode = code;
        try {
          const transformed = Babel.transform(code, {
            presets: [["typescript", { ignoreExtensions: false }]],
            parserOpts: { allowReturnOutsideFunction: true },
            filename: "snippet.ts",
          });
          cleanCode = transformed.code || code;
        } catch {
          // Fallback
        }

        cleanCode = cleanCode
          .replace(/^import\s+[\s\S]*?from\s+['"].*?['"];?/gm, "")
          .replace(/^export\s+default\s+/gm, "")
          .replace(/^export\s+/gm, "");

        const fn = new Function("console", cleanCode);
        fn(dummyConsole);

        setPreviewHtml(null);
        if (logs.length > 0) {
          setOutputLog(logs.join("\n"));
          toast.success("Executed cleanly in console mode");
        } else {
          setOutputLog("✓ Executed cleanly in console mode (no console output).");
          toast.success("Executed cleanly in console mode");
        }
        setIsErrorLog(false);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        setOutputLog(`Runtime Error:\n${errMsg}`);
        setIsErrorLog(true);
        setPreviewHtml(null);
      }
    } else if (resolvedMode === "html") {
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
    } else if (resolvedMode === "css") {
      try {
        const { previewHtml: previewDoc, matchedElementCount } = buildInlineCssPreview(code);
        setPreviewHtml(previewDoc);
        if (matchedElementCount > 0) {
          const unit = matchedElementCount === 1 ? "element" : "elements";
          setOutputLog(`✓ CSS applied to ${matchedElementCount} live preview ${unit}.`);
        } else {
          setOutputLog("✓ CSS applied to live preview fixture.");
        }
        setIsErrorLog(false);
        toast.success("CSS applied to preview");
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        setOutputLog(`Failed to apply CSS:\n${errMsg}`);
        setIsErrorLog(true);
      }
    } else if (resolvedMode === "react") {
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

        try {
          const transformed = Babel.transform(code, {
            presets: [
              ["react", { runtime: "classic" }],
              ["typescript", { ignoreExtensions: false }],
            ],
            parserOpts: { allowReturnOutsideFunction: true },
            filename: `snippet.${normLang === "tsx" || normLang === "ts" || normLang === "typescript" ? "tsx" : "jsx"}`,
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
    } else {
      // dom, events, network, async, storage, etc.
      let cleanJs = code;
      try {
        const transformed = Babel.transform(code, {
          presets: [["typescript", { ignoreExtensions: false }]],
          parserOpts: { allowReturnOutsideFunction: true },
          filename: "snippet.ts",
        });
        cleanJs = transformed.code || code;
      } catch {
        // Fallback
      }

      const resolvedFixture =
        explicitFixture ||
        (resolvedMode === "events"
          ? "events"
          : resolvedMode === "network"
            ? "request-response"
            : resolvedMode === "async"
              ? "timer"
              : resolvedMode === "storage"
                ? "storage"
                : "basic");

      const previewDoc = buildInlineFixtureDomPreview(
        cleanJs,
        previewId,
        resolvedMode,
        resolvedFixture,
        runtime?.bindings,
      );
      setPreviewHtml(previewDoc);
      setOutputLog("");
      setIsErrorLog(false);
      toast.success(
        `${resolvedMode.toUpperCase()} script loaded in preview (${resolvedFixture} fixture)`,
      );
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
