"use client";

import { useEffect, useRef, useState } from "react";
import { productAPI, categoryAPI, uploadImage } from "@/lib/api";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/toast";
import { Plus, Edit, Trash2 } from "lucide-react";
import { getColorNameFromHex } from "@/lib/colorName";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    totalStock: "",
    availableStock: "",
    images: [] as { url: string; alt?: string; isPrimary?: boolean }[],
    colors: [] as { name: string; hexCode?: string }[],
  });

  const formatPrice = (price: number | null | undefined) => {
    if (typeof price !== "number") return "-";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(price);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        productAPI.getAll(),
        categoryAPI.getAll(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Failed to load products and categories", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : null,
        totalStock: parseInt(formData.totalStock) || 0,
        availableStock: parseInt(formData.availableStock) || 0,
        images: formData.images.filter(img => img.url.trim()),
        colors: formData.colors.filter(color => color.name.trim()),
      };

      if (editingProduct) {
        await productAPI.update(editingProduct.id, payload);
        toast.success("Product updated successfully");
      } else {
        await productAPI.create(payload);
        toast.success("Product created successfully");
      }
      resetForm();
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save product");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await productAPI.delete(id);
      toast.success("Product deleted");
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete product");
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || "",
      description: product.description || "",
      price: product.price?.toString() || "",
      categoryId: product.categoryId || "",
      totalStock: product.totalStock?.toString() || "",
      availableStock: product.availableStock?.toString() || "",
      images: product.images || [],
      colors: product.colors || [],
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      categoryId: "",
      totalStock: "",
      availableStock: "",
      images: [],
      colors: [],
    });
    setEditingProduct(null);
    setDialogOpen(false);
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (formData.images.length >= 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }

    try {
      toast.loading("Uploading image...");
      const res = await uploadImage(file);

      setFormData((prev) => ({
        ...prev,
        images: [
          ...prev.images,
          {
            url: res.url,
            alt: prev.name || file.name,
            isPrimary: prev.images.length === 0,
          },
        ],
      }));

      toast.dismiss();
      toast.success("Image uploaded");
    } catch {
      toast.dismiss();
      toast.error("Image upload failed");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };


  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const addColor = () => {
    setFormData({
      ...formData,
      colors: [...formData.colors, { name: "", hexCode: "" }],
    });
  };

  const removeColor = (index: number) => {
    setFormData({
      ...formData,
      colors: formData.colors.filter((_, i) => i !== index),
    });
  };

  const getStatusBadge = (status: string) => {
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
        return null;
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[92vh] sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total Stock</Label>
                  <Input
                    type="number"
                    value={formData.totalStock}
                    onChange={(e) => setFormData({ ...formData, totalStock: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Available Stock</Label>
                  <Input
                    type="number"
                    value={formData.availableStock}
                    onChange={(e) => setFormData({ ...formData, availableStock: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Label>Product Images</Label>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
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

                {formData.images.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Upload images one by one. First image will be primary by default.
                  </p>
                )}

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {formData.images.map((image, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-[var(--border)] bg-[var(--card)]/70 p-3"
                    >
                      <Image
                        loader={({ src }) => src}
                        unoptimized
                        src={
                          image.url ||
                          "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
                        }
                        alt={image.alt || "Product image"}
                        width={320}
                        height={128}
                        className="h-32 w-full rounded object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                          if (fallback) fallback.classList.remove("hidden");
                        }}
                      />
                      <div className="hidden h-32 w-full items-center justify-center rounded bg-[var(--muted)]/40 text-xs text-[var(--muted-foreground)]">
                        Preview unavailable
                      </div>

                      <p className="mt-2 line-clamp-2 min-h-9 text-xs text-[var(--muted-foreground)]">
                        {image.alt || "Untitled image"}
                      </p>

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <label className="flex items-center gap-1 text-sm">
                          <input
                            type="radio"
                            name="primaryImage"
                            checked={image.isPrimary}
                            className="accent-[var(--primary)]"
                            onChange={() => {
                              const newImages = formData.images.map((img, i) => ({
                                ...img,
                                isPrimary: i === index,
                              }));
                              setFormData({ ...formData, images: newImages });
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

                {formData.images.length >= 5 && (
                  <p className="text-xs text-red-500">
                    Maximum 5 images allowed
                  </p>
                )}
              </div>

              {/* Colors */}
              <div className="space-y-2">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Label>Product Colors</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={addColor}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Color
                  </Button>
                </div>

                {formData.colors.map((color, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-[var(--border)] bg-[var(--card)]/70 p-3"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                      <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-[56px_minmax(0,1fr)_132px]">
                      {/* Color Name */}
                      <input
                        type="color"
                        value={color.hexCode || "#000000"}
                        onChange={(e) => {
                          const hex = e.target.value;
                          const newColors = [...formData.colors];

                          newColors[index].hexCode = hex;

                          // Auto-generate color name
                          if (!newColors[index].name) {
                            newColors[index].name = getColorNameFromHex(hex);
                          }

                          setFormData({ ...formData, colors: newColors });
                        }}
                        className="h-10 w-14 cursor-pointer rounded-md border border-[var(--border)]"
                      />


                      {/* Hex Code (manual) */}
                      <Input
                        placeholder="Hex code (e.g., #FF0000)"
                        value={color.hexCode || ""}
                        onChange={(e) => {
                          const newColors = [...formData.colors];
                          newColors[index].hexCode = e.target.value;
                          setFormData({ ...formData, colors: newColors });
                        }}
                      />

                      {/* Color Picker */}
                      <div className="flex items-center gap-2 sm:justify-end">
                        <input
                          type="color"
                          value={color.hexCode || "#000000"}
                          onChange={(e) => {
                            const newColors = [...formData.colors];
                            newColors[index].hexCode = e.target.value;
                            setFormData({ ...formData, colors: newColors });
                          }}
                          className="h-10 w-14 cursor-pointer rounded-md border border-[var(--border)]"
                        />

                        {/* Color Preview */}
                        <div
                          className="h-10 w-10 rounded-md border border-[var(--border)]"
                          style={{ backgroundColor: color.hexCode || "#ffffff" }}
                        />
                      </div>
                    </div>

                    {/* Remove Color */}
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="self-end sm:self-auto"
                      onClick={() => removeColor(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    </div>
                  </div>
                ))}

                {formData.colors.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Add product colors using name, hex code, or color picker.
                  </p>
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
      </div>

      {loading ? (
        <div className="text-center py-12">Loading products...</div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {products.length === 0 ? (
              <div className="rounded-2xl border border-[#ded8d2] bg-[#f9f7f5] p-6 text-center text-sm text-[#6f6761]">
                No products found
              </div>
            ) : (
              products.map((product) => (
                <div
                  key={product.id}
                  className="rounded-2xl border border-[#ded8d2] bg-[#f9f7f5] p-4 shadow-[0_6px_20px_rgba(31,27,24,0.08)]"
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-base font-semibold text-[#2f2b29]">{product.name}</p>
                      <p className="text-sm text-[#736a64]">{product.category?.name || "-"}</p>
                    </div>
                    {getStatusBadge(product.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border border-[#e6e0db] bg-white/55 p-2.5">
                      <p className="text-xs uppercase tracking-wide text-[#7a716a]">Price</p>
                      <p className="mt-1 font-medium text-[#2f2b29]">
                        {formatPrice(product.price)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[#e6e0db] bg-white/55 p-2.5">
                      <p className="text-xs uppercase tracking-wide text-[#7a716a]">Stock</p>
                      <p className="mt-1 font-medium text-[#2f2b29]">
                        {product.availableStock} / {product.totalStock}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(product)}
                    >
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
              ))
            )}
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
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-[#6f6761]">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-[#6d655f]">{product.category?.name || "-"}</TableCell>
                      <TableCell>
                        {formatPrice(product.price)}
                      </TableCell>
                      <TableCell>
                        {product.availableStock} / {product.totalStock}
                      </TableCell>
                      <TableCell>{getStatusBadge(product.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(product)}
                          >
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


