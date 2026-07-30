import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Highlighter, Trash2, Download, Bold, Code, Quote, List } from "lucide-react";
import { useProgress } from "@/lib/hooks/use-progress";
import { toast } from "sonner";

interface LessonNotesWidgetProps {
  lessonId: string;
  lessonTitle: string;
}

export function LessonNotesWidget({ lessonId, lessonTitle }: LessonNotesWidgetProps) {
  const { notes, saveNote, lessonHighlights, removeHighlight } = useProgress();
  const [noteContent, setNoteContent] = useState(notes[lessonId] ?? "");
  const [noteSaved, setNoteSaved] = useState(false);

  const highlights = lessonHighlights?.[lessonId] || [];

  const handleSave = (text: string) => {
    setNoteContent(text);
    saveNote(lessonId, text);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  };

  const insertFormatting = (prefix: string, suffix: string = "") => {
    const formatted = `${noteContent}\n${prefix} ${suffix}`;
    handleSave(formatted);
  };

  const handleExport = () => {
    const exportText = `# Notes: ${lessonTitle}\n\n${noteContent}\n\n## Highlights\n${highlights
      .map((h) => `- "${h.text}"`)
      .join("\n")}`;

    const blob = new Blob([exportText], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${lessonId}-notes.md`;
    a.click();
    toast.success("Notes exported to Markdown file");
  };

  return (
    <div className="space-y-4">
      {/* Note Taking Card */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-primary" />
            Lesson Notes
          </CardTitle>
          <div className="flex items-center gap-2">
            {noteSaved && <span className="text-[10px] text-emerald-400 font-medium">Saved</span>}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={handleExport}
              title="Export Notes"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Quick Markdown formatting bar */}
          <div className="flex items-center gap-1 pb-1 border-b border-border/40 text-muted-foreground">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => insertFormatting("**", "**")}
              title="Bold"
            >
              <Bold className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => insertFormatting("`", "`")}
              title="Code"
            >
              <Code className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => insertFormatting("> ")}
              title="Quote"
            >
              <Quote className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => insertFormatting("- ")}
              title="List"
            >
              <List className="h-3 w-3" />
            </Button>
          </div>

          <Textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            onBlur={(e) => handleSave(e.target.value)}
            placeholder="Write key takeaways or notes for yourself..."
            className="min-h-36 resize-none text-xs leading-relaxed font-sans"
          />
        </CardContent>
      </Card>

      {/* Highlights List Card */}
      {highlights.length > 0 && (
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-1.5 text-xs font-semibold">
              <Highlighter className="h-3.5 w-3.5 text-amber-400" />
              Saved Highlights
            </CardTitle>
            <Badge variant="outline" className="text-[10px]">
              {highlights.length}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-2 max-h-56 overflow-y-auto">
            {highlights.map((h) => {
              let colorBg = "bg-amber-400/10 border-amber-400/30 text-amber-200";
              if (h.color === "emerald")
                colorBg = "bg-emerald-400/10 border-emerald-400/30 text-emerald-200";
              if (h.color === "cyan") colorBg = "bg-cyan-400/10 border-cyan-400/30 text-cyan-200";
              if (h.color === "purple")
                colorBg = "bg-purple-400/10 border-purple-400/30 text-purple-200";
              if (h.color === "rose") colorBg = "bg-rose-400/10 border-rose-400/30 text-rose-200";

              return (
                <div
                  key={h.id}
                  className={`p-2 rounded-lg border text-xs relative group flex items-start justify-between gap-2 ${colorBg}`}
                >
                  <span className="italic leading-relaxed truncate">"{h.text}"</span>
                  <button
                    onClick={() => removeHighlight(lessonId, h.id)}
                    className="shrink-0 opacity-70 hover:opacity-100 text-muted-foreground hover:text-rose-400"
                    title="Delete highlight"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
