import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Layers, Sparkles } from "lucide-react";

interface Step {
  title: string;
  description: string;
  code?: string;
  language?: string;
}

interface LessonWalkthroughProps {
  title: string;
  steps: Step[];
}

export function LessonWalkthrough({ title, steps }: LessonWalkthroughProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!steps || steps.length === 0) return null;

  const activeStep = steps[currentStep];

  return (
    <Card className="my-6 border-sky-500/30 bg-card/70 overflow-hidden shadow-elegant">
      <CardHeader className="pb-3 border-b border-border/50 bg-sky-500/5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-sky-400" />
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px] border-sky-500/30 text-sky-300">
            Step-by-Step Walkthrough ({currentStep + 1} / {steps.length})
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Step Stepper Header */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-border/40">
          {steps.map((step, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                currentStep === idx
                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-xs font-semibold"
                  : idx < currentStep
                    ? "bg-muted/40 text-foreground/80 hover:bg-muted"
                    : "bg-muted/20 text-muted-foreground hover:bg-muted/40"
              }`}
            >
              <span className="h-4 w-4 rounded-full bg-background flex items-center justify-center text-[10px] font-mono">
                {idx + 1}
              </span>
              <span className="truncate max-w-[120px]">{step.title}</span>
            </button>
          ))}
        </div>

        {/* Active Step Content */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Sparkles className="h-4 w-4 text-sky-400" />
            <span>
              Step {currentStep + 1}: {activeStep.title}
            </span>
          </div>

          <p className="text-sm text-foreground/85 leading-relaxed">{activeStep.description}</p>

          {activeStep.code && (
            <div className="rounded-lg border border-border/60 bg-[#0d0e12] p-3 font-mono text-xs overflow-x-auto text-sky-200">
              <pre className="whitespace-pre">{activeStep.code}</pre>
            </div>
          )}
        </div>

        {/* Walkthrough Stepper Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-border/40">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
            disabled={currentStep === 0}
            className="gap-1 text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Previous Step
          </Button>

          <Button
            size="sm"
            onClick={() => setCurrentStep((s) => Math.min(steps.length - 1, s + 1))}
            disabled={currentStep === steps.length - 1}
            className="gap-1 text-xs shadow-glow"
          >
            Next Step <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
