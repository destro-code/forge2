import { Link, useRouterState } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Layers,
  FolderKanban,
  Bug,
  MessagesSquare,
  Sparkles,
  Terminal,
  ListChecks,
  Zap,
  Bookmark,
  Library,
  FileText,
  LineChart,
  Trophy,
  BarChart3,
  Calendar,
  Award,
  Settings,
  Info,
  Flame,
  Blocks,
  BookOpenText,
  FolderTree,
  PenTool,
  Brain,
} from "lucide-react";
import { useProgress } from "@/lib/hooks/use-progress";
import { cn } from "@/lib/utils";

type Tier = "core" | "secondary" | "utility";

type Item = {
  title: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  tier: Tier;
};

const startItems: Item[] = [{ title: "Dashboard", to: "/", icon: LayoutDashboard, tier: "core" }];

const learnItems: Item[] = [
  { title: "Learn", to: "/learn", icon: GraduationCap, tier: "core" },
  { title: "Modules", to: "/learn/modules", icon: Layers, tier: "secondary" },
  { title: "Topics", to: "/learn/topics", icon: FolderTree, tier: "secondary" },
  { title: "Lessons", to: "/learn/lessons", icon: BookOpen, tier: "secondary" },
];

const practiceItems: Item[] = [
  { title: "Quizzes", to: "/quizzes", icon: ListChecks, tier: "core" },
  { title: "Debug Lab", to: "/debug-lab", icon: Bug, tier: "core" },
  { title: "Code Playground", to: "/playground", icon: Terminal, tier: "core" },
  { title: "Interview Academy", to: "/interview", icon: MessagesSquare, tier: "core" },
  { title: "Projects", to: "/projects", icon: FolderKanban, tier: "secondary" },
  { title: "Flashcards", to: "/flashcards", icon: Blocks, tier: "secondary" },
  { title: "Daily Challenges", to: "/challenges", icon: Zap, tier: "secondary" },
  { title: "Whiteboard Mode", to: "/whiteboard", icon: PenTool, tier: "secondary" },
];

const progressItems: Item[] = [
  { title: "Progress Dashboard", to: "/progress", icon: LineChart, tier: "core" },
  { title: "Skill Mastery", to: "/mastery", icon: Brain, tier: "core" },
  { title: "Analytics Engine", to: "/analytics", icon: BarChart3, tier: "core" },
  { title: "Achievements", to: "/achievements", icon: Trophy, tier: "core" },
  { title: "Certificates", to: "/certificates", icon: Award, tier: "secondary" },
];

const supportItems: Item[] = [{ title: "AI Mentor", to: "/mentor", icon: Sparkles, tier: "core" }];

const utilityItems: Item[] = [
  { title: "Journal", to: "/journal", icon: BookOpenText, tier: "utility" },
  { title: "Schedule", to: "/calendar", icon: Calendar, tier: "utility" },
  { title: "Bookmarks", to: "/bookmarks", icon: Bookmark, tier: "utility" },
  { title: "Resources", to: "/resources", icon: Library, tier: "utility" },
  { title: "Docs", to: "/docs", icon: FileText, tier: "utility" },
  { title: "Settings", to: "/settings", icon: Settings, tier: "utility" },
];

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const progress = useProgress();

  const isActive = (to: string) =>
    to === "/" ? path === "/" : path === to || path.startsWith(to + "/");

  const renderItem = (item: Item) => {
    const active = isActive(item.to);
    const Icon = item.icon;

    let textStyle = "text-xs font-medium text-foreground/90";
    let iconStyle = "h-4 w-4 shrink-0 text-primary/80 group-hover/link:text-primary";
    let buttonClass = "";

    if (item.tier === "core") {
      textStyle = active
        ? "text-xs font-semibold text-primary"
        : "text-xs font-medium text-foreground/90 group-hover/link:text-foreground";
      iconStyle = active
        ? "h-4 w-4 shrink-0 text-primary"
        : "h-4 w-4 shrink-0 text-primary/80 group-hover/link:text-primary group-hover/link:scale-105 transition-transform";
      buttonClass = active
        ? collapsed
          ? "bg-primary/15 text-primary font-semibold rounded-md"
          : "bg-primary/10 text-primary font-semibold border-l-2 border-primary rounded-r-md rounded-l-none pl-2.5"
        : "";
    } else if (item.tier === "secondary") {
      textStyle = active
        ? "text-xs font-medium text-foreground"
        : "text-xs font-normal text-muted-foreground group-hover/link:text-foreground";
      iconStyle = active
        ? "h-4 w-4 shrink-0 text-foreground"
        : "h-4 w-4 shrink-0 text-muted-foreground/70 group-hover/link:text-foreground/80";
      buttonClass = active ? "bg-sidebar-accent/80 text-foreground" : "";
    } else {
      textStyle = active
        ? "text-xs font-medium text-foreground"
        : "text-xs font-normal text-muted-foreground/80 group-hover/link:text-foreground/90";
      iconStyle = active
        ? "h-3.5 w-3.5 shrink-0 text-foreground"
        : "h-3.5 w-3.5 shrink-0 text-muted-foreground/60 group-hover/link:text-foreground/70";
      buttonClass = active ? "bg-sidebar-accent/60 text-foreground" : "";
    }

    return (
      <SidebarMenuItem key={item.to + item.title}>
        <SidebarMenuButton
          asChild
          isActive={active}
          tooltip={collapsed ? item.title : undefined}
          className={buttonClass}
        >
          <Link to={item.to} className="group/link flex items-center gap-2.5">
            <Icon className={iconStyle} />
            {!collapsed && <span className={cn("truncate", textStyle)}>{item.title}</span>}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  const renderGroup = (label: string, items: Item[]) => (
    <SidebarGroup>
      {!collapsed && (
        <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 px-2 py-1">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>{items.map(renderItem)}</SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="px-3 pt-3">
        <Link
          to="/"
          className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-sidebar-accent/60"
        >
          <div
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md shadow-sm"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Flame className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold leading-tight">Forge</div>
              <div className="truncate text-xs font-medium text-muted-foreground/80">
                Frontend Academy
              </div>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="scrollbar-thin space-y-1">
        {renderGroup("Start", startItems)}
        {renderGroup("Learn", learnItems)}
        {renderGroup("Practice", practiceItems)}
        {renderGroup("Progress", progressItems)}
        {renderGroup("Global Support", supportItems)}
        {renderGroup("Utility", utilityItems)}
      </SidebarContent>

      <SidebarFooter className="px-3 pb-3">
        {!collapsed ? (
          <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/30 p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium">
                <Flame className="h-3.5 w-3.5 text-primary" />
                Learning Streak
              </span>
              <span className="text-xs font-semibold text-primary">{progress.streakDays}d</span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-sidebar-border">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: "72%", background: "var(--gradient-primary)" }}
              />
            </div>
          </div>
        ) : (
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-sidebar-accent/40">
            <Flame className="h-4 w-4 text-primary" />
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
