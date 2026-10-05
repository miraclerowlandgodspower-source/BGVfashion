"use client";

import { useEffect, useState } from "react";

type Integration = {
  id: string;
  name: string;
  status: "connected" | "not_configured" | "error";
  lastSuccessfulCheck: string | null;
  requiredEnv: string[];
  message: string;
};

const statusCopy = {
  connected: { label: "Connected", color: "#047857", background: "#ecfdf5" },
  not_configured: { label: "Not configured", color: "#92400e", background: "#fffbeb" },
  error: { label: "Error", color: "#b91c1c", background: "#fef2f2" },
};

function formatCheck(value: string | null) {
  return value ? new Date(value).toLocaleString() : "Never";
}

export default function AdminIntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  async function loadIntegrations() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/integrations", { cache: "no-store" });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error || "Unable to check integrations.");
      setIntegrations(json.data.integrations);
    } catch (error: any) {
      setNotice(error.message || "Unable to check integrations.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadIntegrations(); }, []);

  async function runAction(id: string, action = "test_connection") {
    setBusy(id);
    setNotice("");
    try {
      const response = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, integration: id }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error || "Unable to run integration test.");
      setIntegrations((current) => current.map((item) => item.id === json.data.id ? json.data : item));
      setNotice(json.data.message);
    } catch (error: any) {
      setNotice(error.message || "Unable to run integration test.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "#111827", margin: 0 }}>API Integrations</h1>
          <p style={{ color: "#6b7280", margin: "6px 0 0", fontSize: "0.9rem" }}>Server-side connection health for the services that power your atelier.</p>
        </div>
        <button type="button" onClick={loadIntegrations} disabled={loading} style={{ padding: "10px 16px", borderRadius: "6px", border: "1px solid #d1d5db", background: "#fff", fontWeight: 700, cursor: loading ? "wait" : "pointer" }}>
          {loading ? "Checking..." : "Refresh checks"}
        </button>
      </div>

      {notice && <div role="status" style={{ marginBottom: "18px", padding: "12px 16px", borderRadius: "6px", background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e40af", fontWeight: 600 }}>{notice}</div>}

      {loading && integrations.length === 0 ? <div style={{ padding: "48px", textAlign: "center", color: "#6b7280" }}>Checking connected services...</div> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
          {integrations.map((integration) => {
            const status = statusCopy[integration.status];
            const isEmail = integration.id === "resend";
            const action = isEmail ? "send_test_email" : integration.id === "cloudinary" ? "test_cloudinary_upload" : "test_connection";
            const buttonLabels: Record<string, string> = {
              database: "Test database connection",
              paystack: "Test Paystack connection",
              mapbox: "Test Mapbox token",
              auth: "Test JWT signing",
              shipping: "Test shipping API",
            };
            const buttonLabel = isEmail ? "Send test email" : integration.id === "cloudinary" ? "Test Cloudinary upload" : buttonLabels[integration.id] || "Test connection";
            return (
              <article key={integration.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                  <h2 style={{ margin: 0, fontSize: "1.05rem", color: "#111827" }}>{integration.name}</h2>
                  <span style={{ color: status.color, background: status.background, padding: "4px 8px", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 800, whiteSpace: "nowrap" }}>{status.label}</span>
                </div>
                <p style={{ color: integration.status === "error" ? "#b91c1c" : "#4b5563", minHeight: "40px", fontSize: "0.84rem", lineHeight: 1.5 }}>{integration.message}</p>
                <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "12px", fontSize: "0.78rem", color: "#6b7280" }}>
                  <strong style={{ color: "#374151" }}>Last successful check:</strong> {formatCheck(integration.lastSuccessfulCheck)}
                </div>
                <div style={{ marginTop: "10px", fontSize: "0.78rem", color: "#6b7280" }}>
                  <strong style={{ color: "#374151" }}>Required environment variables:</strong>
                  <div style={{ marginTop: "5px", display: "flex", flexWrap: "wrap", gap: "5px" }}>{integration.requiredEnv.map((name) => <code key={name} style={{ background: "#f3f4f6", padding: "3px 5px", borderRadius: "4px", color: "#374151" }}>{name}</code>)}</div>
                </div>
                <button type="button" onClick={() => runAction(integration.id, action)} disabled={busy === integration.id || integration.status === "not_configured"} style={{ width: "100%", marginTop: "16px", padding: "10px", border: 0, borderRadius: "6px", background: integration.status === "not_configured" ? "#e5e7eb" : "var(--plum, #4a154b)", color: integration.status === "not_configured" ? "#9ca3af" : "#fff", fontWeight: 700, cursor: busy === integration.id ? "wait" : integration.status === "not_configured" ? "not-allowed" : "pointer" }}>
                  {busy === integration.id ? "Testing..." : buttonLabel}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}