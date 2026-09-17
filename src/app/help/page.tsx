import React from "react";
import Link from "next/link";

export default function HelpPage() {
  return (
    <div className="wrap">
      <div className="breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <span>Customer Care & FAQs</span>
      </div>

      <article className="content-page">
        <p className="eyebrow">CUSTOMER CARE</p>
        <h1 className="page-title">Frequently Asked Questions</h1>
        <p>Everything you need to know regarding orders, shipping, sizing, and security.</p>

        <section id="shipping" style={{ marginTop: "36px" }}>
          <h2>Shipping & Global Delivery</h2>
          <p>
            We provide nationwide delivery across Nigeria within 2 to 4 business days. Express shipping is
            complimentary on orders exceeding ₦100,000.
          </p>
          <p>
            For international clients (US, UK, Europe, Canada, and across Africa), orders are dispatched via
            DHL Express with end-to-end tracking provided immediately upon shipment.
          </p>
        </section>

        <section id="returns" style={{ marginTop: "36px" }}>
          <h2>Returns & Exchanges</h2>
          <p>
            We want you to feel confident in every BGV piece. We gladly offer a 14-day return and exchange
            policy from the date of delivery. Items must be unworn, in original condition with all garment tags
            attached.
          </p>
          <p>
            To initiate an exchange or return, simply reach out through our <Link href="/contact" className="text-link">contact page</Link> with your order reference.
          </p>
        </section>

        <section id="sizes" style={{ marginTop: "36px" }}>
          <h2>Size & Fit Information</h2>
          <p>
            All BGV garments follow standard international sizing with relaxed, contemporary proportions.
            If you fall between sizes or desire an oversized silhouette, we recommend selecting your regular size.
            For structured tailoring, choose your exact measurement.
          </p>
        </section>

        <section id="privacy" style={{ marginTop: "36px" }}>
          <h2>Payment Security & Privacy</h2>
          <p>
            All online transactions on BGV Fashion are processed through Paystack, a PCI-DSS Level 1 certified
            payment processor. We do not store credit card numbers on our servers. Your personal data is encrypted
            with 256-bit SSL protocols.
          </p>
        </section>
      </article>
    </div>
  );
}
