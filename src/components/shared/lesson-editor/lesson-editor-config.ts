import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

/**
 * Custom CodeMirror theme that references Forge lesson design tokens natively.
 * Responsive fonts, focus shadows, and scroll containing behavior are built in.
 */
export const lessonTheme = EditorView.theme(
  {
    "&": {
      color: "var(--lesson-text-primary, #f5f5f5)",
      backgroundColor: "var(--lesson-surface, #161616)",
      fontFamily: "var(--font-mono, monospace)",
      fontSize: "14px",
      height: "100%",
      display: "flex",
      flexDirection: "column",
    },
    "& .cm-scroller": {
      overflow: "auto",
      flex: 1,
      minHeight: "0",
      scrollbarWidth: "thin",
      overscrollBehaviorX: "contain",
    },
    ".cm-content": {
      caretColor: "var(--lesson-accent, #ea580c)",
      padding: "16px 0",
      minHeight: "100%",
    },
    "&.cm-focused": {
      outline: "none",
    },
    "&.cm-focused .cm-cursor": {
      borderLeftColor: "var(--lesson-accent, #ea580c)",
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
      backgroundColor: "rgba(234, 88, 12, 0.22) !important",
    },
    ".cm-gutters": {
      backgroundColor: "var(--lesson-surface-subtle, #141414)",
      color: "var(--lesson-text-muted, #737373)",
      borderRight: "1px solid var(--lesson-border, rgba(255, 255, 255, 0.08))",
      fontFamily: "var(--font-mono, monospace)",
      fontSize: "12px",
      paddingLeft: "10px",
      paddingRight: "10px",
      userSelect: "none",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "rgba(234, 88, 12, 0.08)",
      color: "var(--lesson-text-secondary, #e5e5e5)",
      fontWeight: "bold",
    },
    ".cm-activeLine": {
      backgroundColor: "rgba(234, 88, 12, 0.03)",
    },
    ".cm-matchingBracket": {
      backgroundColor: "rgba(234, 88, 12, 0.2)",
      outline: "1.5px solid var(--lesson-accent, #ea580c)",
      borderRadius: "2px",
    },
    ".cm-nonmatchingBracket": {
      backgroundColor: "rgba(239, 68, 68, 0.2)",
      outline: "1.5px solid #ef4444",
      borderRadius: "2px",
    },
  },
  { dark: true },
);

/**
 * Clean display-ready syntax highlight mapping for Forge's learning environment.
 */
export const lessonHighlightStyle = HighlightStyle.define([
  { tag: t.meta, color: "var(--lesson-text-muted, #737373)" },
  { tag: t.link, textDecoration: "underline" },
  { tag: t.heading, textDecoration: "underline", fontWeight: "bold" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.strong, fontWeight: "bold" },
  { tag: t.strikethrough, textDecoration: "line-through" },
  { tag: t.keyword, color: "#f43f5e", fontWeight: "600" }, // Soft rose/red
  { tag: [t.atom, t.bool, t.url, t.contentSeparator, t.labelName], color: "#f59e0b" }, // Warm amber
  { tag: [t.literal, t.inserted, t.string, t.deleted], color: "#10b981" }, // Crisp green
  { tag: [t.regexp, t.escape, t.special(t.string)], color: "#f43f5e" },
  { tag: t.definition(t.variableName), color: "#3b82f6" }, // Blue
  { tag: [t.typeName, t.className, t.number, t.changed], color: "#ea580c" }, // Orange accent
  { tag: t.tagName, color: "#f43f5e" }, // Rose tags
  { tag: t.attributeName, color: "#3b82f6" }, // Sky blue attributes
  { tag: [t.variableName, t.propertyName], color: "var(--lesson-text-primary, #f5f5f5)" },
  {
    tag: [t.function(t.variableName), t.function(t.propertyName)],
    color: "#3b82f6",
    fontWeight: "500",
  },
  { tag: t.comment, color: "var(--lesson-text-muted, #737373)", fontStyle: "italic" },
  { tag: t.processingInstruction, color: "var(--lesson-text-muted, #737373)" },
  { tag: t.invalid, color: "#ef4444", textDecoration: "underline" },
]);

export const syntaxHighlightingExtension = syntaxHighlighting(lessonHighlightStyle);

/**
 * Natural Tag Completion Extension for HTML and JSX/TSX.
 * Automatically closes elements upon typing '>' with cursor positioned inside.
 */
export const autoCloseTagExtension = EditorView.inputHandler.of((view, from, to, text) => {
  if (text !== ">") return false;

  const state = view.state;
  const line = state.doc.lineAt(from);
  const lineText = line.text;
  const posInLine = from - line.from;

  // Extract content up to the typed '>'
  const textBefore = lineText.slice(0, posInLine);

  // Skip self-closing tags (ending with a slash)
  if (textBefore.trim().endsWith("/")) {
    return false;
  }

  // Look back to match `<tag` or `<Component`
  const match = textBefore.match(/<([A-Za-z0-9_-]+)(?:\s+[^>]*)?$/);

  if (match) {
    const tagName = match[1];

    // Skip self-closing void elements
    const voidElements = [
      "img",
      "input",
      "br",
      "hr",
      "meta",
      "link",
      "source",
      "embed",
      "area",
      "base",
      "col",
      "param",
      "track",
      "wbr",
    ];
    if (voidElements.includes(tagName.toLowerCase())) {
      return false;
    }

    const closingTag = `</${tagName}>`;

    // Dispatch the closing tag insert transaction on the next tick
    // so CodeMirror inserts the typed '>' first
    setTimeout(() => {
      const currentHead = view.state.selection.main.head;
      view.dispatch({
        changes: { from: currentHead, insert: closingTag },
        selection: { anchor: currentHead }, // keep selection cursor positioned inside
      });
    }, 0);
  }

  return false;
});
