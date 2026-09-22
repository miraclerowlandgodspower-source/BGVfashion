"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { CheckIcon } from "@/components/Icons";
import { formatMoney } from "@/lib/money";

function SuccessContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") || searchParams.get("trxref");
  const { clearCart, currency } = useStore();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!reference) {
      setLoading(false);
      return;
    }

    async function verify() {
      try {
        const res = await fetch(`/api/checkout/verify?reference=${encodeURIComponent(reference || "")}`);
        const json = await res.json();
        if (json.success) {
          setVerified(true);
          setOrder(json.data?.order || null);
          clearCart(); // Empty cart on successful order
        }
      } catch (err) {
        console.error("Verification error:", err);
      } finally {
        setLoading(false);
      }
    }

    verify();
  }, [reference]);

  if (loading) {
    return (
      <div className="wrap" style={{ padding: "100px 0", textAlign: "center" }}>
        <h2>Verifying your payment with Paystack...</h2>
        <p style={{ color: "var(--muted)", marginTop: "12px" }}>Please do not close this window.</p>
      </div>
    );
  }

  return (
    <div className="wrap" style={{ padding: "60px 0 100px", maxWidth: "680px" }}>
      <div
        style={{
          textAlign: "center",
          padding: "48px 32px",
          background: "var(--soft)",
          border: "1px solid var(--line)",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "var(--success)",
            color: "#fff",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 20px",
          }}
        >
          <CheckIcon size={32} />
        </div>

        <p className="eyebrow" style={{ color: "var(--success)", fontWeight: 700 }}>
          ORDER CONFIRMED
        </p>
        <h1 style={{ fontSize: "2.4rem", margin: "8px 0 14px" }}>Thank you for your order!</h1>
        <p style={{ color: "var(--muted)", fontSize: "1rem" }}>
          We’ve received your order and payment. Our atelier is preparing your pieces for delivery.
        </p>

        {reference && (
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--line)",
              padding: "20px",
              margin: "28px 0",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ color: "var(--muted)", fontSize: "0.875rem" }}>Payment Reference</span>
              <strong style={{ fontSize: "0.875rem", fontFamily: "monospace" }}>{reference}</strong>
            </div>

            {order?.orderNumber && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: "var(--muted)", fontSize: "0.875rem" }}>Order Number</span>
                <strong style={{ fontSize: "0.875rem" }}>{order.orderNumber}</strong>
              </div>
            )}

            {order?.totalAmount && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted)", fontSize: "0.875rem" }}>Amount Paid</span>
                <strong style={{ fontSize: "0.875rem" }}>
                  {formatMoney(order.totalAmount, currency)}
                </strong>
              </div>
            )}
            {order && (
              <div style={{ borderTop: "1px solid var(--line)", marginTop: "14px", paddingTop: "14px", display: "grid", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".875rem" }}><span>Subtotal</span><strong>{formatMoney(order.subtotal, order.currency || currency)}</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".875rem" }}><span>Delivery fee</span><strong>{formatMoney(order.shippingFee, order.currency || currency)}</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".875rem" }}><span>VAT (7% of delivery)</span><strong>{formatMoney(order.taxFee, order.currency || currency)}</strong></div>
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "24px" }}>
          <Link href="/account" className="button">
            View My Orders
          </Link>
          <Link href="/shop" className="button secondary">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="wrap" style={{ padding: "80px 0" }}><h2>Loading confirmation...</h2></div>}>
      <SuccessContent />
    </Suspense>
  );
}
