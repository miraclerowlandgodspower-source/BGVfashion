"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/admin";
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (errorParam === "insufficient_privileges") {
      setErrorMessage("Access denied: Your account does not have administrator privileges. Please sign in with an authorized administrator account.");
    }
  }, [errorParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Authentication failed. Please verify your admin credentials.");
      }

      // Successful admin login
      router.push(redirectPath);
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1f1118 0%, #2f1725 50%, #150b10 100%)",
        padding: "24px 16px",
        fontFamily: "inherit",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "#ffffff",
          borderRadius: "8px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.45)",
          overflow: "hidden",
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            background: "var(--plum-dark, #23131b)",
            padding: "36px 32px 28px",
            textAlign: "center",
            borderBottom: "3px solid var(--coral, #f472b6)",
          }}
        >
          <div
            style={{
              display: "inline-block",
              background: "rgba(255, 255, 255, 0.1)",
              color: "#f5d0fe",
              fontSize: "0.72rem",
              fontWeight: 800,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              padding: "4px 12px",
              borderRadius: "4px",
              marginBottom: "12px",
            }}
          >
            Management Terminal
          </div>
          <h1
            style={{
              color: "#ffffff",
              fontSize: "1.8rem",
              fontWeight: 900,
              letterSpacing: "0.06em",
              margin: 0,
            }}
          >
            BGV ATELIER
          </h1>
          <p
            style={{
              color: "rgba(255, 255, 255, 0.7)",
              fontSize: "0.85rem",
              marginTop: "6px",
              marginBottom: 0,
            }}
          >
            Secure Administrator Control Center
          </p>
        </div>

        {/* Login Body */}
        <div style={{ padding: "32px" }}>
          {errorMessage && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                padding: "12px 16px",
                borderRadius: "6px",
                fontSize: "0.85rem",
                lineHeight: "1.4",
                marginBottom: "20px",
                fontWeight: 600,
              }}
              role="alert"
            >
              ⚠️ {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "18px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: "var(--ink, #1f1118)",
                  marginBottom: "6px",
                  letterSpacing: "0.02em",
                }}
              >
                Administrator Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="admin@bgvfashion.shop"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "0.95rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "22px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: "var(--ink, #1f1118)",
                  marginBottom: "6px",
                  letterSpacing: "0.02em",
                }}
              >
                Administrator Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 42px 12px 14px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "0.95rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#6b7280",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    padding: "4px",
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                background: "var(--plum, #4a154b)",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                fontSize: "0.95rem",
                fontWeight: 700,
                letterSpacing: "0.04em",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.75 : 1,
                transition: "background 0.2s, opacity 0.2s",
                boxShadow: "0 4px 12px rgba(74, 21, 75, 0.25)",
              }}
            >
              {loading ? "Authenticating Session..." : "Sign In to Admin Dashboard"}
            </button>
          </form>

          <div
            style={{
              marginTop: "24px",
              paddingTop: "20px",
              borderTop: "1px solid #e5e7eb",
              textAlign: "center",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "0.82rem",
            }}
          >
            <Link
              href="/"
              style={{
                color: "#6b7280",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              ← Back to Storefront
            </Link>
            <span style={{ color: "#9ca3af" }}>
              Atelier Ojo · Lagos
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            background: "#1f1118",
            color: "#ffffff",
          }}
        >
          Loading Admin Access...
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
