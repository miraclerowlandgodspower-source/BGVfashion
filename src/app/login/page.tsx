"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";

export default function LoginPage() {
  const router = useRouter();
  const [returnTo, setReturnTo] = useState("/account");
  const { setUser, showToast } = useStore();

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("returnTo");
    if (requested?.startsWith("/")) setReturnTo(requested);
  }, []);

  const [method, setMethod] = useState<"password" | "otp">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();
      if (!json.success || !json.data?.user) {
        throw new Error(json.error || "Failed to sign in");
      }

      setUser(json.data.user);
      showToast(`Welcome back, ${json.data.user.name}!`);
      router.push(returnTo.startsWith("/") ? returnTo : "/account");
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to send code");

      setOtpSent(true);
      showToast("6-digit verification code sent to your email.");
      if (json.devCode) {
        setOtpCode(json.devCode); // Auto fill for development testing
      }
    } catch (err: any) {
      setError(err.message || "Could not send verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otpCode, purpose: "login" }),
      });

      const json = await res.json();
      if (!json.success || !json.data?.user) {
        throw new Error(json.error || "Verification failed");
      }

      setUser(json.data.user);
      showToast(`Welcome back, ${json.data.user.name}!`);
      router.push("/account");
    } catch (err: any) {
      setError(err.message || "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wrap">
      <section className="account-layout">
        <p className="eyebrow">YOUR BGV</p>
        <h1>Welcome back.</h1>
        <p style={{ color: "var(--muted)", marginBottom: "20px" }}>
          Sign in to access your order history and manage your wardrobe.
        </p>

        {/* Tab switcher: Password vs Email Code */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--line)", marginBottom: "24px" }}>
          <button
            type="button"
            onClick={() => {
              setMethod("password");
              setError("");
            }}
            style={{
              padding: "10px 16px",
              fontWeight: 700,
              fontSize: "0.875rem",
              borderBottom: method === "password" ? "2px solid var(--plum)" : "none",
              color: method === "password" ? "var(--plum)" : "var(--muted)",
            }}
          >
            Password Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMethod("otp");
              setError("");
            }}
            style={{
              padding: "10px 16px",
              fontWeight: 700,
              fontSize: "0.875rem",
              borderBottom: method === "otp" ? "2px solid var(--plum)" : "none",
              color: method === "otp" ? "var(--plum)" : "var(--muted)",
            }}
          >
            Email Code (OTP)
          </button>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: "#fff0f2",
              border: "1px solid #f7c5cc",
              color: "#a31835",
              padding: "12px 16px",
              marginBottom: "20px",
              fontSize: "0.875rem",
            }}
            role="alert"
          >
            {error}
          </div>
        )}

        {method === "password" ? (
          <form onSubmit={handlePasswordSubmit}>
            <label className="field">
              <span>Email Address</span>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                type="password"
                required
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </label>

            <button className="button full-width" type="submit" disabled={loading} style={{ marginTop: "12px" }}>
              {loading ? "Signing in..." : "Sign In with Password"}
            </button>
          </form>
        ) : !otpSent ? (
          <form onSubmit={handleSendOtp}>
            <label className="field">
              <span>Email Address</span>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </label>

            <button className="button coral full-width" type="submit" disabled={loading} style={{ marginTop: "12px" }}>
              {loading ? "Sending Code..." : "Send 6-Digit Email Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div style={{ background: "var(--soft)", padding: "12px 16px", marginBottom: "16px", fontSize: "0.85rem" }}>
              Code sent to <strong>{email}</strong>. Check your inbox.
            </div>

            <label className="field">
              <span>Enter 6-Digit Code</span>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="e.g. 123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                style={{ letterSpacing: "0.2em", fontSize: "1.2rem", textAlign: "center" }}
              />
            </label>

            <button className="button coral full-width" type="submit" disabled={loading} style={{ marginTop: "12px" }}>
              {loading ? "Verifying..." : "Verify & Sign In"}
            </button>

            <button
              type="button"
              onClick={() => setOtpSent(false)}
              style={{ display: "block", margin: "14px auto 0", fontSize: "0.8rem", textDecoration: "underline", color: "var(--muted)" }}
            >
              Use different email
            </button>
          </form>
        )}

        <p className="account-switch">
          New to BGV? <Link href="/register">Create an account</Link>
        </p>
        <p className="account-switch" style={{ marginTop: "8px" }}>
          <Link href="/shop">Continue exploring collection</Link>
        </p>
      </section>
    </div>
  );
}
