import { lazy, Suspense, useEffect, useState } from "react";
import type { EditorProps } from "@monaco-editor/react";
import { initMonaco } from "@/lib/monaco-setup";
import { ErrorBoundary } from "@/components/shared/error-boundary";

const EditorComponent = lazy(async () => {
  await initMonaco();
  const mod = await import("@monaco-editor/react");
  return { default: mod.default || mod.Editor };
});

export function MonacoEditor(props: EditorProps) {
  const [mounted, setMounted] = useState(false);
  const [initError, setInitError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    initMonaco()
      .then(() => {
        if (active) setMounted(true);
      })
      .catch((err) => {
        if (active) setInitError(err instanceof Error ? err : new Error(String(err)));
      });

    return () => {
      active = false;
    };
  }, []);

  if (initError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-card p-6 text-center text-xs text-destructive">
        <p className="font-semibold">Failed to initialize Monaco Editor</p>
        <p className="text-muted-foreground">{initError.message}</p>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-card p-6">
        <div className="text-xs text-muted-foreground animate-pulse">Loading editor...</div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      title="Monaco Editor Error"
      description="The code editor encountered a runtime initialization error."
    >
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center bg-card p-6">
            <div className="text-xs text-muted-foreground animate-pulse">Loading editor...</div>
          </div>
        }
      >
        <EditorComponent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}
