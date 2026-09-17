"use client";

import React, { useEffect, useState } from "react";
import { formatMoney } from "@/lib/money";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [carrier, setCarrier] = useState("GIG Logistics");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [status, setStatus] = useState("paid");
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
      console.warn("Load orders notice:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleOpenEdit = (order: any) => {
    setSelectedOrder(order);
    setCarrier(order.trackingCarrier || "GIG Logistics");
    setTrackingNumber(order.trackingNumber || "");
    setStatus(order.status || "paid");
  };

  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: selectedOrder.orderNumber,
          status,
          trackingCarrier: carrier,
          trackingNumber,
          trackingStatus:
            status === "shipped"
              ? `In Transit via ${carrier}`
              : status === "delivered"
              ? "Delivered to Client"
              : status === "processing"
              ? "Preparing in Ojo Atelier"
              : status,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setNotice(`Order ${selectedOrder.orderNumber} updated!`);
        setSelectedOrder(null);
        loadOrders();
        setTimeout(() => setNotice(""), 3500);
      }
    } catch {
      alert("Failed to update order");
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "2rem" }}>Orders & Courier Dispatch ({orders.length})</h1>
        <p style={{ color: "var(--muted)", marginTop: "4px" }}>
          Monitor purchases, assign courier tracking numbers (GIGL / DHL / FedEx), and update shipment status.
        </p>
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

      {/* Edit Order Tracking Modal */}
      {selectedOrder && (
        <div className="modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px" }}>
            <h2>Fulfill Order {selectedOrder.orderNumber}</h2>
            <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "4px" }}>
              Customer: {selectedOrder.customerName} ({selectedOrder.customerEmail})
            </p>

            <form onSubmit={handleSaveOrder} style={{ marginTop: "18px" }}>
              <label className="field">
                <span>Fulfillment Status</span>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="pending">Pending Payment</option>
                  <option value="paid">Payment Verified (Paid)</option>
                  <option value="processing">In Atelier (Packaging in Ojo)</option>
                  <option value="shipped">Dispatched / In Transit</option>
                  <option value="delivered">Delivered to Customer</option>
                  <option value="cancelled">Cancelled / Refunded</option>
                </select>
              </label>

              <label className="field">
                <span>Courier Carrier</span>
                <select value={carrier} onChange={(e) => setCarrier(e.target.value)}>
                  <option value="GIG Logistics">GIG Logistics</option>
                  <option value="DHL Express">DHL Express Worldwide</option>
                  <option value="FedEx">FedEx Express</option>
                  <option value="Speedaf">Speedaf Express</option>
                  <option value="Terminal Africa">Terminal Africa Dispatch</option>
                  <option value="BGV Direct Courier">BGV Direct Atelier Courier (Ojo/Lagos)</option>
                </select>
              </label>

              <label className="field">
                <span>Courier Tracking Number</span>
                <input
                  type="text"
                  placeholder="e.g. GIGL-88492019 or DHL-394829104"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                />
              </label>

              <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
                <button type="submit" className="button coral full-width">
                  Update Tracking Status
                </button>
                <button type="button" className="button secondary" onClick={() => setSelectedOrder(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p>Loading orders...</p>
      ) : orders.length > 0 ? (
        <div style={{ background: "#fff", border: "1px solid var(--line)", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ background: "var(--soft)", borderBottom: "2px solid var(--line)" }}>
                <th style={{ padding: "14px 16px" }}>Order #</th>
                <th style={{ padding: "14px 16px" }}>Date</th>
                <th style={{ padding: "14px 16px" }}>Client</th>
                <th style={{ padding: "14px 16px" }}>Destination</th>
                <th style={{ padding: "14px 16px" }}>Total</th>
                <th style={{ padding: "14px 16px" }}>Status</th>
                <th style={{ padding: "14px 16px" }}>Courier / Tracking</th>
                <th style={{ padding: "14px 16px", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((ord) => (
                <tr key={ord.id || ord.orderNumber} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 700 }}>{ord.orderNumber}</td>
                  <td style={{ padding: "12px 16px", color: "var(--muted)" }}>
                    {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : "Recent"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <strong>{ord.customerName}</strong>
                    <div style={{ color: "var(--muted)", fontSize: "0.75rem" }}>{ord.customerEmail}</div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {ord.shippingAddress?.city || "Lagos"}, {ord.shippingAddress?.country || "Nigeria"}
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 700 }}>
                    {formatMoney(ord.totalAmount, ord.currency)}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        padding: "3px 8px",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        background: ord.status === "paid" || ord.status === "delivered" ? "var(--success)" : "var(--plum)",
                        color: "#fff",
                        borderRadius: "2px",
                      }}
                    >
                      {ord.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--muted)" }}>
                    {ord.trackingCarrier ? (
                      <div>
                        <strong>{ord.trackingCarrier}</strong>
                        <div style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                          {ord.trackingNumber || "No tracking #"}
                        </div>
                      </div>
                    ) : (
                      "Not Assigned"
                    )}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(ord)}
                      className="button secondary"
                      style={{ padding: "4px 10px", minHeight: "30px", fontSize: "0.75rem" }}
                    >
                      Update Tracking
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <h2>No orders placed yet.</h2>
          <p>Orders submitted by customers through Paystack checkout will appear here in real time.</p>
        </div>
      )}
    </div>
  );
}
