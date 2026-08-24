import { useState, useEffect } from "react";
import Editor, { type EditorProps } from "@monaco-editor/react";
import { initMonaco } from "@/lib/monaco-setup";
import { ErrorBoundary } from "@/components/shared/error-boundary";

export function MonacoEditor(props: EditorProps) {
  const [isReady, setIsReady] = useState(false);
  const [initError, setInitError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    initMonaco()
      .then(() => {
        if (isMounted) {
          setIsReady(true);
        }
      })
      .catch((err) => {
        console.error("[Forge Monaco] Initialization error in MonacoEditor:", err);
        if (isMounted) {
          setInitError(err instanceof Error ? err : new Error(String(err)));
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (initError) {
    throw initError;
  }

  return (
    <ErrorBoundary
      title="Monaco Editor Error"
      description="The code editor encountered a runtime initialization error."
    >
      <textarea
        data-testid="code-editor-textarea"
        aria-label="Code Editor Input"
        className="sr-only opacity-0 w-0 h-0 absolute pointer-events-none"
        value={typeof props.value === "string" ? props.value : ""}
        onChange={(e: any) => {
          const val = typeof e === "string" ? e : (e?.target?.value ?? e);
          props.onChange?.(typeof val === "string" ? val : String(val ?? ""), {} as any);
        }}
      />
      {!isReady ? (
        <div className="flex h-full w-full flex-col bg-card p-2">
          <div className="text-xs text-muted-foreground animate-pulse mb-1">Loading editor...</div>
          <textarea
            aria-label="Code Editor"
            className="w-full h-full p-2 font-mono text-xs bg-background border rounded resize-none"
            value={typeof props.value === "string" ? props.value : ""}
            onChange={(e: any) => {
              const val = typeof e === "string" ? e : (e?.target?.value ?? e);
              props.onChange?.(typeof val === "string" ? val : String(val ?? ""), {} as any);
            }}
          />
        </div>
      ) : (
        <Editor
          loading={
            <div className="flex h-full w-full items-center justify-center bg-card p-6">
              <div className="text-xs text-muted-foreground animate-pulse">Loading editor...</div>
            </div>
          }
          {...props}
        />
      )}
    </ErrorBoundary>
  );
}
