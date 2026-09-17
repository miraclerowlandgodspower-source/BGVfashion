import React from "react";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="wrap">
      <div className="breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <span>Terms of Service</span>
      </div>

      <article className="content-page">
        <p className="eyebrow">LEGAL AGREEMENT</p>
        <h1 className="page-title">Terms of Service</h1>
        <p style={{ color: "var(--muted)", fontStyle: "italic" }}>
          Effective Date: September 2026. Please read these terms carefully before purchasing.
        </p>

        <section style={{ marginTop: "32px" }}>
          <h2>1. Agreement to Terms</h2>
          <p>
            By accessing or using the BGV Fashion website (&ldquo;the Site&rdquo;), placing an order, or registering an account, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, please do not use our services.
          </p>
        </section>

        <section style={{ marginTop: "32px" }}>
          <h2>2. Purchases and Payment Verification</h2>
          <p>
            All product prices are displayed in Nigerian Naira (NGN) with indicative conversions available in USD, GBP, and EUR for international customers. When you place an order:
          </p>
          <ul style={{ paddingLeft: "24px", marginTop: "12px", lineHeight: "1.8" }}>
            <li>You represent that you are authorized to use the chosen payment method (Visa, Mastercard, Verve, Apple Pay, Google Pay, or Bank Transfer).</li>
            <li>All payments are securely processed through Paystack. An order is only confirmed once Paystack returns a verified payment status.</li>
            <li>We reserve the right to decline or cancel any order suspected of fraudulent activity or unauthorized payment.</li>
          </ul>
        </section>

        <section style={{ marginTop: "32px" }}>
          <h2>3. Shipping, Delivery & Risk of Loss</h2>
          <p>
            Orders are fulfilled from our main facility in Ojo, Lagos. Delivery timelines are estimates and commence from the date of dispatch. Risk of loss passes to you upon carrier delivery confirmation.
          </p>
        </section>

        <section style={{ marginTop: "32px" }}>
          <h2>4. Intellectual Property Rights</h2>
          <p>
            The BGV name, logo, editorial concept photography, garment designs, and website code are the exclusive intellectual property of BGV Fashion. Reproduction, distribution, or unauthorized commercial use without prior written consent is strictly prohibited.
          </p>
        </section>

        <section style={{ marginTop: "32px" }}>
          <h2>5. Governing Law and Dispute Resolution</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria. Any disputes arising from your use of the site or purchases made shall be subject to the exclusive jurisdiction of the courts of Lagos State, Nigeria.
          </p>
        </section>
      </article>
    </div>
  );
}
