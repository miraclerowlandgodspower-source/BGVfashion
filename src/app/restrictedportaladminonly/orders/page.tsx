"use client";

import React, { useEffect, useState } from "react";
import { formatMoney } from "@/lib/money";

const STATUS_OPTIONS = [
  { value: "all", label: "All Orders" },
  { value: "pending", label: "Pending" },
  { value: "payment_confirmed", label: "Payment Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [activeOrder, setActiveOrder] = useState<any | null>(null);

  // Edit / Fulfill form state
  const [editStatus, setEditStatus] = useState("pending");
  const [editPaymentStatus, setEditPaymentStatus] = useState("pending");
  const [editCarrier, setEditCarrier] = useState("GIG Logistics");
  const [editTrackingNumber, setEditTrackingNumber] = useState("");
  const [editTrackingUrl, setEditTrackingUrl] = useState("");
  const [editEstimatedDelivery, setEditEstimatedDelivery] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/orders");
      const json = await res.json();
      if (json.success && json.data?.orders) {
        setOrders(json.data.orders);
      }
    } catch (err) {
      console.warn("Could not load orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const openOrderDetails = (ord: any) => {
    setActiveOrder(ord);
    setEditStatus(ord.status || "pending");
    setEditPaymentStatus(ord.paymentStatus || (ord.status === "paid" ? "paid" : "pending"));
    setEditCarrier(ord.trackingCarrier || "GIG Logistics");
    setEditTrackingNumber(ord.trackingNumber || "");
    setEditTrackingUrl(ord.trackingUrl || "");
    setEditEstimatedDelivery(ord.estimatedDelivery || "2-4 Business Days");
  };

  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;
    setSaving(true);

    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: activeOrder.orderNumber,
          status: editStatus,
          paymentStatus: editPaymentStatus,
          trackingCarrier: editCarrier,
          trackingNumber: editTrackingNumber.trim(),
          trackingUrl: editTrackingUrl.trim(),
          estimatedDelivery: editEstimatedDelivery.trim(),
          trackingStatus:
            editStatus === "delivered"
              ? "Delivered to Client"
              : editStatus === "out_for_delivery"
              ? "Out for Final Delivery"
              : editStatus === "shipped"
              ? `In Transit via ${editCarrier}`
              : editStatus === "processing"
              ? "Atelier Packaging (Ojo, Lagos)"
              : editStatus,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update order.");
      }

      setNotice(`Order ${activeOrder.orderNumber} updated successfully.`);
      setActiveOrder(null);
      loadOrders();
      setTimeout(() => setNotice(""), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to update order.");
    } finally {
      setSaving(false);
    }
  };

  const filteredOrders = orders.filter((ord) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      ord.orderNumber?.toLowerCase().includes(q) ||
      ord.customerName?.toLowerCase().includes(q) ||
      ord.customerEmail?.toLowerCase().includes(q) ||
      ord.customerPhone?.toLowerCase().includes(q) ||
      ord.paystackReference?.toLowerCase().includes(q) ||
      ord.paystackTransactionId?.toLowerCase().includes(q) ||
      ord.trackingNumber?.toLowerCase().includes(q);

    const matchesStatus =
      selectedStatus === "all" || ord.status === selectedStatus;

    return matchesQuery && matchesStatus;
  });

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "delivered":
      case "paid":
      case "payment_confirmed":
        return { bg: "#ecfdf5", color: "#065f46", border: "#a7f3d0" };
      case "shipped":
      case "out_for_delivery":
        return { bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe" };
      case "processing":
        return { bg: "#faf5ff", color: "#6b21a8", border: "#e9d5ff" };
      case "cancelled":
      case "refunded":
        return { bg: "#fef2f2", color: "#991b1b", border: "#fecaca" };
      default:
        return { bg: "#fffbeb", color: "#92400e", border: "#fde68a" };
    }
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
      {/* Page Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "#111827", margin: 0 }}>
          Order Management & Courier Dispatch ({orders.length})
        </h1>
        <p style={{ color: "#6b7280", marginTop: "4px", fontSize: "0.9rem" }}>
          Inspect purchases, view customer delivery addresses, update payment confirmation, and assign carrier tracking.
        </p>
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
        <div style={{ flex: 1, minWidth: "260px" }}>
          <input
            type="search"
            placeholder="Search by Order #, client name, email, phone, reference..."
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

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{
              padding: "10px 14px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "0.875rem",
              background: "#fff",
              fontWeight: 600,
            }}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Status Filter Chips */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          paddingBottom: "12px",
          marginBottom: "16px",
        }}
      >
        {STATUS_OPTIONS.map((s) => {
          const count =
            s.value === "all"
              ? orders.length
              : orders.filter((o) => o.status === s.value).length;
          const active = selectedStatus === s.value;

          return (
            <button
              key={s.value}
              type="button"
              onClick={() => setSelectedStatus(s.value)}
              style={{
                padding: "6px 12px",
                borderRadius: "20px",
                border: active ? "1px solid var(--plum, #4a154b)" : "1px solid #e5e7eb",
                background: active ? "var(--plum, #4a154b)" : "#ffffff",
                color: active ? "#ffffff" : "#4b5563",
                fontSize: "0.78rem",
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>{s.label}</span>
              <span
                style={{
                  background: active ? "rgba(255,255,255,0.2)" : "#f3f4f6",
                  color: active ? "#fff" : "#6b7280",
                  padding: "1px 6px",
                  borderRadius: "10px",
                  fontSize: "0.7rem",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Orders Table */}
      {loading ? (
        <div style={{ padding: "48px", textAlign: "center", color: "#6b7280" }}>
          Loading orders...
        </div>
      ) : filteredOrders.length > 0 ? (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            overflowX: "auto",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ background: "#fafaf9", borderBottom: "2px solid #e5e7eb", color: "#4b5563" }}>
                <th style={{ padding: "14px 18px" }}>Order Number</th>
                <th style={{ padding: "14px 18px" }}>Date</th>
                <th style={{ padding: "14px 18px" }}>Customer Contact</th>
                <th style={{ padding: "14px 18px" }}>City / Country</th>
                <th style={{ padding: "14px 18px" }}>Total Amount</th>
                <th style={{ padding: "14px 18px" }}>Payment</th>
                <th style={{ padding: "14px 18px" }}>Fulfillment Status</th>
                <th style={{ padding: "14px 18px", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((ord) => {
                const badge = getStatusBadgeStyle(ord.status);
                const isPaid =
                  ord.paymentStatus === "paid" ||
                  ord.status === "paid" ||
                  ord.status === "payment_confirmed";

                return (
                  <tr key={ord.id || ord.orderNumber} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ fontWeight: 800, color: "#111827" }}>{ord.orderNumber}</div>
                      {ord.paystackReference && (
                        <div style={{ fontSize: "0.72rem", color: "#9ca3af", fontFamily: "monospace" }}>
                          Ref: {ord.paystackReference.substring(0, 14)}...
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "14px 18px", color: "#6b7280" }}>
                      {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : "Recent"}
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <strong style={{ color: "#111827" }}>{ord.customerName}</strong>
                      <div style={{ color: "#6b7280", fontSize: "0.75rem" }}>{ord.customerEmail}</div>
                      {ord.customerPhone && (
                        <div style={{ color: "#4b5563", fontSize: "0.75rem" }}>📞 {ord.customerPhone}</div>
                      )}
                    </td>
                    <td style={{ padding: "14px 18px", color: "#4b5563" }}>
                      {ord.shippingAddress?.city || "Lagos"},{" "}
                      {ord.shippingAddress?.country || "Nigeria"}
                    </td>
                    <td style={{ padding: "14px 18px", fontWeight: 800, color: "#111827" }}>
                      {formatMoney(ord.totalAmount, ord.currency)}
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          background: isPaid ? "#ecfdf5" : "#fffbeb",
                          color: isPaid ? "#065f46" : "#92400e",
                          border: `1px solid ${isPaid ? "#a7f3d0" : "#fde68a"}`,
                        }}
                      >
                        {isPaid ? "● Paid" : "⏳ Pending"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                        }}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 18px", textAlign: "right" }}>
                      <button
                        type="button"
                        onClick={() => openOrderDetails(ord)}
                        style={{
                          background: "var(--plum, #4a154b)",
                          color: "#fff",
                          border: "none",
                          padding: "6px 14px",
                          borderRadius: "4px",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Details & Fulfill
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ padding: "48px", textAlign: "center", background: "#fff", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
          <h3 style={{ color: "#374151", margin: 0 }}>No orders found</h3>
          <p style={{ color: "#9ca3af", fontSize: "0.85rem", marginTop: "6px" }}>
            Orders placed on the website will automatically appear here.
          </p>
        </div>
      )}

      {/* Full Order Details & Fulfillment Modal */}
      {activeOrder && (
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
          onClick={() => setActiveOrder(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "10px",
              width: "100%",
              maxWidth: "760px",
              maxHeight: "92vh",
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
                background: "var(--plum-dark, #1c0e16)",
                color: "#ffffff",
                borderRadius: "10px 10px 0 0",
              }}
            >
              <div>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 800, margin: 0 }}>
                  Order Details: {activeOrder.orderNumber}
                </h2>
                <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.7)", marginTop: "3px" }}>
                  Placed on: {activeOrder.createdAt ? new Date(activeOrder.createdAt).toLocaleString() : "Recent"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveOrder(null)}
                style={{ background: "none", border: "none", fontSize: "1.3rem", color: "#fff", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: "24px" }}>
              {/* Customer & Address Information Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px",
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "24px",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, color: "#6b7280" }}>
                    Customer Contact
                  </div>
                  <div style={{ fontWeight: 700, color: "#111827", fontSize: "0.95rem", marginTop: "4px" }}>
                    {activeOrder.customerName}
                  </div>
                  <div style={{ color: "#4b5563", fontSize: "0.82rem", marginTop: "2px" }}>
                    📧 {activeOrder.customerEmail}
                  </div>
                  <div style={{ color: "#4b5563", fontSize: "0.82rem", marginTop: "2px" }}>
                    📞 {activeOrder.customerPhone || activeOrder.shippingAddress?.phone || "Not provided"}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, color: "#6b7280" }}>
                    Delivery Destination Address
                  </div>
                  <div style={{ color: "#111827", fontSize: "0.85rem", marginTop: "4px", lineHeight: "1.4" }}>
                    <strong>{activeOrder.shippingAddress?.fullName || activeOrder.customerName}</strong>
                    <br />
                    {activeOrder.shippingAddress?.addressLine || "Atelier Delivery Address"}
                    <br />
                    {activeOrder.shippingAddress?.city || "Lagos"},{" "}
                    {activeOrder.shippingAddress?.state || "Lagos State"},{" "}
                    {activeOrder.shippingAddress?.country || "Nigeria"}
                    {activeOrder.shippingAddress?.postalCode && (
                      <span> · Postal: {activeOrder.shippingAddress.postalCode}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Purchased Garments / Items List */}
              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#111827", marginBottom: "10px" }}>
                  Purchased Items ({activeOrder.items?.length || 0})
                </h3>
                <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                    <thead>
                      <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb", color: "#6b7280" }}>
                        <th style={{ padding: "10px 14px", textAlign: "left" }}>Garment Piece</th>
                        <th style={{ padding: "10px 14px", textAlign: "center" }}>Size</th>
                        <th style={{ padding: "10px 14px", textAlign: "center" }}>Qty</th>
                        <th style={{ padding: "10px 14px", textAlign: "right" }}>Unit Price</th>
                        <th style={{ padding: "10px 14px", textAlign: "right" }}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeOrder.items && activeOrder.items.length > 0 ? (
                        activeOrder.items.map((it: any, i: number) => (
                          <tr key={it.id || i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                            <td style={{ padding: "10px 14px", fontWeight: 700, color: "#111827" }}>
                              {it.productName || it.name || "Garment Piece"}
                            </td>
                            <td style={{ padding: "10px 14px", textAlign: "center", color: "#4b5563" }}>
                              {it.size || "Standard"}
                            </td>
                            <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: 700 }}>
                              {it.quantity}
                            </td>
                            <td style={{ padding: "10px 14px", textAlign: "right", color: "#6b7280" }}>
                              {formatMoney(it.unitPrice || it.price, activeOrder.currency)}
                            </td>
                            <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: "#111827" }}>
                              {formatMoney((it.unitPrice || it.price) * it.quantity, activeOrder.currency)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} style={{ padding: "14px", textAlign: "center", color: "#9ca3af" }}>
                            Standard order allocation recorded.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial & Payment Summary */}
              <div
                style={{
                  background: "#fafaf9",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "24px",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, color: "#6b7280" }}>
                    Payment Verification
                  </div>
                  <div style={{ marginTop: "4px", fontSize: "0.85rem" }}>
                    Payment Provider: <strong>{activeOrder.paymentMethod || "Paystack Gateway"}</strong>
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "#4b5563", marginTop: "2px", fontFamily: "monospace" }}>
                    Ref: {activeOrder.paystackReference || "Direct Atelier Verification"}
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "#4b5563", marginTop: "2px", fontFamily: "monospace" }}>
                    Transaction ID: {activeOrder.paystackTransactionId || "Not available"}
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "#4b5563", marginTop: "2px" }}>
                    Status: <strong>{activeOrder.paymentStatus || activeOrder.status}</strong>
                    {activeOrder.paidAt && <span> (Verified {new Date(activeOrder.paidAt).toLocaleDateString()})</span>}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.82rem", color: "#6b7280" }}>
                    Items Subtotal: {formatMoney(activeOrder.subtotal || activeOrder.totalAmount, activeOrder.currency)}
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "#6b7280", marginTop: "2px" }}>
                    Delivery / Shipping Fee: {formatMoney(activeOrder.shippingFee || 0, activeOrder.currency)}
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "#6b7280", marginTop: "2px" }}>
                    VAT (7% of delivery): {formatMoney(activeOrder.taxFee || 0, activeOrder.currency)}
                  </div>
                  <div style={{ fontSize: "1.15rem", fontWeight: 900, color: "var(--plum, #4a154b)", marginTop: "6px" }}>
                    Total Amount: {formatMoney(activeOrder.totalAmount, activeOrder.currency)}
                  </div>
                </div>
              </div>

              {/* Fulfillment & Order Status Update Form */}
              <form onSubmit={handleSaveOrder} style={{ borderTop: "2px solid #e5e7eb", paddingTop: "20px" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#111827", marginBottom: "14px" }}>
                  Fulfill & Update Order Status
                </h3>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px" }}>
                      Order Status *
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", background: "#fff", fontWeight: 700 }}
                    >
                      <option value="pending">Pending</option>
                      <option value="payment_confirmed">Payment Confirmed</option>
                      <option value="processing">Processing (In Atelier Ojo)</option>
                      <option value="shipped">Shipped (Dispatched)</option>
                      <option value="out_for_delivery">Out for Delivery</option>
                      <option value="delivered">Delivered to Client</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px" }}>
                      Payment Status
                    </label>
                    <select
                      value={editPaymentStatus}
                      onChange={(e) => setEditPaymentStatus(e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", background: "#fff" }}
                    >
                      <option value="pending">Pending Payment</option>
                      <option value="paid">Payment Verified (Paid)</option>
                      <option value="failed">Failed / Reversed</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px" }}>
                      Assigned Courier Carrier
                    </label>
                    <select
                      value={editCarrier}
                      onChange={(e) => setEditCarrier(e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", background: "#fff" }}
                    >
                      <option value="GIG Logistics">GIG Logistics</option>
                      <option value="DHL Express">DHL Express Worldwide</option>
                      <option value="FedEx">FedEx Express</option>
                      <option value="Speedaf">Speedaf Express</option>
                      <option value="Terminal Africa">Terminal Africa Dispatch</option>
                      <option value="BGV Direct Courier">BGV Direct Atelier Courier (Ojo/Lagos)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px" }}>
                      Courier Waybill / Tracking Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. GIGL-84920491 or DHL-938204918"
                      value={editTrackingNumber}
                      onChange={(e) => setEditTrackingNumber(e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px" }}>
                      Online Tracking URL (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://track.giglogistics.com/... or carrier tracking link"
                      value={editTrackingUrl}
                      onChange={(e) => setEditTrackingUrl(e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px" }}>
                      Estimated Delivery Window
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 2-4 Business Days"
                      value={editEstimatedDelivery}
                      onChange={(e) => setEditEstimatedDelivery(e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setActiveOrder(null)}
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
                    Close
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
                    {saving ? "Saving Fulfillment..." : "Update Order & Tracking"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
