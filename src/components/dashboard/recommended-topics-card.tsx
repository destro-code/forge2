import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { useLessons } from "@/lib/hooks/use-content";
import { useProgress } from "@/lib/hooks/use-progress";
import { getAdaptiveRecommendations } from "@/lib/hooks/use-recommendations";
import { Compass, TrendingUp, Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import type { Topic } from "@/lib/types";

interface RecommendedTopicsCardProps {
  topics: Topic[];
}

export function RecommendedTopicsCard({ topics }: RecommendedTopicsCardProps) {
  const progress = useProgress();
  const lessons = useLessons();
  const { topics: recommendedList, allMastered } = getAdaptiveRecommendations(
    topics,
    progress,
    lessons,
  );

  return (
    <Card className="border-border/50 bg-card/80 transition duration-200 hover:border-border">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Compass className="h-4 w-4 text-primary" />
            {allMastered ? "Curriculum Mastered — Refresh Topics" : "Recommended Next Topics"}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            {allMastered
              ? "All topics mastered! Keep interview high-frequency topics fresh with periodic review."
              : "Adaptive signal-based recommendations for maximum learning impact"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {allMastered && (
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs"
            >
              <CheckCircle2 className="h-3 w-3 mr-1" /> All Mastered
            </Badge>
          )}
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-xs gap-1 text-muted-foreground hover:text-foreground h-8 px-2"
          >
            <Link to="/learn/topics">
              Explore Topics <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="grid gap-3 sm:grid-cols-3">
        {recommendedList.map((topic) => {
          const topicLessons = lessons.filter(
            (l) => l.topicId === topic.id || (topic.topicId && l.topicId === topic.topicId),
          );
          const firstLesson = topicLessons[0];

          return (
            <div
              key={topic.id}
              className="flex flex-col justify-between rounded-lg bg-muted/30 p-3.5 transition-colors hover:bg-muted/50"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-1">
                  <DifficultyBadge difficulty={topic.difficulty} />
                  <span className="text-xs font-medium text-muted-foreground inline-flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-primary" />
                    {topic.interviewFrequency}
                  </span>
                </div>

                <h4 className="font-semibold text-sm text-foreground leading-snug">
                  {topic.title}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-2">{topic.description}</p>
              </div>

              <div className="mt-4 pt-2.5 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {topic.estimatedMinutes}m
                </span>
                <Button
                  asChild
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs px-2 text-primary gap-1 font-medium"
                >
                  {firstLesson ? (
                    <Link to="/lesson/$lessonId" params={{ lessonId: firstLesson.id }}>
                      {allMastered ? "Review Lesson" : "Start Lesson"}{" "}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  ) : (
                    <Link to="/learn/topics/$topicId" params={{ topicId: topic.id }}>
                      Open Topic <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
