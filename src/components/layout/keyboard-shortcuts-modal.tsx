import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Keyboard, Command, Sparkles, MoveRight } from "lucide-react";

export function KeyboardShortcutsModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle with '?' key (Shift + /) when not inside input or textarea
      if (
        e.key === "?" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName) &&
        !(e.target as HTMLElement)?.isContentEditable
      ) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const shortcuts = [
    { key: "⌘ K / Ctrl K", description: "Open Global Command Palette & Quick Search" },
    { key: "⌘ B / Ctrl B", description: "Toggle Academy Navigation Sidebar" },
    { key: "?", description: "Open Keyboard Shortcuts Help Dialog" },
    { key: "Esc", description: "Close Modals, Drawers & Active Overlays" },
    {
      key: "Tab / Shift+Tab",
      description: "Navigate interactive controls with visible focus ring",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md bg-card border-border/80 p-6">
        <DialogHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center">
              <Keyboard className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                Keyboard Shortcuts
                <Badge variant="secondary" className="text-[10px] font-mono">
                  WCAG AA
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Quick navigation & accessibility commands across Forge Academy.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-3">
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-lg border border-border/50 bg-muted/20 text-xs"
            >
              <span className="text-foreground font-medium">{s.description}</span>
              <kbd className="inline-flex items-center gap-1 rounded border border-border/80 bg-background px-2 py-1 text-[11px] font-mono font-semibold text-primary shadow-xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-primary" /> Press{" "}
            <kbd className="font-mono text-primary font-bold">?</kbd> anytime to toggle
          </span>
          <span>Sprint 19 Polish</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
