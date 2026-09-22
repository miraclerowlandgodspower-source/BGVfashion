"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/money";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/admin/stats");
        const json = await res.json();
        if (json.success && json.data) {
          setStats(json.data);
        }
      } catch (err) {
        console.warn("Could not load stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const statCards = [
    {
      title: "Total Store Revenue",
      value: stats ? formatMoney(stats.totalRevenue) : "₦0",
      icon: "💰",
      color: "#059669",
      subtitle: "Verified customer payments",
    },
    {
      title: "Total Orders Placed",
      value: stats?.totalOrders || 0,
      icon: "📦",
      color: "#4a154b",
      subtitle: "All-time order volume",
    },
    {
      title: "Pending Fulfillment",
      value: stats?.pendingOrders || 0,
      icon: "⏳",
      color: "#d97706",
      subtitle: "Requires packaging & dispatch",
    },
    {
      title: "Completed Deliveries",
      value: stats?.completedOrders || 0,
      icon: "✅",
      color: "#2563eb",
      subtitle: "Delivered to clients",
    },
    {
      title: "Active Catalogue Pieces",
      value: stats?.productsCount || 0,
      icon: "👗",
      color: "#7c3aed",
      subtitle: "Garments in store inventory",
    },
    {
      title: "Registered Clients",
      value: stats?.customersCount || 0,
      icon: "👥",
      color: "#0891b2",
      subtitle: "Customer profiles in database",
    },
    {
      title: "Low-Stock Alerts",
      value: stats?.lowStockCount || 0,
      icon: "⚠️",
      color: (stats?.lowStockCount || 0) > 0 ? "#dc2626" : "#6b7280",
      subtitle: "Pieces with 5 or fewer items",
    },
    {
      title: "Support Conversations",
      value: stats?.unreadMessages || 0,
      icon: "💬",
      color: "#db2777",
      subtitle: "Open customer chat inquiries",
    },
  ];

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
      {/* Welcome Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "28px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#111827", margin: 0 }}>
            Atelier Command Center
          </h1>
          <p style={{ color: "#6b7280", marginTop: "4px", fontSize: "0.95rem" }}>
            Operational dispatch hub: <strong>{stats?.atelierLocation || "Ojo, Lagos, Nigeria"}</strong> · Real-time storefront metrics
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <Link
            href="/admin/products"
            style={{
              background: "var(--plum, #4a154b)",
              color: "#fff",
              padding: "10px 18px",
              borderRadius: "6px",
              fontWeight: 700,
              fontSize: "0.85rem",
              textDecoration: "none",
            }}
          >
            + Add New Piece
          </Link>
          <Link
            href="/admin/orders"
            style={{
              background: "#ffffff",
              border: "1px solid #d1d5db",
              color: "#374151",
              padding: "10px 18px",
              borderRadius: "6px",
              fontWeight: 700,
              fontSize: "0.85rem",
              textDecoration: "none",
            }}
          >
            Fulfill Orders →
          </Link>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
          Loading store analytics...
        </div>
      ) : (
        <>
          {/* Key Metric Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "18px",
              marginBottom: "32px",
            }}
          >
            {statCards.map((card, idx) => (
              <div
                key={idx}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "20px",
                  borderLeft: `4px solid ${card.color}`,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#6b7280" }}>
                    {card.title}
                  </span>
                  <span style={{ fontSize: "1.25rem" }}>{card.icon}</span>
                </div>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#111827", marginTop: "10px" }}>
                  {card.value}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "4px" }}>
                  {card.subtitle}
                </div>
              </div>
            ))}
          </div>

          {/* Low Stock Alert Section */}
          {stats?.lowStockProducts && stats.lowStockProducts.length > 0 && (
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #fed7aa",
                borderRadius: "8px",
                marginBottom: "32px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  background: "#fff7ed",
                  padding: "14px 20px",
                  borderBottom: "1px solid #fed7aa",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "1.2rem" }}>⚠️</span>
                  <strong style={{ color: "#9a3412", fontSize: "0.95rem" }}>
                    Low-Stock Attention Required ({stats.lowStockProducts.length} items low or sold out)
                  </strong>
                </div>
                <Link
                  href="/admin/products"
                  style={{ color: "#ea580c", fontSize: "0.82rem", fontWeight: 700, textDecoration: "underline" }}
                >
                  Manage All Inventory →
                </Link>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                  <thead>
                    <tr style={{ background: "#fafaf9", borderBottom: "1px solid #e5e7eb", color: "#4b5563" }}>
                      <th style={{ padding: "10px 20px", textAlign: "left" }}>Garment</th>
                      <th style={{ padding: "10px 20px", textAlign: "left" }}>Department</th>
                      <th style={{ padding: "10px 20px", textAlign: "left" }}>Category</th>
                      <th style={{ padding: "10px 20px", textAlign: "left" }}>Price</th>
                      <th style={{ padding: "10px 20px", textAlign: "left" }}>Stock Left</th>
                      <th style={{ padding: "10px 20px", textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.lowStockProducts.map((p: any) => (
                      <tr key={p.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{ padding: "12px 20px", fontWeight: 700, color: "#111827" }}>
                          {p.name}
                        </td>
                        <td style={{ padding: "12px 20px", color: "#6b7280" }}>{p.department}</td>
                        <td style={{ padding: "12px 20px", color: "#6b7280" }}>{p.category}</td>
                        <td style={{ padding: "12px 20px", fontWeight: 700 }}>{formatMoney(p.price)}</td>
                        <td style={{ padding: "12px 20px" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              background: (p.stockQuantity ?? 0) === 0 ? "#fee2e2" : "#fef3c7",
                              color: (p.stockQuantity ?? 0) === 0 ? "#991b1b" : "#92400e",
                            }}
                          >
                            {(p.stockQuantity ?? 0) === 0 ? "0 units (Sold Out)" : `${p.stockQuantity} units left`}
                          </span>
                        </td>
                        <td style={{ padding: "12px 20px", textAlign: "right" }}>
                          <Link
                            href="/admin/products"
                            style={{
                              padding: "4px 10px",
                              borderRadius: "4px",
                              background: "#f3f4f6",
                              color: "#374151",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              textDecoration: "none",
                            }}
                          >
                            Restock
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Two-Column Grid: Recent Orders & Recent Support Inquiries */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(460px, 1fr))",
              gap: "24px",
              marginBottom: "36px",
            }}
          >
            {/* Recent Orders */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid #e5e7eb",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <strong style={{ fontSize: "1rem", color: "#111827" }}>📦 Recent Customer Orders</strong>
                  <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>Latest purchases waiting for fulfillment</div>
                </div>
                <Link
                  href="/admin/orders"
                  style={{ color: "var(--plum, #4a154b)", fontSize: "0.82rem", fontWeight: 700 }}
                >
                  View All Orders →
                </Link>
              </div>

              {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                    <tbody>
                      {stats.recentOrders.map((ord: any) => (
                        <tr key={ord.id || ord.orderNumber} style={{ borderBottom: "1px solid #f3f4f6" }}>
                          <td style={{ padding: "14px 20px" }}>
                            <div style={{ fontWeight: 700, color: "#111827" }}>{ord.orderNumber}</div>
                            <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                              {ord.customerName} ({ord.customerEmail})
                            </div>
                          </td>
                          <td style={{ padding: "14px 20px", fontWeight: 700 }}>
                            {formatMoney(ord.totalAmount, ord.currency)}
                          </td>
                          <td style={{ padding: "14px 20px" }}>
                            <span
                              style={{
                                padding: "2px 8px",
                                borderRadius: "4px",
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                background:
                                  ord.status === "delivered" || ord.status === "paid" || ord.status === "payment_confirmed"
                                    ? "#dcfce7"
                                    : ord.status === "shipped"
                                    ? "#dbeafe"
                                    : "#fef3c7",
                                color:
                                  ord.status === "delivered" || ord.status === "paid" || ord.status === "payment_confirmed"
                                    ? "#166534"
                                    : ord.status === "shipped"
                                    ? "#1e40af"
                                    : "#92400e",
                              }}
                            >
                              {ord.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: "32px", textAlign: "center", color: "#9ca3af", fontSize: "0.875rem" }}>
                  No customer orders placed yet.
                </div>
              )}
            </div>

            {/* Recent Messages */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid #e5e7eb",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <strong style={{ fontSize: "1rem", color: "#111827" }}>💬 Recent Concierge Inquiries</strong>
                  <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>Live customer chats from the storefront</div>
                </div>
                <Link
                  href="/admin/messages"
                  style={{ color: "var(--plum, #4a154b)", fontSize: "0.82rem", fontWeight: 700 }}
                >
                  Open Chat Inbox →
                </Link>
              </div>

              {stats?.recentMessages && stats.recentMessages.length > 0 ? (
                <div>
                  {stats.recentMessages.map((msg: any) => (
                    <div
                      key={msg.id}
                      style={{
                        padding: "14px 20px",
                        borderBottom: "1px solid #f3f4f6",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ maxWidth: "75%" }}>
                        <div style={{ fontWeight: 700, color: "#111827", fontSize: "0.875rem" }}>
                          {msg.customerName}
                          <span style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 400, marginLeft: "6px" }}>
                            ({msg.customerEmail})
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "#4b5563",
                            marginTop: "3px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {msg.lastMessage || "Inquiry started..."}
                        </div>
                      </div>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          background: msg.status === "resolved" ? "#f3f4f6" : "#fee2e2",
                          color: msg.status === "resolved" ? "#4b5563" : "#991b1b",
                        }}
                      >
                        {msg.status || "open"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: "32px", textAlign: "center", color: "#9ca3af", fontSize: "0.875rem" }}>
                  No customer chat inquiries yet.
                </div>
              )}
            </div>
          </div>

          {/* Direct Module Cards */}
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#111827", marginBottom: "16px" }}>
            Store Management Modules
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "16px",
            }}
          >
            {[
              { title: "👗 Products & Inventory", desc: "Add, edit, stock count, SKU, prices & sizes.", href: "/admin/products" },
              { title: "📦 Order Dispatch", desc: "View items, update status, and manage courier details.", href: "/admin/orders" },
              { title: "🚚 Shipping & Couriers", desc: "Manage GIGL, DHL, FedEx tracking and dispatch queue.", href: "/admin/shipping" },
              { title: "💳 Payments", desc: "Verify transactions, webhooks, and refunds.", href: "/admin/payments" },
              { title: "👥 Registered Clients", desc: "Client contact info, addresses, and order history.", href: "/admin/customers" },
              { title: "✅ User Approvals", desc: "Review and approve new registered customers.", href: "/admin/approvals" },
              { title: "💬 Live Chat Inbox", desc: "Reply in real time to customer sizing & order inquiries.", href: "/admin/messages" },
              { title: "👁️ Visitor Analytics", desc: "Privacy-conscious tracking of storefront visitors.", href: "/admin/visitors" },
              { title: "📈 Store Analytics", desc: "Revenue graphs, order volume, and performance.", href: "/admin/analytics" },
              { title: "⚙️ Store Configuration", desc: "Atelier details, default shipping fees & admin credentials.", href: "/admin/settings" },
            ].map((mod, i) => (
              <Link
                key={i}
                href={mod.href}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "20px",
                  textDecoration: "none",
                  display: "block",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                  transition: "transform 0.15s, border-color 0.15s",
                }}
              >
                <strong style={{ color: "var(--plum, #4a154b)", fontSize: "1.05rem", display: "block" }}>
                  {mod.title}
                </strong>
                <p style={{ color: "#6b7280", fontSize: "0.82rem", margin: "6px 0 12px", lineHeight: "1.4" }}>
                  {mod.desc}
                </p>
                <span style={{ color: "var(--coral, #f472b6)", fontSize: "0.8rem", fontWeight: 700 }}>
                  Open Module →
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
