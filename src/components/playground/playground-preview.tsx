import { useEffect, useRef, useState } from "react";
import { RefreshCw, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlaygroundFile } from "@/lib/types/playground";
import { buildPlaygroundHtml } from "@/lib/playground-compiler";

interface PlaygroundPreviewProps {
  files: PlaygroundFile[];
  onLogCaptured: (level: "log" | "info" | "warn" | "error", message: string) => void;
}

export function PlaygroundPreview({ files, onLogCaptured }: PlaygroundPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [key, setKey] = useState(0);

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
          srcDoc={buildPlaygroundHtml(files, { title: "Forge Playground Live Preview" })}
          title="Forge Playground Live Preview"
          sandbox="allow-scripts allow-modals"
          className="h-full w-full rounded-lg border border-border/60 bg-background shadow-inner"
        />
      </div>
    </div>
  );
}
