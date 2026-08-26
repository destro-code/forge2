import { Link, useRouterState } from "@tanstack/react-router";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Bell, Command, Moon, Search, Sun, User } from "lucide-react";
import { useCommandPalette } from "@/lib/hooks/use-command-palette";
import { useTheme } from "@/lib/hooks/use-theme";
import { contentProvider } from "@/lib/providers/content-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

const LABELS: Record<string, string> = {
  "": "Dashboard",
  learn: "Learning Paths",
  modules: "Modules",
  topics: "Topics",
  lessons: "Lessons",
  lesson: "Lesson",
  practice: "Practice",
  projects: "Projects",
  "debug-lab": "Debug Lab",
  interview: "Mock Interviews",
  session: "Session",
  mentor: "AI Mentor",
  playground: "Code Playground",
  quizzes: "Quizzes",
  flashcards: "Flashcards",
  bookmarks: "Bookmarks",
  resources: "Resources",
  docs: "Docs",
  progress: "Progress Tracker",
  mastery: "Skill Mastery",
  achievements: "Achievements",
  statistics: "Statistics",
  challenges: "Daily Challenges",
  settings: "Settings",
  about: "About",
};

function useCrumbs() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return [];
  const crumbs = [{ label: "Home", to: "/" as const }];
  let acc = "";
  parts.forEach((p) => {
    acc += "/" + p;
    let label = LABELS[p];
    if (!label) {
      const lesson = contentProvider.getLesson(p);
      if (lesson) label = lesson.title;
      else {
        const topic = contentProvider.getTopic(p);
        if (topic) label = topic.title;
        else {
          const project = contentProvider.getProject(p);
          if (project) label = project.title;
          else {
            const moduleItem = contentProvider.getModule(p);
            if (moduleItem) label = moduleItem.title;
            else {
              const quiz = contentProvider.getQuiz(p);
              if (quiz) label = quiz.title;
              else {
                const bug = contentProvider.getBug(p);
                if (bug) label = bug.title;
                else label = p;
              }
            }
          }
        }
      }
    }
    crumbs.push({ label, to: acc as "/" });
  });
  return crumbs;
}

export function TopBar() {
  const { setOpen } = useCommandPalette();
  const { theme, toggle } = useTheme();
  const crumbs = useCrumbs();

  return (
    <header className="glass-panel sticky top-0 z-30 flex h-16 items-center justify-between gap-2 border-b px-3 sm:px-6">
      <div className="flex items-center gap-2 min-w-0 shrink">
        <SidebarTrigger className="h-8 w-8 shrink-0" />

        {/* Mobile Forge Brand Icon Link */}
        <Link
          to="/"
          className="flex items-center gap-1.5 sm:hidden shrink-0 transition-opacity hover:opacity-85"
          aria-label="Forge Home"
        >
          <img
            src="/forge-logo.png"
            alt="Forge"
            width={24}
            height={24}
            className="h-6 w-6 rounded-md object-contain shadow-2xs"
          />
        </Link>

        {/* Desktop Breadcrumb Nav (hidden on root dashboard) */}
        {crumbs.length > 0 && (
          <nav
            aria-label="Breadcrumb"
            className="hidden min-w-0 items-center gap-1.5 text-xs font-medium sm:flex max-w-xs md:max-w-md"
          >
            {crumbs.map((c, i) => (
              <div key={c.to + i} className="flex min-w-0 items-center gap-1.5 shrink">
                {i > 0 && <span className="text-muted-foreground/40 shrink-0">/</span>}
                <Link
                  to={c.to}
                  className={
                    i === crumbs.length - 1
                      ? "truncate text-foreground font-semibold min-w-0"
                      : "truncate text-muted-foreground/80 transition hover:text-foreground min-w-0"
                  }
                >
                  {c.label}
                </Link>
              </div>
            ))}
          </nav>
        )}

        {/* Mobile Contextual Indicator (hidden on root dashboard) */}
        {crumbs.length > 0 && (
          <div className="flex min-w-0 items-center gap-1 text-xs font-medium sm:hidden">
            {crumbs.length > 1 && (
              <span className="text-muted-foreground/70 text-[11px] shrink-0 max-w-[80px] truncate">
                {crumbs[crumbs.length - 2]?.label}
              </span>
            )}
            {crumbs.length > 1 && <span className="text-muted-foreground/40 shrink-0">/</span>}
            <span className="truncate font-semibold text-foreground max-w-[130px]">
              {crumbs[crumbs.length - 1]?.label}
            </span>
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="hidden h-8 items-center gap-2 rounded-lg border border-border/50 bg-muted/20 px-2.5 text-xs text-muted-foreground transition hover:bg-muted/40 md:flex md:w-64"
          aria-label="Open command palette"
        >
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
          <span className="flex-1 text-left">Search or jump to…</span>
          <kbd className="ml-2 inline-flex items-center gap-0.5 rounded border border-border/50 bg-muted/50 px-1.5 py-0.5 text-xs font-medium">
            <Command className="h-3 w-3" /> K
          </kbd>
        </button>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Search"
          onClick={() => setOpen(true)}
        >
          <Search className="h-4 w-4" />
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="border-b px-3 py-2 text-sm font-medium">Notifications</div>
            <ul className="max-h-72 divide-y overflow-auto text-sm">
              <li className="p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Daily challenge ready</span>
                  <Badge variant="secondary">New</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Debug a stale closure in a React counter.
                </p>
              </li>
              <li className="p-3">
                <div className="font-medium">Achievement unlocked</div>
                <p className="mt-1 text-xs text-muted-foreground">Seven Days Strong · silver</p>
              </li>
              <li className="p-3">
                <div className="font-medium">Mentor tip</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  You've been practicing useEffect — try Break My Code.
                </p>
              </li>
            </ul>
          </PopoverContent>
        </Popover>

        <Button
          variant="ghost"
          size="icon"
          className="hidden sm:flex text-muted-foreground hover:text-foreground"
          aria-label="Keyboard Shortcuts (?)"
          title="Keyboard Shortcuts (?)"
          onClick={() => {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "?" }));
          }}
        >
          <kbd className="grid h-6 w-6 place-items-center rounded border border-border/80 bg-muted/40 text-[11px] font-mono font-bold">
            ?
          </kbd>
        </Button>

        <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={toggle}>
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Profile menu">
              <div className="grid h-7 w-7 place-items-center rounded-full border border-border/60 bg-muted text-xs font-semibold">
                <User className="h-3.5 w-3.5" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Signed in as Learner</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/progress">My progress</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/achievements">Achievements</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/about">About Forge</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
