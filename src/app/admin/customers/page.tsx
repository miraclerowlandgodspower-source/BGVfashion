"use client";

import React, { useEffect, useState } from "react";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCustomers() {
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
    }
    loadCustomers();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "2rem" }}>Registered Clients ({customers.length})</h1>
        <p style={{ color: "var(--muted)", marginTop: "4px" }}>
          Client database of users who registered with password or verified via OTP.
        </p>
      </div>

      {loading ? (
        <p>Loading clients...</p>
      ) : customers.length > 0 ? (
        <div style={{ background: "#fff", border: "1px solid var(--line)", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: "var(--soft)", borderBottom: "2px solid var(--line)" }}>
                <th style={{ padding: "14px 16px" }}>Full Name</th>
                <th style={{ padding: "14px 16px" }}>Email Address</th>
                <th style={{ padding: "14px 16px" }}>Account Role</th>
                <th style={{ padding: "14px 16px" }}>Registration Date</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id || c.email} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 700 }}>{c.name}</td>
                  <td style={{ padding: "12px 16px" }}>{c.email}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        background: c.role === "admin" ? "var(--plum)" : "#edfdf4",
                        color: c.role === "admin" ? "#fff" : "#166534",
                        borderRadius: "2px",
                      }}
                    >
                      {c.role || "customer"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--muted)" }}>
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "Active"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <h2>No registered clients yet.</h2>
          <p>Clients who register or sign in via OTP will appear here.</p>
        </div>
      )}
    </div>
  );
}
