"use client";

import React, { useEffect, useState } from "react";

const COURIER_OPTIONS = [
  "GIG Logistics",
  "DHL Express Worldwide",
  "FedEx Express",
  "Speedaf Express",
  "Terminal Africa Dispatch",
  "BGV Direct Atelier Courier (Ojo/Lagos)",
];

const SHIPMENT_STATUSES = [
  { value: "preparing", label: "Preparing in Atelier (Ojo)" },
  { value: "in_transit", label: "Dispatched / In Transit" },
  { value: "out_for_delivery", label: "Out for Final Delivery" },
  { value: "delivered", label: "Delivered to Client" },
  { value: "delayed", label: "Fulfillment Delayed" },
];

export default function AdminShippingPage() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeShipment, setActiveShipment] = useState<any | null>(null);

  // Edit form state
  const [carrier, setCarrier] = useState("GIG Logistics");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");
  const [shipmentStatus, setShipmentStatus] = useState("preparing");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const loadShipments = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/shipping");
      const json = await res.json();
      if (json.success && json.data?.shipments) {
        setShipments(json.data.shipments);
      }
    } catch (err) {
      console.warn("Could not load shipments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShipments();
  }, []);

  const openEditModal = (ship: any) => {
    setActiveShipment(ship);
    setCarrier(ship.carrier || "GIG Logistics");
    setTrackingNumber(ship.trackingNumber || "");
    setTrackingUrl(ship.trackingUrl || "");
    setEstimatedDelivery(ship.estimatedDelivery || "2-4 Business Days");
    setShipmentStatus(
      ship.status === "delivered"
        ? "delivered"
        : ship.status === "shipped"
        ? "in_transit"
        : ship.status === "out_for_delivery"
        ? "out_for_delivery"
        : "preparing"
    );
  };

  const handleSaveShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShipment) return;
    setSaving(true);

    try {
      const res = await fetch("/api/admin/shipping", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: activeShipment.orderNumber,
          carrier,
          trackingNumber: trackingNumber.trim(),
          trackingUrl: trackingUrl.trim(),
          estimatedDelivery: estimatedDelivery.trim(),
          status:
            shipmentStatus === "delivered"
              ? "delivered"
              : shipmentStatus === "in_transit"
              ? "shipped"
              : shipmentStatus === "out_for_delivery"
              ? "out_for_delivery"
              : "processing",
          trackingStatus:
            shipmentStatus === "delivered"
              ? "Delivered to Client"
              : shipmentStatus === "in_transit"
              ? `In Transit via ${carrier}`
              : shipmentStatus === "out_for_delivery"
              ? "Out for Delivery"
              : "Preparing in Atelier Ojo",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update shipment.");
      }

      setNotice(`Waybill & tracking for order ${activeShipment.orderNumber} updated!`);
      setActiveShipment(null);
      loadShipments();
      setTimeout(() => setNotice(""), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to update shipment.");
    } finally {
      setSaving(false);
    }
  };

  const filteredShipments = shipments.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      s.orderNumber?.toLowerCase().includes(q) ||
      s.customerName?.toLowerCase().includes(q) ||
      s.trackingNumber?.toLowerCase().includes(q) ||
      s.carrier?.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "in_transit" && (s.status === "shipped" || s.status === "in_transit")) ||
      (statusFilter === "delivered" && s.status === "delivered") ||
      (statusFilter === "preparing" && (s.status === "pending" || s.status === "processing" || s.status === "payment_confirmed"));

    return matchesQuery && matchesStatus;
  });

  const inTransitCount = shipments.filter((s) => s.status === "shipped" || s.status === "in_transit").length;
  const deliveredCount = shipments.filter((s) => s.status === "delivered").length;
  const awaitingCount = shipments.filter((s) => s.status !== "delivered" && s.status !== "shipped").length;

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "#111827", margin: 0 }}>
            Shipping & Courier Dispatch Center ({shipments.length})
          </h1>
          <p style={{ color: "#6b7280", marginTop: "4px", fontSize: "0.9rem" }}>
            Assign waybills, courier partners (GIG Logistics, DHL, FedEx), tracking URLs, and delivery status updates.
          </p>
        </div>

        <div
          style={{
            background: "#fdf4ff",
            border: "1px solid #f0abfc",
            padding: "8px 14px",
            borderRadius: "6px",
            fontSize: "0.8rem",
            color: "var(--plum, #4a154b)",
            fontWeight: 700,
          }}
        >
          📍 Dispatch Hub: Ojo, Lagos, Nigeria
        </div>
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

      {/* Summary KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "18px", borderLeft: "4px solid #4a154b" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>
            Total Shipments
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#111827", marginTop: "6px" }}>
            {shipments.length}
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "18px", borderLeft: "4px solid #d97706" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>
            Awaiting Dispatch
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#92400e", marginTop: "6px" }}>
            {awaitingCount}
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "18px", borderLeft: "4px solid #2563eb" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>
            In Transit / Dispatched
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1e40af", marginTop: "6px" }}>
            {inTransitCount}
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "18px", borderLeft: "4px solid #059669" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>
            Delivered to Clients
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#065f46", marginTop: "6px" }}>
            {deliveredCount}
          </div>
        </div>
      </div>

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
        <div style={{ flex: 1, minWidth: "240px" }}>
          <input
            type="search"
            placeholder="Search by order #, client name, carrier or waybill number..."
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "10px 14px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "0.875rem",
              background: "#fff",
              fontWeight: 600,
            }}
          >
            <option value="all">All Shipments</option>
            <option value="preparing">Awaiting Packaging (Atelier)</option>
            <option value="in_transit">Dispatched / In Transit</option>
            <option value="delivered">Delivered to Clients</option>
          </select>
        </div>
      </div>

      {/* Shipments Table */}
      {loading ? (
        <div style={{ padding: "48px", textAlign: "center", color: "#6b7280" }}>
          Loading dispatch queue...
        </div>
      ) : filteredShipments.length > 0 ? (
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
                <th style={{ padding: "14px 18px" }}>Order / Date</th>
                <th style={{ padding: "14px 18px" }}>Recipient Client</th>
                <th style={{ padding: "14px 18px" }}>Destination Address</th>
                <th style={{ padding: "14px 18px" }}>Carrier Partner</th>
                <th style={{ padding: "14px 18px" }}>Waybill / Tracking #</th>
                <th style={{ padding: "14px 18px" }}>Dispatch Status</th>
                <th style={{ padding: "14px 18px", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredShipments.map((s) => {
                const isDispatched = s.status === "shipped" || s.status === "in_transit" || s.status === "delivered";

                return (
                  <tr key={s.orderNumber} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ fontWeight: 800, color: "#111827" }}>{s.orderNumber}</div>
                      <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                        {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "Recent"}
                      </div>
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <strong style={{ color: "#111827" }}>{s.customerName}</strong>
                      <div style={{ color: "#6b7280", fontSize: "0.75rem" }}>{s.customerEmail}</div>
                      {s.customerPhone && (
                        <div style={{ color: "#4b5563", fontSize: "0.75rem" }}>📞 {s.customerPhone}</div>
                      )}
                    </td>
                    <td style={{ padding: "14px 18px", color: "#4b5563" }}>
                      <div>{s.shippingAddress?.addressLine || "Atelier Delivery"}</div>
                      <div style={{ fontWeight: 600 }}>
                        {s.shippingAddress?.city || "Lagos"}, {s.shippingAddress?.country || "Nigeria"}
                      </div>
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          background: "#f3f4f6",
                          color: "#374151",
                        }}
                      >
                        🚚 {s.carrier || "GIG Logistics"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      {s.trackingNumber ? (
                        <div>
                          <div style={{ fontWeight: 700, fontFamily: "monospace", color: "#111827" }}>
                            {s.trackingNumber}
                          </div>
                          {s.trackingUrl && (
                            <a
                              href={s.trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: "#2563eb", fontSize: "0.72rem", textDecoration: "underline" }}
                            >
                              Track Online ↗
                            </a>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: "#9ca3af", fontStyle: "italic", fontSize: "0.78rem" }}>
                          Not assigned yet
                        </span>
                      )}
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
                            s.status === "delivered"
                              ? "#ecfdf5"
                              : isDispatched
                              ? "#eff6ff"
                              : "#fffbeb",
                          color:
                            s.status === "delivered"
                              ? "#065f46"
                              : isDispatched
                              ? "#1e40af"
                              : "#92400e",
                          border: `1px solid ${
                            s.status === "delivered"
                              ? "#a7f3d0"
                              : isDispatched
                              ? "#bfdbfe"
                              : "#fde68a"
                          }`,
                        }}
                      >
                        {s.trackingStatus || s.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 18px", textAlign: "right" }}>
                      <button
                        type="button"
                        onClick={() => openEditModal(s)}
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
                        Update Waybill
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
          <h3 style={{ color: "#374151", margin: 0 }}>No shipments found</h3>
          <p style={{ color: "#9ca3af", fontSize: "0.85rem", marginTop: "6px" }}>
            Customer orders will be queued here for waybill assignment and courier dispatch.
          </p>
        </div>
      )}

      {/* Edit Waybill Modal */}
      {activeShipment && (
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
          onClick={() => setActiveShipment(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "10px",
              width: "100%",
              maxWidth: "600px",
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
                background: "var(--plum-dark, #1c0e16)",
                color: "#ffffff",
                borderRadius: "10px 10px 0 0",
              }}
            >
              <div>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>
                  Assign Waybill: Order {activeShipment.orderNumber}
                </h2>
                <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.7)", marginTop: "2px" }}>
                  Client: {activeShipment.customerName} ({activeShipment.customerEmail})
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveShipment(null)}
                style={{ background: "none", border: "none", fontSize: "1.3rem", color: "#fff", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveShipment} style={{ padding: "24px" }}>
              {/* Delivery Info */}
              <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "6px", padding: "12px 16px", marginBottom: "20px", fontSize: "0.85rem" }}>
                <strong>Destination:</strong> {activeShipment.shippingAddress?.addressLine}, {activeShipment.shippingAddress?.city}, {activeShipment.shippingAddress?.state}, {activeShipment.shippingAddress?.country || "Nigeria"}
                {activeShipment.customerPhone && <div>📞 {activeShipment.customerPhone}</div>}
              </div>

              {activeShipment.trackingEvents?.length > 0 && (
                <div style={{ border: "1px solid #e5e7eb", borderRadius: "6px", padding: "12px 16px", marginBottom: "20px" }}>
                  <strong style={{ display: "block", fontSize: "0.82rem", marginBottom: "8px" }}>Tracking Events</strong>
                  {activeShipment.trackingEvents.map((event: any) => (
                    <div key={event.id} style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "7px 0", borderTop: "1px solid #f3f4f6", fontSize: "0.78rem" }}>
                      <span><strong>{event.status}</strong>{event.message ? ` · ${event.message}` : ""}</span>
                      <span style={{ color: "#6b7280", whiteSpace: "nowrap" }}>{new Date(event.createdAt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px" }}>
                  Courier Partner *
                </label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", background: "#fff", fontWeight: 600 }}
                >
                  {COURIER_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px" }}>
                  Waybill / Tracking Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GIGL-88492019 or DHL-394829104"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontFamily: "monospace" }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px" }}>
                  Courier Online Tracking URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://track.giglogistics.com/... or carrier portal tracking link"
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px" }}>
                    Shipment Status *
                  </label>
                  <select
                    value={shipmentStatus}
                    onChange={(e) => setShipmentStatus(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", background: "#fff", fontWeight: 700 }}
                  >
                    {SHIPMENT_STATUSES.map((st) => (
                      <option key={st.value} value={st.value}>{st.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px" }}>
                    Estimated Delivery
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2-4 Business Days"
                    value={estimatedDelivery}
                    onChange={(e) => setEstimatedDelivery(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px" }}
                  />
                </div>
              </div>

              {/* Carrier API Extensibility Notice */}
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "10px 14px", borderRadius: "6px", fontSize: "0.75rem", color: "#166534", marginBottom: "20px" }}>
                🔌 <strong>Courier API Ready:</strong> Third-party tracking APIs (Terminal Africa, GIG Logistics, DHL Express) can easily plug into this endpoint without modifying frontend schemas.
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => setActiveShipment(null)}
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
                  {saving ? "Updating Waybill..." : "Save Waybill & Dispatch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
