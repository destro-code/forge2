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
  Compass,
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
  Network,
  PenTool,
  Brain,
} from "lucide-react";
import { useProgress } from "@/lib/hooks/use-progress";

type Item = { title: string; to: string; icon: React.ComponentType<{ className?: string }> };

const learn: Item[] = [
  { title: "Dashboard", to: "/", icon: LayoutDashboard },
  { title: "Academy Roadmap", to: "/learn", icon: GraduationCap },
  { title: "Curriculum Modules", to: "/learn/modules", icon: Layers },
  { title: "Chapter Topics", to: "/learn/topics", icon: FolderTree },
  { title: "Lesson Catalog", to: "/learn/lessons", icon: BookOpen },
];
const practice: Item[] = [
  { title: "Practice", to: "/practice", icon: ListChecks },
  { title: "Whiteboard Mode", to: "/whiteboard", icon: PenTool },
  { title: "Playground", to: "/playground", icon: Terminal },
  { title: "Debug Lab", to: "/debug-lab", icon: Bug },
  { title: "Projects", to: "/projects", icon: FolderKanban },
  { title: "Quizzes", to: "/quizzes", icon: ListChecks },
  { title: "Flashcards", to: "/flashcards", icon: Blocks },
  { title: "Daily Challenges", to: "/challenges", icon: Zap },
];
const grow: Item[] = [
  { title: "Mastery Engine", to: "/mastery", icon: Brain },
  { title: "Certificates", to: "/certificates", icon: Award },
  { title: "Journal", to: "/journal", icon: BookOpenText },
  { title: "Interview Room", to: "/interview", icon: MessagesSquare },
  { title: "AI Mentor", to: "/mentor", icon: Sparkles },
  { title: "Progress", to: "/progress", icon: LineChart },
  { title: "Achievements", to: "/achievements", icon: Trophy },
  { title: "Statistics", to: "/statistics", icon: BarChart3 },
  { title: "Calendar", to: "/calendar", icon: Calendar },
];
const misc: Item[] = [
  { title: "Bookmarks", to: "/bookmarks", icon: Bookmark },
  { title: "Resources", to: "/resources", icon: Library },
  { title: "Docs", to: "/docs", icon: FileText },
  { title: "Settings", to: "/settings", icon: Settings },
  { title: "About", to: "/about", icon: Info },
];

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const progress = useProgress();

  const isActive = (to: string) =>
    to === "/" ? path === "/" : path === to || path.startsWith(to + "/");

  const renderGroup = (label: string, items: Item[]) => (
    <SidebarGroup>
      {!collapsed && (
        <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.to + item.title}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.to)}
                tooltip={collapsed ? item.title : undefined}
              >
                <Link to={item.to} className="group/link flex items-center gap-2.5">
                  <item.icon className="h-[18px] w-[18px] shrink-0 opacity-80 group-hover/link:opacity-100" />
                  {!collapsed && <span className="truncate text-[13px]">{item.title}</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-3 pt-3">
        <Link
          to="/"
          className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-sidebar-accent/60"
        >
          <div
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Flame className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold leading-tight">Forge</div>
              <div className="truncate text-[10px] uppercase tracking-widest text-muted-foreground">
                Frontend Academy
              </div>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="scrollbar-thin">
        {renderGroup("Learn", learn)}
        {renderGroup("Practice", practice)}
        {renderGroup("Grow", grow)}
        {renderGroup("More", misc)}
      </SidebarContent>

      <SidebarFooter className="px-3 pb-3">
        {!collapsed ? (
          <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Flame className="h-3.5 w-3.5 text-primary" />
              Streak
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tabular-nums">{progress.streakDays}</span>
              <span className="text-xs text-muted-foreground">days</span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-sidebar-border">
              <div
                className="h-full rounded-full"
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
