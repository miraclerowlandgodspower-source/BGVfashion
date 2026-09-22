"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";

export default function RegisterPage() {
  const router = useRouter();
  const { showToast } = useStore();

  const [method, setMethod] = useState<"password" | "otp">("password");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const json = await res.json();
      if (!json.success || !json.data?.user) {
        throw new Error(json.error || "Failed to create account");
      }

      const otpRes = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const otpJson = await otpRes.json();
      if (!otpRes.ok || !otpJson.success) {
        throw new Error(otpJson.error || "Account created, but we could not send the verification code.");
      }

      setOtpSent(true);
      showToast("Account created. Verify your email to continue.");
      if (otpJson.devCode) setOtpCode(otpJson.devCode);
    } catch (err: any) {
      setError(err.message || "An error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
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
        setOtpCode(json.devCode);
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
        body: JSON.stringify({ email, code: otpCode, name }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Verification failed");
      }

      showToast("Email verified. Your account is awaiting admin approval.");
      router.push("/login");
    } catch (err: any) {
      setError(err.message || "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wrap">
      <section className="account-layout">
        <p className="eyebrow">MAKE IT YOURS</p>
        <h1>Join the BGV Edit.</h1>
        <p style={{ color: "var(--muted)", marginBottom: "20px" }}>
          Create an account for expedited checkout, order tracking, and private collection releases.
        </p>

        {/* Tab switcher */}
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
            Create with Password
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

        {!otpSent ? (
          <form onSubmit={handlePasswordSubmit}>
            <label className="field">
              <span>Full Name</span>
              <input
                type="text"
                required
                placeholder="e.g. Amara Okafor"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </label>

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
              <span>Create Password</span>
              <input
                type="password"
                required
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </label>

            <button className="button coral full-width" type="submit" disabled={loading} style={{ marginTop: "12px" }}>
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div style={{ background: "var(--soft)", padding: "12px 16px", marginBottom: "16px", fontSize: "0.85rem" }}>
              Code sent to <strong>{email}</strong>. Enter it below to complete registration.
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
              {loading ? "Verifying..." : "Verify & Complete Registration"}
            </button>

            <button
              type="button"
              onClick={() => setOtpSent(false)}
              style={{ display: "block", margin: "14px auto 0", fontSize: "0.8rem", textDecoration: "underline", color: "var(--muted)" }}
            >
              Change Email
            </button>
          </form>
        )}

        <p className="account-switch">
          Already have an account? <Link href="/login">Sign in here</Link>
        </p>
      </section>
    </div>
  );
}
