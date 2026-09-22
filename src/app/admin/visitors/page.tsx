"use client";

import { useEffect, useState } from "react";

export default function AdminVisitorsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/visitors").then((response) => response.json()).then((json) => {
      if (json.success) setData(json.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading visitor activity...</div>;
  const visitors = data?.visitors || [];
  return <div style={{ maxWidth: 1280, margin: "0 auto" }}>
    <h1 style={{ fontSize: "1.85rem", marginBottom: 6 }}>Visitor Activity</h1>
    <p style={{ color: "#6b7280", marginBottom: 24 }}>Anonymous session activity from the storefront. Active means activity within the last five minutes.</p>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, marginBottom: 24 }}>
      {[['Active now', data?.activeVisitors || 0], ['Visitors today', data?.visitorsToday || 0], ['Sessions recorded', visitors.length], ['Desktop sessions', data?.deviceBreakdown?.Desktop || 0]].map(([label, value]) => <div key={String(label)} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: 18 }}><div style={{ color: "#6b7280", fontSize: ".8rem", fontWeight: 700 }}>{label}</div><strong style={{ display: "block", fontSize: "1.7rem", marginTop: 6 }}>{value}</strong></div>)}
    </div>
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".84rem" }}><thead><tr style={{ background: "#fafafa", textAlign: "left" }}>{['Session','Current page','Device / browser','Referrer','Last activity'].map((heading) => <th key={heading} style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>{heading}</th>)}</tr></thead><tbody>
        {visitors.map((visitor: any) => <tr key={visitor.id} style={{ borderBottom: "1px solid #f3f4f6" }}><td style={{ padding: "12px 16px", fontFamily: "monospace" }}>{visitor.sessionId.slice(0, 12)}...</td><td style={{ padding: "12px 16px", fontWeight: 700 }}>{visitor.currentPage || visitor.entryPage || "/"}</td><td style={{ padding: "12px 16px" }}>{visitor.deviceType || "Unknown"}<div style={{ color: "#6b7280" }}>{visitor.browser || "Unknown"} · {visitor.os || "Unknown"}</div></td><td style={{ padding: "12px 16px", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{visitor.referrer || "Direct"}</td><td style={{ padding: "12px 16px" }}>{new Date(visitor.lastActivityAt).toLocaleString()}</td></tr>)}
      </tbody></table>
      {visitors.length === 0 && <p style={{ padding: 24, color: "#6b7280" }}>No visitor sessions recorded yet.</p>}
    </div>
  </div>;
}
