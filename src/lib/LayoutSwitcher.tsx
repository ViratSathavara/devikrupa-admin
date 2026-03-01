"use client";

import Sidebar from "@/components/layouts/Sidebar";
import { adminAuthAPI } from "./api";
import { usePathname } from "next/navigation";
import {
  Clock3,
  CircleUserRound,
  ChevronRight,
  Menu,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

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
  const { adminName, adminRole } = useMemo(() => getStoredAdminDetails(), []);

  const pageTitle = getTitleFromPath(pathname);

  useEffect(() => {
    if (!isAuthenticated) return;
    const intervalId = setInterval(() => setClock(getTimeString()), 1000);
    return () => clearInterval(intervalId);
  }, [isAuthenticated]);

  const initial = useMemo(
    () => adminName?.trim()?.charAt(0)?.toUpperCase() || "A",
    [adminName],
  );

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--shell-bg)] text-foreground">
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
          <div className="flex min-h-[calc(100vh-0.5rem)] flex-col rounded-[24px] border border-[var(--shell-border)] bg-[var(--shell-bg)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] md:min-h-[calc(100vh-2rem)] md:p-4">
            <header className="mb-4 flex min-h-[68px] flex-wrap items-center justify-between gap-3 rounded-[18px] border border-[var(--shell-border)] bg-[var(--shell-card)] px-3 py-2 md:px-4">
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
                <h2 className="text-base font-semibold text-foreground md:text-lg">
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

            <section className="flex-1 overflow-hidden rounded-[18px] border border-[var(--shell-border)] bg-card">
              <div className="h-full overflow-auto">{children}</div>
            </section>
          </div>
        </main>
      </div>
    );
  }

  return <main>{children}</main>;
}
