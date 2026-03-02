"use client";

import React, { useEffect, useState } from "react";
import { toast } from "@/lib/toast";
import { adminAPI } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";

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

type APIError = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

const AdminPage = () => {
  const [admins, setAdmins] = useState<AdminItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<AdminForm>({
    name: "",
    email: "",
    password: "",
    role: "ADMIN",
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const data = await adminAPI.getAll();
      setAdmins(data);
    } catch (error) {
      console.error("Failed to load admins", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ name: "", email: "", password: "", role: "ADMIN" });
    setEditId(null);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email) {
      toast.error("Name and Email are required");
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
      resetForm();
      setIsOpen(false);
      fetchAdmins();
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err !== null && "response" in err
          ? (err as APIError).response?.data?.message || "Something went wrong"
          : "Something went wrong";
      toast.error(message);
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
    } catch {
      toast.error("Delete failed");
    }
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
      console.error("Failed to load admin", error);
    }
  };

  const closeDialog = () => {
    resetForm();
    setIsOpen(false);
  };

  const getRoleBadge = (role: AdminRole) => {
    if (role === "SUPER_ADMIN") {
      return <Badge className="border-[#0e5f39] bg-[#dbf6e8] text-[#0e5f39]">Super Admin</Badge>;
    }

    return <Badge className="border-[#4f83f0] bg-[#e7efff] text-[#1f56cc]">Admin</Badge>;
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[#2f2b29]">Admins</h2>
          <p className="text-sm text-[#756d67]">Manage admin access and permissions</p>
        </div>

        <Button onClick={openCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Admin
        </Button>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-[#6e6660]">Loading...</p>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {admins.length === 0 ? (
              <div className="rounded-2xl border border-[#ded8d2] bg-[#f9f7f5] p-6 text-center text-sm text-[#6f6761]">
                No admins found
              </div>
            ) : (
              admins.map((admin) => (
                <div
                  key={admin.id}
                  className="rounded-2xl border border-[#ded8d2] bg-[#f9f7f5] p-4 shadow-[0_6px_20px_rgba(31,27,24,0.08)]"
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-[#2f2b29]">{admin.name}</p>
                      <p className="text-sm text-[#736a64]">{admin.email}</p>
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
              ))
            )}
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
                {admins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-[#6f6761]">
                      No admins found
                    </TableCell>
                  </TableRow>
                ) : (
                  admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">{admin.name}</TableCell>
                      <TableCell className="text-[#6d655f]">{admin.email}</TableCell>
                      <TableCell>{getRoleBadge(admin.role)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEdit(admin.id)}>
                            <Edit className="mr-1.5 h-4 w-4" />
                            Edit
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(admin.id)}>
                            <Trash2 className="mr-1.5 h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editId ? "Update Admin" : "Create Admin"}</DialogTitle>
            <DialogDescription>Manage admin access and permissions</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="admin-name">Name</Label>
              <Input
                id="admin-name"
                name="name"
                placeholder="Enter name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                name="email"
                placeholder="Enter email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                name="password"
                type="password"
                placeholder={editId ? "New Password (optional)" : "Password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
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
            <Button
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting
                ? "Saving..."
                : editId
                  ? "Update Admin"
                  : "Create Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPage;

