import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { HeatMap } from "@/components/shared/heat-map";
import { progressStore } from "@/lib/providers/progress-provider";
import {
  useProgress,
  getMasteryLabelFromConfidence,
  updateTopicMasteryRecord,
} from "@/lib/hooks/use-progress";
import { getReadinessAnalytics, getPillarRadarAnalytics } from "@/lib/analytics/progress-analytics";
import { useLessons, useQuizzes } from "@/lib/hooks/use-content";
import type { MasteryState, TopicMasteryRecord } from "@/lib/types";
import { toast } from "sonner";
import {
  Flame,
  Clock,
  Target,
  Trophy,
  Brain,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  TrendingUp,
  Plus,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Filter,
  Sliders,
  Award,
  ListChecks,
  PenTool,
  Bug,
  HelpCircle,
  Zap,
  BarChart2,
  Check,
} from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
} from "recharts";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Progress Tracker · Forge" },
      {
        name: "description",
        content:
          "Track confidence levels, spaced-repetition review dates, weak/strong topics, and interview readiness.",
      },
      { property: "og:title", content: "Progress Tracker · Forge" },
      { property: "og:description", content: "Data-driven frontend skill mastery." },
    ],
  }),
  component: MasteryEnginePage,
});

const MASTERY_STAGES: MasteryState[] = [
  "Not Started",
  "Learning",
  "Practicing",
  "Needs Review",
  "Interview Ready",
  "Mastered",
];

const CATEGORIES = [
  "All",
  "JavaScript",
  "React",
  "CSS",
  "TypeScript",
  "Performance",
  "System Design",
];

export function MasteryEnginePage() {
  const progress = useProgress();
  const lessons = useLessons();
  const quizzes = useQuizzes();
  const [, setProgress] = progressStore.useStore();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("confidence");

  // Add topic modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicCategory, setNewTopicCategory] = useState("JavaScript");
  const [newTopicConfidence, setNewTopicConfidence] = useState(50);
  const [newTopicMastery, setNewTopicMastery] = useState<MasteryState>("Learning");

  // AI Refresher Modal State
  const [refresherModalOpen, setRefresherModalOpen] = useState(false);
  const [selectedRefresherTopic, setSelectedRefresherTopic] = useState<TopicMasteryRecord | null>(
    null,
  );

  // Safely fallback to empty object if not yet populated in local storage
  const masteryRecords: Record<string, TopicMasteryRecord> = useMemo(() => {
    return progress.topicMasteryRecords || {};
  }, [progress.topicMasteryRecords]);

  const recordsList = useMemo(() => Object.values(masteryRecords), [masteryRecords]);

  // Helper calculation for Spaced Repetition status
  const getSpacedReviewStatus = (nextReviewAtStr: string) => {
    const now = new Date();
    const nextDate = new Date(nextReviewAtStr);
    const diffTime = nextDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        status: "overdue" as const,
        label: `Overdue by ${Math.abs(diffDays)}d`,
        days: diffDays,
        badgeVariant: "destructive" as const,
      };
    } else if (diffDays === 0) {
      return {
        status: "today" as const,
        label: "Due Today",
        days: 0,
        badgeVariant: "default" as const,
      };
    } else if (diffDays <= 3) {
      return {
        status: "soon" as const,
        label: `Due in ${diffDays}d`,
        days: diffDays,
        badgeVariant: "secondary" as const,
      };
    } else {
      return {
        status: "upcoming" as const,
        label: `In ${diffDays}d`,
        days: diffDays,
        badgeVariant: "outline" as const,
      };
    }
  };

  // Metrics Calculations
  const weakTopics = useMemo(
    () =>
      recordsList.filter(
        (r) =>
          r.confidence < 60 ||
          r.mastery === "Needs Review" ||
          getSpacedReviewStatus(r.nextReviewAt).status === "overdue",
      ),
    [recordsList],
  );

  const strongTopics = useMemo(
    () =>
      recordsList.filter(
        (r) => r.confidence >= 80 || r.mastery === "Mastered" || r.mastery === "Interview Ready",
      ),
    [recordsList],
  );

  const overdueCount = useMemo(
    () =>
      recordsList.filter((r) => getSpacedReviewStatus(r.nextReviewAt).status === "overdue").length,
    [recordsList],
  );

  const dueTodayCount = useMemo(
    () =>
      recordsList.filter((r) => getSpacedReviewStatus(r.nextReviewAt).status === "today").length,
    [recordsList],
  );

  const avgConfidence = useMemo(() => {
    if (recordsList.length === 0) return 0;
    const sum = recordsList.reduce((acc, r) => acc + r.confidence, 0);
    return Math.round(sum / recordsList.length);
  }, [recordsList]);

  // Interview Readiness Calculation Engine (Using Canonical Analytical Helpers)
  const readinessData = useMemo(() => {
    const readinessAnalytics = getReadinessAnalytics(progress);
    const pillarRadarAnalytics = getPillarRadarAnalytics(progress);

    return {
      score: readinessAnalytics.overallReadinessPercent,
      tier: readinessAnalytics.tier,
      pillars: pillarRadarAnalytics.pillars,
    };
  }, [progress]);

  // Filtered Topics
  const filteredRecords = useMemo(() => {
    return recordsList.filter((r) => {
      const matchesCategory = selectedCategory === "All" || r.category === selectedCategory;
      const matchesQuery =
        !searchQuery.trim() ||
        r.topicTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [recordsList, selectedCategory, searchQuery]);

  // Event Handlers for State Persistence
  const handleUpdateConfidence = (topicId: string, newConfidence: number) => {
    setProgress((prev) => {
      const currentMap = prev.topicMasteryRecords || {};
      if (!currentMap[topicId]) return prev;

      const updatedMap = updateTopicMasteryRecord(currentMap, topicId, {
        confidence: newConfidence,
      });

      return {
        ...prev,
        topicMasteryRecords: updatedMap,
      };
    });
    toast.success("Updated topic confidence!");
  };

  const handleUpdateMastery = (topicId: string, newMastery: MasteryState) => {
    setProgress((prev) => {
      const currentMap = prev.topicMasteryRecords || {};
      if (!currentMap[topicId]) return prev;

      const updatedMap = updateTopicMasteryRecord(currentMap, topicId, {
        mastery: newMastery,
      });

      return {
        ...prev,
        topicMasteryRecords: updatedMap,
      };
    });
    toast.success(`Updated status to "${newMastery}"`);
  };

  const handleMarkReviewed = (topicId: string) => {
    const now = new Date();
    const existing = masteryRecords[topicId];
    if (!existing) return;

    // Spaced Repetition interval multiplier (doubles up to 30 days)
    const newInterval = Math.min(existing.intervalDays * 2 || 3, 30);
    const nextDate = new Date(now);
    nextDate.setDate(nextDate.getDate() + newInterval);

    setProgress((prev) => {
      const currentMap = prev.topicMasteryRecords || {};
      const record = currentMap[topicId];
      if (!record) return prev;

      const updatedMap = updateTopicMasteryRecord(currentMap, topicId, {
        intervalDays: newInterval,
        lastReviewedAt: now.toISOString(),
        nextReviewAt: nextDate.toISOString(),
        reviewCountDelta: 1,
      });

      return {
        ...prev,
        xp: (prev.xp || 0) + 15,
        topicMasteryRecords: updatedMap,
      };
    });

    toast.success(
      `Marked reviewed! Next spaced repetition scheduled in ${newInterval} days. (+15 XP)`,
    );
  };

  const handleScheduleCustomReview = (topicId: string, daysAhead: number) => {
    const now = new Date();
    const nextDate = new Date(now);
    nextDate.setDate(nextDate.getDate() + daysAhead);

    setProgress((prev) => {
      const currentMap = prev.topicMasteryRecords || {};
      const record = currentMap[topicId];
      if (!record) return prev;

      return {
        ...prev,
        topicMasteryRecords: {
          ...currentMap,
          [topicId]: {
            ...record,
            nextReviewAt: nextDate.toISOString(),
            intervalDays: daysAhead,
          },
        },
      };
    });

    toast.info(`Review scheduled in ${daysAhead} days.`);
  };

  const handleAddCustomTopic = () => {
    if (!newTopicTitle.trim()) return;

    const id = newTopicTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const now = new Date();
    const nextDate = new Date(now);
    nextDate.setDate(nextDate.getDate() + 3);

    const newRecord: TopicMasteryRecord = {
      topicId: id,
      topicTitle: newTopicTitle.trim(),
      category: newTopicCategory,
      confidence: newTopicConfidence,
      mastery: newTopicMastery,
      lastReviewedAt: now.toISOString(),
      nextReviewAt: nextDate.toISOString(),
      intervalDays: 3,
      reviewCount: 0,
    };

    setProgress((prev) => {
      const currentMap = prev.topicMasteryRecords || {};
      return {
        ...prev,
        topicMasteryRecords: {
          ...currentMap,
          [id]: newRecord,
        },
      };
    });

    setNewTopicTitle("");
    setIsAddModalOpen(false);
    toast.success(`Added new topic: ${newRecord.topicTitle}`);
  };

  const weeklyData = progress.weekly.map((v, i) => ({
    d: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
    v,
  }));

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          eyebrow="Skill Mastery"
          title="Skill Mastery & Interview Readiness Hub"
          description="Real-time skill tracking, spaced repetition dates, weak topic matrix & interview metrics."
        />

        <div className="flex items-center gap-2 shrink-0">
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 font-semibold">
                <Plus className="h-4 w-4" /> Add Topic
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" /> Track New Concept
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                    Topic Title
                  </label>
                  <Input
                    placeholder="e.g. React Server Components & Streaming SSR"
                    value={newTopicTitle}
                    onChange={(e) => setNewTopicTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                    Category
                  </label>
                  <select
                    value={newTopicCategory}
                    onChange={(e) => setNewTopicCategory(e.target.value)}
                    className="w-full h-9 rounded-md border bg-background px-3 text-xs"
                  >
                    {CATEGORIES.filter((c) => c !== "All").map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Initial Confidence
                    </label>
                    <span className="text-xs font-bold text-primary">{newTopicConfidence}%</span>
                  </div>
                  <Slider
                    value={[newTopicConfidence]}
                    onValueChange={([val]) => setNewTopicConfidence(val)}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                    Initial Mastery Stage
                  </label>
                  <select
                    value={newTopicMastery}
                    onChange={(e) => setNewTopicMastery(e.target.value as MasteryState)}
                    className="w-full h-9 rounded-md border bg-background px-3 text-xs"
                  >
                    {MASTERY_STAGES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleAddCustomTopic}>
                  Track Topic
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Link to="/interview">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Trophy className="h-4 w-4 text-amber-500" /> Mock Interview
            </Button>
          </Link>
        </div>
      </div>

      {/* Top Stat Cards Row */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Interview Readiness"
          value={`${readinessData.score}%`}
          delta={readinessData.tier}
          icon={<Award className="h-4 w-4 text-emerald-500" />}
          tone="primary"
        />
        <StatCard
          label="Avg Confidence"
          value={`${avgConfidence}%`}
          delta={`${recordsList.length} total topics`}
          icon={<Brain className="h-4 w-4 text-primary" />}
        />
        <StatCard
          label="Weak Topics"
          value={weakTopics.length}
          delta={weakTopics.length > 0 ? "Action Needed" : "All Good"}
          icon={<AlertTriangle className="h-4 w-4 text-rose-500" />}
        />
        <StatCard
          label="Strong Topics"
          value={strongTopics.length}
          delta="Ready to Demo"
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
        />
        <StatCard
          label="Spaced Reviews"
          value={`${overdueCount} Overdue`}
          delta={`${dueTodayCount} Due Today`}
          icon={<Calendar className="h-4 w-4 text-amber-500" />}
        />
      </div>

      {/* Main Feature Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto p-1 bg-muted/50 rounded-xl">
          <TabsTrigger value="confidence" className="gap-2 text-xs py-2 font-medium">
            <Brain className="h-3.5 w-3.5" /> Confidence Matrix
          </TabsTrigger>
          <TabsTrigger value="spaced" className="gap-2 text-xs py-2 font-medium">
            <Calendar className="h-3.5 w-3.5" /> Review Schedule ({overdueCount})
          </TabsTrigger>
          <TabsTrigger value="weak" className="gap-2 text-xs py-2 font-medium">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-500" /> Weak Topics ({weakTopics.length}
            )
          </TabsTrigger>
          <TabsTrigger value="strong" className="gap-2 text-xs py-2 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Strong Topics (
            {strongTopics.length})
          </TabsTrigger>
          <TabsTrigger value="readiness" className="gap-2 text-xs py-2 font-medium">
            <Award className="h-3.5 w-3.5 text-amber-500" /> Interview Readiness
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: CONFIDENCE MATRIX */}
        <TabsContent value="confidence" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" /> Track Topic Confidence & Mastery
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Adjust your confidence slider or set mastery stages to power your personal
                    adaptive learning path.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 text-xs w-48"
                  />
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                {CATEGORIES.map((cat) => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    size="xs"
                    className="h-7 text-xs rounded-full"
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                {filteredRecords.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-xs italic">
                    No topics found matching your query.
                  </div>
                ) : (
                  filteredRecords.map((record) => {
                    const reviewInfo = getSpacedReviewStatus(record.nextReviewAt);
                    return (
                      <Card
                        key={record.topicId}
                        className="p-4 transition hover:border-primary/40 bg-card/60"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          {/* Topic Details */}
                          <div className="space-y-1.5 md:w-1/3">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-[10px]">
                                {record.category}
                              </Badge>
                              <Badge
                                variant={
                                  record.confidence >= 80
                                    ? "default"
                                    : record.confidence < 40
                                      ? "destructive"
                                      : "outline"
                                }
                                className="text-[10px]"
                              >
                                {record.mastery}
                              </Badge>
                              <Badge
                                variant={reviewInfo.badgeVariant}
                                className="text-[10px] font-mono"
                              >
                                {reviewInfo.label}
                              </Badge>
                            </div>
                            <h3 className="font-semibold text-sm">{record.topicTitle}</h3>
                            {record.notes && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                📝 {record.notes}
                              </p>
                            )}
                          </div>

                          {/* Confidence Slider */}
                          <div className="space-y-1 md:w-1/3">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground font-medium">Confidence:</span>
                              <span className="font-bold font-mono text-primary">
                                {record.confidence}%
                              </span>
                            </div>
                            <Slider
                              value={[record.confidence]}
                              onValueChange={([val]) => handleUpdateConfidence(record.topicId, val)}
                              min={0}
                              max={100}
                              step={5}
                            />
                            <div className="flex justify-between text-[9px] text-muted-foreground">
                              <span>Low (&lt;50%)</span>
                              <span>Medium (50-80%)</span>
                              <span>High (85%+)</span>
                            </div>
                          </div>

                          {/* Action Controls */}
                          <div className="flex items-center gap-2 md:w-1/4 justify-end">
                            <select
                              value={record.mastery}
                              onChange={(e) =>
                                handleUpdateMastery(record.topicId, e.target.value as MasteryState)
                              }
                              className="h-8 text-xs rounded-md border bg-background px-2"
                            >
                              {MASTERY_STAGES.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>

                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => handleMarkReviewed(record.topicId)}
                              className="h-8 gap-1 text-[11px]"
                            >
                              <Check className="h-3 w-3 text-emerald-500" /> Review
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: SPACED REPETITION & REVIEW SCHEDULE */}
        <TabsContent value="spaced" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-500" /> Spaced Repetition Review Schedule
              </CardTitle>
              <CardDescription className="text-xs">
                To move concepts into long-term memory, review topics when their interval decays.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recordsList
                .sort(
                  (a, b) => new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime(),
                )
                .map((record) => {
                  const reviewInfo = getSpacedReviewStatus(record.nextReviewAt);
                  return (
                    <Card
                      key={record.topicId}
                      className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        reviewInfo.status === "overdue"
                          ? "border-rose-500/40 bg-rose-500/5"
                          : reviewInfo.status === "today"
                            ? "border-amber-500/40 bg-amber-500/5"
                            : "bg-card"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{record.topicTitle}</span>
                          <Badge variant="secondary" className="text-[10px]">
                            {record.category}
                          </Badge>
                          <Badge
                            variant={reviewInfo.badgeVariant}
                            className="text-[10px] font-mono"
                          >
                            {reviewInfo.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Current interval: <strong>{record.intervalDays} days</strong> · Total
                          reviews: <strong>{record.reviewCount}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="xs"
                          onClick={() => handleMarkReviewed(record.topicId)}
                          className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <Check className="h-3.5 w-3.5" /> Mark Reviewed Today
                        </Button>

                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleScheduleCustomReview(record.topicId, 7)}
                        >
                          +7 Days
                        </Button>
                      </div>
                    </Card>
                  );
                })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: WEAK TOPICS MATRIX */}
        <TabsContent value="weak" className="space-y-4">
          <Card className="border-rose-500/30 bg-rose-500/5">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-rose-500">
                <AlertTriangle className="h-4 w-4" /> Weak Topics Requiring Immediate Focus
              </CardTitle>
              <CardDescription className="text-xs">
                Topics with confidence &lt; 60%, marked "Needs Review", or overdue for spaced
                repetition.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {weakTopics.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-xs italic">
                  🎉 Fantastic job! You have zero weak topics right now.
                </div>
              ) : (
                weakTopics.map((topic) => {
                  const matchingLesson = lessons.find((l) => l.topicId === topic.topicId);
                  const matchingQuiz = quizzes.find((q) => q.topicId === topic.topicId);

                  return (
                    <Card
                      key={topic.topicId}
                      className="p-4 flex flex-col md:flex-row justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">
                            {topic.topicTitle}
                          </span>
                          <Badge variant="destructive" className="text-[10px]">
                            Confidence: {topic.confidence}%
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {topic.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {topic.notes ||
                            "Low confidence score recorded. Recommended to review material or complete practice quiz."}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {matchingLesson ? (
                          <Button asChild size="xs" variant="outline" className="gap-1">
                            <Link to="/lesson/$lessonId" params={{ lessonId: matchingLesson.id }}>
                              <BookOpen className="h-3.5 w-3.5" /> Review Lesson
                            </Link>
                          </Button>
                        ) : (
                          <Button asChild size="xs" variant="outline" className="gap-1">
                            <Link to="/learn/topics/$topicId" params={{ topicId: topic.topicId }}>
                              <BookOpen className="h-3.5 w-3.5" /> Review Topic
                            </Link>
                          </Button>
                        )}

                        {matchingQuiz ? (
                          <Button asChild size="xs" variant="default" className="gap-1">
                            <Link to="/quizzes/$quizId" params={{ quizId: matchingQuiz.id }}>
                              <ListChecks className="h-3.5 w-3.5" /> Practice Quiz
                            </Link>
                          </Button>
                        ) : (
                          <Button asChild size="xs" variant="default" className="gap-1">
                            <Link to="/quizzes">
                              <ListChecks className="h-3.5 w-3.5" /> Take Quiz
                            </Link>
                          </Button>
                        )}

                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => handleOpenRefresher(topic)}
                          className="gap-1 text-primary hover:text-primary/80"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-amber-400" /> AI Refresher
                        </Button>
                      </div>
                    </Card>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: STRONG TOPICS MATRIX */}
        <TabsContent value="strong" className="space-y-4">
          <Card className="border-emerald-500/30 bg-emerald-500/5">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-emerald-500">
                <CheckCircle2 className="h-4 w-4" /> Strong & Mastered Topics
              </CardTitle>
              <CardDescription className="text-xs">
                Topics with confidence &gt;= 80% or marked "Mastered" / "Interview Ready".
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {strongTopics.map((topic) => (
                <Card
                  key={topic.topicId}
                  className="p-4 flex flex-col md:flex-row justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{topic.topicTitle}</span>
                      <Badge className="bg-emerald-600 text-white text-[10px]">
                        Confidence: {topic.confidence}%
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {topic.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ready for senior-level technical interviews and architectural challenge
                      sessions.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link to="/interview">
                      <Button size="xs" variant="outline" className="gap-1">
                        <Trophy className="h-3.5 w-3.5 text-amber-500" /> Mock Interview
                      </Button>
                    </Link>

                    <Link to="/mentor">
                      <Button size="xs" variant="secondary" className="gap-1">
                        <Sparkles className="h-3.5 w-3.5 text-primary" /> Teach Mentor
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: INTERVIEW READINESS RADAR & ROADMAP */}
        <TabsContent value="readiness" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Radar Chart Card */}
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Award className="h-4 w-4 text-emerald-500" /> Technical Pillar Skill Radar
                </CardTitle>
                <CardDescription className="text-xs">
                  Your readiness index evaluated across 6 core technical pillars.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer>
                  <RadarChart data={readinessData.pillars}>
                    <PolarGrid stroke="var(--color-border)" />
                    <PolarAngleAxis
                      dataKey="name"
                      tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                    />
                    <PolarRadiusAxis stroke="var(--color-border)" tick={false} />
                    <Radar
                      dataKey="score"
                      stroke="var(--color-primary)"
                      fill="var(--color-primary)"
                      fillOpacity={0.4}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Overall Score & Recommendations Card */}
            <Card className="border-border/60 flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-sm">Readiness Tier & Next Steps</CardTitle>
                <CardDescription className="text-xs">
                  Actionable steps to reach 100% Interview Readiness.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                    {readinessData.score}%
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{readinessData.tier}</h3>
                    <p className="text-xs text-muted-foreground">
                      Target goal: {progress.readinessGoalPercent || 85}%
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Action Recommendations:
                  </span>
                  <ul className="space-y-2 text-xs">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>
                        Review <strong>{weakTopics.length} Weak Topics</strong> in the Confidence
                        Matrix to raise baseline scores.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>
                        Solve 2 exercises in Debug Lab to strengthen async execution under pressure.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>
                        Simulate a full 30-minute Mock Interview Session in Mock Interviews.
                      </span>
                    </li>
                  </ul>
                </div>

                <Link to="/interview">
                  <Button className="w-full gap-2 font-semibold">
                    <Trophy className="h-4 w-4" /> Start Full Mock Interview Simulation
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Activity Heatmap */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Flame className="h-4 w-4 text-amber-500" /> Learning Activity Heatmap (Last 12 Weeks)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <HeatMap data={progress.heatmap} />
        </CardContent>
      </Card>
    </div>
  );
}
