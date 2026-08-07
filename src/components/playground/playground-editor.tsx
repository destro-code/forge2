import { useEffect, useMemo, useRef } from "react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  useSandpack,
  useSandpackConsole,
  type SandpackTheme,
} from "@codesandbox/sandpack-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Code2, Play, Terminal } from "lucide-react";
import type { PlaygroundFile } from "@/lib/types/playground";
import { PlaygroundConsole } from "./playground-console";

export const forgeSandpackTheme: SandpackTheme = {
  colors: {
    surface1: "#0f172a", // Slate-900 editor background
    surface2: "#1e293b", // Slate-800 tabs and header
    surface3: "#334155", // Slate-700 active item/hover
    disabled: "#64748b",
    base: "#f8fafc", // High-contrast slate-50 text
    clickable: "#94a3b8",
    hover: "#38bdf8", // Neon sky blue
    accent: "#06b6d4", // Neon cyan accent
    error: "#f43f5e", // Neon rose
    errorSurface: "#881337",
  },
  syntax: {
    plain: "#f8fafc",
    comment: { color: "#64748b", fontStyle: "italic" },
    keyword: { color: "#38bdf8", fontWeight: "bold" }, // Neon sky blue
    tag: { color: "#22d3ee" }, // Neon cyan
    punctuation: { color: "#cbd5e1" },
    definition: { color: "#a855f7" }, // Neon purple
    property: { color: "#38bdf8" },
    static: { color: "#f43f5e" }, // Neon rose
    string: { color: "#4ade80" }, // Neon emerald green
  },
  font: {
    body: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    mono: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    size: "13px",
    lineHeight: "1.6",
  },
};

interface SandpackSyncProps {
  onCodeChange?: (fileName: string, newCode: string) => void;
}

function SandpackSync({ onCodeChange }: SandpackSyncProps) {
  const { sandpack } = useSandpack();
  const activeFile = sandpack.activeFile;
  const currentCode = sandpack.files[activeFile]?.code;
  const lastSyncedCodeRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (onCodeChange && activeFile && currentCode !== undefined) {
      if (lastSyncedCodeRef.current[activeFile] !== currentCode) {
        lastSyncedCodeRef.current[activeFile] = currentCode;
        const cleanName = activeFile.startsWith("/") ? activeFile.slice(1) : activeFile;
        onCodeChange(cleanName, currentCode);
      }
    }
  }, [activeFile, currentCode, onCodeChange]);

  return null;
}

function CustomSandpackConsole({ height = "480px" }: { height?: string }) {
  const { logs: rawLogs, reset } = useSandpackConsole();

  // Map and filter logs to match PlaygroundConsole requirements
  const logs = (rawLogs || [])
    .filter((log) => {
      const dataArray = Array.isArray(log.data) ? log.data : [];
      const message = dataArray
        .map((arg) => {
          if (typeof arg === "string") return arg;
          try {
            return typeof arg === "object" ? JSON.stringify(arg) : String(arg);
          } catch {
            return String(arg);
          }
        })
        .join(" ");

      // Explicitly filter out and ignore any error messages containing "Canceled" or "ERR Canceled"
      const isCancellationError =
        log.method === "error" &&
        (message.includes("Canceled") || message.includes("ERR Canceled"));

      return !isCancellationError;
    })
    .map((log) => {
      const dataArray = Array.isArray(log.data) ? log.data : [];
      const message = dataArray
        .map((arg) => {
          if (typeof arg === "string") return arg;
          try {
            return typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg);
          } catch {
            return String(arg);
          }
        })
        .join(" ");

      let level: "log" | "info" | "warn" | "error" = "log";
      if (log.method === "warn") level = "warn";
      else if (log.method === "error") level = "error";
      else if (log.method === "info") level = "info";

      return {
        id: log.id,
        level,
        message,
        timestamp: new Date().toLocaleTimeString(),
      };
    });

  return (
    <div style={{ height }} className="w-full h-full overflow-hidden">
      <PlaygroundConsole logs={logs} onClearConsole={reset} />
    </div>
  );
}

export interface PlaygroundEditorProps {
  files: PlaygroundFile[];
  activeFileId?: string;
  onCodeChange?: (fileName: string, newCode: string) => void;
}

export function PlaygroundEditor({ files, activeFileId, onCodeChange }: PlaygroundEditorProps) {
  const sandpackFiles = useMemo(() => {
    return files.reduce<Record<string, { code: string }>>((acc, file) => {
      const filePath = file.name.startsWith("/") ? file.name : `/${file.name}`;
      acc[filePath] = { code: file.code };
      return acc;
    }, {});
  }, [files]);

  const activeFileObj = files.find((f) => f.id === activeFileId) || files[0];
  const activeFileName = activeFileObj
    ? activeFileObj.name.startsWith("/")
      ? activeFileObj.name
      : `/${activeFileObj.name}`
    : "/App.tsx";

  return (
    <div className="w-full max-w-full overflow-hidden rounded-xl border border-border/60 shadow-elegant bg-[#0f172a]">
      <style>{`
        @media (max-width: 767px) {
          .sp-wrapper,
          .sp-layout,
          .sp-stack,
          .sp-code-editor,
          .sp-cm,
          .cm-editor,
          .cm-content,
          .cm-line,
          .cm-gutters,
          .cm-gutterElement {
            font-size: 12px !important;
            font-size: 0.75rem !important;
            line-height: 1.4 !important;
          }

          .sp-header,
          .sp-tabs,
          .sp-tab-button,
          .sp-button {
            padding: 0.25rem 0.5rem !important;
            font-size: 0.75rem !important;
            min-height: auto !important;
          }
        }

        .sp-wrapper,
        .sp-layout,
        .sp-code-editor,
        .sp-cm,
        .cm-editor,
        .cm-scroller {
          max-width: 100% !important;
          overflow-x: auto !important;
          box-sizing: border-box !important;
        }
      `}</style>
      <SandpackProvider
        template="react-ts"
        theme={forgeSandpackTheme}
        files={sandpackFiles}
        options={{
          activeFile: activeFileName,
          recompileMode: "immediate",
          recompileDelay: 300,
        }}
      >
        <SandpackSync onCodeChange={onCodeChange} />

        {/* Mobile Viewports (<768px / md): Radix UI Tabs */}
        <div className="md:hidden w-full max-w-full overflow-hidden p-2 bg-[#0f172a]">
          <Tabs defaultValue="editor" className="w-full max-w-full overflow-hidden">
            <TabsList className="grid w-full grid-cols-3 bg-slate-900 border border-slate-800 p-1 rounded-lg">
              <TabsTrigger
                value="editor"
                className="gap-1.5 py-1 px-2 text-xs font-semibold text-slate-400 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 data-[state=active]:border data-[state=active]:border-cyan-500/40 data-[state=active]:shadow-sm cursor-pointer"
              >
                <Code2 className="h-3.5 w-3.5 text-cyan-400" />
                Editor
              </TabsTrigger>
              <TabsTrigger
                value="preview"
                className="gap-1.5 py-1 px-2 text-xs font-semibold text-slate-400 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 data-[state=active]:border data-[state=active]:border-cyan-500/40 data-[state=active]:shadow-sm cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 text-emerald-400" />
                Preview
              </TabsTrigger>
              <TabsTrigger
                value="console"
                className="gap-1.5 py-1 px-2 text-xs font-semibold text-slate-400 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 data-[state=active]:border data-[state=active]:border-cyan-500/40 data-[state=active]:shadow-sm cursor-pointer"
              >
                <Terminal className="h-3.5 w-3.5 text-purple-400" />
                Console / Tests
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="editor"
              className="mt-2 min-h-[420px] w-full max-w-full overflow-hidden rounded-lg border border-slate-800 bg-slate-950"
            >
              <SandpackCodeEditor
                showLineNumbers
                showInlineErrors
                showTabs
                closableTabs={false}
                showRunButton={false}
                style={{ height: "480px" }}
              />
            </TabsContent>

            <TabsContent
              value="preview"
              className="mt-2 min-h-[420px] w-full max-w-full overflow-hidden rounded-lg border border-slate-800 bg-slate-950"
            >
              <SandpackPreview
                showNavigator={false}
                showOpenInCodeSandbox={false}
                showRefreshButton
                style={{ height: "480px" }}
              />
            </TabsContent>

            <TabsContent
              value="console"
              className="mt-2 min-h-[420px] w-full max-w-full overflow-hidden rounded-lg border border-slate-800 bg-slate-950"
            >
              <CustomSandpackConsole height="480px" />
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop Viewports (>=768px / md): Side-by-Side Split Panel */}
        <div className="hidden md:block w-full max-w-full overflow-hidden">
          <SandpackLayout className="!grid !grid-cols-2 !gap-0 !rounded-xl !border-none !bg-[#0f172a] !overflow-hidden h-[680px]">
            <SandpackCodeEditor
              showLineNumbers
              showInlineErrors
              showTabs
              closableTabs={false}
              showRunButton={false}
              style={{ height: "100%", minHeight: "420px" }}
            />
            <div className="flex flex-col h-full border-l border-slate-800">
              <div className="flex-1 overflow-hidden min-h-[340px]">
                <SandpackPreview
                  showNavigator={false}
                  showOpenInCodeSandbox={false}
                  showRefreshButton
                  style={{ height: "100%" }}
                />
              </div>
              <div className="h-[280px] border-t border-slate-800 overflow-hidden bg-slate-950">
                <CustomSandpackConsole height="100%" />
              </div>
            </div>
          </SandpackLayout>
        </div>
      </SandpackProvider>
    </div>
  );
}
