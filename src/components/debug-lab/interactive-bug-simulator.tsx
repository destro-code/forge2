import { useState } from "react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackConsole,
  useSandpack,
} from "@codesandbox/sandpack-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { forgeSandpackTheme } from "@/components/playground/playground-editor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Code2,
  Play,
  Terminal,
} from "lucide-react";
import { toast } from "sonner";

export interface InteractiveBugSimulatorProps {
  brokenCode: string;
  fixedCode: string;
  bugTitle?: string;
  bugId?: string;
  interactiveType?: string;
  isFixed?: boolean;
  onVerifySuccess?: () => void;
}

export function prepareSandpackFiles(rawCode: string, bugId?: string) {
  let appCode = rawCode;
  const files: Record<string, { code: string }> = {};

  if (bugId === "layout-shift" || rawCode.includes(".hero-container")) {
    files["/styles.css"] = { code: rawCode };
    files["/App.tsx"] = {
      code: `import React, { useState } from 'react';
import './styles.css';

export default function App() {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="p-4 bg-slate-900 text-slate-100 min-h-screen space-y-4 font-sans">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hero Layout Test</h3>
        <button
          onClick={() => setImageLoaded(!imageLoaded)}
          className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-medium transition"
        >
          {imageLoaded ? "Reset / Unload Image" : "Simulate Image Load"}
        </button>
      </div>

      <div className="p-3 border border-slate-800 rounded-lg bg-slate-950 space-y-3">
        <div className="hero-container bg-slate-800/50">
          {imageLoaded ? (
            <div className="hero-image bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
              Loaded Banner Image (16:9 Aspect)
            </div>
          ) : (
            <div className="p-4 text-xs text-slate-500 text-center italic">Image loading over network...</div>
          )}
        </div>

        <div className="p-3 bg-slate-900 rounded border border-slate-800 space-y-2">
          <h4 className="font-semibold text-xs text-slate-200">Call to Action Button</h4>
          <p className="text-[11px] text-slate-400">
            If dimensions aren't reserved, this box jumps down abruptly when image loads!
          </p>
          <button className="w-full py-1.5 bg-blue-600 text-white rounded text-xs font-medium">Click Me</button>
        </div>
      </div>
    </div>
  );}`,
    };
    return files;
  }

  if (bugId === "a11y-missing-aria" || rawCode.includes("<button className=")) {
    files["/App.tsx"] = {
      code: `import React from 'react';

function TrashIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
    </svg>
  );
}

export default function App() {
  return (
    <div className="p-6 bg-slate-900 text-slate-100 min-h-screen flex flex-col items-center justify-center gap-4 font-sans">
      <div className="p-4 border border-slate-800 rounded-xl bg-slate-950 space-y-3 max-w-sm w-full">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">A11y Button Inspector</h3>
        <div className="flex items-center justify-between p-3 bg-slate-900 rounded border border-slate-800">
          <span className="text-xs text-slate-300">Product Item #101</span>
          ${rawCode}
        </div>
      </div>
    </div>
  );}`,
    };
    return files;
  }

  if (appCode.includes("export function ProductList")) {
    appCode += `\n\nfunction ProductCard({ item, onSelect, style }: any) {
  return (
    <div style={style} className="p-2 border border-slate-800 rounded my-1 flex justify-between items-center text-xs bg-slate-950">
      <span>{item.name}</span>
      <button onClick={() => onSelect?.(item.id)} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200">Select</button>
    </div>
  );
}

const MOCK_ITEMS = [
  { id: '1', name: 'MacBook Pro 16' },
  { id: '2', name: 'Logitech MX Master 3S' },
  { id: '3', name: 'Dell UltraSharp 27' },
];

export default function App() {
  return (
    <div className="p-4 bg-slate-900 text-slate-100 min-h-screen font-sans">
      <ProductList items={MOCK_ITEMS} />
    </div>
  );
}`;
  } else {
    const fnMatch = appCode.match(/export function (\w+)/);
    if (fnMatch && !appCode.includes("export default")) {
      const fnName = fnMatch[1];
      appCode += `\n\nexport default ${fnName};`;
    }
  }

  files["/App.tsx"] = { code: appCode };
  return files;
}

interface SandpackToolbarProps {
  brokenCode: string;
  fixedCode: string;
  bugId?: string;
  onVerifyResult: (success: boolean, msg: string) => void;
  onResetCode: () => void;
  onLoadSolutionCode: () => void;
}

function SandpackToolbar({
  brokenCode,
  fixedCode,
  bugId,
  onVerifyResult,
  onResetCode,
  onLoadSolutionCode,
}: SandpackToolbarProps) {
  const { sandpack } = useSandpack();

  const handleVerify = () => {
    const activeFile = sandpack.activeFile;
    const currentCode = sandpack.files[activeFile]?.code || "";

    const normalize = (str: string) =>
      str
        .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "")
        .replace(/\s+/g, "")
        .toLowerCase();

    const normCurrent = normalize(currentCode);
    const normFixed = normalize(fixedCode);
    const normBroken = normalize(brokenCode);

    if (normCurrent === normBroken) {
      onVerifyResult(false, "Code is still in its original broken state. Apply a fix!");
      return;
    }

    const isExact = normCurrent === normFixed;
    let passesPattern = false;

    if (
      bugId === "stale-closure" &&
      (currentCode.includes("prevCount =>") || currentCode.includes("prev =>"))
    ) {
      passesPattern = true;
    } else if (
      bugId === "layout-shift" &&
      (currentCode.includes("aspect-ratio") ||
        currentCode.includes("16 / 9") ||
        currentCode.includes("16/9"))
    ) {
      passesPattern = true;
    } else if (bugId === "memory-leak-listener" && currentCode.includes("removeEventListener")) {
      passesPattern = true;
    } else if (
      bugId === "network-race-condition" &&
      (currentCode.includes("AbortController") || currentCode.includes("signal"))
    ) {
      passesPattern = true;
    } else if (
      bugId === "a11y-missing-aria" &&
      (currentCode.includes("aria-label") || currentCode.includes("sr-only"))
    ) {
      passesPattern = true;
    } else if (
      bugId === "excessive-re-renders" &&
      (currentCode.includes("useCallback") || currentCode.includes("useMemo"))
    ) {
      passesPattern = true;
    } else if (
      bugId === "cannot-read-property-map" &&
      (currentCode.includes("useState<") ||
        currentCode.includes("?? []") ||
        currentCode.includes("data?."))
    ) {
      passesPattern = true;
    } else if (
      bugId === "infinite-useeffect-loop" &&
      (currentCode.includes("setInterval") || currentCode.includes("[]"))
    ) {
      passesPattern = true;
    }

    if (isExact || passesPattern) {
      onVerifyResult(true, "Fix Verified! Solution addresses the bug.");
    } else {
      onVerifyResult(
        false,
        "Code changed, but key fix patterns (e.g. cleanup function, memoization, AbortController) were not detected.",
      );
    }
  };

  const handleReset = () => {
    const fresh = prepareSandpackFiles(brokenCode, bugId);
    Object.entries(fresh).forEach(([path, content]) => {
      sandpack.updateFile(path, content.code);
    });
    onResetCode();
  };

  const handleSolution = () => {
    const sol = prepareSandpackFiles(fixedCode, bugId);
    Object.entries(sol).forEach(([path, content]) => {
      sandpack.updateFile(path, content.code);
    });
    onLoadSolutionCode();
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-900 border-t border-slate-800 text-xs">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={handleVerify}
          className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs h-8 shadow-sm"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Verify Fix
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleReset}
          className="gap-1.5 text-xs h-8 border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset Code
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSolution}
          className="gap-1.5 text-xs h-8 text-cyan-400 hover:text-cyan-300 hover:bg-slate-800"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Load Reference Solution
        </Button>
      </div>
    </div>
  );
}

export function InteractiveBugSimulator({
  brokenCode,
  fixedCode,
  bugTitle,
  bugId,
  isFixed,
  onVerifySuccess,
}: InteractiveBugSimulatorProps) {
  const activeSourceCode = isFixed ? fixedCode : brokenCode;
  const initialFiles = prepareSandpackFiles(activeSourceCode, bugId);

  const [verifiedStatus, setVerifiedStatus] = useState<{
    verified: boolean;
    message: string;
  } | null>(null);

  const handleVerifyResult = (success: boolean, msg: string) => {
    setVerifiedStatus({ verified: success, message: msg });
    if (success) {
      toast.success(msg);
      onVerifySuccess?.();
    } else {
      toast.error(msg);
    }
  };

  return (
    <Card className="border-border/60 bg-[#0f172a] overflow-hidden shadow-elegant">
      <CardHeader className="bg-slate-900 border-b border-slate-800 py-3 px-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-cyan-400 animate-pulse" />
          <CardTitle className="text-sm font-medium text-slate-100">
            {bugTitle ? `Sandpack Debugger: ${bugTitle}` : "Sandpack Live Bug Diagnostic Sandbox"}
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
          {verifiedStatus?.verified && (
            <Badge className="bg-emerald-600 text-white gap-1 py-0.5 text-[11px]">
              <ShieldCheck className="h-3 w-3" /> Verified
            </Badge>
          )}
          <Badge variant={isFixed ? "default" : "destructive"} className="text-xs">
            {isFixed ? "Fixed Code Loaded" : "Broken Code Active"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <SandpackProvider
          template="react-ts"
          theme={forgeSandpackTheme}
          files={initialFiles}
          options={{
            recompileMode: "immediate",
            recompileDelay: 300,
          }}
        >
          {/* Mobile Viewports (<768px / md): Radix UI Tabs */}
          <div className="md:hidden p-2 bg-[#0f172a]">
            <Tabs defaultValue="editor" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-slate-900 border border-slate-800 p-1 rounded-lg">
                <TabsTrigger
                  value="editor"
                  className="gap-1 text-xs font-semibold text-slate-400 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 data-[state=active]:border data-[state=active]:border-cyan-500/40 data-[state=active]:shadow-sm cursor-pointer"
                >
                  <Code2 className="h-3.5 w-3.5 text-cyan-400" />
                  Editor
                </TabsTrigger>
                <TabsTrigger
                  value="preview"
                  className="gap-1 text-xs font-semibold text-slate-400 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 data-[state=active]:border data-[state=active]:border-cyan-500/40 data-[state=active]:shadow-sm cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5 text-emerald-400" />
                  Preview
                </TabsTrigger>
                <TabsTrigger
                  value="console"
                  className="gap-1 text-xs font-semibold text-slate-400 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 data-[state=active]:border data-[state=active]:border-cyan-500/40 data-[state=active]:shadow-sm cursor-pointer"
                >
                  <Terminal className="h-3.5 w-3.5 text-purple-400" />
                  Console / Tests
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="editor"
                forceMount
                className="mt-2 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 min-h-[380px] data-[state=inactive]:hidden"
              >
                <SandpackCodeEditor
                  showLineNumbers
                  showInlineErrors
                  showTabs
                  closableTabs={false}
                  showRunButton={false}
                  style={{ height: "400px" }}
                />
              </TabsContent>

              <TabsContent
                value="preview"
                forceMount
                className="mt-2 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 min-h-[380px] data-[state=inactive]:hidden"
              >
                <SandpackPreview
                  showNavigator={false}
                  showOpenInCodeSandbox={false}
                  showRefreshButton
                  style={{ height: "400px" }}
                />
              </TabsContent>

              <TabsContent
                value="console"
                forceMount
                className="mt-2 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 min-h-[380px] data-[state=inactive]:hidden"
              >
                <SandpackConsole style={{ height: "400px" }} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Desktop Viewports (>=768px / md): Multi-Panel Split View */}
          <div className="hidden md:block">
            <SandpackLayout className="!grid !grid-cols-1 lg:!grid-cols-2 !gap-0 !rounded-none !border-none !bg-[#0f172a] !overflow-hidden min-h-[480px]">
              <SandpackCodeEditor
                showLineNumbers
                showInlineErrors
                showTabs
                closableTabs={false}
                showRunButton={false}
                style={{ height: "100%", minHeight: "400px" }}
              />
              <SandpackPreview
                showNavigator={false}
                showOpenInCodeSandbox={false}
                showRefreshButton
                style={{ height: "100%", minHeight: "400px" }}
              />
            </SandpackLayout>
          </div>

          <SandpackToolbar
            brokenCode={brokenCode}
            fixedCode={fixedCode}
            bugId={bugId}
            onVerifyResult={handleVerifyResult}
            onResetCode={() => {
              setVerifiedStatus(null);
              toast.info("Reset code to initial bug state.");
            }}
            onLoadSolutionCode={() => {
              setVerifiedStatus({ verified: true, message: "Loaded reference solution." });
              toast.success("Loaded reference solution code!");
            }}
          />
        </SandpackProvider>

        {verifiedStatus && (
          <div
            className={`p-3 text-xs font-mono border-t ${
              verifiedStatus.verified
                ? "bg-emerald-950/80 border-emerald-800 text-emerald-300 flex items-center gap-2"
                : "bg-rose-950/80 border-rose-800 text-rose-300 flex items-center gap-2"
            }`}
          >
            {verifiedStatus.verified ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            )}
            <span>{verifiedStatus.message}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
