import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useLocation,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { motion } from "framer-motion";
import appCss from "../styles.css?url";
import "../design-overrides.css";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { CommandPalette } from "@/components/layout/command-palette";
import { KeyboardShortcutsModal } from "@/components/layout/keyboard-shortcuts-modal";
import { Toaster } from "@/components/ui/sonner";
import { useTheme } from "@/lib/hooks/use-theme";
import { RuntimeDebugConsole } from "@/components/debug/runtime-debug-console";

function NotFoundComponent() {
  return (
    <div className="grid min-h-dvh place-items-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">404</div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">This page hasn't been forged yet</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The route you're looking for doesn't exist in the Academy.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="grid min-h-dvh place-items-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something broke</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You can try again or head back to the dashboard.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Forge — Frontend Engineering Academy" },
      {
        name: "description",
        content:
          "Forge is a premium AI-powered frontend engineering academy that takes you from beginner to production-ready and interview-ready.",
      },
      { property: "og:title", content: "Forge — Frontend Engineering Academy" },
      { property: "og:description", content: "Premium AI-powered frontend engineering academy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "icon", href: "/forge-logo.svg", type: "image/svg+xml" },
      { rel: "shortcut icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AppLayout() {
  useTheme(); // hydrate theme
  const location = useLocation();
  const isLessonRoute = location.pathname.startsWith("/lesson");

  return (
    <SidebarProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-xs focus:font-bold focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>
      <div className="forge-grid flex min-h-dvh w-full bg-background text-foreground">
        {!isLessonRoute && <AppSidebar />}
        <div className="relative flex min-w-0 flex-1 flex-col">
          {!isLessonRoute && <TopBar />}
          <main id="main-content" tabIndex={-1} className="relative flex-1 focus:outline-none">
            {isLessonRoute ? (
              <Outlet />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="mx-auto w-full max-w-[1360px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-9"
              >
                <Outlet />
              </motion.div>
            )}
          </main>
        </div>
        <CommandPalette />
        <KeyboardShortcutsModal />
        {import.meta.env.DEV && <RuntimeDebugConsole />}
        <Toaster />
      </div>
    </SidebarProvider>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AppLayout />
    </QueryClientProvider>
  );
}
