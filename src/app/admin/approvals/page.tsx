"use client";

import { useEffect, useState } from "react";

const tabs = [
  ["pending", "Pending"],
  ["review", "Review Required"],
  ["approved", "Approved"],
  ["rejected", "Rejected"],
  ["suspended", "Suspended"],
];

export default function AdminApprovalsPage() {
  const [tab, setTab] = useState("pending");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const load = async () => {
    setLoading(true);
    try { const response = await fetch(`/api/admin/approvals?status=${tab}`); const json = await response.json(); setUsers(json.success ? json.data.users || [] : []); } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [tab]);
  const action = async (userId: string, value: string) => {
    const reason = value === "approve" || value === "reactivate" ? undefined : window.prompt("Reason (optional):") || undefined;
    setBusy(userId);
    try { const response = await fetch("/api/admin/approvals", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, action: value, reason }) }); const json = await response.json(); if (!response.ok || !json.success) throw new Error(json.error || "Action failed"); await load(); } catch (error: any) { window.alert(error.message); } finally { setBusy(null); }
  };
  return <div style={{ maxWidth: 1280, margin: "0 auto" }}><h1 style={{ fontSize: "1.85rem", marginBottom: 6 }}>User Approvals</h1><p style={{ color: "#6b7280", marginBottom: 24 }}>Review verified registrations and risk signals before granting account access.</p><div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>{tabs.map(([value, label]) => <button key={value} onClick={() => setTab(value)} style={{ padding: "9px 14px", border: "1px solid #d1d5db", borderRadius: 6, background: tab === value ? "#40152f" : "#fff", color: tab === value ? "#fff" : "#374151", fontWeight: 700 }}>{label}</button>)}</div>{loading ? <div>Loading approval queue...</div> : <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".84rem" }}><thead><tr style={{ background: "#fafafa", textAlign: "left" }}>{["User", "Account status", "Risk", "Signals", "Registered", "Actions"].map((heading) => <th key={heading} style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>{heading}</th>)}</tr></thead><tbody>{users.map((user) => <tr key={user.id} style={{ borderBottom: "1px solid #f3f4f6" }}><td style={{ padding: "12px 16px" }}><strong>{user.name}</strong><div style={{ color: "#6b7280" }}>{user.email}</div></td><td style={{ padding: "12px 16px" }}>{user.accountStatus}</td><td style={{ padding: "12px 16px", fontWeight: 700, color: user.riskScore >= 60 ? "#b91c1c" : user.riskScore > 0 ? "#b45309" : "#047857" }}>{user.riskStatus} · {user.riskScore}</td><td style={{ padding: "12px 16px" }}>{(user.riskSignals || []).join(", ") || "None recorded"}<div style={{ color: "#6b7280" }}>IP: {user.registrationIp || "Unavailable"}</div></td><td style={{ padding: "12px 16px" }}>{new Date(user.createdAt).toLocaleString()}</td><td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>{tab === "pending" || tab === "review" ? <><button disabled={busy === user.id} onClick={() => void action(user.id, "approve")} style={{ marginRight: 6, padding: "6px 9px", background: "#047857", color: "#fff", borderRadius: 4 }}>Approve</button><button disabled={busy === user.id} onClick={() => void action(user.id, "reject")} style={{ marginRight: 6, padding: "6px 9px", background: "#b45309", color: "#fff", borderRadius: 4 }}>Reject</button><button disabled={busy === user.id} onClick={() => void action(user.id, "spam")} style={{ padding: "6px 9px", background: "#b91c1c", color: "#fff", borderRadius: 4 }}>Spam</button></> : tab === "approved" ? <button disabled={busy === user.id} onClick={() => void action(user.id, "suspend")} style={{ padding: "6px 9px", background: "#b45309", color: "#fff", borderRadius: 4 }}>Suspend</button> : tab === "suspended" ? <button disabled={busy === user.id} onClick={() => void action(user.id, "reactivate")} style={{ padding: "6px 9px", background: "#047857", color: "#fff", borderRadius: 4 }}>Reactivate</button> : <button disabled={busy === user.id} onClick={() => void action(user.id, "reactivate")} style={{ padding: "6px 9px", background: "#047857", color: "#fff", borderRadius: 4 }}>Reactivate</button>}</td></tr>)}</tbody></table>{users.length === 0 && <p style={{ padding: 24, color: "#6b7280" }}>No users in this queue.</p>}</div>}</div>;
}
