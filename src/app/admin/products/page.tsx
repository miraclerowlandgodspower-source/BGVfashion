"use client";

import React, { useEffect, useState } from "react";
import { Product } from "@/types";
import { formatMoney } from "@/lib/money";

interface ProductFormData {
  id?: string;
  name: string;
  department: "Women" | "Men" | "Unisex";
  category: string;
  price: number;
  salePrice: number | string;
  sku: string;
  stockQuantity: number;
  sizes: string;
  colors: string;
  description: string;
  image: string;
  status: "active" | "draft" | "archived";
  featured: boolean;
  newArrival: boolean;
}

const DEFAULT_FORM: ProductFormData = {
  name: "",
  department: "Women",
  category: "Dresses",
  price: 45000,
  salePrice: "",
  sku: "",
  stockQuantity: 15,
  sizes: "XS, S, M, L, XL",
  colors: "Black, Plum, Gold",
  description: "",
  image: "",
  status: "active",
  featured: false,
  newArrival: true,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/products");
      const json = await res.json();
      if (json.success && json.data?.products) {
        setProducts(json.data.products);
      }
    } catch (err) {
      console.warn("Could not load products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const openAddModal = () => {
    setFormData({
      ...DEFAULT_FORM,
      sku: `BGV-W-${Math.floor(1000 + Math.random() * 9000)}`,
    });
    setModalMode("add");
  };

  const openEditModal = (p: Product) => {
    setFormData({
      id: p.id,
      name: p.name,
      department: p.department,
      category: p.category,
      price: p.price,
      salePrice: p.salePrice ?? "",
      sku: p.sku || "",
      stockQuantity: p.stockQuantity ?? 10,
      sizes: Array.isArray(p.sizes) ? p.sizes.join(", ") : "",
      colors: Array.isArray(p.colors) ? p.colors.join(", ") : "",
      description: p.description,
      image: p.image || "",
      status: p.status || "active",
      featured: Boolean(p.featured),
      newArrival: Boolean(p.newArrival),
    });
    setModalMode("edit");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setSaving(true);
    setNotice("Uploading image...");

    try {
      const res = await fetch(`/api/admin/upload?filename=${encodeURIComponent(file.name)}`, {
        method: "POST",
        body: file,
      });
      const json = await res.json();
      if (json.success) {
        setFormData({ ...formData, image: json.url });
        setNotice("Image uploaded successfully!");
      } else {
        alert(json.error || "Upload failed");
        setNotice("");
      }
    } catch (err) {
      alert("Image upload error");
      setNotice("");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const parsedSizes = formData.sizes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const parsedColors = formData.colors
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

      const payload = {
        ...formData,
        price: Number(formData.price),
        salePrice: formData.salePrice !== "" ? Number(formData.salePrice) : null,
        stockQuantity: Number(formData.stockQuantity),
        sizes: parsedSizes.length > 0 ? parsedSizes : ["Standard"],
        colors: parsedColors.length > 0 ? parsedColors : ["Classic"],
      };

      const method = modalMode === "edit" ? "PUT" : "POST";
      const res = await fetch("/api/admin/products", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save product.");
      }

      setNotice(
        modalMode === "edit"
          ? `Product "${formData.name}" updated successfully.`
          : `New garment "${formData.name}" added to catalogue.`
      );
      setModalMode(null);
      loadProducts();
      setTimeout(() => setNotice(""), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStock = async (product: Product) => {
    const updatedStock = !product.inStock;
    try {
      await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: product.id,
          inStock: updatedStock,
          stockQuantity: updatedStock ? (product.stockQuantity || 10) : 0,
        }),
      });

      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id
            ? {
                ...p,
                inStock: updatedStock,
                stockQuantity: updatedStock ? (p.stockQuantity || 10) : 0,
              }
            : p
        )
      );
    } catch (err) {
      console.warn("Stock update error:", err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently remove "${name}" from the catalogue?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        setNotice(`"${name}" was deleted from inventory.`);
        setTimeout(() => setNotice(""), 4000);
      } else {
        alert(json.error || "Failed to delete product.");
      }
    } catch {
      alert("Failed to delete product.");
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesQuery =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDept =
      deptFilter === "all" || p.department.toLowerCase() === deptFilter.toLowerCase();

    const matchesStatus =
      statusFilter === "all" || (p.status || "active") === statusFilter;

    return matchesQuery && matchesDept && matchesStatus;
  });

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "#111827", margin: 0 }}>
            Product Inventory Management ({products.length})
          </h1>
          <p style={{ color: "#6b7280", marginTop: "4px", fontSize: "0.9rem" }}>
            Add new garments, update prices, manage stock quantities, sizing and publishing status.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          style={{
            background: "var(--plum, #4a154b)",
            color: "#fff",
            padding: "11px 20px",
            borderRadius: "6px",
            border: "none",
            fontWeight: 700,
            fontSize: "0.9rem",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(74, 21, 75, 0.2)",
          }}
        >
          + Add New Fashion Piece
        </button>
      </div>

      {notice && (
        <div
          style={{
            background: "#ecfdf5",
            border: "1px solid #a7f3d0",
            color: "#065f46",
            padding: "12px 18px",
            borderRadius: "6px",
            marginBottom: "20px",
            fontWeight: 700,
            fontSize: "0.9rem",
          }}
        >
          ✓ {notice}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "20px",
          display: "flex",
          gap: "14px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ flex: 1, minWidth: "220px" }}>
          <input
            type="search"
            placeholder="Search piece by name, category, or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "0.875rem",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            style={{
              padding: "10px 14px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "0.875rem",
              background: "#fff",
            }}
          >
            <option value="all">All Departments</option>
            <option value="Women">Women</option>
            <option value="Men">Men</option>
            <option value="Unisex">Unisex</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "10px 14px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "0.875rem",
              background: "#fff",
            }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active (Published)</option>
            <option value="draft">Draft (Hidden)</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Product List Table */}
      {loading ? (
        <div style={{ padding: "48px", textAlign: "center", color: "#6b7280" }}>
          Loading catalogue pieces...
        </div>
      ) : filteredProducts.length > 0 ? (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            overflowX: "auto",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: "#fafaf9", borderBottom: "2px solid #e5e7eb", color: "#4b5563" }}>
                <th style={{ padding: "14px 18px" }}>Garment / SKU</th>
                <th style={{ padding: "14px 18px" }}>Category</th>
                <th style={{ padding: "14px 18px" }}>Department</th>
                <th style={{ padding: "14px 18px" }}>Price</th>
                <th style={{ padding: "14px 18px" }}>Stock</th>
                <th style={{ padding: "14px 18px" }}>Sizes</th>
                <th style={{ padding: "14px 18px" }}>Status</th>
                <th style={{ padding: "14px 18px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ fontWeight: 700, color: "#111827", fontSize: "0.95rem" }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "2px", fontFamily: "monospace" }}>
                      SKU: {p.sku || p.id}
                    </div>
                    <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                      {p.featured && (
                        <span style={{ fontSize: "0.68rem", background: "#fef3c7", color: "#92400e", padding: "1px 6px", borderRadius: "3px", fontWeight: 700 }}>
                          ★ Featured
                        </span>
                      )}
                      {p.newArrival && (
                        <span style={{ fontSize: "0.68rem", background: "#dbeafe", color: "#1e40af", padding: "1px 6px", borderRadius: "3px", fontWeight: 700 }}>
                          New Arrival
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "14px 18px", color: "#4b5563" }}>{p.category}</td>
                  <td style={{ padding: "14px 18px", color: "#4b5563" }}>{p.department}</td>
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ fontWeight: 700, color: "#111827" }}>{formatMoney(p.price)}</div>
                    {p.salePrice && (
                      <div style={{ fontSize: "0.75rem", color: "#059669", fontWeight: 700 }}>
                        Sale: {formatMoney(p.salePrice)}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ fontWeight: 700, color: (p.stockQuantity ?? 10) <= 5 ? "#dc2626" : "#111827" }}>
                      {p.stockQuantity ?? 10} units
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleStock(p)}
                      style={{
                        padding: "2px 8px",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        borderRadius: "3px",
                        border: "1px solid",
                        cursor: "pointer",
                        marginTop: "4px",
                        background: p.inStock ? "#ecfdf5" : "#fef2f2",
                        color: p.inStock ? "#065f46" : "#991b1b",
                        borderColor: p.inStock ? "#a7f3d0" : "#fecaca",
                      }}
                    >
                      {p.inStock ? "● In Stock" : "○ Sold Out"}
                    </button>
                  </td>
                  <td style={{ padding: "14px 18px", color: "#6b7280", maxWidth: "160px" }}>
                    {Array.isArray(p.sizes) ? p.sizes.join(", ") : "Standard"}
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        background:
                          (p.status || "active") === "active"
                            ? "#ecfdf5"
                            : (p.status || "active") === "draft"
                            ? "#f3f4f6"
                            : "#fee2e2",
                        color:
                          (p.status || "active") === "active"
                            ? "#065f46"
                            : (p.status || "active") === "draft"
                            ? "#4b5563"
                            : "#991b1b",
                      }}
                    >
                      {p.status || "active"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 18px", textAlign: "right", whiteSpace: "nowrap" }}>
                    <button
                      type="button"
                      onClick={() => openEditModal(p)}
                      style={{
                        background: "#f3f4f6",
                        border: "1px solid #d1d5db",
                        color: "#374151",
                        padding: "5px 12px",
                        borderRadius: "4px",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        marginRight: "8px",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id, p.name)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#dc2626",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ padding: "48px", textAlign: "center", background: "#fff", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
          <h3 style={{ color: "#374151", margin: 0 }}>No pieces match your filters.</h3>
          <p style={{ color: "#9ca3af", fontSize: "0.85rem", marginTop: "6px" }}>
            Try adjusting your search terms or clearing your department filter.
          </p>
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalMode && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            padding: "20px",
          }}
          onClick={() => setModalMode(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "10px",
              width: "100%",
              maxWidth: "680px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#111827", margin: 0 }}>
                {modalMode === "edit" ? "Edit Fashion Piece" : "Add New Garment to Catalogue"}
              </h2>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#9ca3af" }}
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProduct} style={{ padding: "24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px" }}>
                    Garment Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. The Atelier Silk Wrap Dress"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px" }}>
                    SKU Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BGV-W-1042"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px" }}>
                    Department *
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value as any })}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", background: "#fff" }}
                  >
                    <option value="Women">Women</option>
                    <option value="Men">Men</option>
                    <option value="Unisex">Unisex</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px" }}>
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", background: "#fff" }}
                  >
                    <option value="Dresses">Dresses</option>
                    <option value="Tops">Tops</option>
                    <option value="Denim">Denim</option>
                    <option value="Sets">Sets</option>
                    <option value="Jackets">Jackets</option>
                    <option value="Streetwear">Streetwear</option>
                    <option value="Tailoring">Tailoring</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px" }}>
                    Retail Price (NGN ₦) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px" }}>
                    Sale Price (Optional ₦)
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Leave empty if none"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px" }}>
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px" }}>
                    Available Sizes (comma-separated) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. XS, S, M, L, XL"
                    value={formData.sizes}
                    onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px" }}>
                    Colours Available (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Black, Burgundy, Ivory, Gold"
                    value={formData.colors}
                    onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px" }}>
                  Product Image (Upload or URL)
                </label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <input
                    type="url"
                    placeholder="https://... or upload file ->"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    style={{ flex: 1, padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px" }}
                  />
                  <label
                    style={{
                      background: "#f3f4f6",
                      border: "1px solid #d1d5db",
                      color: "#374151",
                      padding: "10px 16px",
                      borderRadius: "6px",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      cursor: saving ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    Upload File
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={saving}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
                {formData.image && (
                  <div style={{ marginTop: "10px" }}>
                    <img
                      src={formData.image}
                      alt="Preview"
                      style={{ height: "60px", width: "auto", borderRadius: "4px", border: "1px solid #e5e7eb" }}
                    />
                  </div>
                )}
                <span style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "3px", display: "block" }}>
                  Upload an image directly (saved to Vercel Blob) or paste a CDN URL.
                </span>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px" }}>
                  Description & Composition Details *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Handcrafted premium fabric composition, silhouette details, tailoring care..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "24px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px" }}>
                    Publish Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", background: "#fff" }}
                  >
                    <option value="active">Active (Visible in Store)</option>
                    <option value="draft">Draft (Private)</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "24px" }}>
                  <input
                    type="checkbox"
                    id="featured-check"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
                  />
                  <label htmlFor="featured-check" style={{ fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
                    ★ Featured Piece
                  </label>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "24px" }}>
                  <input
                    type="checkbox"
                    id="new-arrival-check"
                    checked={formData.newArrival}
                    onChange={(e) => setFormData({ ...formData, newArrival: e.target.checked })}
                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
                  />
                  <label htmlFor="new-arrival-check" style={{ fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
                    ✦ New Arrival
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid #e5e7eb", paddingTop: "18px" }}>
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  style={{
                    padding: "10px 18px",
                    background: "#f3f4f6",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: "10px 22px",
                    background: "var(--plum, #4a154b)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.75 : 1,
                  }}
                >
                  {saving ? "Saving Changes..." : modalMode === "edit" ? "Save Changes" : "Publish to Storefront"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
