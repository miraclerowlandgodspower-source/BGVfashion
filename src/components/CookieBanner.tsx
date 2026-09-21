"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function CookieBanner() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("bgv_cookie_consent");
    if (!consent) {
      // Delay slightly for smooth page load
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("bgv_cookie_consent", "accepted");
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("bgv_cookie_consent", "declined_non_essential");
    setVisible(false);
  };

  if (!visible || pathname?.startsWith("/admin")) return null;

  return (
    <aside
      aria-label="Cookie consent banner"
      style={{
        position: "fixed",
        bottom: "0",
        left: "0",
        right: "0",
        zIndex: 9999,
        background: "var(--plum-dark)",
        color: "#fff",
        padding: "18px 24px",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.25)",
        borderTop: "1px solid rgba(255,255,255,0.15)",
      }}
    >
      <div
        className="wrap"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div style={{ maxWidth: "780px" }}>
          <p style={{ fontSize: "0.875rem", lineHeight: "1.5", color: "#e3d8de" }}>
            <strong>Your Privacy Choices:</strong> We use cookies to elevate your shopping experience, remember
            your bag, and analyze website traffic. Read our{" "}
            <Link href="/privacy" style={{ textDecoration: "underline", color: "#fff", fontWeight: 700 }}>
              Privacy & Cookie Policy
            </Link>{" "}
            for details.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="button"
            className="button coral"
            onClick={handleAccept}
            style={{ padding: "8px 18px", minHeight: "38px", fontSize: "0.8rem" }}
          >
            Accept All
          </button>
          <button
            type="button"
            className="button outlined"
            onClick={handleDecline}
            style={{ padding: "8px 18px", minHeight: "38px", fontSize: "0.8rem" }}
          >
            Essential Only
          </button>
        </div>
      </div>
    </aside>
  );
}
