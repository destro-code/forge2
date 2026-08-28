import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { FileCode2, Paintbrush, Zap, Eye } from "lucide-react";

export type LayerSlot = "html" | "css" | "js";

export interface StackLayer {
  slot: LayerSlot;
  label: string;
  role: string;
  code: string;
}

export interface LayerStackData {
  layers: StackLayer[];
  /** Optional caption shown under the live preview. */
  previewLabel?: string;
}

const SLOT_META: Record<
  LayerSlot,
  { icon: typeof FileCode2; hue: string; lang: string }
> = {
  html: { icon: FileCode2, hue: "24 80% 58%", lang: "html" },
  css: { icon: Paintbrush, hue: "205 75% 58%", lang: "css" },
  js: { icon: Zap, hue: "45 85% 58%", lang: "js" },
};

/**
 * LayerStack — the signature "see the system work" visual.
 *
 * The three files a browser assembles into a page (HTML, CSS, JavaScript) are
 * made tangible: toggle each layer and watch the *same* page rebuild live in
 * the preview frame. Structure alone looks raw; add CSS and it takes shape;
 * add JS and it responds. Understanding by manipulation, not by paragraph.
 */
export function LayerStack({ config }: { config: LayerStackData }) {
  const layers = config.layers;
  const [enabled, setEnabled] = useState<Record<LayerSlot, boolean>>({
    html: true,
    css: false,
    js: false,
  });
  const [activeTab, setActiveTab] = useState<LayerSlot>(layers[0]?.slot ?? "html");

  const bySlot = useMemo(() => {
    const map = {} as Record<LayerSlot, StackLayer | undefined>;
    layers.forEach((l) => (map[l.slot] = l));
    return map;
  }, [layers]);

  const srcDoc = useMemo(() => {
    const html = enabled.html ? bySlot.html?.code ?? "" : "";
    const css = enabled.css ? bySlot.css?.code ?? "" : "";
    const js = enabled.js ? bySlot.js?.code ?? "" : "";
    return `<!doctype html><html><head><meta charset="utf-8"/><style>
      *{box-sizing:border-box}
      body{margin:0;padding:20px;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;color:#111;background:#fff}
      ${css}
    </style></head><body>${html}${
      js ? `<script>try{${js}}catch(e){console.warn(e)}<\/script>` : ""
    }</body></html>`;
  }, [enabled, bySlot]);

  const activeLayer = bySlot[activeTab];
  const activeEnabled = enabled[activeTab];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
      {/* Left: layer controls + code */}
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-2">
          {(["html", "css", "js"] as LayerSlot[]).map((slot) => {
            const layer = bySlot[slot];
            if (!layer) return null;
            const meta = SLOT_META[slot];
            const Icon = meta.icon;
            const on = enabled[slot];
            return (
              <button
                key={slot}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  setEnabled((e) => ({ ...e, [slot]: !e[slot] }));
                  setActiveTab(slot);
                }}
                style={{ "--h": meta.hue } as React.CSSProperties}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all",
                  on
                    ? "border-[hsl(var(--h)/0.55)] bg-[hsl(var(--h)/0.10)] shadow-[0_0_18px_hsl(var(--h)/0.18)]"
                    : "border-lesson-border bg-lesson-surface-subtle opacity-60 hover:opacity-100",
                )}
              >
                <span className="flex items-center gap-1.5">
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      on ? "text-[hsl(var(--h))]" : "text-lesson-text-muted",
                    )}
                  />
                  <span
                    className={cn(
                      "text-xs font-bold tracking-tight",
                      on ? "text-lesson-text-primary" : "text-lesson-text-muted",
                    )}
                  >
                    {layer.label}
                  </span>
                </span>
                <span className="text-[10px] leading-tight text-lesson-text-muted">
                  {layer.role}
                </span>
                <span
                  className={cn(
                    "mt-1 text-[9px] font-bold uppercase tracking-widest",
                    on ? "text-[hsl(var(--h))]" : "text-lesson-text-muted/60",
                  )}
                >
                  {on ? "On" : "Off"}
                </span>
              </button>
            );
          })}
        </div>

        {/* Code viewer for the active layer */}
        <div className="overflow-hidden rounded-xl border border-lesson-border bg-zinc-950">
          <div className="flex items-center gap-1 border-b border-white/5 px-2 py-1.5">
            {(["html", "css", "js"] as LayerSlot[]).map((slot) => {
              const layer = bySlot[slot];
              if (!layer) return null;
              const meta = SLOT_META[slot];
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setActiveTab(slot)}
                  style={{ "--h": meta.hue } as React.CSSProperties}
                  className={cn(
                    "rounded-md px-2.5 py-1 font-mono text-[11px] font-semibold transition-colors",
                    activeTab === slot
                      ? "bg-white/8 text-[hsl(var(--h))]"
                      : "text-zinc-500 hover:text-zinc-300",
                  )}
                >
                  {layer.label.toLowerCase()}
                  {!enabled[slot] && <span className="ml-1 text-zinc-600">·off</span>}
                </button>
              );
            })}
          </div>
          <pre
            className={cn(
              "max-h-[220px] overflow-auto p-3.5 font-mono text-[12px] leading-relaxed transition-opacity",
              activeEnabled ? "text-zinc-200" : "text-zinc-500 opacity-50",
            )}
          >
            <code>{activeLayer?.code ?? ""}</code>
          </pre>
        </div>
      </div>

      {/* Right: live browser preview */}
      <div className="flex flex-col gap-2">
        <div className="overflow-hidden rounded-xl border border-lesson-border bg-white shadow-lg">
          <div className="flex items-center gap-1.5 border-b border-black/10 bg-zinc-100 px-3 py-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="ml-2 flex items-center gap-1 rounded-md bg-white px-2 py-0.5 font-mono text-[10px] text-zinc-500">
              <Eye className="h-3 w-3" /> live preview
            </span>
          </div>
          <iframe
            title="Live layer preview"
            srcDoc={srcDoc}
            sandbox="allow-scripts"
            className="h-[260px] w-full bg-white"
          />
        </div>
        <p className="px-1 text-center text-xs text-lesson-text-muted">
          {enabled.html && enabled.css && enabled.js
            ? "All three layers working together — a real page."
            : enabled.html && !enabled.css
              ? "Structure only. HTML gives meaning, not looks."
              : config.previewLabel ?? "Toggle layers to see each file's job."}
        </p>
      </div>
    </div>
  );
}
