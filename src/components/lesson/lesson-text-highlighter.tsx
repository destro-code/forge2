import { useEffect, useState, useRef } from "react";
import { HighlightingPopover } from "./highlighting-popover";
import { useProgress } from "@/lib/hooks/use-progress";
import type { LessonHighlightColor } from "@/lib/types";
import { toast } from "sonner";

interface LessonTextHighlighterProps {
  lessonId: string;
  onAddNoteFromText?: (text: string) => void;
  children: React.ReactNode;
}

export function LessonTextHighlighter({
  lessonId,
  onAddNoteFromText,
  children,
}: LessonTextHighlighterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState("");
  const { addHighlight } = useProgress();

  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setPopoverPos(null);
        setSelectedText("");
        return;
      }

      const text = selection.toString().trim();
      if (!text || text.length < 3) {
        setPopoverPos(null);
        setSelectedText("");
        return;
      }

      // Check if selection is within our lesson container
      if (containerRef.current && containerRef.current.contains(selection.anchorNode)) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        setSelectedText(text);
        setPopoverPos({
          x: rect.left + rect.width / 2,
          y: rect.top + window.scrollY - 10,
        });
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, []);

  const handleApplyHighlight = (color: LessonHighlightColor) => {
    if (!selectedText) return;

    addHighlight(lessonId, { text: selectedText, color });
    toast.success(`Text highlighted in ${color}`);
    setPopoverPos(null);
    window.getSelection()?.removeAllRanges();
  };

  const handleAddNote = () => {
    if (!selectedText) return;
    if (onAddNoteFromText) {
      onAddNoteFromText(selectedText);
    }
    setPopoverPos(null);
    window.getSelection()?.removeAllRanges();
  };

  const handleCopyQuote = () => {
    if (!selectedText) return;
    navigator.clipboard.writeText(`"${selectedText}"`);
    toast.success("Quote copied to clipboard");
    setPopoverPos(null);
    window.getSelection()?.removeAllRanges();
  };

  return (
    <div ref={containerRef} className="relative select-text">
      {children}

      {popoverPos && (
        <HighlightingPopover
          position={popoverPos}
          onHighlight={handleApplyHighlight}
          onAddNote={handleAddNote}
          onCopyQuote={handleCopyQuote}
          onClose={() => setPopoverPos(null)}
        />
      )}
    </div>
  );
}
