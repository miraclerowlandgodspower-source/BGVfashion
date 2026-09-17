"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { TruckIcon, CheckIcon } from "@/components/Icons";

export default function TrackOrderPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState("");

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/orders/track?query=${encodeURIComponent(query.trim())}`);
      const json = await res.json();

      if (!json.success || !json.data?.order) {
        throw new Error(json.error || "Order not found");
      }

      setOrder(json.data.order);
      setItems(json.data.items || []);
    } catch (err: any) {
      setOrder(null);
      setError(err.message || "Failed to locate order. Please check your reference.");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { title: "Order Placed", desc: "Payment verified via Paystack", completed: true },
    {
      title: "In Atelier",
      desc: "Quality inspection & packaging in Ojo, Lagos",
      completed: ["paid", "processing", "shipped", "delivered"].includes(order?.status?.toLowerCase()),
    },
    {
      title: "Handed to Courier",
      desc: `Dispatched via ${order?.trackingCarrier || "Courier"}`,
      completed: ["shipped", "delivered"].includes(order?.status?.toLowerCase()),
    },
    {
      title: "Delivered",
      desc: "Package received by client",
      completed: order?.status?.toLowerCase() === "delivered",
    },
  ];

  return (
    <div className="wrap" style={{ paddingBottom: "80px", maxWidth: "860px" }}>
      <div className="breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <span>Track Order</span>
      </div>

      <header className="page-head">
        <p className="eyebrow">REAL-TIME SHIPMENT STATUS</p>
        <h1 className="page-title">Track Your Purchase</h1>
        <p className="page-intro">
          Enter your BGV Order Number (e.g. <code>BGV-XXXXXX</code>) or Paystack reference to monitor your delivery progress.
        </p>
      </header>

      <form onSubmit={handleTrack} style={{ display: "flex", gap: "12px", margin: "24px 0 40px" }}>
        <input
          type="text"
          placeholder="Enter Order # or Reference (e.g. BGV-L4XYZ-102)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          required
          style={{ flex: 1, padding: "14px 18px", fontSize: "1rem" }}
        />
        <button type="submit" disabled={loading} className="button coral" style={{ minWidth: "160px" }}>
          {loading ? "Locating..." : "Track Package"}
        </button>
      </form>

      {error && (
        <div
          style={{
            background: "#fff0f2",
            border: "1px solid #f7c5cc",
            color: "#a31835",
            padding: "16px 20px",
            marginBottom: "30px",
          }}
          role="alert"
        >
          {error}
        </div>
      )}

      {order && (
        <div
          style={{
            border: "1px solid var(--line)",
            background: "var(--soft)",
            padding: "32px",
            borderRadius: "4px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: "16px",
              borderBottom: "1px solid var(--line)",
              paddingBottom: "20px",
              marginBottom: "28px",
            }}
          >
            <div>
              <span style={{ fontSize: "0.85rem", color: "var(--muted)", textTransform: "uppercase" }}>
                Order Number
              </span>
              <h2 style={{ fontSize: "1.7rem", marginTop: "4px" }}>{order.orderNumber}</h2>
              <div style={{ fontSize: "0.9rem", color: "var(--muted)", marginTop: "4px" }}>
                Origin: <strong>Ojo Distribution Atelier, Lagos</strong>
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "6px 14px",
                  background: order.status === "paid" || order.status === "delivered" ? "var(--success)" : "var(--plum)",
                  color: "#fff",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  borderRadius: "2px",
                }}
              >
                {order.trackingStatus || order.status}
              </span>
              <div style={{ fontSize: "0.85rem", color: "var(--muted)", marginTop: "8px" }}>
                Est. Delivery: <strong>{order.estimatedDelivery || "2–4 Business Days"}</strong>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div style={{ margin: "36px 0" }}>
            <h3 style={{ marginBottom: "20px", fontSize: "1.1rem" }}>Shipment Timeline</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  style={{
                    borderTop: `4px solid ${step.completed ? "var(--plum)" : "var(--line)"}`,
                    paddingTop: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      color: step.completed ? "var(--plum)" : "var(--muted)",
                    }}
                  >
                    {step.completed && <CheckIcon size={16} />}
                    {step.title}
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "4px", lineHeight: "1.4" }}>
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Courier & Destination details */}
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--line)",
              padding: "20px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
              marginTop: "24px",
            }}
          >
            <div>
              <strong style={{ fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>
                Courier & Tracking Number
              </strong>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <TruckIcon size={20} />
                <span style={{ fontSize: "0.9rem", fontWeight: 700 }}>
                  {order.trackingCarrier} — {order.trackingNumber}
                </span>
              </div>
            </div>

            <div>
              <strong style={{ fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>
                Delivery Destination
              </strong>
              <div style={{ fontSize: "0.9rem" }}>
                {order.shippingAddress?.fullName}, {order.shippingAddress?.city}, {order.shippingAddress?.state},{" "}
                {order.shippingAddress?.country}
              </div>
            </div>
          </div>

          {/* Items Purchased */}
          {items.length > 0 && (
            <div style={{ marginTop: "28px" }}>
              <h3 style={{ fontSize: "1.05rem", marginBottom: "12px" }}>Items in this package</h3>
              <div style={{ display: "grid", gap: "8px" }}>
                {items.map((it, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.875rem",
                      padding: "8px 0",
                      borderBottom: "1px solid var(--line)",
                    }}
                  >
                    <span>
                      {it.productName || it.productId} (Size {it.size}) × {it.quantity}
                    </span>
                    <strong>{formatMoney(it.totalPrice || it.unitPrice * it.quantity, order.currency)}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
