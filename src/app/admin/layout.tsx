"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // If on admin login page, render clean layout without admin dashboard chrome
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: "📊" },
    { label: "Products", href: "/admin/products", icon: "👗" },
    { label: "Orders", href: "/admin/orders", icon: "📦" },
    { label: "Customers", href: "/admin/customers", icon: "👥" },
    { label: "Messages", href: "/admin/messages", icon: "💬" },
    { label: "Shipping", href: "/admin/shipping", icon: "🚚" },
    { label: "Settings", href: "/admin/settings", icon: "⚙️" },
  ];

  const handleLogout = async () => {
    if (!confirm("Are you sure you want to sign out of the administrator portal?")) return;
    setLoggingOut(true);
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch {
      router.push("/admin/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8f9fa" }}>
      {/* Mobile Sidebar Overlay */}
      {mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 999,
          }}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        style={{
          width: "260px",
          background: "var(--plum-dark, #1c0e16)",
          color: "#ffffff",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 1000,
          transform: mobileNavOpen ? "translateX(0)" : undefined,
          transition: "transform 0.25s ease-in-out",
          boxShadow: "2px 0 12px rgba(0,0,0,0.15)",
        }}
        className={`admin-sidebar ${mobileNavOpen ? "open" : ""}`}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: "24px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "1.25rem",
                fontWeight: 900,
                letterSpacing: "0.08em",
                color: "#ffffff",
              }}
            >
              BGV ATELIER
            </div>
            <div
              style={{
                fontSize: "0.68rem",
                color: "var(--coral, #f472b6)",
                fontWeight: 800,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginTop: "2px",
              }}
            >
              Management Portal
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="mobile-close-btn"
            style={{
              display: "none",
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: "1.2rem",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {/* Nav Links */}
        <nav style={{ flex: 1, padding: "16px 12px", overflowY: "auto" }}>
          <div
            style={{
              fontSize: "0.7rem",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "rgba(255,255,255,0.4)",
              fontWeight: 700,
              padding: "8px 12px",
            }}
          >
            Store Modules
          </div>

          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "11px 14px",
                  borderRadius: "6px",
                  fontSize: "0.875rem",
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "#ffffff" : "rgba(255,255,255,0.72)",
                  background: isActive
                    ? "rgba(244, 114, 182, 0.16)"
                    : "transparent",
                  borderLeft: isActive
                    ? "3px solid var(--coral, #f472b6)"
                    : "3px solid transparent",
                  textDecoration: "none",
                  marginBottom: "4px",
                  transition: "all 0.15s ease",
                }}
              >
                <span style={{ fontSize: "1.1rem" }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div
          style={{
            padding: "16px 12px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <Link
            href="/"
            target="_blank"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 12px",
              borderRadius: "6px",
              fontSize: "0.82rem",
              color: "rgba(255,255,255,0.7)",
              textDecoration: "none",
              background: "rgba(255,255,255,0.05)",
            }}
          >
            <span>🌐</span>
            <span>Customer Storefront ↗</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 12px",
              borderRadius: "6px",
              fontSize: "0.85rem",
              fontWeight: 700,
              color: "#fca5a5",
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              cursor: loggingOut ? "not-allowed" : "pointer",
              textAlign: "left",
              width: "100%",
            }}
          >
            <span>🚪</span>
            <span>{loggingOut ? "Signing out..." : "Logout"}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, marginLeft: "260px", display: "flex", flexDirection: "column", minHeight: "100vh" }} className="admin-main-wrapper">
        {/* Top Bar Header */}
        <header
          style={{
            background: "#ffffff",
            borderBottom: "1px solid #e5e7eb",
            padding: "14px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="admin-menu-toggle"
              style={{
                display: "none",
                background: "none",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                padding: "6px 10px",
                cursor: "pointer",
                fontSize: "1.1rem",
              }}
              aria-label="Toggle Navigation Menu"
            >
              ☰
            </button>
            <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#111827" }}>
              Atelier Management Dashboard
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                background: "#f3f4f6",
                padding: "4px 10px",
                borderRadius: "20px",
                fontSize: "0.75rem",
                color: "#4b5563",
                fontWeight: 600,
              }}
            >
              📍 Ojo, Lagos Atelier
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "0.82rem",
                fontWeight: 700,
                color: "var(--plum, #4a154b)",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#10b981",
                  display: "inline-block",
                }}
              />
              Administrator Session
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, padding: "32px 28px" }}>
          {children}
        </main>
      </div>

      <style jsx global>{`
        @media (max-width: 900px) {
          .admin-sidebar {
            transform: translateX(-100%) !important;
          }
          .admin-sidebar.open {
            transform: translateX(0) !important;
          }
          .admin-main-wrapper {
            margin-left: 0 !important;
          }
          .admin-menu-toggle {
            display: inline-block !important;
          }
          .mobile-close-btn {
            display: inline-block !important;
          }
        }
      `}</style>
    </div>
  );
}
