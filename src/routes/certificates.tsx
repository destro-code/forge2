import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/shared/progress-ring";
import { useProgress } from "@/lib/hooks/use-progress";
import { checkPathEligibility } from "@/lib/utils/path-eligibility";
import learningPathsData from "@/data/learning-paths.json";
import {
  Award,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Sparkles,
  BookOpen,
  GraduationCap,
  Lock,
} from "lucide-react";
import type { LearningPath } from "@/lib/types";

export const Route = createFileRoute("/certificates")({
  head: () => ({
    meta: [
      { title: "My Certificates · Forge" },
      {
        name: "description",
        content: "View all earned engineering path certificates and assessment credentials.",
      },
      { property: "og:title", content: "My Certificates · Forge" },
    ],
  }),
  component: CertificatesRoute,
});

function CertificatesRoute() {
  const progress = useProgress();
  const certificates = progress.certificates || [];
  const paths = learningPathsData as LearningPath[];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <PageHeader
        eyebrow="Credentials & Mastery"
        title="Engineering Path Certificates"
        description="Verify and share your verified learning path achievements, path examination scores, and credentials."
        actions={
          <Button asChild variant="outline">
            <Link to="/learn/paths">Explore All Paths</Link>
          </Button>
        }
      />

      {/* Earned Certificates Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold tracking-tight">
            Earned Certificates ({certificates.length})
          </h2>
        </div>

        {certificates.length === 0 ? (
          <Card className="border-border/60 bg-card p-8 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/30 text-muted-foreground border border-border/40">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="font-semibold text-foreground">No Certificates Earned Yet</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Complete all lessons and pass all topic quizzes in a learning path to unlock its
                final assessment and earn your first certificate!
              </p>
            </div>
            <Button asChild size="sm" className="gap-2 shadow-glow">
              <Link to="/learn/paths">
                Browse Learning Paths <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {certificates.map((cert) => {
              const formattedDate = new Date(cert.issuedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });

              return (
                <Card
                  key={cert.id}
                  className="group relative flex flex-col justify-between overflow-hidden border-border/60 transition duration-200 hover:border-primary/50 hover:shadow-glow"
                >
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <Badge
                          variant="secondary"
                          className="gap-1 border-primary/20 bg-primary/10 text-primary text-[10px]"
                        >
                          <ShieldCheck className="h-3 w-3" /> VERIFIED CREDENTIAL
                        </Badge>
                        <h3 className="text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                          {cert.pathTitle}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-primary" />
                            Issued: {formattedDate}
                          </span>
                        </div>
                      </div>
                      <ProgressRing value={cert.score / 100} size={52} strokeWidth={4} />
                    </div>

                    <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs">
                      <span className="font-semibold text-emerald-500">
                        Final Score: {cert.score}%
                      </span>
                      <Button asChild size="sm" className="gap-1.5 h-8">
                        <Link to="/certificate/$certificateId" params={{ certificateId: cert.id }}>
                          View Certificate <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Learning Path Status Overview Section */}
      <div className="space-y-4 pt-6 border-t border-border/40">
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" /> Path Assessment Eligibility
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          {paths.map((path) => {
            const eligibility = checkPathEligibility(
              path.id,
              progress.lessonsCompleted,
              progress.quizResults,
            );
            const isEarned = certificates.some((c) => c.pathId === path.id);

            return (
              <Card key={path.id} className="border-border/60 bg-card/60 p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-foreground">{path.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">{path.targetRole}</p>
                  </div>
                  {isEarned ? (
                    <Badge
                      variant="default"
                      className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    >
                      Certified
                    </Badge>
                  ) : eligibility.isEligible ? (
                    <Badge
                      variant="default"
                      className="text-[10px] bg-primary/10 text-primary border-primary/20"
                    >
                      Assessment Ready
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px]">
                      In Progress
                    </Badge>
                  )}
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>
                      Lessons: {eligibility.completedLessonsCount} / {eligibility.totalLessonsCount}
                    </span>
                    <span>
                      Quizzes: {eligibility.passedQuizzesCount} / {eligibility.totalQuizzesCount}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/30 flex justify-end">
                  {isEarned ? (
                    <Button asChild variant="outline" size="sm" className="h-7 text-xs gap-1">
                      <Link
                        to="/certificate/$certificateId"
                        params={{
                          certificateId: certificates.find((c) => c.pathId === path.id)!.id,
                        }}
                      >
                        View Certificate <ArrowRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  ) : eligibility.isEligible ? (
                    <Button asChild size="sm" className="h-7 text-xs gap-1 shadow-glow">
                      <Link to="/assessment/$pathId" params={{ pathId: path.id }}>
                        Take Assessment <Sparkles className="h-3 w-3" />
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild variant="ghost" size="sm" className="h-7 text-xs gap-1">
                      <Link to="/assessment/$pathId" params={{ pathId: path.id }}>
                        View Requirements <Lock className="h-3 w-3" />
                      </Link>
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
