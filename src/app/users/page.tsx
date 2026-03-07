"use client";

import { Users2 } from "lucide-react";
import {
  AdminEmptyState,
  AdminPage,
  AdminPageHeader,
} from "@/components/layouts/AdminPageShell";

export default function UsersPage() {
  return (
    <AdminPage>
      <AdminPageHeader
        title="Users"
        description="This module is ready for customer or internal user management."
      />
      <AdminEmptyState
        title="User management is not configured yet"
        description="Connect your user API and controls to manage permissions, status, and access."
        icon={Users2}
      />
    </AdminPage>
  );
}
