"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { formatMoney } from "@/lib/money";

export default function AccountPage() {
  const router = useRouter();
  const { user, logout, currency } = useStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await fetch("/api/orders");
        const json = await res.json();
        if (json.success && json.data?.orders) {
          setOrders(json.data.orders);
        }
      } catch (err) {
        console.warn("Could not load orders:", err);
      } finally {
        setLoadingOrders(false);
      }
    }
    if (user) {
      loadOrders();
    } else {
      setLoadingOrders(false);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="wrap" style={{ padding: "80px 0" }}>
        <div className="empty-state">
          <h2>Sign in to view your account</h2>
          <p>You need to be logged in to view your orders and account settings.</p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <Link href="/login" className="button">
              Sign In
            </Link>
            <Link href="/register" className="button secondary">
              Register
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap" style={{ paddingBottom: "80px" }}>
      <div className="breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <span>My Account</span>
      </div>

      <header
        className="page-head"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "20px",
        }}
      >
        <div>
          <p className="eyebrow">BGV CLIENT</p>
          <h1 className="page-title" style={{ marginBottom: "6px" }}>
            Hello, {user.name}
          </h1>
          <p style={{ color: "var(--muted)" }}>{user.email}</p>
        </div>

        <button type="button" className="button secondary" onClick={logout}>
          Sign Out
        </button>
      </header>

      <section style={{ marginTop: "36px" }}>
        <h2 style={{ fontSize: "1.6rem", marginBottom: "20px" }}>Your Order History</h2>

        {loadingOrders ? (
          <p style={{ color: "var(--muted)" }}>Loading your orders...</p>
        ) : orders.length > 0 ? (
          <div style={{ display: "grid", gap: "20px" }}>
            {orders.map((ord) => (
              <div
                key={ord.id || ord.orderNumber}
                style={{
                  border: "1px solid var(--line)",
                  padding: "24px",
                  background: "var(--soft)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "12px",
                    borderBottom: "1px solid var(--line)",
                    paddingBottom: "14px",
                    marginBottom: "16px",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Order Reference:</span>
                    <strong style={{ display: "block" }}>{ord.orderNumber}</strong>
                  </div>

                  <div>
                    <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Date Placed:</span>
                    <div style={{ fontSize: "0.9rem" }}>
                      {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : "Recent"}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Status:</span>
                    <span
                      style={{
                        display: "inline-block",
                        marginLeft: "6px",
                        padding: "3px 10px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        background: ord.status === "paid" ? "var(--success)" : "var(--plum)",
                        color: "#fff",
                      }}
                    >
                      {ord.status}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Total:</span>
                    <strong style={{ display: "block", color: "var(--plum)" }}>
                      {formatMoney(ord.totalAmount, currency)}
                    </strong>
                  </div>
                </div>

                {ord.items && ord.items.length > 0 && (
                  <div style={{ display: "grid", gap: "8px" }}>
                    {ord.items.map((it: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "0.875rem",
                        }}
                      >
                        <span>
                          {it.productName || it.productId} (Size: {it.size}) × {it.quantity}
                        </span>
                        <span>{formatMoney(it.totalPrice || it.unitPrice * it.quantity, currency)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h2>No orders placed yet.</h2>
            <p>Your previous purchases and deliveries will appear here.</p>
            <Link href="/shop" className="button coral">
              Start Shopping
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
