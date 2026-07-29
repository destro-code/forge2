import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useCommandPalette } from "@/lib/hooks/use-command-palette";
import { useTheme } from "@/lib/hooks/use-theme";
import {
  LayoutDashboard,
  GraduationCap,
  Terminal,
  Sparkles,
  Bug,
  MessagesSquare,
  FolderKanban,
  Trophy,
  LineChart,
  Settings,
  Sun,
  Moon,
  BookOpen,
  Library,
} from "lucide-react";

export function CommandPalette() {
  const { open, setOpen, toggle } = useCommandPalette();
  const navigate = useNavigate();
  const { toggle: toggleTheme, theme } = useTheme();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  const go = (to: string) => {
    setOpen(false);
    navigate({ to });
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search Forge — jump to a page, lesson or action…" />
      <CommandList className="max-h-[420px]">
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => go("/")}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </CommandItem>
          <CommandItem onSelect={() => go("/learn")}>
            <GraduationCap className="mr-2 h-4 w-4" />
            Learn
          </CommandItem>
          <CommandItem onSelect={() => go("/learn/lessons")}>
            <BookOpen className="mr-2 h-4 w-4" />
            All lessons
          </CommandItem>
          <CommandItem onSelect={() => go("/playground")}>
            <Terminal className="mr-2 h-4 w-4" />
            Code Playground
          </CommandItem>
          <CommandItem onSelect={() => go("/debug-lab")}>
            <Bug className="mr-2 h-4 w-4" />
            Debug Lab
          </CommandItem>
          <CommandItem onSelect={() => go("/interview")}>
            <MessagesSquare className="mr-2 h-4 w-4" />
            Interview Room
          </CommandItem>
          <CommandItem onSelect={() => go("/mentor")}>
            <Sparkles className="mr-2 h-4 w-4" />
            AI Mentor
          </CommandItem>
          <CommandItem onSelect={() => go("/projects")}>
            <FolderKanban className="mr-2 h-4 w-4" />
            Projects
          </CommandItem>
          <CommandItem onSelect={() => go("/progress")}>
            <LineChart className="mr-2 h-4 w-4" />
            Progress
          </CommandItem>
          <CommandItem onSelect={() => go("/achievements")}>
            <Trophy className="mr-2 h-4 w-4" />
            Achievements
          </CommandItem>
          <CommandItem onSelect={() => go("/resources")}>
            <Library className="mr-2 h-4 w-4" />
            Resources
          </CommandItem>
          <CommandItem onSelect={() => go("/settings")}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => {
              setOpen(false);
              toggleTheme();
            }}
          >
            {theme === "dark" ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            Toggle theme
          </CommandItem>
          <CommandItem onSelect={() => go("/mentor")}>
            <Sparkles className="mr-2 h-4 w-4" />
            New mentor chat
          </CommandItem>
          <CommandItem onSelect={() => go("/challenges")}>Open today's challenge</CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
