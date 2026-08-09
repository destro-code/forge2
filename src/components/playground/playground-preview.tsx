import { useEffect, useRef, useState } from "react";
import { RefreshCw, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlaygroundStore } from "@/lib/stores/use-playground-store";
import { ErrorBoundary } from "@/components/shared/error-boundary";

interface PlaygroundPreviewProps {
  onLogCaptured: (level: "log" | "info" | "warn" | "error", message: string) => void;
}

export function PlaygroundPreview({ onLogCaptured }: PlaygroundPreviewProps) {
  const { compilerOutput, isBuilding } = usePlaygroundStore();
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
    <div className="flex-1 flex flex-col h-full min-h-[400px] bg-background w-full min-w-0 overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/60 bg-card/60 px-3 py-2 text-xs shrink-0">
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

      <div className="flex-1 relative p-2 bg-card/20 min-h-0 w-full">
        <ErrorBoundary
          title="Playground Live Preview Crash"
          description="The live execution surface encountered an error during rendering."
          onReset={() => setKey((k) => k + 1)}
        >
          <iframe
            key={key}
            ref={iframeRef}
            srcDoc={compilerOutput}
            title="Forge Playground Live Preview"
            sandbox="allow-scripts allow-modals"
            className="h-full w-full rounded-lg border border-border/60 bg-background shadow-inner"
          />
        </ErrorBoundary>
      </div>
    </div>
  );
}
