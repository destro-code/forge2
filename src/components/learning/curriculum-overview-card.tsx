import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, GraduationCap, Layers, Clock } from "lucide-react";
import { useCurriculum, type CurriculumStats } from "@/lib/hooks/use-curriculum";

interface CurriculumOverviewCardProps {
  stats?: CurriculumStats;
}

export function CurriculumOverviewCard({ stats: propStats }: CurriculumOverviewCardProps) {
  const { stats: derivedStats } = useCurriculum();
  const stats = propStats || derivedStats;
  return (
    <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card via-card to-card/80 shadow-elegant">
      <div className="absolute right-0 top-0 -mr-12 -mt-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <CardContent className="p-6">
        <div className="grid gap-6 md:grid-cols-4">
          {/* Main Progress Metric */}
          <div className="md:col-span-1 space-y-2 border-b md:border-b-0 md:border-r border-border/50 pb-4 md:pb-0 md:pr-6">
            <div className="flex items-center gap-1.5 text-xs font-medium text-primary uppercase tracking-wider">
              <GraduationCap className="h-4 w-4" />
              Curriculum Mastery
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-foreground">
                {stats.overallProgress}%
              </span>
              <span className="text-xs text-muted-foreground">overall completed</span>
            </div>
            <Progress value={stats.overallProgress} className="h-2 bg-muted/60" />
            <p className="text-xs text-muted-foreground pt-1">
              {stats.completedLessonsCount} of {stats.totalLessons} total lessons mastered
            </p>
          </div>

          {/* Metric 2: Modules & Topics */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Layers className="h-4 w-4 text-primary" />
              <span>Curriculum Structure</span>
            </div>
            <div className="text-2xl font-semibold text-foreground">
              {stats.totalModules}{" "}
              <span className="text-sm font-normal text-muted-foreground">Modules</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalTopics} core topics & knowledge nodes
            </p>
          </div>

          {/* Metric 3: Total Content Sizing */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <BookOpen className="h-4 w-4 text-primary" />
              <span>Lesson Library</span>
            </div>
            <div className="text-2xl font-semibold text-foreground">
              {stats.totalLessons}{" "}
              <span className="text-sm font-normal text-muted-foreground">Lessons</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Interactive exercises & interview questions
            </p>
          </div>

          {/* Metric 4: Estimated Time Commitment */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Clock className="h-4 w-4 text-primary" />
              <span>Time Investment</span>
            </div>
            <div className="text-2xl font-semibold text-foreground">
              ~{stats.totalHours}{" "}
              <span className="text-sm font-normal text-muted-foreground">Hours</span>
            </div>
            <p className="text-xs text-muted-foreground">Self-paced, structured career academy</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
