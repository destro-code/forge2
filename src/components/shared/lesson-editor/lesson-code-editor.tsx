import { useEffect, useRef, useState } from "react";
import { EditorState, Compartment } from "@codemirror/state";
import {
  EditorView,
  lineNumbers,
  highlightActiveLine,
  drawSelection,
  keymap,
} from "@codemirror/view";
import { bracketMatching, indentOnInput } from "@codemirror/language";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";

import {
  lessonTheme,
  syntaxHighlightingExtension,
  autoCloseTagExtension,
} from "./lesson-editor-config";
import { cn } from "@/lib/utils";

export interface LessonCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: "html" | "css" | "javascript" | "typescript" | "jsx" | "tsx" | string;
  readOnly?: boolean;
  className?: string;
  "aria-label"?: string;
  id?: string;
}

// Compartments for dynamic run-time extension updates
const languageCompartment = new Compartment();
const readOnlyCompartment = new Compartment();

/**
 * Maps the Forge language key to the appropriate CodeMirror 6 language extension.
 */
function getLanguageExtension(lang: string) {
  const normalized = (lang || "").toLowerCase();
  switch (normalized) {
    case "html":
      return html();
    case "css":
      return css();
    case "javascript":
    case "js":
      return javascript({ jsx: false, typescript: false });
    case "typescript":
    case "ts":
      return javascript({ jsx: false, typescript: true });
    case "jsx":
      return javascript({ jsx: true, typescript: false });
    case "tsx":
      return javascript({ jsx: true, typescript: true });
    default:
      return html(); // Default to HTML
  }
}

export function LessonCodeEditor({
  value,
  onChange,
  language = "html",
  readOnly = false,
  className,
  "aria-label": ariaLabel = "Code Editor",
  id,
}: LessonCodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const [isFocused, setIsFocused] = useState(false);

  // Sync onChange to avoid re-initializing the update listener
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Initializing CodeMirror 6 Instance
  useEffect(() => {
    if (!containerRef.current) return;

    // Core CodeMirror 6 extension set
    const state = EditorState.create({
      doc: value,
      extensions: [
        lessonTheme,
        syntaxHighlightingExtension,
        autoCloseTagExtension,
        lineNumbers(),
        highlightActiveLine(),
        drawSelection(),
        bracketMatching(),
        closeBrackets(),
        indentOnInput(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap, ...closeBracketsKeymap]),
        languageCompartment.of(getLanguageExtension(language)),
        readOnlyCompartment.of(EditorState.readOnly.of(readOnly)),
        EditorView.updateListener.of((update) => {
          if (update.focusChanged) {
            setIsFocused(update.view.hasFocus);
          }
          if (update.docChanged) {
            const currentDoc = update.state.doc.toString();
            onChangeRef.current(currentDoc);
          }
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    editorViewRef.current = view;

    // Cleanup view on unmount
    return () => {
      view.destroy();
      editorViewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run exactly once

  // Controlled Value Synchronization (avoiding loops/cursor jumps)
  useEffect(() => {
    const view = editorViewRef.current;
    if (!view) return;

    const currentDoc = view.state.doc.toString();
    if (value !== currentDoc) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value },
      });
    }
  }, [value]);

  // Dynamic Language Reconfiguration
  useEffect(() => {
    const view = editorViewRef.current;
    if (!view) return;

    view.dispatch({
      effects: languageCompartment.reconfigure(getLanguageExtension(language)),
    });
  }, [language]);

  // Dynamic Read-Only Reconfiguration
  useEffect(() => {
    const view = editorViewRef.current;
    if (!view) return;

    view.dispatch({
      effects: readOnlyCompartment.reconfigure(EditorState.readOnly.of(readOnly)),
    });
  }, [readOnly]);

  return (
    <div
      id={id}
      className={cn(
        "relative w-full h-full flex flex-col bg-lesson-surface rounded-xl border transition-all text-lesson-text-primary overflow-hidden",
        isFocused
          ? "border-lesson-accent ring-2 ring-lesson-accent/25 shadow-xs"
          : "border-lesson-border",
        className,
      )}
    >
      {/* Hidden textarea for screen-readers and headless environment accessibility */}
      <textarea
        data-testid="lesson-editor-textarea"
        aria-label={ariaLabel}
        readOnly={readOnly}
        className="sr-only opacity-0 w-0 h-0 absolute pointer-events-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      {/* CodeMirror Mounting Div */}
      <div
        ref={containerRef}
        className="w-full flex-1 min-h-0 text-xs sm:text-sm md:text-base leading-relaxed"
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel}
        aria-readonly={readOnly}
      />
    </div>
  );
}
