import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Sparkles } from "lucide-react";

interface JourneyIntroProps {
  isNewLearner?: boolean;
}

export function JourneyIntro({ isNewLearner = false }: JourneyIntroProps) {
  return (
    <section aria-label="Your learning forge" className="flex flex-col gap-4">
      <div className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Your learning forge</span>
      </div>

      <h1 className="text-pretty font-serif text-4xl font-medium leading-[1.05] tracking-tight text-foreground sm:text-5xl">
        Shape your <span className="text-primary">craft.</span>
      </h1>

      <p className="max-w-md text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
        {isNewLearner
          ? "Start where it matters. Every node is a skill you can make your own through deliberate practice."
          : "Build fluency through deliberate practice. Every node is a skill you can make your own."}
      </p>

      <Link
        to="/playground"
        className="group inline-flex w-fit items-center gap-2 border-b-2 border-primary pb-1 font-mono text-sm font-medium text-foreground transition-colors hover:text-primary"
      >
        <span>Open playground</span>
        <ArrowUpRight
          className="h-4 w-4 text-primary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </Link>
    </section>
  );
}
