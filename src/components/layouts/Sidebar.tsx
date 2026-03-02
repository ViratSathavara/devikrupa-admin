"use client";

import Link from "next/link";
import { useAdminAuth } from "@/lib/admin-auth-context";
import {
  Home,
  ClipboardList,
  LogOut,
  X,
  Layers,
  Package,
  Settings,
  ChevronLeft,
  ChevronRight,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import logo from "../../../public/logo-new-light.png";

type SidebarProps = {
  desktopOpen: boolean;
  onDesktopToggle: () => void;
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function Sidebar({
  desktopOpen,
  onDesktopToggle,
  mobileOpen,
  setMobileOpen,
}: SidebarProps) {
  const { logout, admin } = useAdminAuth();
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (hoveredPath && hoveredPath !== path) return false;
    return pathname === path;
  };

  const items = [
    {
      href: "/dashboard",
      icon: <Home className="h-4 w-4" />,
      label: "Dashboard",
    },
    {
      href: "/categories",
      icon: <Layers className="h-4 w-4" />,
      label: "Categories",
    },
    {
      href: "/products",
      icon: <Package className="h-4 w-4" />,
      label: "Products",
    },
    {
      href: "/inquiries",
      icon: <ClipboardList className="h-4 w-4" />,
      label: "My Inquiries",
    },
    {
      href: "/testimonials",
      icon: <Star className="h-4 w-4" />,
      label: "Testimonials",
    },
    {
      href: "/settings",
      icon: <Settings className="h-4 w-4" />,
      label: "Settings",
    },
  ];

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/45 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-full max-w-[282px]
          transition-transform duration-300 ease-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          ${desktopOpen ? "md:translate-x-0" : "md:-translate-x-full"}
        `}
      >
        <div className="h-full p-3 md:p-4">
          <div className="flex h-full flex-col rounded-[20px] border border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] text-[var(--sidebar-foreground)] shadow-[0_24px_48px_rgba(18,17,17,0.24)]">
            <div className="mb-3 flex items-center justify-between border-b border-[var(--sidebar-border)] px-4 pb-5 pt-6">
              <Image
                src={logo}
                alt="Devikrupa Electricals"
                width={120}
                height={28}
                className="h-auto w-[118px]"
                priority
              />
              <button
                type="button"
                className="hidden rounded-full border border-[var(--sidebar-border)] p-1.5 text-[var(--sidebar-foreground)] md:inline-flex hover:bg-white/10"
                aria-label="Collapse sidebar"
                onClick={onDesktopToggle}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="text-[var(--sidebar-foreground)] hover:bg-white/10 hover:text-white md:hidden"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="px-4 pb-3 md:hidden">
              <p className="text-sm font-semibold">{admin?.role}</p>
              <p className="text-xs text-white/70">{admin?.email}</p>
            </div>

            <nav className="flex-1 space-y-1.5 px-3">
              {items.map((item) => (
                <SidebarItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  active={isActive(item.href)}
                  onHover={setHoveredPath}
                  onNavigate={() => setMobileOpen(false)}
                />
              ))}
            </nav>

            <div className="border-t border-[var(--sidebar-border)] p-3">
              <Button
                onClick={logout}
                className="h-11 w-full justify-start gap-3 rounded-xl text-sm font-medium text-[var(--sidebar-foreground)] hover:bg-white/10 hover:text-white"
                variant="ghost"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function SidebarItem({
  href,
  icon,
  label,
  active,
  onHover,
  onNavigate,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onHover: (path: string | null) => void;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onMouseEnter={() => onHover(href)}
      onMouseLeave={() => onHover(null)}
      onClick={onNavigate}
      className={`
          flex items-center justify-between gap-3
          rounded-xl px-3 py-2.5
          text-sm font-medium transition-all
          ${
            active
              ? "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-fg)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]"
              : "text-[var(--sidebar-foreground)] hover:bg-white/10 hover:text-white"
          }
        `}
    >
      <span className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </span>
      <ChevronRight className="h-3.5 w-3.5 opacity-65" />
    </Link>
  );
}
