"use client";

import React from "react";
import { useStore } from "@/context/StoreContext";

export function Toast() {
  const { toast } = useStore();

  if (!toast.visible || !toast.message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        top: "calc(env(safe-area-inset-top, 0px) + 18px)",
        right: "18px",
        zIndex: 9999,
        width: "min(420px, calc(100vw - 32px))",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          border: "1px solid rgba(220, 177, 87, 0.55)",
          borderRadius: "18px",
          padding: "14px 16px",
          background:
            "linear-gradient(135deg, rgba(39, 16, 32, 0.98), rgba(64, 21, 47, 0.96))",
          color: "#fff",
          boxShadow: "0 18px 50px rgba(35, 18, 26, 0.28), 0 0 0 1px rgba(255,255,255,0.05) inset",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          fontSize: "0.92rem",
          fontWeight: 700,
          lineHeight: 1.4,
          animation: "bgvToastIn 260ms ease-out both",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            flex: "0 0 auto",
            width: "10px",
            height: "10px",
            borderRadius: "999px",
            marginTop: "5px",
            background: "linear-gradient(135deg, #f7d488, #b57b1f)",
            boxShadow: "0 0 16px rgba(247, 212, 136, 0.75)",
          }}
        />
        <span>{toast.message}</span>
      </div>
      <style jsx>{`
        @keyframes bgvToastIn {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 640px) {
          div[role="status"] {
            top: calc(env(safe-area-inset-top, 0px) + 12px) !important;
            right: 12px !important;
            width: calc(100vw - 24px) !important;
          }
        }
      `}</style>
    </div>
  );
}
