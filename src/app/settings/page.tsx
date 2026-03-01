"use client";

import Link from "next/link";
import {
  Users,
  ShieldCheck,
  Settings,
  Sliders,
} from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage system configuration and admin controls
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

        <SettingsCard
          title="Admin Users"
          description="Create, update and manage admin roles"
          href="/settings/admin-users"
          icon={<Users className="w-6 h-6" />}
        />

        <SettingsCard
          title="Security"
          description="Passwords, sessions and access control"
          href="/settings/security"
          icon={<ShieldCheck className="w-6 h-6" />}
          disabled
        />

        <SettingsCard
          title="System Settings"
          description="Application level configuration"
          href="/settings/system"
          icon={<Sliders className="w-6 h-6" />}
          disabled
        />

        {/* Future Ready */}
        <SettingsCard
          title="General"
          description="Branding, preferences and defaults"
          href="/settings/general"
          icon={<Settings className="w-6 h-6" />}
          disabled
        />

      </div>
    </div>
  );
}

/* =================================
   Settings Card Component
================================= */
function SettingsCard({
  title,
  description,
  href,
  icon,
  disabled = false,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border)] p-6 opacity-50 cursor-not-allowed">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-muted p-3">{icon}</div>
          <div>
            <h3 className="font-medium">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="
        group rounded-xl border border-[var(--border)]
        bg-[var(--card)] p-6 transition-all
        hover:border-[var(--primary)]
        hover:shadow-md
      "
    >
      <div className="flex items-center gap-4">
        <div
          className="
            rounded-lg p-3
            bg-[var(--primary)]/10
            text-[var(--primary)]
            group-hover:bg-[var(--primary)]
            group-hover:text-white
            transition
          "
        >
          {icon}
        </div>

        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}
