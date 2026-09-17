import React from "react";
import Link from "next/link";

export default function ShippingPolicyPage() {
  return (
    <div className="wrap">
      <div className="breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <span>Shipping Policy</span>
      </div>

      <article className="content-page">
        <p className="eyebrow">DELIVERY & FULFILLMENT</p>
        <h1 className="page-title">Shipping & Delivery Policy</h1>
        <p style={{ color: "var(--muted)", fontStyle: "italic" }}>
          Orders fulfilled daily from our main atelier in Ojo, Lagos, Nigeria.
        </p>

        <section style={{ marginTop: "32px" }}>
          <h2>1. Origin and Processing Times</h2>
          <p>
            All BGV Fashion garments are inspected, packaged in custom dustproof packaging, and dispatched directly from our distribution hub located in <strong>Ojo, Lagos State, Nigeria</strong>.
          </p>
          <p>
            Orders placed before 2:00 PM West Africa Time (WAT) Monday through Friday are typically processed and handed over to our courier partners within 24 hours.
          </p>
        </section>

        <section style={{ marginTop: "32px" }}>
          <h2>2. Domestic Delivery Coverage (All 36 States + FCT)</h2>
          <p>We deliver to all thirty-six (36) states of the Federation and the Federal Capital Territory (Abuja):</p>
          <ul style={{ paddingLeft: "24px", marginTop: "12px", lineHeight: "1.8" }}>
            <li><strong>Lagos Local Zone (Ojo, Alaba, Festac, Badagry):</strong> Same-day or Next-day delivery (₦2,500).</li>
            <li><strong>Lagos Mainland Central (Ikeja, Surulere, Yaba, Gbagada):</strong> 1–2 business days (₦3,500).</li>
            <li><strong>Lagos Island & Outskirts (Lekki, VI, Ikoyi, Ajah, Ikorodu):</strong> 1–2 business days (₦4,500).</li>
            <li><strong>South-West Neighboring States (Ogun, Oyo, Osun, Ondo, Ekiti):</strong> 2–3 business days (₦5,800).</li>
            <li><strong>Major Metros (Abuja FCT, Port Harcourt, Kano, Kaduna, Enugu):</strong> 2–4 business days (₦7,500).</li>
            <li><strong>Rest of Nigeria:</strong> 3–5 business days (₦8,500).</li>
          </ul>
          <div style={{ background: "var(--soft)", padding: "16px 20px", marginTop: "16px", borderLeft: "4px solid var(--plum)" }}>
            <strong>✨ Complimentary Express Shipping:</strong> Available on all domestic Nigerian orders exceeding ₦150,000.
          </div>
        </section>

        <section style={{ marginTop: "32px" }}>
          <h2>3. Worldwide International Shipping (193 Countries)</h2>
          <p>
            We proudly ship to all 193 UN member countries worldwide via premium carriers including <strong>DHL Express Worldwide</strong> and <strong>FedEx International Priority</strong>.
          </p>
          <ul style={{ paddingLeft: "24px", marginTop: "12px", lineHeight: "1.8" }}>
            <li><strong>West Africa (Ghana, Benin, Togo, Côte d&apos;Ivoire, Senegal):</strong> 3–5 business days (₦24,000 / ~$15).</li>
            <li><strong>United Kingdom & European Union:</strong> 4–6 business days (₦35,000 / ~$22).</li>
            <li><strong>United States & Canada:</strong> 4–7 business days (₦42,000 / ~$26).</li>
            <li><strong>Rest of the World:</strong> 5–9 business days (₦48,000 / ~$30).</li>
          </ul>
        </section>

        <section style={{ marginTop: "32px" }}>
          <h2>4. Live Order Tracking</h2>
          <p>
            Upon courier handover, you will receive an automated tracking reference via email or SMS. You can also track the real-time movement of your package anytime using our <Link href="/track-order" className="text-link">Live Order Tracker</Link>.
          </p>
        </section>
      </article>
    </div>
  );
}
