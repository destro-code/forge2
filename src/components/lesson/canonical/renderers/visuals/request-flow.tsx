import { useState } from "react";
import { cn } from "@/lib/utils";
import { Monitor, Server, ArrowRight, RotateCcw, Play } from "lucide-react";
import { motion } from "framer-motion";

export type FlowSide = "client" | "network" | "server";

export interface FlowStep {
  label: string;
  detail: string;
  side: FlowSide;
}

export interface RequestFlowData {
  steps: FlowStep[];
}

/**
 * RequestFlow — step a request through the client/network/server boundary.
 *
 * Abstract "how the web works" prose becomes a controllable journey: the
 * learner advances a packet along the path and watches which side of the
 * boundary is doing the work at each stage. Prediction-friendly: they can
 * guess what happens next before revealing it.
 */
export function RequestFlow({ config }: { config: RequestFlowData }) {
  const steps = config.steps;
  const [step, setStep] = useState(0);
  const current = steps[step];
  const atEnd = step === steps.length - 1;

  const sideActive = (side: FlowSide) => current?.side === side;

  return (
    <div className="flex flex-col gap-5">
      {/* The boundary diagram */}
      <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl border border-lesson-border bg-lesson-surface-subtle p-5">
        <Endpoint
          icon={Monitor}
          title="Client"
          subtitle="The browser"
          active={sideActive("client")}
        />

        <div className="flex flex-col items-center gap-2">
          <div className="relative h-0.5 w-16 overflow-visible rounded bg-lesson-border sm:w-24">
            <motion.span
              key={step}
              className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-[var(--m-accent)] shadow-[0_0_10px_var(--m-accent)]"
              initial={{ left: current?.side === "server" ? "0%" : "100%", opacity: 0 }}
              animate={{
                left: sideActive("client") ? "0%" : sideActive("server") ? "100%" : "50%",
                opacity: sideActive("network") ? 1 : 0.4,
              }}
              transition={{ type: "spring", stiffness: 180, damping: 22 }}
            />
          </div>
          <span
            className={cn(
              "font-mono text-[9px] uppercase tracking-widest transition-colors",
              sideActive("network") ? "text-[var(--m-accent)]" : "text-lesson-text-muted/50",
            )}
          >
            network
          </span>
        </div>

        <Endpoint
          icon={Server}
          title="Server"
          subtitle="Remote backend"
          active={sideActive("server")}
        />
      </div>

      {/* Current step detail */}
      <div className="rounded-2xl border border-[var(--m-accent-line)] bg-[var(--m-accent-soft)] p-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--m-accent)]">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--m-accent)] font-mono text-[10px] text-lesson-bg">
            {step + 1}
          </span>
          <span>{current?.label}</span>
        </div>
        <p className="mt-2 text-sm leading-6 text-lesson-text-secondary">{current?.detail}</p>
      </div>

      {/* Step ticks + control */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5">
          {steps.map((s, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Step ${i + 1}: ${s.label}`}
              onClick={() => setStep(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === step
                  ? "w-6 bg-[var(--m-accent)]"
                  : i < step
                    ? "w-1.5 bg-[var(--m-accent-line)]"
                    : "w-1.5 bg-lesson-surface-subtle",
              )}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => setStep((s) => (atEnd ? 0 : s + 1))}
          style={{ backgroundColor: "var(--m-accent)", color: "var(--lesson-bg)" }}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition-transform hover:-translate-y-px"
        >
          {atEnd ? (
            <>
              <RotateCcw className="h-4 w-4" /> Replay
            </>
          ) : step === 0 ? (
            <>
              <Play className="h-4 w-4" /> Trace the request
            </>
          ) : (
            <>
              Next <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function Endpoint({
  icon: Icon,
  title,
  subtitle,
  active,
}: {
  icon: typeof Monitor;
  title: string;
  subtitle: string;
  active: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all duration-300",
        active
          ? "border-[var(--m-accent-line)] bg-[var(--m-accent-soft)] shadow-[0_0_20px_var(--m-glow)]"
          : "border-transparent",
      )}
    >
      <span
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-xl transition-colors",
          active
            ? "bg-[var(--m-accent)] text-lesson-bg"
            : "bg-lesson-surface text-lesson-text-muted ring-1 ring-lesson-border",
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="leading-tight">
        <p className="text-sm font-bold text-lesson-text-primary">{title}</p>
        <p className="text-[11px] text-lesson-text-muted">{subtitle}</p>
      </div>
    </div>
  );
}
