"use client";

import Sidebar from "@/components/layouts/Sidebar";
import { adminAuthAPI, pageSettingsAPI, PageConstructionSetting } from "./api";
import { usePathname } from "next/navigation";
import {
  Clock3,
  CircleUserRound,
  ChevronRight,
  Menu,
  AlertTriangle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";

function getTitleFromPath(pathname: string) {
  if (pathname === "/" || pathname === "/admin") {
    return "Dashboard";
  }

  const segments = pathname.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1];

  return lastSegment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getTimeString() {
  return new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getStoredAdminDetails() {
  if (typeof window === "undefined") {
    return { name: "Admin", role: "" };
  }

  try {
    const storedAdmin = localStorage.getItem("admin");
    if (!storedAdmin) {
      return { name: "Admin", role: "" };
    }

    const admin = JSON.parse(storedAdmin);
    return {
      name: admin?.name || "Admin",
      role: admin?.role || "",
    };
  } catch {
    console.error("Failed to read admin from storage");
    return { name: "Admin", role: "" };
  }
}

const normalizeAdminTogglePath = (pathname: string): string => {
  const effectivePath = pathname === "/" ? "/login" : pathname;
  if (effectivePath.startsWith("/_admin")) {
    return effectivePath;
  }
  return `/_admin${effectivePath}`;
};

function AdminUnderConstructionScreen({
  pageStatus,
}: {
  pageStatus: PageConstructionSetting;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--shell-bg)] px-4 py-12">
      <div className="w-full max-w-xl rounded-3xl border bg-[var(--card)] p-8 text-center shadow-[0_18px_56px_rgba(21,21,21,0.12)]">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <h1 className="text-2xl font-semibold">Admin Page Under Construction</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {pageStatus.message ||
            "This admin screen is temporarily unavailable while updates are in progress."}
        </p>

        <p className="mt-5 text-xs text-muted-foreground">
          Path:{" "}
          <span className="font-medium text-foreground">
            {pageStatus.path.replace("/_admin", "") || "/"}
          </span>
        </p>

        <div className="mt-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function LayoutSwitcher({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthenticated = adminAuthAPI.isAuthenticated();

  const [clock, setClock] = useState<string>(getTimeString());
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [pageStatus, setPageStatus] = useState<PageConstructionSetting | null>(
    null
  );
  const [isCheckingPageStatus, setIsCheckingPageStatus] = useState(true);
  const { name: adminName, role: adminRole } = useMemo(
    () => getStoredAdminDetails(),
    []
  );

  const pageTitle = getTitleFromPath(pathname);

  useEffect(() => {
    if (!isAuthenticated) return;
    const intervalId = setInterval(() => setClock(getTimeString()), 1000);
    return () => clearInterval(intervalId);
  }, [isAuthenticated]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    let isActive = true;
    const settingPath = normalizeAdminTogglePath(pathname);

    const checkAdminPage = async () => {
      try {
        setIsCheckingPageStatus(true);
        const setting = await pageSettingsAPI.check(settingPath, `Admin: ${pageTitle}`);
        if (!isActive) {
          return;
        }
        setPageStatus(setting);
      } catch {
        if (!isActive) {
          return;
        }
        setPageStatus(null);
      } finally {
        if (isActive) {
          setIsCheckingPageStatus(false);
        }
      }
    };

    checkAdminPage();

    return () => {
      isActive = false;
    };
  }, [pathname, pageTitle]);

  const initial = useMemo(
    () => adminName?.trim()?.charAt(0)?.toUpperCase() || "A",
    [adminName],
  );

  if (isCheckingPageStatus) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--shell-border)] bg-[var(--card)] px-4 py-2 text-sm text-muted-foreground">
          <Spinner className="h-4 w-4" />
          Loading page...
        </div>
      </main>
    );
  }

  if (pageStatus?.isUnderConstruction) {
    return <AdminUnderConstructionScreen pageStatus={pageStatus} />;
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen text-foreground page-enter">
        <Sidebar
          desktopOpen={desktopSidebarOpen}
          onDesktopToggle={() => setDesktopSidebarOpen((prev) => !prev)}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />

        <main
          className={`min-h-screen p-2 transition-[margin] duration-300 md:p-4 ${
            desktopSidebarOpen ? "md:ml-[282px]" : "md:ml-0"
          }`}
        >
          <div className="flex min-h-[calc(100vh-0.5rem)] flex-col rounded-[24px] border border-[var(--shell-border)] bg-[var(--surface-soft)]/75 p-3 shadow-[0_18px_40px_rgba(22,20,18,0.08)] md:min-h-[calc(100vh-2rem)] md:p-4">
            <header className="mb-4 flex min-h-[68px] flex-wrap items-center justify-between gap-3 rounded-[18px] border border-[var(--shell-border)] bg-[var(--surface-elevated)]/95 px-3 py-2 shadow-[0_8px_16px_rgba(22,20,18,0.06)] md:px-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-[var(--card)] text-foreground shadow-sm md:hidden"
                  onClick={() => setMobileOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                {!desktopSidebarOpen && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hidden rounded-full border border-[var(--shell-border)] bg-[var(--card)] text-foreground shadow-sm md:inline-flex"
                    onClick={() => setDesktopSidebarOpen((prev) => !prev)}
                    aria-label="Open sidebar"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                )}
                <h2 className="text-base font-semibold tracking-tight text-foreground md:text-lg">
                  {pageTitle}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden items-center gap-1.5 rounded-full border border-[var(--shell-border)] bg-[var(--card)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)] sm:inline-flex">
                  <Clock3 className="h-3.5 w-3.5" />
                  {clock}
                </span>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--shell-border)] bg-[var(--card)] text-xs font-semibold text-foreground shadow-sm"
                        aria-label="Admin profile"
                      >
                        {initial}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="mr-1 rounded-md bg-popover p-3 text-popover-foreground">
                      <div className="flex items-center gap-2">
                        <CircleUserRound className="h-4 w-4 text-[var(--muted-foreground)]" />
                        <div>
                          <p className="text-sm font-medium">{adminName}</p>
                          <p className="text-xs text-[var(--muted-foreground)]">{adminRole}</p>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </header>

            <section className="flex-1 overflow-hidden rounded-[18px] border border-[var(--shell-border)] bg-[var(--surface-elevated)]/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
              <div className="h-full overflow-auto">{children}</div>
            </section>
          </div>
        </main>
      </div>
    );
  }

  return <main className="page-enter">{children}</main>;
}
