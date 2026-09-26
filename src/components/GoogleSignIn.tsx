"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";

type GoogleSignInProps = {
  mode?: "signin" | "signup";
  returnTo?: string;
};

export function GoogleSignIn({ mode = "signin", returnTo = "/account" }: GoogleSignInProps) {
  const router = useRouter();
  const { setUser, showToast } = useStore();
  const buttonRef = useRef<HTMLDivElement>(null);
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
    if (!clientId || !google?.accounts?.id || !buttonRef.current) return;

    google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredential,
      context: mode,
      ux_mode: "popup",
      use_fedcm_for_button: true,
    });

    buttonRef.current.innerHTML = "";
    const width = Math.min(buttonRef.current.clientWidth || 420, 420);
    google.accounts.id.renderButton(buttonRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: mode === "signup" ? "signup_with" : "continue_with",
      shape: "rectangular",
      logo_alignment: "left",
      width,
    });
    setReady(true);
  }, [clientId, handleCredential, mode]);

  useEffect(() => {
    renderButton();
  }, [renderButton]);

  if (!clientId) {
    return <div className="google-config-note">Google sign-in is being configured.</div>;
  }

  return (
    <div className="google-auth">
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={renderButton} />
      <div ref={buttonRef} className="google-button-slot" aria-label={mode === "signup" ? "Sign up with Google" : "Continue with Google"} />
      {!ready && <div className="google-loading">Loading Google sign-in…</div>}
      {error && <p className="auth-error" role="alert">{error}</p>}
    </div>
  );
}
