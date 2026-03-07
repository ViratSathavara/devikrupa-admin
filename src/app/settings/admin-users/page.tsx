"use client";

import { useEffect, useState } from "react";
import { Edit, Plus, ShieldUser, Trash2 } from "lucide-react";

import { adminAPI } from "@/lib/api";
import { getApiErrorMessage, toast } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AdminEmptyState,
  AdminLoadingState,
  AdminPage,
  AdminPageHeader,
  AdminPanel,
} from "@/components/layouts/AdminPageShell";

type AdminRole = "ADMIN" | "SUPER_ADMIN";

type AdminForm = {
  name: string;
  email: string;
  password?: string;
  role: AdminRole;
};

type AdminItem = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
};

const initialForm: AdminForm = {
  name: "",
  email: "",
  password: "",
  role: "ADMIN",
};

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<AdminItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<AdminForm>(initialForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchAdmins = async () => {
    try {
      const data = await adminAPI.getAll();
      setAdmins(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load admins", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const resetForm = () => {
    setForm(initialForm);
    setEditId(null);
  };

  const closeDialog = () => {
    resetForm();
    setIsOpen(false);
  };

  const openCreate = () => {
    resetForm();
    setIsOpen(true);
  };

  const openEdit = async (id: string) => {
    try {
      const admin = await adminAPI.getById(id);
      setForm({ ...admin, password: "" });
      setEditId(id);
      setIsOpen(true);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load admin"));
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email) {
      toast.error("Name and email are required");
      return;
    }

    setSubmitting(true);
    try {
      if (editId) {
        await adminAPI.update(editId, form);
        toast.success("Admin updated");
      } else {
        await adminAPI.create(form);
        toast.success("Admin created");
      }
      closeDialog();
      fetchAdmins();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Something went wrong"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this admin?")) return;
    try {
      await adminAPI.delete(id);
      toast.success("Admin deleted");
      fetchAdmins();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Delete failed"));
    }
  };

  const getRoleBadge = (role: AdminRole) => {
    if (role === "SUPER_ADMIN") {
      return (
        <Badge className="border-[#0e5f39] bg-[#dbf6e8] text-[#0e5f39]">
          Super Admin
        </Badge>
      );
    }

    return <Badge className="border-[#4f83f0] bg-[#e7efff] text-[#1f56cc]">Admin</Badge>;
  };

  return (
    <AdminPage>
      <AdminPageHeader
        title="Admin Users"
        description="Manage admin access and account roles."
        actions={
          <Button onClick={openCreate} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Admin
          </Button>
        }
      >
        <Badge variant="secondary">Total Admins: {admins.length}</Badge>
      </AdminPageHeader>

      {loading ? (
        <AdminLoadingState label="Loading admins..." />
      ) : admins.length === 0 ? (
        <AdminEmptyState
          title="No admins found"
          description="Create the first admin account to start access management."
          icon={ShieldUser}
        />
      ) : (
        <AdminPanel className="space-y-3">
          <div className="space-y-3 md:hidden">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="rounded-xl border border-[var(--shell-border)] bg-[var(--surface-elevated)] p-4"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-foreground">{admin.name}</p>
                    <p className="text-sm text-muted-foreground">{admin.email}</p>
                  </div>
                  {getRoleBadge(admin.role)}
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(admin.id)}>
                    <Edit className="mr-1.5 h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(admin.id)}>
                    <Trash2 className="mr-1.5 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">{admin.name}</TableCell>
                    <TableCell className="text-muted-foreground">{admin.email}</TableCell>
                    <TableCell>{getRoleBadge(admin.role)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(admin.id)}>
                          <Edit className="mr-1.5 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(admin.id)}
                        >
                          <Trash2 className="mr-1.5 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </AdminPanel>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editId ? "Update Admin" : "Create Admin"}</DialogTitle>
            <DialogDescription>Manage admin access and permissions.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="admin-name">Name</Label>
              <Input
                id="admin-name"
                placeholder="Enter name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                placeholder="Enter email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder={editId ? "New password (optional)" : "Password"}
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={form.role}
                onValueChange={(value: AdminRole) => setForm({ ...form, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                  <SelectItem value="SUPER_ADMIN">SUPER ADMIN</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={closeDialog} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Saving..." : editId ? "Update Admin" : "Create Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}
