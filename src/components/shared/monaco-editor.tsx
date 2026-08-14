import { lazy, Suspense } from "react";
import type { EditorProps } from "@monaco-editor/react";
import { initMonaco } from "@/lib/monaco-setup";
import { ErrorBoundary } from "@/components/shared/error-boundary";

const EditorComponent = lazy(async () => {
  await initMonaco();
  const mod = await import("@monaco-editor/react");
  return { default: mod.default || mod.Editor };
});

export function MonacoEditor(props: EditorProps) {
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
