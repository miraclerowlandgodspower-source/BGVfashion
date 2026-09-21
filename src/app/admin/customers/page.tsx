"use client";

import React, { useEffect, useState } from "react";
import { formatMoney } from "@/lib/money";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/customers");
      const json = await res.json();
      if (json.success && json.data?.customers) {
        setCustomers(json.data.customers);
      }
    } catch (err) {
      console.warn("Could not load customers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "#111827", margin: 0 }}>
          Registered Clients & Wardrobe Profiles ({customers.length})
        </h1>
        <p style={{ color: "#6b7280", marginTop: "4px", fontSize: "0.9rem" }}>
          Client directory, saved shipping addresses, order transaction histories, and lifetime atelier spend.
        </p>
      </div>

      {/* Search Bar */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "20px",
          display: "flex",
          gap: "14px",
          alignItems: "center",
        }}
      >
        <div style={{ flex: 1 }}>
          <input
            type="search"
            placeholder="Search client by name, email, or phone number..."
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
      </div>

      {/* Customers Table */}
      {loading ? (
        <div style={{ padding: "48px", textAlign: "center", color: "#6b7280" }}>
          Loading customer directory...
        </div>
      ) : filteredCustomers.length > 0 ? (
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
                <th style={{ padding: "14px 18px" }}>Client Name</th>
                <th style={{ padding: "14px 18px" }}>Email Address</th>
                <th style={{ padding: "14px 18px" }}>Phone</th>
                <th style={{ padding: "14px 18px" }}>Role</th>
                <th style={{ padding: "14px 18px" }}>Orders</th>
                <th style={{ padding: "14px 18px" }}>Lifetime Spend</th>
                <th style={{ padding: "14px 18px" }}>Joined</th>
                <th style={{ padding: "14px 18px", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((c) => (
                <tr key={c.id || c.email} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "14px 18px", fontWeight: 700, color: "#111827" }}>
                    {c.name}
                  </td>
                  <td style={{ padding: "14px 18px", color: "#4b5563" }}>{c.email}</td>
                  <td style={{ padding: "14px 18px", color: "#4b5563" }}>{c.phone || "—"}</td>
                  <td style={{ padding: "14px 18px" }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        background: c.role === "admin" ? "#fdf4ff" : "#ecfdf5",
                        color: c.role === "admin" ? "var(--plum, #4a154b)" : "#065f46",
                        border: `1px solid ${c.role === "admin" ? "#f0abfc" : "#a7f3d0"}`,
                      }}
                    >
                      {c.role || "customer"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 18px", fontWeight: 700, color: "#111827" }}>
                    {c.orderCount ?? c.orders?.length ?? 0} orders
                  </td>
                  <td style={{ padding: "14px 18px", fontWeight: 700, color: "#059669" }}>
                    {formatMoney(c.totalSpent || 0)}
                  </td>
                  <td style={{ padding: "14px 18px", color: "#6b7280" }}>
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "Active"}
                  </td>
                  <td style={{ padding: "14px 18px", textAlign: "right" }}>
                    <button
                      type="button"
                      onClick={() => setSelectedCustomer(c)}
                      style={{
                        background: "#f3f4f6",
                        border: "1px solid #d1d5db",
                        color: "#374151",
                        padding: "5px 12px",
                        borderRadius: "4px",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      View Profile & History
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ padding: "48px", textAlign: "center", background: "#fff", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
          <h3 style={{ color: "#374151", margin: 0 }}>No registered clients match your search</h3>
          <p style={{ color: "#9ca3af", fontSize: "0.85rem", marginTop: "6px" }}>
            New customers who register or verify with OTP will appear in this directory.
          </p>
        </div>
      )}

      {/* Customer Profile & Order History Modal */}
      {selectedCustomer && (
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
          onClick={() => setSelectedCustomer(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "10px",
              width: "100%",
              maxWidth: "680px",
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
                <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0 }}>
                  Client Profile: {selectedCustomer.name}
                </h2>
                <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.7)", marginTop: "2px" }}>
                  Registered Email: {selectedCustomer.email}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                style={{ background: "none", border: "none", fontSize: "1.3rem", color: "#fff", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: "24px" }}>
              {/* Summary Stats */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "14px",
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "24px",
                  textAlign: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 700, textTransform: "uppercase" }}>
                    Total Orders
                  </div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#111827", marginTop: "4px" }}>
                    {selectedCustomer.orders?.length || selectedCustomer.orderCount || 0}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 700, textTransform: "uppercase" }}>
                    Lifetime Spend
                  </div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#059669", marginTop: "4px" }}>
                    {formatMoney(selectedCustomer.totalSpent || 0)}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 700, textTransform: "uppercase" }}>
                    Account Role
                  </div>
                  <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--plum, #4a154b)", marginTop: "6px", textTransform: "capitalize" }}>
                    {selectedCustomer.role || "customer"}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#111827", marginBottom: "8px" }}>
                  Contact Information
                </h3>
                <div style={{ background: "#fafaf9", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "14px 16px", fontSize: "0.85rem" }}>
                  <div><strong>Full Name:</strong> {selectedCustomer.name}</div>
                  <div style={{ marginTop: "4px" }}><strong>Email Address:</strong> {selectedCustomer.email}</div>
                  <div style={{ marginTop: "4px" }}><strong>Phone Number:</strong> {selectedCustomer.phone || "Not on file"}</div>
                  <div style={{ marginTop: "4px", color: "#9ca3af", fontSize: "0.75rem" }}>
                    🔒 Password: Encrypted with bcrypt hash. (Passwords are never exposed).
                  </div>
                </div>
              </div>

              {/* Saved Delivery Addresses */}
              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#111827", marginBottom: "8px" }}>
                  Saved Delivery Addresses ({selectedCustomer.addresses?.length || 0})
                </h3>
                {selectedCustomer.addresses && selectedCustomer.addresses.length > 0 ? (
                  <div style={{ display: "grid", gap: "10px" }}>
                    {selectedCustomer.addresses.map((addr: any, idx: number) => (
                      <div
                        key={addr.id || idx}
                        style={{
                          background: "#fff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "6px",
                          padding: "12px 16px",
                          fontSize: "0.85rem",
                          lineHeight: "1.4",
                        }}
                      >
                        <strong>{addr.fullName || selectedCustomer.name}</strong> · {addr.phone || ""}
                        <div style={{ color: "#4b5563", marginTop: "2px" }}>
                          {addr.addressLine}, {addr.city}, {addr.state}, {addr.country || "Nigeria"}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: "#9ca3af", fontSize: "0.85rem", fontStyle: "italic" }}>
                    No addresses saved yet. Addresses entered during checkout will appear here.
                  </div>
                )}
              </div>

              {/* Order History */}
              <div>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#111827", marginBottom: "8px" }}>
                  Order History
                </h3>
                {selectedCustomer.orders && selectedCustomer.orders.length > 0 ? (
                  <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                      <thead>
                        <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb", color: "#6b7280" }}>
                          <th style={{ padding: "10px 14px", textAlign: "left" }}>Order #</th>
                          <th style={{ padding: "10px 14px", textAlign: "left" }}>Date</th>
                          <th style={{ padding: "10px 14px", textAlign: "left" }}>Status</th>
                          <th style={{ padding: "10px 14px", textAlign: "right" }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCustomer.orders.map((ord: any, idx: number) => (
                          <tr key={ord.orderNumber || idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                            <td style={{ padding: "10px 14px", fontWeight: 700, color: "#111827" }}>
                              {ord.orderNumber}
                            </td>
                            <td style={{ padding: "10px 14px", color: "#6b7280" }}>
                              {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : "Recent"}
                            </td>
                            <td style={{ padding: "10px 14px" }}>
                              <span
                                style={{
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  fontSize: "0.7rem",
                                  fontWeight: 700,
                                  textTransform: "uppercase",
                                  background: ord.status === "delivered" || ord.status === "paid" ? "#ecfdf5" : "#fffbeb",
                                  color: ord.status === "delivered" || ord.status === "paid" ? "#065f46" : "#92400e",
                                }}
                              >
                                {ord.status}
                              </span>
                            </td>
                            <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: "#111827" }}>
                              {formatMoney(ord.totalAmount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ color: "#9ca3af", fontSize: "0.85rem", fontStyle: "italic" }}>
                    No purchase history yet for this client.
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #e5e7eb" }}>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  style={{
                    padding: "10px 20px",
                    background: "#f3f4f6",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    cursor: "pointer",
                  }}
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
