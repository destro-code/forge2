import type { CodeExampleActivity } from "@/lib/curriculum/types";
import type { ActivityRendererProps } from "../types";
import { ActivityContainer } from "../primitives/activity-container";
import { ActivityHeader } from "../primitives/activity-header";
import { ActivityActions } from "../primitives/activity-actions";
import { CodeBlock } from "@/components/shared/code-block";
import { Code2, MessageSquare } from "lucide-react";

export function CodeExampleRenderer({
  activity,
  state,
  onContinue,
}: ActivityRendererProps<CodeExampleActivity>) {
  const { title, description, code, language, highlightedLines, annotations } = activity.content;

  return (
    <ActivityContainer id={`activity-${activity.id}`}>
      <ActivityHeader activity={activity} />

      <div className="p-6 md:p-8 flex flex-col gap-6">
        <div className="space-y-2">
          {title && (
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Code2 className="w-5 h-5 text-primary" />
              <span>{title}</span>
            </h2>
          )}
          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          )}
        </div>

        <div className="rounded-lg overflow-hidden border border-border/80 shadow-inner">
          <CodeBlock
            code={code}
            language={language}
            showLineNumbers
            highlightedLines={highlightedLines}
          />
        </div>

        {annotations && annotations.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-primary" />
              <span>Line-by-Line Breakdown</span>
            </h3>
            <div className="grid gap-2">
              {annotations.map((ann, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border/60 text-sm"
                >
                  <span className="px-2 py-0.5 rounded font-mono text-xs bg-muted text-foreground font-semibold shrink-0">
                    Line {ann.line}
                  </span>
                  <span className="text-foreground/90">{ann.comment}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ActivityActions
        status={state.status}
        isInteractive={false}
        onContinue={onContinue}
        continueLabel="Continue"
      />
    </ActivityContainer>
  );
}
