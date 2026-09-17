"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { label: "📊 Overview", href: "/admin" },
    { label: "👗 Products (Inventory)", href: "/admin/products" },
    { label: "📦 Orders & Tracking", href: "/admin/orders" },
    { label: "💬 Client Messages (Live Chat)", href: "/admin/messages" },
    { label: "👥 Registered Clients", href: "/admin/customers" },
  ];

  return (
    <div style={{ background: "#f5f3f4", minHeight: "90vh", paddingBottom: "80px" }}>
      {/* Admin Top Navigation Bar */}
      <div
        style={{
          background: "var(--plum-dark)",
          color: "#fff",
          padding: "16px 0",
          borderBottom: "2px solid var(--coral)",
        }}
      >
        <div
          className="wrap"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link href="/admin" style={{ fontSize: "1.6rem", fontWeight: 900, color: "#fff" }}>
              BGV ADMIN PORTAL
            </Link>
            <span
              style={{
                background: "var(--coral)",
                color: "#23131b",
                fontSize: "0.7rem",
                padding: "2px 8px",
                fontWeight: 800,
                borderRadius: "3px",
              }}
            >
              STORE MANAGER
            </span>
          </div>

          <Link
            href="/"
            className="button outlined"
            style={{ padding: "6px 14px", minHeight: "34px", fontSize: "0.8rem" }}
          >
            ← Back to Storefront
          </Link>
        </div>
      </div>

      {/* Admin Sub Nav */}
      <div style={{ background: "#fff", borderBottom: "1px solid var(--line)" }}>
        <div className="wrap" style={{ display: "flex", gap: "8px", overflowX: "auto", padding: "8px 0" }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: "10px 18px",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  color: isActive ? "var(--plum)" : "var(--muted)",
                  borderBottom: isActive ? "3px solid var(--plum)" : "3px solid transparent",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="wrap" style={{ marginTop: "32px" }}>
        {children}
      </div>
    </div>
  );
}
