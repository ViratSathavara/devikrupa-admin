"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  Languages,
  Settings,
  ShieldCheck,
  Sliders,
  Star,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  AdminPage,
  AdminPageHeader,
  AdminPanel,
} from "@/components/layouts/AdminPageShell";

type SettingsCardConfig = {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
  disabled?: boolean;
  badge?: string;
};

const settingsCards: SettingsCardConfig[] = [
  {
    title: "Admin Users",
    description: "Create, update, and manage admin roles and access.",
    href: "/settings/admin-users",
    icon: <Users className="h-5 w-5" />,
    badge: "Core",
  },
  {
    title: "System Settings",
    description: "Control page visibility and under-construction modes.",
    href: "/settings/system",
    icon: <Sliders className="h-5 w-5" />,
    badge: "Core",
  },
  {
    title: "Language Manager",
    description: "Manage dictionary, phrases, translation rules, and learning.",
    href: "/settings/language",
    icon: <Languages className="h-5 w-5" />,
  },
  {
    title: "Testimonials",
    description: "Review and remove public customer testimonials.",
    href: "/testimonials",
    icon: <Star className="h-5 w-5" />,
  },
  {
    title: "Security",
    description: "Passwords, sessions, and access policies.",
    href: "/settings/security",
    icon: <ShieldCheck className="h-5 w-5" />,
    disabled: true,
    badge: "Soon",
  },
  {
    title: "General",
    description: "Branding preferences and app defaults.",
    href: "/settings/general",
    icon: <Settings className="h-5 w-5" />,
    disabled: true,
    badge: "Soon",
  },
];

export default function SettingsPage() {
  return (
    <AdminPage>
      <AdminPageHeader
        title="Settings"
        description="Manage system configuration and admin controls."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {settingsCards.map((card) => (
          <SettingsCard key={card.title} card={card} />
        ))}
      </div>
    </AdminPage>
  );
}

function SettingsCard({ card }: { card: SettingsCardConfig }) {
  const content = (
    <AdminPanel
      className={cn(
        "h-full p-0 transition-transform duration-200",
        card.disabled
          ? "cursor-not-allowed opacity-60"
          : "hover:-translate-y-0.5 hover:border-primary/40",
      )}
    >
      <div className="flex h-full flex-col gap-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {card.icon}
          </div>
          {card.badge ? (
            <Badge variant={card.disabled ? "outline" : "secondary"}>{card.badge}</Badge>
          ) : null}
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">{card.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{card.description}</p>
        </div>
      </div>
    </AdminPanel>
  );

  if (card.disabled) {
    return content;
  }

  return (
    <Link href={card.href} className="block">
      {content}
    </Link>
  );
}
