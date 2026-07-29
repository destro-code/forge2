import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, RotateCcw, SlidersHorizontal } from "lucide-react";
import type { Category, LearningPath, Difficulty } from "@/lib/types";

interface CurriculumFilterBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  categoryId: string;
  onCategoryChange: (id: string) => void;
  difficulty: Difficulty | "All";
  onDifficultyChange: (diff: Difficulty | "All") => void;
  pathId: string;
  onPathChange: (id: string) => void;
  categories: Category[];
  learningPaths: LearningPath[];
  activeCount: number;
  onReset: () => void;
}

export function CurriculumFilterBar({
  query,
  onQueryChange,
  categoryId,
  onCategoryChange,
  difficulty,
  onDifficultyChange,
  pathId,
  onPathChange,
  categories,
  learningPaths,
  activeCount,
  onReset,
}: CurriculumFilterBarProps) {
  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-card/50 p-4 backdrop-blur-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search modules, topics, keywords or tags..."
            className="h-10 pl-9 bg-background/60"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap gap-2 sm:flex-nowrap">
          {/* Category Dropdown */}
          <Select value={categoryId} onValueChange={onCategoryChange}>
            <SelectTrigger className="h-10 w-[180px] bg-background/60">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Difficulty Dropdown */}
          <Select
            value={difficulty}
            onValueChange={(val) => onDifficultyChange(val as Difficulty | "All")}
          >
            <SelectTrigger className="h-10 w-[140px] bg-background/60">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Levels</SelectItem>
              <SelectItem value="Beginner">Beginner</SelectItem>
              <SelectItem value="Intermediate">Intermediate</SelectItem>
              <SelectItem value="Advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>

          {/* Learning Path Dropdown */}
          <Select value={pathId} onValueChange={onPathChange}>
            <SelectTrigger className="h-10 w-[180px] bg-background/60">
              <SelectValue placeholder="Learning Path" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Learning Paths</SelectItem>
              {learningPaths.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Reset Action */}
          {activeCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-10 gap-1.5 px-3 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset ({activeCount})
            </Button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-1.5 border-t border-border/40 pt-3 text-xs">
        <span className="mr-1 text-muted-foreground flex items-center gap-1">
          <SlidersHorizontal className="h-3 w-3" /> Quick Filter:
        </span>
        <Badge
          variant={categoryId === "all" ? "default" : "outline"}
          className="cursor-pointer font-normal transition hover:opacity-80"
          onClick={() => onCategoryChange("all")}
        >
          All
        </Badge>
        {categories.map((c) => (
          <Badge
            key={c.id}
            variant={categoryId === c.id ? "default" : "outline"}
            className="cursor-pointer font-normal transition hover:opacity-80"
            onClick={() => onCategoryChange(c.id)}
          >
            {c.name}
          </Badge>
        ))}
      </div>
    </div>
  );
}
