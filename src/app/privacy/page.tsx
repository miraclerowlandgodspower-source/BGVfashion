import React from "react";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="wrap">
      <div className="breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <span>Privacy Policy</span>
      </div>

      <article className="content-page">
        <p className="eyebrow">LEGAL & TRUST</p>
        <h1 className="page-title">Privacy Policy</h1>
        <p style={{ color: "var(--muted)", fontStyle: "italic" }}>
          Last updated: September 2026. Compliant with Nigeria Data Protection Regulation (NDPR) & GDPR.
        </p>

        <section style={{ marginTop: "32px" }}>
          <h2>1. Introduction & Overview</h2>
          <p>
            At BGV Fashion (&ldquo;BGV&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), we deeply respect your personal privacy and are committed to protecting the personal information you share with us. This Privacy Policy outlines our practices concerning the collection, storage, processing, and disclosure of your personal data when you visit our website, create an account, purchase luxury fashion garments, or interact with our customer concierge services.
          </p>
        </section>

        <section style={{ marginTop: "32px" }}>
          <h2>2. Information We Collect</h2>
          <p>We may collect several categories of information from and about users of our store:</p>
          <ul style={{ paddingLeft: "24px", marginTop: "12px", lineHeight: "1.8" }}>
            <li><strong>Personal Contact Data:</strong> Full name, billing and shipping address, email address, and telephone number.</li>
            <li><strong>Account Credentials:</strong> Username, password hashes (securely encrypted using bcrypt), and purchase history.</li>
            <li><strong>Payment & Transaction Information:</strong> Order numbers, items purchased, totals, and Paystack payment references. Note: We never store your full credit card numbers or CVV on our servers.</li>
            <li><strong>Technical & Browsing Data:</strong> IP address, browser type, device identifiers, time zone settings, and shopping bag cookies.</li>
            <li><strong>Concierge & Chat Inquiries:</strong> Transcripts of communications submitted through our live chat, contact forms, or email support.</li>
          </ul>
        </section>

        <section style={{ marginTop: "32px" }}>
          <h2>3. How We Use Your Data</h2>
          <p>We utilize your personal information solely for lawful business purposes, including:</p>
          <ul style={{ paddingLeft: "24px", marginTop: "12px", lineHeight: "1.8" }}>
            <li>Fulfilling, processing, and dispatching your orders from our Ojo, Lagos atelier to your doorstep.</li>
            <li>Processing secure payments, fraud detection, and transaction verification via Paystack.</li>
            <li>Providing order tracking updates via SMS or email with our courier partners (e.g., GIG Logistics, DHL Express).</li>
            <li>Delivering responsive live chat customer support.</li>
            <li>Sending authentication codes (OTP) and account security notices.</li>
          </ul>
        </section>

        <section style={{ marginTop: "32px" }}>
          <h2>4. Cookies and Tracking Technologies</h2>
          <p>
            We use essential session cookies to remember the contents of your shopping bag, maintain secure logins, and store your currency and country preferences. We also provide a Cookie Consent banner allowing you to accept or decline non-essential analytics cookies at any time.
          </p>
        </section>

        <section style={{ marginTop: "32px" }}>
          <h2>5. Data Retention & Security Safeguards</h2>
          <p>
            All data transmissions across our platform are secured with industry-standard 256-bit SSL encryption. We implement strict administrative and technical safeguards to prevent unauthorized access, accidental alteration, or disclosure.
          </p>
        </section>

        <section style={{ marginTop: "32px" }}>
          <h2>6. Your Privacy Rights</h2>
          <p>
            Under applicable data protection laws, you have the right to request access to your personal data, rectify inaccuracies, request deletion of your account, or withdraw consent for marketing communications. To exercise any of these rights, please contact our Data Protection Officer via <Link href="/contact" className="text-link">our contact page</Link>.
          </p>
        </section>
      </article>
    </div>
  );
}
