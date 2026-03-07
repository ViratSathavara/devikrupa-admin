"use client";

import { useEffect, useMemo, useState } from "react";
import { Edit, Layers3, Plus, Trash2 } from "lucide-react";

import { categoryAPI } from "@/lib/api";
import { getApiErrorMessage, toast } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from "@/components/ui/textarea";
import {
  AdminEmptyState,
  AdminLoadingState,
  AdminPage,
  AdminPageHeader,
  AdminPanel,
} from "@/components/layouts/AdminPageShell";

type CategoryStatus = "ACTIVE" | "HIDDEN";

type CategoryItem = {
  id: string;
  name: string;
  name_en?: string | null;
  name_gu?: string | null;
  description?: string | null;
  description_en?: string | null;
  description_gu?: string | null;
  status: CategoryStatus;
  displayOrder?: number | null;
};

type CategoryForm = {
  name: string;
  nameEn: string;
  nameGu: string;
  description: string;
  descriptionEn: string;
  descriptionGu: string;
  status: CategoryStatus;
  displayOrder: number;
};

const initialCategoryForm: CategoryForm = {
  name: "",
  nameEn: "",
  nameGu: "",
  description: "",
  descriptionEn: "",
  descriptionGu: "",
  status: "ACTIVE",
  displayOrder: 0,
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [formData, setFormData] = useState<CategoryForm>(initialCategoryForm);

  const totalCount = useMemo(() => categories.length, [categories]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await categoryAPI.getAll();
        setCategories(Array.isArray(data) ? (data as CategoryItem[]) : []);
      } catch (error) {
        console.error("Failed to load categories", error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoryAPI.getAll();
      setCategories(Array.isArray(data) ? (data as CategoryItem[]) : []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load categories"));
    }
  };

  const resetForm = () => {
    setFormData(initialCategoryForm);
    setEditingCategory(null);
    setDialogOpen(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      ...formData,
      name: formData.nameEn || formData.name || formData.nameGu,
      name_en: formData.nameEn || undefined,
      name_gu: formData.nameGu || undefined,
      description:
        formData.descriptionEn || formData.description || formData.descriptionGu,
      description_en: formData.descriptionEn || undefined,
      description_gu: formData.descriptionGu || undefined,
    };

    try {
      if (editingCategory) {
        await categoryAPI.update(editingCategory.id, payload);
        toast.success("Category updated");
      } else {
        await categoryAPI.create(payload);
        toast.success("Category created");
      }
      resetForm();
      loadCategories();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to save category"));
    }
  };

  const handleEdit = (category: CategoryItem) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || "",
      nameEn: category.name_en || category.name || "",
      nameGu: category.name_gu || "",
      description: category.description || "",
      descriptionEn: category.description_en || category.description || "",
      descriptionGu: category.description_gu || "",
      status: category.status,
      displayOrder: category.displayOrder ?? 0,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;

    try {
      await categoryAPI.delete(id);
      toast.success("Category deleted");
      loadCategories();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to delete category"));
    }
  };

  const getStatusBadge = (status: CategoryStatus) => (
    <Badge variant={status === "ACTIVE" ? "green" : "red"}>
      {status === "ACTIVE" ? "Active" : "Hidden"}
    </Badge>
  );

  return (
    <AdminPage>
      <AdminPageHeader
        title="Categories"
        description="Create and manage category details for product grouping."
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setFormData(initialCategoryForm);
                  setEditingCategory(null);
                }}
                className="w-full sm:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>

            <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Name (English) *</Label>
                    <Input
                      required
                      value={formData.nameEn}
                      onChange={(event) =>
                        setFormData((previous) => ({
                          ...previous,
                          nameEn: event.target.value,
                          name: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Name (Gujarati)</Label>
                    <Input
                      value={formData.nameGu}
                      onChange={(event) =>
                        setFormData((previous) => ({
                          ...previous,
                          nameGu: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Description (English)</Label>
                    <Textarea
                      value={formData.descriptionEn}
                      onChange={(event) =>
                        setFormData((previous) => ({
                          ...previous,
                          descriptionEn: event.target.value,
                          description: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Description (Gujarati)</Label>
                    <Textarea
                      value={formData.descriptionGu}
                      onChange={(event) =>
                        setFormData((previous) => ({
                          ...previous,
                          descriptionGu: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: CategoryStatus) =>
                        setFormData((previous) => ({ ...previous, status: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                        <SelectItem value="HIDDEN">HIDDEN</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Display Order</Label>
                    <Input
                      type="number"
                      value={formData.displayOrder}
                      onChange={(event) =>
                        setFormData((previous) => ({
                          ...previous,
                          displayOrder: Number(event.target.value),
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit">{editingCategory ? "Update" : "Create"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      >
        <Badge variant="secondary">Total Categories: {totalCount}</Badge>
      </AdminPageHeader>

      {loading ? (
        <AdminLoadingState label="Loading categories..." />
      ) : categories.length === 0 ? (
        <AdminEmptyState
          title="No categories found"
          description="Create your first category to organize products."
          icon={Layers3}
        />
      ) : (
        <AdminPanel className="space-y-3">
          <div className="space-y-3 md:hidden">
            {categories.map((category) => (
              <div
                key={category.id}
                className="rounded-xl border border-[var(--shell-border)] bg-[var(--surface-elevated)] p-4"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-foreground">
                      {category.name_en || category.name}
                    </p>
                    {category.name_gu ? (
                      <p className="text-xs text-muted-foreground">{category.name_gu}</p>
                    ) : null}
                  </div>
                  {getStatusBadge(category.status)}
                </div>

                <p className="text-sm text-muted-foreground">
                  {category.description || "No description"}
                </p>

                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Display Order:{" "}
                  <span className="text-foreground">{category.displayOrder ?? 0}</span>
                </p>

                <div className="mt-4 flex items-center justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(category)}>
                    <Edit className="mr-1.5 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(category.id)}
                  >
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
                  <TableHead>Description</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">
                      <div>{category.name_en || category.name}</div>
                      {category.name_gu ? (
                        <div className="text-xs text-muted-foreground">{category.name_gu}</div>
                      ) : null}
                    </TableCell>
                    <TableCell className="max-w-sm text-muted-foreground">
                      {category.description || "-"}
                    </TableCell>
                    <TableCell>{category.displayOrder ?? 0}</TableCell>
                    <TableCell>{getStatusBadge(category.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(category)}>
                          <Edit className="mr-1.5 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(category.id)}
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
    </AdminPage>
  );
}
