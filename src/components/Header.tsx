"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import {
  SearchIcon,
  HeartIcon,
  UserIcon,
  BagIcon,
  GlobeIcon,
  MenuIcon,
  CloseIcon,
  TruckIcon,
  InstagramIcon,
  TikTokIcon,
  YouTubeIcon,
} from "./Icons";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, cartCount, wishlist, country, currency, setIsRegionModalOpen } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <header>
      <div className="header-main wrap">
        <button
          className="icon-button menu-toggle"
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>

        <Link href="/" className="wordmark" aria-label="BGV Fashion Homepage">
          BGV
        </Link>

        <form className="search-form" onSubmit={handleSearch} role="search">
          <button type="submit" aria-label="Search collection">
            <SearchIcon />
          </button>
          <input
            type="search"
            placeholder="Search BGV pieces (Dresses, Denim, Sets...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            maxLength={100}
          />
        </form>

        <div className="header-actions">
          <button
            type="button"
            className="region-button"
            onClick={() => setIsRegionModalOpen(true)}
            aria-label="Choose shipping country and currency"
          >
            <GlobeIcon />
            <span>
              {country} / {currency}
            </span>
            <span aria-hidden="true" style={{ fontSize: "0.75rem" }}>
              ⌄
            </span>
          </button>

          <Link
            href={user ? "/account" : "/login"}
            className="icon-button"
            aria-label={user ? `Account (${user.name})` : "Sign In"}
            title={user ? `Signed in as ${user.name}` : "Sign In"}
          >
            <UserIcon />
          </Link>

          <Link
            href="/wishlist"
            className="icon-button"
            aria-label={`Wishlist, ${wishlist.length} saved pieces`}
          >
            <HeartIcon />
            {wishlist.length > 0 && <span className="count-badge">{wishlist.length}</span>}
          </Link>

          <Link
            href="/cart"
            className="icon-button bag-link"
            aria-label={`Shopping bag, ${cartCount} items`}
          >
            <BagIcon />
            {cartCount > 0 && <span className="count-badge">{cartCount}</span>}
          </Link>
        </div>
      </div>

      <nav className={`main-nav ${mobileMenuOpen ? "mobile-open" : ""}`} aria-label="Main navigation">
        <div className="nav-inner wrap">
          <Link
            href="/shop"
            className={pathname === "/shop" ? "active" : ""}
            onClick={() => setMobileMenuOpen(false)}
          >
            New In
          </Link>
          <Link
            href="/shop?department=Women"
            onClick={() => setMobileMenuOpen(false)}
          >
            Women
          </Link>
          <Link
            href="/shop?department=Men"
            onClick={() => setMobileMenuOpen(false)}
          >
            Men
          </Link>
          <Link
            href="/shop?category=Dresses"
            onClick={() => setMobileMenuOpen(false)}
          >
            Dresses
          </Link>
          <Link
            href="/shop?category=Denim"
            onClick={() => setMobileMenuOpen(false)}
          >
            Denim
          </Link>
          <Link
            href="/shop?category=Sets"
            onClick={() => setMobileMenuOpen(false)}
          >
            Sets
          </Link>
          <Link
            href="/shop?category=Streetwear"
            onClick={() => setMobileMenuOpen(false)}
          >
            Streetwear
          </Link>
          <Link
            href="/shop?category=Accessories"
            onClick={() => setMobileMenuOpen(false)}
          >
            Accessories
          </Link>
          <Link
            href="/about"
            className={pathname === "/about" ? "active" : ""}
            onClick={() => setMobileMenuOpen(false)}
          >
            Our Story
          </Link>
          <Link
            href="/track-order"
            className={pathname === "/track-order" ? "active" : ""}
            onClick={() => setMobileMenuOpen(false)}
          >
            Track Order
          </Link>
          <Link
            href="/contact"
            className={pathname === "/contact" ? "active" : ""}
            onClick={() => setMobileMenuOpen(false)}
          >
            Contact
          </Link>
        </div>
      </nav>
    </header>
  );
}
