"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GoogleSignIn } from "@/components/GoogleSignIn";
import { isValidEmail, normalizeEmail } from "@/lib/email";
import { useStore } from "@/context/StoreContext";

export default function RegisterPage() {
  const router = useRouter();
  const { showToast } = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<"details" | "verify" | "complete">("details");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const createEmailAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const normalizedEmail = normalizeEmail(email);
    if (!name.trim()) {
      setError("Enter your full name.");
      return;
    }
    if (!isValidEmail(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setEmail(normalizedEmail);
    setLoading(true);

    try {
      const registerRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: normalizedEmail,
          password,
          sessionId: typeof window !== "undefined" ? window.sessionStorage.getItem("bgv_session_id") : null,
        }),
      });
      const registerJson = await registerRes.json();
      if (!registerRes.ok || !registerJson.success) {
        throw new Error(registerJson.error || "Could not create your account.");
      }

      const otpRes = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const otpJson = await otpRes.json();
      if (!otpRes.ok || !otpJson.success) {
        throw new Error(otpJson.error || "Account created, but we could not send the verification code.");
      }

      setStep("verify");
      showToast("We sent a 6-digit verification code to your email.");
    } catch (err: any) {
      setError(err?.message || "Could not create your account.");
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!/^\d{6}$/.test(otpCode.trim())) {
      setError("Enter the 6-digit code from your email.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code: otpCode.trim(),
          name: name.trim(),
          purpose: "signup",
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Verification failed.");
      }

      setStep("complete");
      showToast("Your email has been verified.");
    } catch (err: any) {
      setError(err?.message || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Could not resend code.");
      showToast("A new verification code was sent.");
    } catch (err: any) {
      setError(err?.message || "Could not resend code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="minimal-auth-page">
      <section className="minimal-auth-panel" aria-labelledby="create-account-title">
        <p className="minimal-kicker">BGV ACCOUNT</p>
        <h1 id="create-account-title">Create your account.</h1>
        <p className="minimal-auth-copy">
          Sign up with Google or use any valid email address. Email accounts are protected with a 6-digit verification code.
        </p>

        {step === "details" && (
          <>
            <GoogleSignIn mode="signup" returnTo="/account" />
            <div className="auth-divider"><span>or sign up with email</span></div>

            {error && <p className="auth-error" role="alert">{error}</p>}

            <form onSubmit={createEmailAccount}>
              <label className="field">
                <span>Full Name</span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  autoComplete="name"
                />
              </label>

              <label className="field">
                <span>Email Address</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </label>

              <label className="field">
                <span>Password</span>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                />
              </label>

              <button className="button full-width" type="submit" disabled={loading} style={{ marginTop: "12px" }}>
                {loading ? "Creating account..." : "Create Account with Email"}
              </button>
            </form>
          </>
        )}

        {step === "verify" && (
          <>
            <p className="minimal-auth-copy" style={{ marginTop: 0 }}>
              We sent a 6-digit code to <strong>{email}</strong>. Enter it below to verify your email.
            </p>

            {error && <p className="auth-error" role="alert">{error}</p>}

            <form onSubmit={verifyEmail}>
              <label className="field">
                <span>Verification Code</span>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  autoComplete="one-time-code"
                  style={{ letterSpacing: ".2em", textAlign: "center" }}
                />
              </label>

              <button className="button full-width" type="submit" disabled={loading} style={{ marginTop: "12px" }}>
                {loading ? "Verifying..." : "Verify Email"}
              </button>
            </form>

            <button
              type="button"
              onClick={resendCode}
              disabled={loading}
              style={{ marginTop: "16px", textDecoration: "underline", color: "var(--muted)", fontSize: ".82rem" }}
            >
              Resend verification code
            </button>
          </>
        )}

        {step === "complete" && (
          <>
            <p className="minimal-auth-copy">
              Your email is verified and your BGV account has been created.
            </p>
            <button className="button full-width" type="button" onClick={() => router.push("/login")}>
              Continue to Sign In
            </button>
          </>
        )}

        <p className="minimal-privacy">
          By continuing, you agree to BGV&apos;s account and privacy terms.
        </p>

        <div className="minimal-auth-footer">
          <span>Already have a BGV account?</span>
          <Link href="/login">Sign in</Link>
        </div>
      </section>

      <aside className="minimal-auth-editorial" aria-label="BGV membership">
        <p>BGV / MEMBERSHIP</p>
        <h2>One account.<br />Your whole wardrobe.</h2>
        <div>
          <span>01 — Faster checkout</span>
          <span>02 — Order tracking</span>
          <span>03 — Wishlist access</span>
          <span>04 — Private releases</span>
        </div>
      </aside>
    </main>
  );
}
