import { Link } from "@tanstack/react-router";
import { ArrowRight, PlayCircle, Clock, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Lesson } from "@/lib/types";

interface QuickResumeBarProps {
  lesson: Lesson;
  progressPercent: number;
}

export function QuickResumeBar({ lesson, progressPercent }: QuickResumeBarProps) {
  return (
    <Card className="border-primary/20 bg-primary/5 shadow-md flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl relative overflow-hidden group">
      {/* Dynamic Progress Background */}
      <div 
        className="absolute left-0 top-0 bottom-0 bg-primary/10 transition-all duration-1000 ease-out z-0" 
        style={{ width: `${progressPercent}%` }}
      />
      
      <div className="flex items-center gap-4 z-10 w-full md:w-auto">
        <div className="h-10 w-10 shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
          <BookOpen className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[10px] bg-background/50 backdrop-blur-sm border-primary/30 text-primary">
              Up Next
            </Badge>
            <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
              <Clock className="h-3 w-3" /> {lesson.estimatedMinutes}m
            </span>
          </div>
          <h3 className="font-semibold text-foreground text-sm truncate">{lesson.title}</h3>
        </div>
      </div>
      
      <div className="flex items-center gap-4 z-10 w-full md:w-auto shrink-0">
        <div className="hidden md:flex flex-col items-end gap-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Path Progress</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 bg-background rounded-full overflow-hidden border border-border/50">
              <div className="h-full bg-primary" style={{ width: `${progressPercent}%` }} />
            </div>
            <span className="text-xs font-mono font-medium">{progressPercent}%</span>
          </div>
        </div>
        
        <Button asChild className="w-full md:w-auto shadow-glow gap-2" size="sm">
          <Link to="/lesson/$lessonId" params={{ lessonId: lesson.id }}>
            <PlayCircle className="h-4 w-4 fill-current" />
            Resume
          </Link>
        </Button>
      </div>
    </Card>
  );
}
