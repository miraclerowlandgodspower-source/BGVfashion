"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { formatMoney } from "@/lib/money";
import { COUNTRIES_193, NIGERIAN_STATES_AND_CITIES } from "@/lib/locations";
import { calculateShippingFee } from "@/lib/shipping";
import { calculateOrderTotal } from "@/lib/order-totals";
import { PaystackIcon, TruckIcon } from "@/components/Icons";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartSubtotal, user, authReady, country, currency, showToast } = useStore();

  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: "",
    addressLine: "",
    country: country || "Nigeria",
    state: "Lagos",
    city: "Ojo / Alaba",
    postalCode: "",
  });

  const [discountCode, setDiscountCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (country) {
      setFormData((prev) => ({
        ...prev,
        country: country,
        state: country === "Nigeria" ? prev.state || "Lagos" : "",
        city: country === "Nigeria" ? prev.city || "Ojo / Alaba" : "",
      }));
    }
  }, [country]);

  const shippingCalculation = useMemo(() => {
    return calculateShippingFee({
      country: formData.country,
      state: formData.state,
      city: formData.city,
      subtotal: cartSubtotal,
    });
  }, [formData.country, formData.state, formData.city, cartSubtotal]);

  const shippingFee = Math.max(3500, shippingCalculation.fee);
  const duties = 0;
  const taxes = calculateOrderTotal(cartSubtotal, shippingFee).vatFee;
  const subtotalAfterDiscount = Math.max(0, cartSubtotal - discountAmount);
  const grandTotal = subtotalAfterDiscount + shippingFee + duties + taxes;

  useEffect(() => {
    if (authReady && !user) router.replace(`/login?returnTo=${encodeURIComponent("/checkout")}`);
  }, [authReady, router, user]);

  if (!authReady || !user) {
    return <div className="wrap" style={{ padding: "100px 0", textAlign: "center" }}><h2>Sign in to continue to checkout.</h2><p style={{ color: "var(--muted)", marginTop: "12px" }}>Redirecting you to secure sign in...</p></div>;
  }

  if (cart.length === 0) {
    return (
      <div className="wrap" style={{ padding: "80px 0" }}>
        <div className="empty-state">
          <h2>Your bag is empty</h2>
          <p>Please add items to your shopping bag before proceeding to checkout.</p>
          <Link href="/shop" className="button coral">
            Explore Collection
          </Link>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "state" && prev.country === "Nigeria" && NIGERIAN_STATES_AND_CITIES[value]) {
        updated.city = NIGERIAN_STATES_AND_CITIES[value][0] || "";
      }
      return updated;
    });
  };

  const handleApplyDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountCode.trim()) return;

    if (discountCode.trim().toUpperCase() === "BGV10" || discountCode.trim().toUpperCase() === "WELCOME10") {
      const discount = Math.round(cartSubtotal * 0.1);
      setDiscountAmount(discount);
      setDiscountApplied(true);
      showToast("10% discount applied to your order!");
    } else {
      showToast("Invalid discount code.");
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.fullName || !formData.email || !formData.addressLine || !formData.phone) {
      setError("Please fill in all required contact and address fields.");
      return;
    }

    if (!formData.city || (formData.country === "Nigeria" && !formData.state)) {
      setError("Please select your State and City for delivery calculation.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/checkout/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          shippingAddress: formData,
          currency,
          shippingCalculation,
          discountAmount,
          taxes,
          grandTotal,
        }),
      });

      const json = await res.json();

      if (!json.success || !json.data?.authorizationUrl) {
        throw new Error(json.error || "Could not initialize Paystack payment session.");
      }

      showToast("Redirecting to Paystack payment gateway...");
      window.location.assign(json.data.authorizationUrl);
    } catch (err: any) {
      console.error("Checkout error:", err);
      setError(err.message || "An error occurred during checkout. Please try again.");
      setLoading(false);
    }
  };

  const isNigeria = formData.country === "Nigeria";
  const availableCities = isNigeria && NIGERIAN_STATES_AND_CITIES[formData.state]
    ? NIGERIAN_STATES_AND_CITIES[formData.state]
    : [];

  return (
    <div className="wrap" style={{ paddingBottom: "80px" }}>
      <div className="breadcrumb">
        <Link href="/cart">Shopping Bag</Link>
        <span>/</span>
        <span>Checkout</span>
      </div>

      <form onSubmit={handlePay} className="checkout-layout" style={{ marginTop: "24px" }}>
        <section>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 900, marginBottom: "20px" }}>
            1. Delivery Address
          </h2>

          {error && (
            <div
              style={{
                backgroundColor: "#fff0f2",
                border: "1px solid #f7c5cc",
                color: "#a31835",
                padding: "14px 18px",
                marginBottom: "20px",
                fontSize: "0.875rem",
                borderRadius: "8px",
              }}
              role="alert"
            >
              {error}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <label className="field">
              <span style={{ fontWeight: 800 }}>First & Last Name *</span>
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                placeholder="First name, Last name"
              />
            </label>

            <label className="field">
              <span style={{ fontWeight: 800 }}>Email Address *</span>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
              />
            </label>
          </div>

          <label className="field">
            <span style={{ fontWeight: 800 }}>Phone Number *</span>
            <input
              type="tel"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              placeholder="+234 800 000 0000"
            />
          </label>

          <label className="field">
            <span style={{ fontWeight: 800 }}>Country / Region *</span>
            <select name="country" value={formData.country} onChange={handleChange} style={{ fontWeight: 700 }}>
              {COUNTRIES_193.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          {isNigeria ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <label className="field">
                <span style={{ fontWeight: 800 }}>State *</span>
                <select name="state" value={formData.state} onChange={handleChange} style={{ fontWeight: 700 }}>
                  {Object.keys(NIGERIAN_STATES_AND_CITIES).map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span style={{ fontWeight: 800 }}>City / LGA *</span>
                <select name="city" value={formData.city} onChange={handleChange} style={{ fontWeight: 700 }}>
                  {availableCities.map((ct) => (
                    <option key={ct} value={ct}>
                      {ct}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <label className="field">
                <span style={{ fontWeight: 800 }}>State / Region</span>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="State / Region"
                />
              </label>

              <label className="field">
                <span style={{ fontWeight: 800 }}>City *</span>
                <input
                  type="text"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City"
                />
              </label>
            </div>
          )}

          <label className="field">
            <span style={{ fontWeight: 800 }}>Address Line *</span>
            <input
              type="text"
              name="addressLine"
              required
              value={formData.addressLine}
              onChange={handleChange}
              placeholder="Street address, house number"
            />
          </label>

          {/* Paystack Exclusive Payment Method Section */}
          <div style={{ marginTop: "36px" }}>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 900, marginBottom: "16px" }}>
              2. Payment Method
            </h2>

            <div
              style={{
                border: "2px solid #000",
                borderRadius: "12px",
                padding: "20px",
                background: "#FAF8F9",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <PaystackIcon width={48} height={30} />
                <div>
                  <div style={{ fontWeight: 900, fontSize: "1rem", color: "#000" }}>
                    Paystack Payment Gateway
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "#64748B", marginTop: "2px" }}>
                    Debit / Credit Card, Bank Transfer, USSD, Apple Pay
                  </div>
                </div>
              </div>

              <div
                style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  background: "#000",
                  color: "#FFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.8rem",
                  fontWeight: 900,
                }}
              >
                ✓
              </div>
            </div>
          </div>
        </section>

        {/* Order Summary matching Image 1 */}
        <aside
          style={{
            background: "#FFF",
            border: "1px solid #E2E8F0",
            borderRadius: "16px",
            padding: "28px",
          }}
          aria-label="Order summary"
        >
          {/* Cart Products List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
            {cart.map((item, idx) => {
              if (!item.product) return null;
              return (
                <div key={idx} style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                  <div style={{ position: "relative", width: "64px", height: "64px", flexShrink: 0 }}>
                    <div className={`photo q${item.product.quadrant}`} style={{ width: "64px", height: "64px", borderRadius: "8px" }}>
                      <img
                        src={`/images/${item.product.sheet}`}
                        alt={item.product.name}
                        width={1024}
                        height={1536}
                      />
                    </div>
                    <span
                      style={{
                        position: "absolute",
                        top: "-6px",
                        right: "-6px",
                        background: "#000",
                        color: "#FFF",
                        borderRadius: "50%",
                        fontSize: "0.75rem",
                        fontWeight: 900,
                        width: "20px",
                        height: "20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {item.quantity}
                    </span>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#000" }}>
                      {item.product.name}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#64748B" }}>
                      Size: {item.size}
                    </div>
                  </div>

                  <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#000" }}>
                    {formatMoney(item.product.price * item.quantity, currency)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Discount Code Box (Image 1) */}
          <form onSubmit={handleApplyDiscount} style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
            <input
              type="text"
              placeholder="Discount code or gift card"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: "10px",
                border: "1px solid #CBD5E1",
                fontSize: "0.9rem",
                outline: "none",
                minHeight: "44px",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "0 18px",
                background: "#F1F5F9",
                border: "1px solid #CBD5E1",
                borderRadius: "10px",
                fontWeight: 800,
                fontSize: "0.88rem",
                cursor: "pointer",
                color: "#334155",
                minHeight: "44px",
              }}
            >
              Apply
            </button>
          </form>

          {/* Subtotal, Shipping, Duties, Taxes, Total Breakdown matching Image 1 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px solid #E2E8F0", paddingTop: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
              <span style={{ color: "#475569" }}>Subtotal</span>
              <span style={{ fontWeight: 800 }}>{formatMoney(cartSubtotal, currency)}</span>
            </div>

            {discountApplied && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "#16a34a" }}>
                <span>Discount (10% OFF)</span>
                <span style={{ fontWeight: 800 }}>-{formatMoney(discountAmount, currency)}</span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
              <span style={{ color: "#475569" }}>Shipping</span>
              <span style={{ fontWeight: 800 }}>
                {shippingFee === 0 ? "FREE" : formatMoney(shippingFee, currency)}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
              <span style={{ color: "#475569" }}>Duties</span>
              <span style={{ fontWeight: 800 }}>{formatMoney(duties, currency)}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
              <span style={{ color: "#475569" }}>VAT (7% of delivery)</span>
              <span style={{ fontWeight: 800 }}>{formatMoney(taxes, currency)}</span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "2px solid #000",
                paddingTop: "16px",
                marginTop: "10px",
              }}
            >
              <span style={{ fontSize: "1.1rem", fontWeight: 900, color: "#000" }}>Total</span>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 700, marginRight: "4px" }}>
                  {currency}
                </span>
                <span style={{ fontSize: "1.4rem", fontWeight: 900, color: "#000" }}>
                  {formatMoney(grandTotal, currency)}
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="button full-width"
            disabled={loading}
            style={{
              marginTop: "24px",
              background: "#000",
              color: "#FFF",
              fontWeight: 900,
              fontSize: "1.05rem",
              padding: "16px",
              borderRadius: "10px",
            }}
          >
            {loading ? "Processing..." : `Complete Order with Paystack`}
          </button>
        </aside>
      </form>
    </div>
  );
}
