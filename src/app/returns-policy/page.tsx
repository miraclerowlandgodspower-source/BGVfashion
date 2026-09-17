import React from "react";
import Link from "next/link";

export default function ReturnsPolicyPage() {
  return (
    <div className="wrap">
      <div className="breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <span>Returns & Refund Policy</span>
      </div>

      <article className="content-page">
        <p className="eyebrow">CLIENT SATISFACTION</p>
        <h1 className="page-title">Returns & Exchanges Policy</h1>
        <p style={{ color: "var(--muted)", fontStyle: "italic" }}>
          We want you to feel confident in every piece you wear.
        </p>

        <section style={{ marginTop: "32px" }}>
          <h2>1. 14-Day Return & Exchange Guarantee</h2>
          <p>
            If you are not completely satisfied with your purchase, BGV Fashion gladly accepts returns and size exchanges within <strong>fourteen (14) calendar days</strong> from the date of package delivery.
          </p>
        </section>

        <section style={{ marginTop: "32px" }}>
          <h2>2. Eligibility Criteria</h2>
          <p>To qualify for a refund or size replacement, returned items must strictly meet the following conditions:</p>
          <ul style={{ paddingLeft: "24px", marginTop: "12px", lineHeight: "1.8" }}>
            <li>Unworn, unwashed, and completely free from perfume, deodorant, makeup stains, or odors.</li>
            <li>In original brand packaging with all garment tags, security seals, and dust bags intact.</li>
            <li>Accompanied by the original order confirmation email or receipt reference.</li>
          </ul>
        </section>

        <section style={{ marginTop: "32px" }}>
          <h2>3. How to Initiate a Return</h2>
          <p>Initiating a return is simple:</p>
          <ol style={{ paddingLeft: "24px", marginTop: "12px", lineHeight: "1.8" }}>
            <li>Contact our concierge team via our <Link href="/contact" className="text-link">Contact Page</Link> or open our <strong>Live Chat</strong> at the bottom of your screen.</li>
            <li>Provide your Order Reference (e.g. <code>BGV-XXXXXX</code>) and the reason for exchange or return.</li>
            <li>Our team will provide a prepaid return courier authorization or drop-off location in your city.</li>
            <li>Once inspected at our Ojo, Lagos hub, your replacement piece will be dispatched or refund issued within 3–5 business days.</li>
          </ol>
        </section>
      </article>
    </div>
  );
}
