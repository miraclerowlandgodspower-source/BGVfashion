"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";

type GoogleSignInProps = {
  mode?: "signin" | "signup";
  returnTo?: string;
};

const GOOGLE_BUTTON_MAX_WIDTH = 400;

export function GoogleSignIn({ mode = "signin", returnTo = "/account" }: GoogleSignInProps) {
  const router = useRouter();
  const { setUser, showToast } = useStore();
  const buttonRef = useRef<HTMLDivElement>(null);
  const lastRenderedWidth = useRef(0);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleCredential = useCallback(async (response: { credential?: string }) => {
    if (!response.credential) {
      setError("Google did not return a sign-in credential.");
      return;
    }

    setError("");
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });
      const json = await res.json();

      if (!res.ok || !json.success || !json.data?.user) {
        throw new Error(json.error || "Google sign-in failed.");
      }

      setUser(json.data.user);
      showToast(mode === "signup" ? "Your BGV account is ready." : `Welcome back, ${json.data.user.name}!`);
      router.push(returnTo.startsWith("/") ? returnTo : "/account");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Could not continue with Google.");
    }
  }, [mode, returnTo, router, setUser, showToast]);

  const renderButton = useCallback(() => {
    const google = (window as any).google;
    const slot = buttonRef.current;
    if (!clientId || !google?.accounts?.id || !slot) return;

    const availableWidth = Math.floor(slot.getBoundingClientRect().width);
    if (!availableWidth) return;

    const width = Math.min(availableWidth, GOOGLE_BUTTON_MAX_WIDTH);
    if (ready && lastRenderedWidth.current === width) return;

    google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredential,
      context: mode,
      ux_mode: "popup",
      use_fedcm_for_button: true,
    });

    slot.innerHTML = "";
    google.accounts.id.renderButton(slot, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: mode === "signup" ? "signup_with" : "continue_with",
      shape: "rectangular",
      logo_alignment: "left",
      width,
    });

    lastRenderedWidth.current = width;
    setReady(true);
  }, [clientId, handleCredential, mode, ready]);

  useEffect(() => {
    renderButton();

    const slot = buttonRef.current;
    if (!slot || typeof ResizeObserver === "undefined") return;

    let frame = 0;
    const observer = new ResizeObserver(() => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(renderButton);
    });

    observer.observe(slot);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [renderButton]);

  if (!clientId) {
    return <div className="google-config-note">Google sign-in is being configured.</div>;
  }

  return (
    <div className="google-auth" style={{ width: "100%", maxWidth: GOOGLE_BUTTON_MAX_WIDTH }}>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={renderButton} />
      <div
        ref={buttonRef}
        className="google-button-slot"
        aria-label={mode === "signup" ? "Sign up with Google" : "Continue with Google"}
        style={{
          width: "100%",
          maxWidth: GOOGLE_BUTTON_MAX_WIDTH,
          minWidth: 0,
          minHeight: 44,
          overflow: "hidden",
        }}
      />
      {!ready && <div className="google-loading">Loading Google sign-in…</div>}
      {error && <p className="auth-error" role="alert">{error}</p>}
    </div>
  );
}
