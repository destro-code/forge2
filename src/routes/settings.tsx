import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettings } from "@/lib/hooks/use-settings";
import { useTheme } from "@/lib/hooks/use-theme";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · Forge" },
      {
        name: "description",
        content:
          "Configure theme, editor, AI mentor, learning goals, notifications and accessibility.",
      },
      { property: "og:title", content: "Settings · Forge" },
      { property: "og:description", content: "Make Forge yours." },
    ],
  }),
  component: Settings,
});

function Settings() {
  const { settings, update, setSettings } = useSettings();
  const { setTheme, theme } = useTheme();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Settings"
        title="Preferences"
        description="Everything about how Forge feels and behaves."
      />
      <Tabs defaultValue="theme">
        <TabsList className="mb-4 flex flex-wrap">
          {["theme", "editor", "ai", "learning", "notifications", "accessibility"].map((t) => (
            <TabsTrigger key={t} value={t} className="capitalize">
              {t}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="theme">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-sm">Appearance</CardTitle>
            </CardHeader>
            <CardContent className="grid max-w-md gap-4">
              <Row label="Theme">
                <Select
                  value={theme}
                  onValueChange={(v) => setTheme(v as "dark" | "light" | "system")}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </Row>
              <Row label="Font size">
                <Select
                  value={settings.fontSize}
                  onValueChange={(v) => update("fontSize", v as "sm" | "md" | "lg")}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sm">Small</SelectItem>
                    <SelectItem value="md">Medium</SelectItem>
                    <SelectItem value="lg">Large</SelectItem>
                  </SelectContent>
                </Select>
              </Row>
              <Row label="Reduce motion">
                <Switch
                  checked={settings.reduceMotion}
                  onCheckedChange={(v) => update("reduceMotion", v)}
                />
              </Row>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="editor">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-sm">Editor</CardTitle>
            </CardHeader>
            <CardContent className="grid max-w-md gap-4">
              <Row label="Tab size">
                <div className="flex w-48 items-center gap-3">
                  <Slider
                    value={[settings.editor.tabSize]}
                    min={2}
                    max={8}
                    step={2}
                    onValueChange={([v]) =>
                      setSettings((s) => ({ ...s, editor: { ...s.editor, tabSize: v } }))
                    }
                  />
                  <span className="w-6 text-right text-sm tabular-nums">
                    {settings.editor.tabSize}
                  </span>
                </div>
              </Row>
              <Row label="Word wrap">
                <Switch
                  checked={settings.editor.wordWrap}
                  onCheckedChange={(v) =>
                    setSettings((s) => ({ ...s, editor: { ...s.editor, wordWrap: v } }))
                  }
                />
              </Row>
              <Row label="Font ligatures">
                <Switch
                  checked={settings.editor.fontLigatures}
                  onCheckedChange={(v) =>
                    setSettings((s) => ({ ...s, editor: { ...s.editor, fontLigatures: v } }))
                  }
                />
              </Row>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="ai">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-sm">AI Mentor</CardTitle>
            </CardHeader>
            <CardContent className="grid max-w-md gap-4">
              <Row label="Provider">
                <Select
                  value={settings.ai.provider}
                  onValueChange={(v) =>
                    setSettings((s) => ({ ...s, ai: { ...s.ai, provider: v as never } }))
                  }
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mock">Forge (mock)</SelectItem>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="gemini">Google Gemini</SelectItem>
                    <SelectItem value="openrouter">OpenRouter</SelectItem>
                  </SelectContent>
                </Select>
              </Row>
              <Row label="Coaching mode">
                <Switch
                  checked={settings.ai.coachingMode}
                  onCheckedChange={(v) =>
                    setSettings((s) => ({ ...s, ai: { ...s.ai, coachingMode: v } }))
                  }
                />
              </Row>
              <Row label="Temperature">
                <div className="flex w-48 items-center gap-3">
                  <Slider
                    value={[settings.ai.temperature * 100]}
                    min={0}
                    max={100}
                    step={5}
                    onValueChange={([v]) =>
                      setSettings((s) => ({ ...s, ai: { ...s.ai, temperature: v / 100 } }))
                    }
                  />
                  <span className="w-10 text-right text-sm tabular-nums">
                    {settings.ai.temperature.toFixed(2)}
                  </span>
                </div>
              </Row>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="learning">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-sm">Learning</CardTitle>
            </CardHeader>
            <CardContent className="grid max-w-md gap-4">
              <Row label="Daily goal (min)">
                <div className="flex w-48 items-center gap-3">
                  <Slider
                    value={[settings.learning.dailyGoalMinutes]}
                    min={10}
                    max={120}
                    step={5}
                    onValueChange={([v]) =>
                      setSettings((s) => ({
                        ...s,
                        learning: { ...s.learning, dailyGoalMinutes: v },
                      }))
                    }
                  />
                  <span className="w-10 text-right text-sm tabular-nums">
                    {settings.learning.dailyGoalMinutes}
                  </span>
                </div>
              </Row>
              <Row label="Auto-advance lessons">
                <Switch
                  checked={settings.learning.autoAdvance}
                  onCheckedChange={(v) =>
                    setSettings((s) => ({ ...s, learning: { ...s.learning, autoAdvance: v } }))
                  }
                />
              </Row>
              <Row label="Show hints first">
                <Switch
                  checked={settings.learning.showHintsFirst}
                  onCheckedChange={(v) =>
                    setSettings((s) => ({ ...s, learning: { ...s.learning, showHintsFirst: v } }))
                  }
                />
              </Row>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notifications">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-sm">Notifications</CardTitle>
            </CardHeader>
            <CardContent className="grid max-w-md gap-4">
              <Row label="Daily reminder">
                <Switch
                  checked={settings.notifications.dailyReminder}
                  onCheckedChange={(v) =>
                    setSettings((s) => ({
                      ...s,
                      notifications: { ...s.notifications, dailyReminder: v },
                    }))
                  }
                />
              </Row>
              <Row label="Weekly report">
                <Switch
                  checked={settings.notifications.weeklyReport}
                  onCheckedChange={(v) =>
                    setSettings((s) => ({
                      ...s,
                      notifications: { ...s.notifications, weeklyReport: v },
                    }))
                  }
                />
              </Row>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="accessibility">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-sm">Accessibility</CardTitle>
            </CardHeader>
            <CardContent className="grid max-w-md gap-4 text-sm text-muted-foreground">
              <p>
                Forge follows WCAG AA. Keyboard shortcuts, focus rings, and reduced-motion are
                enabled by default. Report accessibility issues via the profile menu.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}
