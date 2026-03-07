"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Edit, PackageSearch, Plus, Trash2 } from "lucide-react";

import { categoryAPI, productAPI, uploadImage } from "@/lib/api";
import { getColorNameFromHex } from "@/lib/colorName";
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

type ProductStatus = "AVAILABLE" | "LOW_STOCK" | "OUT_OF_STOCK" | string;

type CategoryItem = {
  id: string;
  name: string;
  name_en?: string | null;
};

type ProductImage = {
  url: string;
  alt?: string;
  isPrimary?: boolean;
};

type ProductColor = {
  name: string;
  hexCode?: string;
};

type ProductItem = {
  id: string;
  name?: string;
  name_en?: string | null;
  name_gu?: string | null;
  description?: string | null;
  description_en?: string | null;
  description_gu?: string | null;
  price?: number | null;
  categoryId?: string | null;
  category?: CategoryItem | null;
  totalStock?: number | null;
  availableStock?: number | null;
  status: ProductStatus;
  images?: ProductImage[];
  colors?: ProductColor[];
};

type ProductForm = {
  name: string;
  nameEn: string;
  nameGu: string;
  description: string;
  descriptionEn: string;
  descriptionGu: string;
  price: string;
  categoryId: string;
  totalStock: string;
  availableStock: string;
  images: ProductImage[];
  colors: ProductColor[];
};

const initialProductForm: ProductForm = {
  name: "",
  nameEn: "",
  nameGu: "",
  description: "",
  descriptionEn: "",
  descriptionGu: "",
  price: "",
  categoryId: "",
  totalStock: "",
  availableStock: "",
  images: [],
  colors: [],
};

const emptyImageSrc =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [formData, setFormData] = useState<ProductForm>(initialProductForm);

  const totalProducts = useMemo(() => products.length, [products]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsData, categoriesData] = await Promise.all([
          productAPI.getAll(),
          categoryAPI.getAll(),
        ]);
        setProducts(Array.isArray(productsData) ? (productsData as ProductItem[]) : []);
        setCategories(Array.isArray(categoriesData) ? (categoriesData as CategoryItem[]) : []);
      } catch (error) {
        console.error("Failed to load products and categories", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        productAPI.getAll(),
        categoryAPI.getAll(),
      ]);
      setProducts(Array.isArray(productsData) ? (productsData as ProductItem[]) : []);
      setCategories(Array.isArray(categoriesData) ? (categoriesData as CategoryItem[]) : []);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to load products"));
    }
  };

  const resetForm = () => {
    setFormData(initialProductForm);
    setEditingProduct(null);
    setDialogOpen(false);
  };

  const formatPrice = (price: number | null | undefined) => {
    if (typeof price !== "number") return "-";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(price);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formData.categoryId) {
      toast.error("Please select a category");
      return;
    }

    const payload = {
      ...formData,
      name: formData.nameEn || formData.name || formData.nameGu,
      name_en: formData.nameEn || undefined,
      name_gu: formData.nameGu || undefined,
      description:
        formData.descriptionEn || formData.description || formData.descriptionGu,
      description_en: formData.descriptionEn || undefined,
      description_gu: formData.descriptionGu || undefined,
      price: formData.price ? Number.parseFloat(formData.price) : null,
      totalStock: Number.parseInt(formData.totalStock || "0", 10) || 0,
      availableStock: Number.parseInt(formData.availableStock || "0", 10) || 0,
      images: formData.images.filter((image) => image.url.trim()),
      colors: formData.colors
        .map((color) => ({
          ...color,
          name: color.name.trim(),
          hexCode: color.hexCode?.trim() || undefined,
        }))
        .filter((color) => color.name),
    };

    try {
      if (editingProduct) {
        await productAPI.update(editingProduct.id, payload);
        toast.success("Product updated successfully");
      } else {
        await productAPI.create(payload);
        toast.success("Product created successfully");
      }
      resetForm();
      loadData();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to save product"));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      await productAPI.delete(id);
      toast.success("Product deleted");
      loadData();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to delete product"));
    }
  };

  const handleEdit = (product: ProductItem) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || "",
      nameEn: product.name_en || product.name || "",
      nameGu: product.name_gu || "",
      description: product.description || "",
      descriptionEn: product.description_en || product.description || "",
      descriptionGu: product.description_gu || "",
      price: product.price?.toString() || "",
      categoryId: product.categoryId || "",
      totalStock: product.totalStock?.toString() || "",
      availableStock: product.availableStock?.toString() || "",
      images: product.images || [],
      colors: product.colors || [],
    });
    setDialogOpen(true);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (formData.images.length >= 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }

    try {
      toast.loading("Uploading image...");
      const response = await uploadImage(file);
      setFormData((previous) => ({
        ...previous,
        images: [
          ...previous.images,
          {
            url: response.url,
            alt: previous.nameEn || previous.name || file.name,
            isPrimary: previous.images.length === 0,
          },
        ],
      }));
      toast.dismiss();
      toast.success("Image uploaded");
    } catch (error: unknown) {
      toast.dismiss();
      toast.error(getApiErrorMessage(error, "Image upload failed"));
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeImage = (index: number) => {
    setFormData((previous) => {
      const nextImages = previous.images.filter((_, imageIndex) => imageIndex !== index);
      if (nextImages.length > 0 && !nextImages.some((image) => image.isPrimary)) {
        nextImages[0] = { ...nextImages[0], isPrimary: true };
      }
      return { ...previous, images: nextImages };
    });
  };

  const addColor = () => {
    setFormData((previous) => ({
      ...previous,
      colors: [...previous.colors, { name: "", hexCode: "#000000" }],
    }));
  };

  const removeColor = (index: number) => {
    setFormData((previous) => ({
      ...previous,
      colors: previous.colors.filter((_, colorIndex) => colorIndex !== index),
    }));
  };

  const getStatusBadge = (status: ProductStatus) => {
    switch (status) {
      case "AVAILABLE":
        return <Badge variant="green">Available</Badge>;
      case "LOW_STOCK":
        return (
          <Badge className="border-[#7c5a0b] bg-[#fff3d6] text-[#7c5a0b]">
            Low Stock
          </Badge>
        );
      case "OUT_OF_STOCK":
        return <Badge variant="red">Out of Stock</Badge>;
      default:
        return <Badge variant="outline">{status || "Unknown"}</Badge>;
    }
  };

  return (
    <AdminPage>
      <AdminPageHeader
        title="Products"
        description="Manage inventory, stock status, images, and color variants."
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setFormData(initialProductForm);
                  setEditingProduct(null);
                }}
                className="w-full sm:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>

            <DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-5xl">
              <DialogHeader>
                <DialogTitle>{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Name (English) *</Label>
                    <Input
                      value={formData.nameEn}
                      onChange={(event) =>
                        setFormData((previous) => ({
                          ...previous,
                          nameEn: event.target.value,
                          name: event.target.value,
                        }))
                      }
                      required
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

                  <div className="space-y-1.5">
                    <Label>Category *</Label>
                    <Select
                      value={formData.categoryId}
                      onValueChange={(value) =>
                        setFormData((previous) => ({ ...previous, categoryId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name_en || category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      rows={4}
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
                      rows={4}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label>Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={formData.price}
                      onChange={(event) =>
                        setFormData((previous) => ({ ...previous, price: event.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Total Stock</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.totalStock}
                      onChange={(event) =>
                        setFormData((previous) => ({
                          ...previous,
                          totalStock: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Available Stock</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.availableStock}
                      onChange={(event) =>
                        setFormData((previous) => ({
                          ...previous,
                          availableStock: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-3 rounded-xl border border-[var(--shell-border)] bg-[var(--surface-elevated)]/80 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label>Product Images</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={formData.images.length >= 5}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Image
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </div>

                  {formData.images.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Upload up to 5 images. First image is set as primary by default.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {formData.images.map((image, index) => (
                        <div
                          key={`${image.url}-${index}`}
                          className="rounded-xl border border-[var(--shell-border)] bg-card p-3"
                        >
                          <Image
                            loader={({ src }) => src}
                            unoptimized
                            src={image.url || emptyImageSrc}
                            alt={image.alt || "Product image"}
                            width={320}
                            height={128}
                            className="h-32 w-full rounded-lg object-cover"
                          />

                          <p className="mt-2 line-clamp-2 min-h-9 text-xs text-muted-foreground">
                            {image.alt || "Untitled image"}
                          </p>

                          <div className="mt-3 flex items-center justify-between gap-2">
                            <label className="flex items-center gap-1 text-sm">
                              <input
                                type="radio"
                                name="primaryImage"
                                checked={Boolean(image.isPrimary)}
                                className="accent-[var(--primary)]"
                                onChange={() => {
                                  setFormData((previous) => ({
                                    ...previous,
                                    images: previous.images.map((item, imageIndex) => ({
                                      ...item,
                                      isPrimary: imageIndex === index,
                                    })),
                                  }));
                                }}
                              />
                              Primary
                            </label>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              className="h-8 px-2.5"
                              onClick={() => removeImage(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3 rounded-xl border border-[var(--shell-border)] bg-[var(--surface-elevated)]/80 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label>Product Colors</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addColor}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Color
                    </Button>
                  </div>

                  {formData.colors.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Add color options to help customers choose product variants.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {formData.colors.map((color, index) => (
                        <div
                          key={`${color.hexCode}-${index}`}
                          className="grid gap-2 rounded-lg border border-[var(--shell-border)] bg-card p-3 sm:grid-cols-[56px_1fr_130px_auto]"
                        >
                          <input
                            type="color"
                            value={color.hexCode || "#000000"}
                            className="h-10 w-14 cursor-pointer rounded-md border border-[var(--shell-border)]"
                            onChange={(event) => {
                              const hexCode = event.target.value;
                              setFormData((previous) => {
                                const nextColors = [...previous.colors];
                                const current = nextColors[index];
                                nextColors[index] = {
                                  ...current,
                                  hexCode,
                                  name: current.name || getColorNameFromHex(hexCode),
                                };
                                return { ...previous, colors: nextColors };
                              });
                            }}
                          />

                          <Input
                            placeholder="Color name"
                            value={color.name}
                            onChange={(event) => {
                              setFormData((previous) => {
                                const nextColors = [...previous.colors];
                                nextColors[index] = {
                                  ...nextColors[index],
                                  name: event.target.value,
                                };
                                return { ...previous, colors: nextColors };
                              });
                            }}
                          />

                          <Input
                            placeholder="#000000"
                            value={color.hexCode || ""}
                            onChange={(event) => {
                              setFormData((previous) => {
                                const nextColors = [...previous.colors];
                                nextColors[index] = {
                                  ...nextColors[index],
                                  hexCode: event.target.value,
                                };
                                return { ...previous, colors: nextColors };
                              });
                            }}
                          />

                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeColor(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit">{editingProduct ? "Update" : "Create"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      >
        <Badge variant="secondary">Total Products: {totalProducts}</Badge>
      </AdminPageHeader>

      {loading ? (
        <AdminLoadingState label="Loading products..." />
      ) : products.length === 0 ? (
        <AdminEmptyState
          title="No products found"
          description="Add your first product to build the catalog."
          icon={PackageSearch}
        />
      ) : (
        <AdminPanel className="space-y-3">
          <div className="space-y-3 md:hidden">
            {products.map((product) => (
              <div
                key={product.id}
                className="rounded-xl border border-[var(--shell-border)] bg-[var(--surface-elevated)] p-4"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-base font-semibold text-foreground">
                      {product.name_en || product.name || "-"}
                    </p>
                    {product.name_gu ? (
                      <p className="text-xs text-muted-foreground">{product.name_gu}</p>
                    ) : null}
                    <p className="text-sm text-muted-foreground">
                      {product.category?.name || "-"}
                    </p>
                  </div>
                  {getStatusBadge(product.status)}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border border-[var(--shell-border)] bg-card p-2.5">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Price</p>
                    <p className="mt-1 font-medium text-foreground">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[var(--shell-border)] bg-card p-2.5">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Stock</p>
                    <p className="mt-1 font-medium text-foreground">
                      {product.availableStock ?? 0} / {product.totalStock ?? 0}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(product)}>
                    <Edit className="mr-1.5 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(product.id)}
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
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      <div>{product.name_en || product.name || "-"}</div>
                      {product.name_gu ? (
                        <div className="text-xs text-muted-foreground">{product.name_gu}</div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.category?.name || "-"}
                    </TableCell>
                    <TableCell>{formatPrice(product.price)}</TableCell>
                    <TableCell>
                      {product.availableStock ?? 0} / {product.totalStock ?? 0}
                    </TableCell>
                    <TableCell>{getStatusBadge(product.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(product)}>
                          <Edit className="mr-1.5 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(product.id)}
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
