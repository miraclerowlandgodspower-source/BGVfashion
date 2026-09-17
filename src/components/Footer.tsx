import React from "react";
import Link from "next/link";
import {
  InstagramIcon,
  TikTokIcon,
  YouTubeIcon,
  FacebookIcon,
  PinterestIcon,
  SnapchatIcon,
  PaymentBadges,
} from "./Icons";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-grid">
          <div className="footer-intro">
            <Link href="/" className="wordmark" aria-label="BGV Home">
              BGV
            </Link>
            <p style={{ marginTop: "14px" }}>
              Different styles. Same energy.
              <br />
              Atelier & Distribution: <strong>Ojo, Lagos State, Nigeria</strong>.
              <br />
              Worldwide express fulfillment across 193 countries.
            </p>

            {/* Social Media Links */}
            <div style={{ display: "flex", gap: "14px", marginTop: "20px", alignItems: "center" }}>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                style={{ color: "#d3c4ce", transition: "color 0.15s" }}
              >
                <InstagramIcon size={20} />
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                style={{ color: "#d3c4ce", transition: "color 0.15s" }}
              >
                <TikTokIcon size={20} />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                style={{ color: "#d3c4ce", transition: "color 0.15s" }}
              >
                <YouTubeIcon size={20} />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                style={{ color: "#d3c4ce", transition: "color 0.15s" }}
              >
                <FacebookIcon size={20} />
              </a>
              <a
                href="https://pinterest.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Pinterest"
                style={{ color: "#d3c4ce", transition: "color 0.15s" }}
              >
                <PinterestIcon size={20} />
              </a>
              <a
                href="https://snapchat.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Snapchat"
                style={{ color: "#d3c4ce", transition: "color 0.15s" }}
              >
                <SnapchatIcon size={20} />
              </a>
            </div>

            <div style={{ marginTop: "24px" }}>
              <PaymentBadges />
            </div>
          </div>

          <div className="footer-links">
            <h2>COLLECTIONS</h2>
            <Link href="/shop?department=Women">Women’s Edit</Link>
            <Link href="/shop?department=Men">Men’s Edit</Link>
            <Link href="/shop?category=Dresses">Evening & Dresses</Link>
            <Link href="/shop?category=Denim">Tailored Denim</Link>
            <Link href="/shop?category=Sets">Matching Sets</Link>
            <Link href="/shop?category=Accessories">Bags & Accessories</Link>
            <Link href="/wishlist">Saved Favourites</Link>
          </div>

          <div className="footer-links">
            <h2>CLIENT SERVICES & POLICIES</h2>
            <Link href="/track-order">Track My Order ↗</Link>
            <Link href="/contact">Client Concierge & Support</Link>
            <Link href="/shipping-policy">Shipping & Delivery Policy</Link>
            <Link href="/returns-policy">14-Day Returns & Exchanges</Link>
            <Link href="/help#sizes">Size & Fit Guide</Link>
            <Link href="/privacy">Privacy & Cookie Policy</Link>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/account">My Account</Link>
            <Link href="/admin" style={{ color: "var(--coral)", fontWeight: 700 }}>
              Admin Portal
            </Link>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {currentYear} BGV Fashion Ltd. All rights reserved.</span>
          <span>Dispatched from Ojo, Lagos · Nationwide & Global Delivery</span>
          <div style={{ display: "flex", gap: "14px" }}>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
