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
        if (json.success) {
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
    { title: "Total Verified Revenue", value: stats ? formatMoney(stats.totalRevenue) : "₦0", color: "#1b8a5a" },
    { title: "Total Store Orders", value: stats?.totalOrders || 0, color: "var(--plum)" },
    { title: "Active / Pending Orders", value: stats?.pendingOrders || 0, color: "var(--coral)" },
    { title: "Catalogue Pieces in Stock", value: stats?.productsCount || 0, color: "#2563eb" },
    { title: "Registered Clients", value: stats?.customersCount || 0, color: "#7c3aed" },
    { title: "Client Inquiries (Live Chat)", value: stats?.unreadMessages || 0, color: "#d97706" },
  ];

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "2.2rem" }}>Store Management Overview</h1>
        <p style={{ color: "var(--muted)", marginTop: "4px" }}>
          Fulfillment Atelier & Dispatch Hub: <strong>{stats?.atelierLocation || "Ojo, Lagos, Nigeria"}</strong>
        </p>
      </div>

      {loading ? (
        <p>Loading overview metrics...</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "20px",
            marginBottom: "36px",
          }}
        >
          {statCards.map((card, idx) => (
            <div
              key={idx}
              style={{
                background: "#fff",
                border: "1px solid var(--line)",
                padding: "24px",
                borderRadius: "6px",
                borderTop: `4px solid ${card.color}`,
              }}
            >
              <span style={{ fontSize: "0.85rem", color: "var(--muted)", fontWeight: 700 }}>
                {card.title}
              </span>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, marginTop: "8px", color: "var(--ink)" }}>
                {card.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Action Navigation Panels */}
      <h2 style={{ fontSize: "1.4rem", marginBottom: "16px" }}>Store Management Modules</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
        }}
      >
        <Link
          href="/admin/products"
          style={{
            background: "#fff",
            border: "1px solid var(--line)",
            padding: "24px",
            borderRadius: "6px",
            display: "block",
            transition: "transform 0.15s, border-color 0.15s",
          }}
        >
          <strong style={{ fontSize: "1.2rem", display: "block", color: "var(--plum)" }}>
            👗 Product Catalogue & Inventory
          </strong>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginTop: "8px" }}>
            Add new garments, update prices, manage available sizes, stock availability, and featured pieces.
          </p>
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--coral)", marginTop: "12px", display: "inline-block" }}>
            Manage Products →
          </span>
        </Link>

        <Link
          href="/admin/orders"
          style={{
            background: "#fff",
            border: "1px solid var(--line)",
            padding: "24px",
            borderRadius: "6px",
            display: "block",
            transition: "transform 0.15s, border-color 0.15s",
          }}
        >
          <strong style={{ fontSize: "1.2rem", display: "block", color: "var(--plum)" }}>
            📦 Orders & Courier Dispatch
          </strong>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginTop: "8px" }}>
            View customer orders, mark as Processing/Shipped/Delivered, and assign courier tracking numbers.
          </p>
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--coral)", marginTop: "12px", display: "inline-block" }}>
            Manage Orders →
          </span>
        </Link>

        <Link
          href="/admin/messages"
          style={{
            background: "#fff",
            border: "1px solid var(--line)",
            padding: "24px",
            borderRadius: "6px",
            display: "block",
            transition: "transform 0.15s, border-color 0.15s",
          }}
        >
          <strong style={{ fontSize: "1.2rem", display: "block", color: "var(--plum)" }}>
            💬 Live Chat & Inquiries Inbox
          </strong>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginTop: "8px" }}>
            Respond to real-time customer questions, styling advice, and sizing inquiries from the live chat widget.
          </p>
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--coral)", marginTop: "12px", display: "inline-block" }}>
            Open Chat Inbox →
          </span>
        </Link>
      </div>
    </div>
  );
}
