import { Link, useRouterState } from "@tanstack/react-router";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Bell, Command, Moon, Search, Sun, User } from "lucide-react";
import { useCommandPalette } from "@/lib/hooks/use-command-palette";
import { useTheme } from "@/lib/hooks/use-theme";
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
  learn: "Learn",
  modules: "Modules",
  topics: "Topics",
  lessons: "Lessons",
  lesson: "Lesson",
  practice: "Practice",
  projects: "Projects",
  "debug-lab": "Debug Lab",
  interview: "Interview Room",
  session: "Session",
  mentor: "AI Mentor",
  playground: "Playground",
  quizzes: "Quizzes",
  flashcards: "Flashcards",
  bookmarks: "Bookmarks",
  resources: "Resources",
  docs: "Docs",
  progress: "Progress",
  achievements: "Achievements",
  statistics: "Statistics",
  challenges: "Daily Challenges",
  settings: "Settings",
  about: "About",
};

function useCrumbs() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const parts = path.split("/").filter(Boolean);
  const crumbs = [{ label: "Home", to: "/" as const }];
  let acc = "";
  parts.forEach((p) => {
    acc += "/" + p;
    crumbs.push({ label: LABELS[p] ?? p, to: acc as "/" });
  });
  return crumbs;
}

export function TopBar() {
  const { setOpen } = useCommandPalette();
  const { theme, toggle } = useTheme();
  const crumbs = useCrumbs();

  return (
    <header className="glass-panel sticky top-0 z-30 flex h-14 items-center gap-2 border-b px-3 sm:px-4">
      <SidebarTrigger className="h-8 w-8" />

      <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-sm sm:flex">
        {crumbs.map((c, i) => (
          <div key={c.to + i} className="flex min-w-0 items-center gap-1.5">
            {i > 0 && <span className="text-muted-foreground/50">/</span>}
            <Link
              to={c.to}
              className="truncate text-muted-foreground transition hover:text-foreground"
            >
              {c.label}
            </Link>
          </div>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="hidden h-9 items-center gap-2 rounded-lg border bg-background/40 px-3 text-sm text-muted-foreground transition hover:bg-accent/60 md:flex md:w-72"
          aria-label="Open command palette"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Search or jump to…</span>
          <kbd className="ml-2 inline-flex items-center gap-0.5 rounded border border-border/60 bg-muted px-1.5 py-0.5 text-[10px] font-medium">
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
