import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { useLessons } from "@/lib/hooks/use-content";
import { Compass, TrendingUp, Clock, ArrowRight, Sparkles } from "lucide-react";
import type { Topic } from "@/lib/types";

interface RecommendedTopicsCardProps {
  topics: Topic[];
}

export function RecommendedTopicsCard({ topics }: RecommendedTopicsCardProps) {
  const recommendedList = topics.slice(0, 3);
  const lessons = useLessons();

  return (
    <Card className="border-border/60 shadow-xs transition duration-200 hover:border-primary/40">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Compass className="h-4 w-4 text-primary" />
            Recommended Next Topics
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            High-impact topics based on interview frequency & skill gaps
          </p>
        </div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-xs gap-1 text-muted-foreground hover:text-foreground"
        >
          <Link to="/learn/topics">
            Knowledge Graph <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="grid gap-3 sm:grid-cols-3">
        {recommendedList.map((topic) => {
          const firstLesson = lessons.find((l) => l.topicId === topic.id);

          return (
            <div
              key={topic.id}
              className="flex flex-col justify-between rounded-lg border border-border/50 bg-card/60 p-3.5 transition hover:border-primary/40"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-1">
                  <DifficultyBadge difficulty={topic.difficulty} />
                  <Badge variant="secondary" className="gap-1 text-[10px] shrink-0">
                    <TrendingUp className="h-3 w-3 text-primary" />
                    {topic.interviewFrequency}
                  </Badge>
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
                  className="h-7 text-xs px-2 text-primary gap-1"
                >
                  <Link to="/learn/topics/$topicId" params={{ topicId: topic.id }}>
                    Open Topic <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
