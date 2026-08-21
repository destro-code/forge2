import { Button } from "@/components/ui/button";
import { X, Plus, FileCode2, FileSpreadsheet, FileText, Code2, FileCode } from "lucide-react";
import type { PlaygroundFile } from "@/lib/types/playground";
import { usePlaygroundStore } from "@/lib/stores/use-playground-store";

interface PlaygroundTabsProps {
  onNewFileClick: () => void;
}

export function PlaygroundTabs({ onNewFileClick }: PlaygroundTabsProps) {
  const { files, openTabIds, activeFileId, setActiveFileId, closeTab } = usePlaygroundStore();

  const onSelectTab = (id: string) => setActiveFileId(id);
  const onCloseTab = (id: string) => closeTab(id);
  const openFiles = files.filter((f) => openTabIds.includes(f.id));

  const getFileIcon = (name: string) => {
    if (name.endsWith(".html") || name.endsWith(".htm")) {
      return <FileCode className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-orange-400" />;
    }
    if (name.endsWith(".css") || name.endsWith(".scss")) {
      return <FileSpreadsheet className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-pink-400" />;
    }
    if (name.endsWith(".json")) {
      return <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-400" />;
    }
    if (name.endsWith(".tsx") || name.endsWith(".jsx")) {
      return <FileCode2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-sky-400" />;
    }
    if (name.endsWith(".ts") || name.endsWith(".js")) {
      return <Code2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-400" />;
    }
    return <FileCode2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />;
  };

  return (
    <div className="flex items-center overflow-x-auto border-b border-border/60 bg-muted/20 px-0.5 sm:px-1 text-[11px] sm:text-xs w-full min-w-0 scrollbar-none flex-nowrap">
      <div className="flex items-center gap-0.5 sm:gap-1 flex-nowrap shrink-0">
        {openFiles.map((file) => {
          const isActive = file.id === activeFileId;

          return (
            <div
              key={file.id}
              onClick={() => onSelectTab(file.id)}
              className={`group flex items-center gap-1.5 border-t-2 border-r border-border/40 px-2 py-1 sm:px-3 sm:py-2 text-[11px] sm:text-xs cursor-pointer transition select-none ${
                isActive
                  ? "border-t-primary bg-background text-foreground font-medium"
                  : "border-t-transparent text-muted-foreground hover:bg-card/60 hover:text-foreground"
              }`}
            >
              {getFileIcon(file.name)}
              <span>{file.name}</span>

              {openFiles.length > 1 && (
                <button
                  type="button"
                  className="rounded p-0.5 text-muted-foreground opacity-60 hover:bg-muted hover:text-foreground group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(file.id);
                  }}
                  title="Close tab"
                >
                  <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 sm:h-7 sm:w-7 text-muted-foreground hover:text-foreground ml-0.5 shrink-0"
        onClick={onNewFileClick}
        title="New tab"
      >
        <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
      </Button>
    </div>
  );
}
