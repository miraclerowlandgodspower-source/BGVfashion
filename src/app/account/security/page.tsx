"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";

export default function AccountSecurityPage() {
  const { user, showToast } = useStore();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  if (!user) return <div className="wrap" style={{ padding: "80px 0" }}><div className="empty-state"><h2>Sign in to manage security</h2><Link href="/login?returnTo=/account/security" className="button">Sign In</Link></div></div>;

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/account/security", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, phone, currentPassword: currentPassword || undefined, newPassword: newPassword || undefined }) });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error || "Could not update settings.");
      setCurrentPassword(""); setNewPassword(""); showToast(json.message);
    } catch (error: any) { showToast(error.message || "Could not update settings."); } finally { setSaving(false); }
  };

  return <div className="wrap" style={{ paddingBottom: 80, maxWidth: 820 }}>
    <div className="breadcrumb"><Link href="/account">My Account</Link><span>/</span><span>Security</span></div>
    <header className="page-head"><p className="eyebrow">ACCOUNT SECURITY</p><h1 className="page-title">Your access, protected.</h1><p className="page-intro">Manage your profile and password. Security keys are shown only when a real WebAuthn service is configured.</p></header>
    <form onSubmit={save}>
      <section style={{ borderTop: "1px solid var(--line)", padding: "28px 0" }}><h2 style={{ fontSize: "1.35rem", marginBottom: 18 }}>Profile information</h2><label className="field"><span>Full name</span><input value={name} onChange={(event) => setName(event.target.value)} required minLength={3} /></label><label className="field"><span>Email address</span><input value={user.email} disabled /></label><label className="field"><span>Phone number</span><input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+234 ..." /></label></section>
      <section style={{ borderTop: "1px solid var(--line)", padding: "28px 0" }}><h2 style={{ fontSize: "1.35rem", marginBottom: 8 }}>Password</h2><p style={{ color: "var(--muted)", fontSize: ".9rem" }}>Leave both password fields empty to keep your current password.</p><label className="field"><span>Current password</span><input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label><label className="field"><span>New password</span><input type="password" autoComplete="new-password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label></section>
      <section style={{ borderTop: "1px solid var(--line)", padding: "28px 0" }}><h2 style={{ fontSize: "1.35rem", marginBottom: 8 }}>Passkeys & trusted devices</h2><div style={{ padding: 18, background: "var(--soft)", border: "1px solid var(--line)" }}><strong>Not configured</strong><p style={{ color: "var(--muted)", fontSize: ".9rem", marginTop: 6 }}>WebAuthn passkeys and trusted-device sessions are not enabled on this deployment. No passkey is being simulated or stored.</p></div></section>
      <button type="submit" className="button coral" disabled={saving}>{saving ? "Saving..." : "Save security settings"}</button>
    </form>
  </div>;
}
