import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { LayoutGrid } from "lucide-react";

import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

type AdminPageProps = React.ComponentProps<"div">;

export function AdminPage({ className, ...props }: AdminPageProps) {
  return <div className={cn("space-y-6 p-4 md:p-6", className)} {...props} />;
}

type AdminPageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
};

export function AdminPageHeader({
  title,
  description,
  actions,
  children,
}: AdminPageHeaderProps) {
  return (
    <div className="rounded-2xl border border-[var(--shell-border)] bg-[var(--card)]/85 px-4 py-4 shadow-[0_10px_28px_rgba(24,20,18,0.08)] md:px-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
          ) : null}
          {children ? <div className="mt-3">{children}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

type AdminPanelProps = React.ComponentProps<"section">;

export function AdminPanel({ className, ...props }: AdminPanelProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-[var(--shell-border)] bg-[var(--card)]/88 p-3 shadow-[0_12px_28px_rgba(24,20,18,0.08)] md:p-4",
        className,
      )}
      {...props}
    />
  );
}

export function AdminLoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <AdminPanel className="flex min-h-[260px] items-center justify-center">
      <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner className="h-4 w-4" />
        {label}
      </div>
    </AdminPanel>
  );
}

type AdminEmptyStateProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
};

export function AdminEmptyState({
  title,
  description,
  icon: Icon = LayoutGrid,
}: AdminEmptyStateProps) {
  return (
    <AdminPanel className="flex min-h-[260px] items-center justify-center">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </AdminPanel>
  );
}
