"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";

export default function ContactPage() {
  const { showToast } = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    showToast("Thank you for your message. Our concierge will be in touch shortly.");
  };

  return (
    <div className="wrap">
      <div className="breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <span>Contact & Support</span>
      </div>

      <article className="content-page">
        <p className="eyebrow">CLIENT CONCIERGE</p>
        <h1 className="page-title">We’re here to help.</h1>
        <p>
          Whether you have questions about sizing, styling advice, order tracking, or delivery estimates,
          our dedicated support team is at your service.
        </p>

        <nav className="help-links" aria-label="Help topics">
          <Link href="/help#shipping">Shipping information ↗</Link>
          <Link href="/help#returns">Returns & exchanges ↗</Link>
          <Link href="/help#sizes">Size guide ↗</Link>
        </nav>

        {submitted ? (
          <div
            style={{
              padding: "36px",
              background: "var(--soft)",
              border: "1px solid var(--line)",
              marginTop: "30px",
              textAlign: "center",
            }}
          >
            <h2 style={{ fontSize: "1.6rem", marginBottom: "8px" }}>Message Received</h2>
            <p style={{ color: "var(--muted)" }}>
              Thank you, {name}. A member of our concierge team will respond to {email} within 24 hours.
            </p>
            <button
              type="button"
              className="button"
              style={{ marginTop: "20px" }}
              onClick={() => setSubmitted(false)}
            >
              Send Another Message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ marginTop: "36px" }}>
            <h2>Send us a message</h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
              <label className="field">
                <span>Your Name</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amara Okafor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>

              <label className="field">
                <span>Email Address</span>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            </div>

            <label className="field">
              <span>Subject</span>
              <input
                type="text"
                required
                placeholder="e.g. Order Inquiry / Size Advice"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </label>

            <label className="field">
              <span>Message</span>
              <textarea
                rows={5}
                required
                placeholder="How can we assist you today?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </label>

            <button className="button coral" type="submit" style={{ marginTop: "12px" }}>
              Send Message
            </button>
          </form>
        )}
      </article>
    </div>
  );
}
