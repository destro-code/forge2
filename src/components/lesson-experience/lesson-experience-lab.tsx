import { useMemo, useState } from "react";
import { ChevronDown, FlaskConical, RotateCcw } from "lucide-react";
import { LessonExperiencePlayer } from "./lesson-experience-player";
import { LAB_LESSONS } from "@/lib/lesson-experience/lab-lessons";
import type { LessonExperienceState } from "@/lib/lesson-experience/types";
import { BROWSER_DOCUMENT_DESCRIPTOR } from "@/lib/lesson-experience/contracts";
import { browserCapabilities } from "@/lib/lesson-experience/browser-family";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

export function LessonExperienceLab() {
  const [selectedId, setSelectedId] = useState(LAB_LESSONS[0].lesson.id);
  const [resetKey, setResetKey] = useState("0");
  const [state, setState] = useState<LessonExperienceState>();
  const definition = useMemo(
    () => LAB_LESSONS.find((lesson) => lesson.lesson.id === selectedId) ?? LAB_LESSONS[0],
    [selectedId],
  );
  const current = state ? definition.experiences[state.currentIndex] : definition.experiences[0];
  const progress = state ? Math.round((state.completedIds.length / state.order.length) * 100) : 0;

  function changeLesson(id: string) {
    setSelectedId(id);
    setState(undefined);
    setResetKey((key) => `${Number(key) + 1}`);
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <Badge variant="outline" className="w-fit gap-2">
              <FlaskConical /> Development lab
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
              What should a Forge lesson feel like?
            </h1>
            <p className="max-w-2xl text-muted-foreground leading-6">
              A small set of synthetic lessons for testing curiosity, practice, feedback, and earned
              completion.
            </p>
          </div>
          <Button variant="outline" onClick={() => setResetKey((key) => `${Number(key) + 1}`)}>
            <RotateCcw data-icon="inline-start" /> Restart lesson
          </Button>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="flex min-w-0 flex-col gap-4">
            <Card>
              <CardHeader className="gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle>{definition.lesson.title}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {definition.lesson.description}
                    </p>
                  </div>
                  <Badge variant="secondary">{current?.kind ?? "ready"}</Badge>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{current?.title}</span>
                    <span>
                      {state?.completedIds.length ?? 0}/{definition.experiences.length} complete
                    </span>
                  </div>
                  <Progress value={progress} aria-label="Lesson progress" />
                </div>
              </CardHeader>
              <CardContent>
                <LessonExperiencePlayer
                  definition={definition}
                  resetKey={resetKey}
                  onStateChange={setState}
                />
              </CardContent>
            </Card>
          </div>

          <aside className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Choose a shape</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {LAB_LESSONS.map((lesson) => (
                  <Button
                    key={lesson.lesson.id}
                    variant={lesson.lesson.id === selectedId ? "secondary" : "ghost"}
                    className="h-auto justify-start whitespace-normal px-3 py-3 text-left"
                    onClick={() => changeLesson(lesson.lesson.id)}
                  >
                    <span className="flex flex-col gap-1">
                      <span>{lesson.lesson.title}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {lesson.experiences.map((experience) => experience.kind).join(" → ")}
                      </span>
                    </span>
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Browser family</CardTitle>
                <p className="text-sm text-muted-foreground">Phase B capability contract</p>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-xs">
                <InspectorRow label="Family" value={BROWSER_DOCUMENT_DESCRIPTOR.family} />
                <InspectorRow label="Security" value={BROWSER_DOCUMENT_DESCRIPTOR.security} />
                <InspectorRow label="Host" value="SandboxRuntimeHost" />
                <Separator />
                <div className="flex flex-col gap-2" aria-label="Browser capabilities">
                  {browserCapabilities().map((capability) => (
                    <div key={capability.name} className="flex items-center justify-between gap-3">
                      <code className="font-mono text-muted-foreground">{capability.name}</code>
                      <Badge variant="secondary">available</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Collapsible defaultOpen>
              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="text-base">Architecture inspector</CardTitle>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Toggle architecture inspector">
                      <ChevronDown />
                    </Button>
                  </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="flex flex-col gap-3 text-xs">
                    <InspectorRow label="Current ID" value={current?.id ?? "—"} />
                    <InspectorRow label="Kind" value={current?.kind ?? "—"} />
                    <InspectorRow label="State" value={state?.status ?? "not-started"} />
                    <InspectorRow
                      label="Attempts"
                      value={
                        state && current
                          ? String(state.experienceState[current.id]?.attempts ?? 0)
                          : "0"
                      }
                    />
                    <InspectorRow
                      label="Validation"
                      value={
                        state && current
                          ? state.experienceState[current.id]?.validation?.isValid
                            ? "passed"
                            : "pending"
                          : "pending"
                      }
                    />
                    <Separator />
                    <InspectorRow label="Visited" value={String(state?.visitedIds.length ?? 0)} />
                    <InspectorRow
                      label="Completed"
                      value={String(state?.completedIds.length ?? 0)}
                    />
                    <InspectorRow
                      label="Lesson"
                      value={state?.status === "completed" ? "complete" : "in progress"}
                    />
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </aside>
        </section>
      </div>
    </main>
  );
}

function InspectorRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <code className="max-w-[150px] truncate text-right font-mono">{value}</code>
    </div>
  );
}
