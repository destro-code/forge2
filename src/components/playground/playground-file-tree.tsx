import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileCode2,
  FileSpreadsheet,
  FileText,
  Plus,
  Trash2,
  FolderTree,
  FilePlus,
  Code2,
  Sparkles,
} from "lucide-react";
import type { PlaygroundFile, PlaygroundPreset } from "@/lib/types/playground";

interface PlaygroundFileTreeProps {
  files: PlaygroundFile[];
  activeFileId: string;
  onSelectFile: (fileId: string) => void;
  onAddFile: (fileName: string) => void;
  onDeleteFile: (fileId: string) => void;
  presets: PlaygroundPreset[];
  currentPresetId: string;
  onSelectPreset: (presetId: string) => void;
}

export function PlaygroundFileTree({
  files,
  activeFileId,
  onSelectFile,
  onAddFile,
  onDeleteFile,
  presets,
  currentPresetId,
  onSelectPreset,
}: PlaygroundFileTreeProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newFileName, setNewFileName] = useState("");

  const handleCreate = () => {
    if (!newFileName.trim()) return;
    let name = newFileName.trim();
    if (!name.includes(".")) {
      name += ".tsx";
    }
    onAddFile(name);
    setNewFileName("");
    setIsAdding(false);
  };

  const getFileIcon = (name: string) => {
    if (name.endsWith(".tsx") || name.endsWith(".jsx")) {
      return <FileCode2 className="h-4 w-4 text-sky-400" />;
    }
    if (name.endsWith(".ts") || name.endsWith(".js")) {
      return <Code2 className="h-4 w-4 text-amber-400" />;
    }
    if (name.endsWith(".css")) {
      return <FileSpreadsheet className="h-4 w-4 text-pink-400" />;
    }
    return <FileText className="h-4 w-4 text-emerald-400" />;
  };

  return (
    <div className="flex h-full flex-col border-r border-border/60 bg-card/40 text-xs">
      {/* Preset Selector */}
      <div className="border-b border-border/50 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-primary" /> Preset Lab
          </span>
        </div>
        <select
          value={currentPresetId}
          onChange={(e) => onSelectPreset(e.target.value)}
          className="w-full rounded-md border border-border/60 bg-background/80 px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {presets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title} ({p.difficulty})
            </option>
          ))}
        </select>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-3 py-2 text-muted-foreground">
        <span className="font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1">
          <FolderTree className="h-3.5 w-3.5" /> Explorer
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={() => setIsAdding(!isAdding)}
          title="New File"
        >
          <FilePlus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* New File Inline Form */}
      {isAdding && (
        <div className="p-2 border-b border-border/50 flex gap-1 bg-background/50">
          <Input
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="filename.tsx"
            className="h-7 text-xs"
            autoFocus
          />
          <Button size="sm" className="h-7 px-2 text-xs" onClick={handleCreate}>
            Add
          </Button>
        </div>
      )}

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-1 space-y-0.5">
        {files.map((file) => {
          const isActive = file.id === activeFileId;
          const isMain = file.name === "App.tsx";

          return (
            <div
              key={file.id}
              onClick={() => onSelectFile(file.id)}
              className={`group flex items-center justify-between rounded-md px-2 py-1.5 cursor-pointer transition ${
                isActive
                  ? "bg-primary/10 text-primary font-medium border border-primary/20"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {getFileIcon(file.name)}
                <span className="truncate">{file.name}</span>
                {isMain && (
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1 h-3.5 border-primary/30 text-primary"
                  >
                    Entry
                  </Badge>
                )}
              </div>

              {!isMain && files.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 hover:text-rose-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFile(file.id);
                  }}
                  title="Delete file"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
