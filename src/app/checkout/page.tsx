"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { formatMoney } from "@/lib/money";
import { COUNTRIES_193, NIGERIAN_STATES_AND_CITIES } from "@/lib/locations";
import { calculateShippingFee } from "@/lib/shipping";
import { PaymentBadges, TruckIcon, ShieldIcon } from "@/components/Icons";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartSubtotal, user, country, currency, showToast } = useStore();

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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Update form country if global currency/country changes
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

  // Dynamic live calculation of distance-based shipping fee from Ojo, Lagos
  const shippingCalculation = useMemo(() => {
    return calculateShippingFee({
      country: formData.country,
      state: formData.state,
      city: formData.city,
      subtotal: cartSubtotal,
    });
  }, [formData.country, formData.state, formData.city, cartSubtotal]);

  const shippingFee = shippingCalculation.fee;
  const grandTotal = cartSubtotal + shippingFee;

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
      // If state changed in Nigeria, reset city to first city of that state
      if (name === "state" && prev.country === "Nigeria" && NIGERIAN_STATES_AND_CITIES[value]) {
        updated.city = NIGERIAN_STATES_AND_CITIES[value][0] || "";
      }
      return updated;
    });
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.fullName || !formData.email || !formData.addressLine || !formData.phone) {
      setError("Please fill in all required contact and street address fields.");
      return;
    }

    if (!formData.city || (formData.country === "Nigeria" && !formData.state)) {
      setError("Please select your destination State and City for delivery calculation.");
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
        }),
      });

      const json = await res.json();

      if (!json.success || !json.data?.authorizationUrl) {
        throw new Error(json.error || "Could not initialize secure payment gateway session.");
      }

      showToast("Redirecting to Paystack secure payment...");
      window.location.href = json.data.authorizationUrl;
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
        <span>Secure Checkout</span>
      </div>

      <header className="page-head">
        <p className="eyebrow">DESTINATION FULFILLMENT FROM OJO, LAGOS</p>
        <h1 className="page-title">Secure Checkout</h1>
        <p className="page-intro">
          Worldwide shipping across 193 countries and all Nigerian states. Guaranteed fast delivery.
        </p>
      </header>

      <form onSubmit={handlePay} className="checkout-layout">
        <section>
          <h2>1. Contact & Delivery Destination</h2>

          {error && (
            <div
              style={{
                backgroundColor: "#fff0f2",
                border: "1px solid #f7c5cc",
                color: "#a31835",
                padding: "14px 18px",
                margin: "18px 0",
                fontSize: "0.875rem",
              }}
              role="alert"
            >
              {error}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <label className="field">
              <span>Full Name *</span>
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                placeholder="e.g. Amara Okafor"
              />
            </label>

            <label className="field">
              <span>Email Address *</span>
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
            <span>Phone Number (for Courier updates) *</span>
            <input
              type="tel"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              placeholder="+234 800 000 0000"
            />
          </label>

          {/* 193 Countries Dropdown */}
          <label className="field">
            <span>Country (193 Countries Supported) *</span>
            <select name="country" value={formData.country} onChange={handleChange}>
              {COUNTRIES_193.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          {/* Cascading State & City Dropdowns */}
          {isNigeria ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <label className="field">
                <span>State (All 36 States + FCT) *</span>
                <select name="state" value={formData.state} onChange={handleChange}>
                  {Object.keys(NIGERIAN_STATES_AND_CITIES).map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>City / Area / LGA *</span>
                <select name="city" value={formData.city} onChange={handleChange}>
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
                <span>State / Province / Region</span>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="e.g. Greater London / California"
                />
              </label>

              <label className="field">
                <span>City / Town *</span>
                <input
                  type="text"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. London / New York"
                />
              </label>
            </div>
          )}

          <label className="field">
            <span>Street Address & Flat / Suite *</span>
            <input
              type="text"
              name="addressLine"
              required
              value={formData.addressLine}
              onChange={handleChange}
              placeholder="e.g. 12 Badagry Expressway, Flat 3B"
            />
          </label>

          {/* Live Delivery Calculation Notification */}
          <div
            style={{
              background: "var(--soft)",
              border: "1px solid var(--line)",
              padding: "16px 20px",
              marginTop: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "0.9rem" }}>
              <TruckIcon size={20} />
              <span>Fulfilled from: Ojo Atelier Hub, Lagos</span>
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--muted)", marginTop: "6px" }}>
              Destination Zone: <strong>{shippingCalculation.zone}</strong> · Est. Timeline:{" "}
              <strong>{shippingCalculation.estimatedDays}</strong>
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "4px" }}>
              Carriers: {shippingCalculation.couriers.join(" · ")}
            </div>
          </div>

          {/* Payment method section */}
          <div style={{ marginTop: "32px" }}>
            <h2>2. Supported Payment Methods</h2>
            <div
              style={{
                border: "1px solid var(--plum)",
                padding: "20px",
                marginTop: "16px",
                backgroundColor: "var(--soft)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div>
                  <strong style={{ fontSize: "1rem" }}>Instant & Secure Checkout</strong>
                  <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginTop: "2px" }}>
                    Pay seamlessly with your preferred card or digital wallet.
                  </p>
                </div>
                <span
                  style={{
                    background: "var(--plum)",
                    color: "#fff",
                    fontSize: "0.75rem",
                    padding: "4px 8px",
                    fontWeight: 700,
                  }}
                >
                  ENCRYPTED
                </span>
              </div>

              <PaymentBadges />
            </div>
          </div>
        </section>

        {/* Order Summary */}
        <aside className="order-summary" aria-label="Checkout Summary">
          <h2>Order Summary</h2>

          <div style={{ marginBottom: "20px", maxHeight: "260px", overflowY: "auto" }}>
            {cart.map((item, idx) => {
              if (!item.product) return null;
              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.85rem",
                    paddingBottom: "10px",
                    marginBottom: "10px",
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  <div>
                    <strong>{item.product.name}</strong>
                    <div style={{ color: "var(--muted)" }}>
                      Size {item.size} × {item.quantity}
                    </div>
                  </div>
                  <span>{formatMoney(item.product.price * item.quantity, currency)}</span>
                </div>
              );
            })}
          </div>

          <div className="summary-line">
            <span>Items Subtotal</span>
            <span>{formatMoney(cartSubtotal, currency)}</span>
          </div>

          <div className="summary-line">
            <span>
              Delivery Fee ({shippingCalculation.zone.split(" ")[0]})
            </span>
            <span>
              {shippingCalculation.isFreeShipping ? (
                <span style={{ color: "var(--success)", fontWeight: 700 }}>FREE</span>
              ) : (
                formatMoney(shippingFee, currency)
              )}
            </span>
          </div>

          <div className="summary-line summary-total">
            <span>Total to Pay</span>
            <span>{formatMoney(grandTotal, currency)}</span>
          </div>

          <button
            type="submit"
            className="button coral full-width"
            disabled={loading}
            style={{ marginTop: "24px" }}
          >
            {loading ? "Connecting to Paystack..." : `Pay ${formatMoney(grandTotal, currency)}`}
          </button>

          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--muted)",
              textAlign: "center",
              marginTop: "14px",
            }}
          >
            🔒 Protected by 256-Bit SSL & PCI-DSS Tier 1 Security
          </p>
        </aside>
      </form>
    </div>
  );
}
