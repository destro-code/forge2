import { useEffect, useRef, useState } from "react";
import { RefreshCw, Monitor, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlaygroundFile } from "@/lib/types/playground";

interface PlaygroundPreviewProps {
  files: PlaygroundFile[];
  onLogCaptured: (level: "log" | "info" | "warn" | "error", message: string) => void;
}

export function PlaygroundPreview({ files, onLogCaptured }: PlaygroundPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [key, setKey] = useState(0);

  const mainFile = files.find((f) => f.name === "App.tsx") || files[0];
  const cssFile = files.find((f) => f.name === "styles.css");

  // Construct iframe html content with React 18, Babel standalone, and console proxy
  const buildSrcDoc = () => {
    const rawCode = mainFile ? mainFile.code : "// No code";
    const cssCode = cssFile ? cssFile.code : "";

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Forge Playground Preview</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    ${cssCode}
    body { margin: 0; padding: 16px; font-family: system-ui, -apple-system, sans-serif; background: #0d0e12; color: #f8fafc; }
    #error-overlay { display: none; padding: 12px; background: #451a1a; color: #fca5a5; border-radius: 8px; font-family: monospace; font-size: 12px; margin-bottom: 12px; border: 1px solid #f87171; white-space: pre-wrap; }
  </style>
</head>
<body>
  <div id="error-overlay"></div>
  <div id="root"></div>

  <script>
    // Console proxy to parent window
    const origLog = console.log;
    const origWarn = console.warn;
    const origError = console.error;
    const origInfo = console.info;

    function formatArgs(args) {
      return args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
    }

    console.log = function(...args) {
      origLog.apply(console, args);
      window.parent.postMessage({ type: 'PLAYGROUND_CONSOLE', level: 'log', message: formatArgs(args) }, '*');
    };
    console.info = function(...args) {
      origInfo.apply(console, args);
      window.parent.postMessage({ type: 'PLAYGROUND_CONSOLE', level: 'info', message: formatArgs(args) }, '*');
    };
    console.warn = function(...args) {
      origWarn.apply(console, args);
      window.parent.postMessage({ type: 'PLAYGROUND_CONSOLE', level: 'warn', message: formatArgs(args) }, '*');
    };
    console.error = function(...args) {
      origError.apply(console, args);
      window.parent.postMessage({ type: 'PLAYGROUND_CONSOLE', level: 'error', message: formatArgs(args) }, '*');
    };

    window.onerror = function(msg, url, line) {
      const err = "Runtime Error: " + msg + " (line " + line + ")";
      document.getElementById('error-overlay').style.display = 'block';
      document.getElementById('error-overlay').textContent = err;
      window.parent.postMessage({ type: 'PLAYGROUND_CONSOLE', level: 'error', message: err }, '*');
    };
  </script>

  <script type="text/babel">
    try {
      ${rawCode}

      const container = document.getElementById('root');
      if (typeof Counter !== 'undefined') {
        ReactDOM.createRoot(container).render(<Counter />);
      } else if (typeof SearchApp !== 'undefined') {
        ReactDOM.createRoot(container).render(<SearchApp />);
      } else if (typeof UserFetcher !== 'undefined') {
        ReactDOM.createRoot(container).render(<UserFetcher />);
      } else if (typeof App !== 'undefined') {
        ReactDOM.createRoot(container).render(<App />);
      } else {
        // Find default export component
        const Component = typeof defaultExport !== 'undefined' ? defaultExport : () => <div style={{padding: 20}}>Running code snippet...</div>;
        ReactDOM.createRoot(container).render(<Component />);
      }
    } catch (err) {
      document.getElementById('error-overlay').style.display = 'block';
      document.getElementById('error-overlay').textContent = "Compilation Error: " + err.message;
      window.parent.postMessage({ type: 'PLAYGROUND_CONSOLE', level: 'error', message: "Compilation Error: " + err.message }, '*');
    }
  </script>
</body>
</html>`;
  };

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
          srcDoc={buildSrcDoc()}
          title="Forge Playground Live Preview"
          sandbox="allow-scripts allow-modals"
          className="h-full w-full rounded-lg border border-border/60 bg-background shadow-inner"
        />
      </div>
    </div>
  );
}
