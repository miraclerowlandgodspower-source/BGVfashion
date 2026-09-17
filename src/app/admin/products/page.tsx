"use client";

import React, { useEffect, useState } from "react";
import { Product } from "@/types";
import { formatMoney } from "@/lib/money";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [notice, setNotice] = useState("");

  const [newProduct, setNewProduct] = useState({
    name: "",
    department: "Women",
    category: "Dresses",
    price: 45000,
    sheet: "women.png",
    quadrant: 0,
    sizes: "XS, S, M, L, XL",
    description: "",
  });

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

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newProduct,
          sizes: newProduct.sizes.split(",").map((s) => s.trim()),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setNotice("Piece added to catalogue successfully!");
        setShowAddModal(false);
        loadProducts();
        setTimeout(() => setNotice(""), 3500);
      } else {
        alert(json.error || "Failed to add product");
      }
    } catch (err) {
      alert("Failed to add piece");
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
        }),
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, inStock: updatedStock } : p))
      );
    } catch (err) {
      console.warn("Update stock error:", err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" from the catalogue?`)) return;
    try {
      await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setNotice(`"${name}" removed.`);
      setTimeout(() => setNotice(""), 3500);
    } catch {
      alert("Failed to delete product");
    }
  };

  return (
    <div>
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
          <h1 style={{ fontSize: "2rem" }}>Product Inventory ({products.length} Pieces)</h1>
          <p style={{ color: "var(--muted)", marginTop: "4px" }}>
            Add, update pricing, toggle stock availability, and manage sizing.
          </p>
        </div>

        <button
          type="button"
          className="button coral"
          onClick={() => setShowAddModal(true)}
        >
          + Add New Fashion Piece
        </button>
      </div>

      {notice && (
        <div
          style={{
            background: "#edfdf4",
            border: "1px solid #bbf7d0",
            color: "#166534",
            padding: "12px 18px",
            marginBottom: "20px",
            fontWeight: 700,
            fontSize: "0.9rem",
          }}
        >
          {notice}
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "560px" }}
          >
            <h2 style={{ marginBottom: "16px" }}>Add New Garment to Catalogue</h2>
            <form onSubmit={handleAddProduct}>
              <label className="field">
                <span>Product Name</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. The Atelier Silk Wrap Dress"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label className="field">
                  <span>Department</span>
                  <select
                    value={newProduct.department}
                    onChange={(e) => setNewProduct({ ...newProduct, department: e.target.value })}
                  >
                    <option value="Women">Women</option>
                    <option value="Men">Men</option>
                    <option value="Unisex">Unisex</option>
                  </select>
                </label>

                <label className="field">
                  <span>Category</span>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
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
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label className="field">
                  <span>Price (in NGN ₦)</span>
                  <input
                    type="number"
                    required
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                  />
                </label>

                <label className="field">
                  <span>Available Sizes (comma-separated)</span>
                  <input
                    type="text"
                    required
                    value={newProduct.sizes}
                    onChange={(e) => setNewProduct({ ...newProduct, sizes: e.target.value })}
                  />
                </label>
              </div>

              <label className="field">
                <span>Description</span>
                <textarea
                  rows={3}
                  required
                  placeholder="Fabric composition, cut, styling details..."
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                />
              </label>

              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button type="submit" className="button coral full-width">
                  Save to Storefront
                </button>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p>Loading catalogue...</p>
      ) : (
        <div style={{ background: "#fff", border: "1px solid var(--line)", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: "var(--soft)", borderBottom: "2px solid var(--line)" }}>
                <th style={{ padding: "14px 16px" }}>Piece</th>
                <th style={{ padding: "14px 16px" }}>Department</th>
                <th style={{ padding: "14px 16px" }}>Category</th>
                <th style={{ padding: "14px 16px" }}>Price (NGN)</th>
                <th style={{ padding: "14px 16px" }}>Sizes</th>
                <th style={{ padding: "14px 16px" }}>Stock Status</th>
                <th style={{ padding: "14px 16px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 700 }}>{p.name}</td>
                  <td style={{ padding: "12px 16px" }}>{p.department}</td>
                  <td style={{ padding: "12px 16px" }}>{p.category}</td>
                  <td style={{ padding: "12px 16px", fontWeight: 700 }}>{formatMoney(p.price)}</td>
                  <td style={{ padding: "12px 16px", color: "var(--muted)" }}>{p.sizes.join(", ")}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <button
                      type="button"
                      onClick={() => handleToggleStock(p)}
                      style={{
                        padding: "3px 10px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        borderRadius: "3px",
                        background: p.inStock ? "#edfdf4" : "#fef2f2",
                        color: p.inStock ? "#166534" : "#991b1b",
                        border: `1px solid ${p.inStock ? "#bbf7d0" : "#fecaca"}`,
                      }}
                    >
                      {p.inStock ? "● In Stock" : "○ Sold Out"}
                    </button>
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id, p.name)}
                      style={{ color: "#a31835", fontWeight: 700, fontSize: "0.8rem", textDecoration: "underline" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
