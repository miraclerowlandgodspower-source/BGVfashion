"use client";

import React, { useEffect, useState } from "react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({
    store_name: "BGV Fashion Atelier",
    atelier_location: "Ojo, Lagos, Nigeria",
    contact_email: "concierge@bgvfashion.com",
    contact_phone: "+234 812 345 6789",
    default_carrier: "GIG Logistics",
    currency: "NGN",
    shipping_fee_lagos: "2500",
    shipping_fee_national: "5000",
    shipping_fee_international: "25000",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  // Password change state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/settings");
        const json = await res.json();
        if (json.success && json.data?.settings) {
          setSettings((prev) => ({ ...prev, ...json.data.settings }));
        }
      } catch (err) {
        console.warn("Could not load settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword) {
      if (newPassword.length < 8) {
        alert("New password must be at least 8 characters long.");
        return;
      }
      if (newPassword !== confirmPassword) {
        alert("Password confirmation does not match.");
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings,
          newPassword: newPassword ? newPassword : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save settings.");
      }

      setNotice("Atelier configuration and security credentials updated successfully.");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setNotice(""), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to update settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "#111827", margin: 0 }}>
          Store Configuration & Security Settings
        </h1>
        <p style={{ color: "#6b7280", marginTop: "4px", fontSize: "0.9rem" }}>
          Manage atelier location details, courier shipping rates, concierge contact channels, and administrator credentials.
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

      {loading ? (
        <div style={{ padding: "48px", textAlign: "center", color: "#6b7280" }}>
          Loading configuration...
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Atelier Brand & Contact Details */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "24px",
              marginBottom: "24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#111827", marginTop: 0, marginBottom: "16px" }}>
              🏢 Atelier Identity & Contact Channels
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px" }}>
                  Storefront Atelier Name
                </label>
                <input
                  type="text"
                  required
                  value={settings.store_name || ""}
                  onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px" }}>
                  Dispatch Hub Physical Location
                </label>
                <input
                  type="text"
                  required
                  value={settings.atelier_location || ""}
                  onChange={(e) => setSettings({ ...settings, atelier_location: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px" }}>
                  Concierge Support Email
                </label>
                <input
                  type="email"
                  required
                  value={settings.contact_email || ""}
                  onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px" }}>
                  Concierge Phone Number
                </label>
                <input
                  type="text"
                  required
                  value={settings.contact_phone || ""}
                  onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px" }}
                />
              </div>
            </div>
          </div>

          {/* Delivery & Rates */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "24px",
              marginBottom: "24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#111827", marginTop: 0, marginBottom: "16px" }}>
              🚚 Shipping & Default Courier Rates
            </h2>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px" }}>
                Default Courier Partner
              </label>
              <select
                value={settings.default_carrier || "GIG Logistics"}
                onChange={(e) => setSettings({ ...settings, default_carrier: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", background: "#fff" }}
              >
                <option value="GIG Logistics">GIG Logistics</option>
                <option value="DHL Express">DHL Express Worldwide</option>
                <option value="FedEx">FedEx Express</option>
                <option value="Terminal Africa">Terminal Africa Dispatch</option>
                <option value="BGV Direct Courier">BGV Direct Atelier Courier (Ojo/Lagos)</option>
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px" }}>
                  Lagos Local Rate (₦)
                </label>
                <input
                  type="number"
                  required
                  value={settings.shipping_fee_lagos || "2500"}
                  onChange={(e) => setSettings({ ...settings, shipping_fee_lagos: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px" }}>
                  National Nigeria Rate (₦)
                </label>
                <input
                  type="number"
                  required
                  value={settings.shipping_fee_national || "5000"}
                  onChange={(e) => setSettings({ ...settings, shipping_fee_national: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px" }}>
                  International Rate (₦)
                </label>
                <input
                  type="number"
                  required
                  value={settings.shipping_fee_international || "25000"}
                  onChange={(e) => setSettings({ ...settings, shipping_fee_international: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px" }}
                />
              </div>
            </div>
          </div>

          {/* Security & Admin Password Update */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "24px",
              marginBottom: "28px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#111827", marginTop: 0, marginBottom: "6px" }}>
              🔐 Administrator Security & Password
            </h2>
            <p style={{ color: "#6b7280", fontSize: "0.82rem", marginBottom: "16px" }}>
              Change the password for your active administrator account. Leave blank if you do not wish to modify your password.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px" }}>
                  New Password (Min 8 Characters)
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Leave empty to keep current"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px" }}>
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px" }}
                />
              </div>
            </div>

            <div style={{ marginTop: "10px" }}>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#6b7280",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                {showPassword ? "Hide passwords" : "Show passwords"}
              </button>
            </div>
          </div>

          {/* Submit Action */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "12px 28px",
                background: "var(--plum, #4a154b)",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                fontWeight: 700,
                fontSize: "0.95rem",
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.75 : 1,
                boxShadow: "0 2px 8px rgba(74, 21, 75, 0.2)",
              }}
            >
              {saving ? "Saving Store Configuration..." : "Save All Settings"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
