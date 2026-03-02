"use client";

import { useEffect, useState } from "react";
import { categoryAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/toast";
import { Plus, Edit, Trash2 } from "lucide-react";

type CategoryForm = {
    name: string;
    description: string;
    status: "ACTIVE" | "INACTIVE";
    displayOrder: number;
};

export default function CategoriesPage() {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);

    const [formData, setFormData] = useState<CategoryForm>({
        name: "",
        description: "",
        status: "ACTIVE",
        displayOrder: 0,
    });

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const data = await categoryAPI.getAll();
            setCategories(data);
        } catch (error) {
            console.error("Failed to load categories", error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            status: "ACTIVE",
            displayOrder: 0,
        });
        setEditingCategory(null);
        setDialogOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingCategory) {
                await categoryAPI.update(editingCategory.id, formData);
                toast.success("Category updated");
            } else {
                await categoryAPI.create(formData);
                toast.success("Category created");
            }

            resetForm();
            loadCategories();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to save category");
        }
    };

    const handleEdit = (category: any) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            description: category.description || "",
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
        } catch {
            toast.error("Failed to delete category");
        }
    };

    const getStatusBadge = (status: string) => (
        <Badge variant={status === "ACTIVE" ? "green" : "red"}>
            {status === "ACTIVE" ? "Active" : "Inactive"}
        </Badge>
    );

    return (
        <div className="p-4 md:p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Categories</h1>
                    <p className="text-muted-foreground">
                        Manage product categories
                    </p>
                </div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={resetForm} className="w-full sm:w-auto">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Category
                        </Button>
                    </DialogTrigger>

                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingCategory ? "Edit Category" : "Add Category"}
                            </DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label>Name *</Label>
                                <Input
                                    required
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                />
                            </div>

                            <div>
                                <Label>Description</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                />
                            </div>

                            <div>
                                <Label>Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(v: any) =>
                                        setFormData({ ...formData, status: v })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                                        <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Display Order</Label>
                                <Input
                                    type="number"
                                    value={formData.displayOrder}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            displayOrder: Number(e.target.value),
                                        })
                                    }
                                />
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={resetForm}>
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    {editingCategory ? "Update" : "Create"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <p className="text-center py-10">Loading...</p>
            ) : (
                <>
                    <div className="space-y-3 md:hidden">
                        {categories.length === 0 ? (
                            <div className="rounded-2xl border border-[#ded8d2] bg-[#f9f7f5] p-6 text-center text-sm text-[#6f6761]">
                                No categories found
                            </div>
                        ) : (
                            categories.map((cat) => (
                                <div
                                    key={cat.id}
                                    className="rounded-2xl border border-[#ded8d2] bg-[#f9f7f5] p-4 shadow-[0_6px_20px_rgba(31,27,24,0.08)]"
                                >
                                    <div className="mb-3 flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-base font-semibold text-[#2f2b29]">{cat.name}</p>
                                            <p className="mt-1 text-sm text-[#736a64]">
                                                {cat.description || "No description"}
                                            </p>
                                        </div>
                                        {getStatusBadge(cat.status)}
                                    </div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-[#756c67]">
                                        Display Order: <span className="text-[#2f2b29]">{cat.displayOrder ?? 0}</span>
                                    </p>
                                    <div className="mt-4 flex items-center justify-end gap-2">
                                        <Button size="sm" variant="outline" onClick={() => handleEdit(cat)}>
                                            <Edit className="mr-1.5 h-4 w-4" />
                                            Edit
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleDelete(cat.id)}>
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
                                    <TableHead>Description</TableHead>
                                    <TableHead>Order</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {categories.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-10 text-center text-[#6f6761]">
                                            No categories found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    categories.map((cat) => (
                                        <TableRow key={cat.id}>
                                            <TableCell className="font-medium">{cat.name}</TableCell>
                                            <TableCell className="max-w-sm text-[#6c645e]">{cat.description || "-"}</TableCell>
                                            <TableCell>{cat.displayOrder}</TableCell>
                                            <TableCell>{getStatusBadge(cat.status)}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleEdit(cat)}
                                                    >
                                                        <Edit className="mr-1.5 h-4 w-4" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleDelete(cat.id)}
                                                    >
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
        </div>
    );
}

