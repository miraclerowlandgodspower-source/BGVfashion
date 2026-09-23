"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { SearchIcon, HeartIcon, UserIcon, BagIcon, GlobeIcon, MenuIcon, CloseIcon } from "./Icons";

const shopLinks = [
  ["New In", "/shop"],
  ["Dresses", "/shop?category=Dresses"],
  ["Tops", "/shop?category=Tops"],
  ["Denim", "/shop?category=Denim"],
  ["Sets", "/shop?category=Sets"],
  ["Jackets", "/shop?category=Jackets"],
  ["Streetwear", "/shop?category=Streetwear"],
  ["Accessories", "/shop?category=Accessories"],
];

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, cartCount, wishlist, country, currency, setIsRegionModalOpen } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileDepartment, setMobileDepartment] = useState("Women");

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  const closeMenu = () => setMobileMenuOpen(false);
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      closeMenu();
    }
  };

  if (pathname?.startsWith("/admin")) return null;

  return (
    <header>
      <div className="header-main wrap">
        <button className="icon-button menu-toggle" type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle mobile menu" aria-expanded={mobileMenuOpen}>
          {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
        <Link href="/" className="wordmark" aria-label="BGV Fashion Homepage">BGV</Link>
        <form className="search-form" onSubmit={handleSearch} role="search">
          <button type="submit" aria-label="Search collection"><SearchIcon /></button>
          <input type="search" placeholder="Search BGV pieces (Dresses, Denim, Sets...)" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} maxLength={100} />
        </form>
        <div className="header-actions">
          <button type="button" className="region-button" onClick={() => setIsRegionModalOpen(true)} aria-label="Choose shipping country and currency">
            <GlobeIcon /><span>{country} / {currency}</span><span aria-hidden="true" style={{ fontSize: "0.75rem" }}>⌄</span>
          </button>
          <Link href={user ? "/account" : "/login"} className="icon-button" aria-label={user ? `Account (${user.name})` : "Sign In"}><UserIcon /></Link>
          <Link href="/wishlist" className="icon-button" aria-label={`Wishlist, ${wishlist.length} saved pieces`}><HeartIcon />{wishlist.length > 0 && <span className="count-badge">{wishlist.length}</span>}</Link>
          <Link href="/cart" className="icon-button bag-link" aria-label={`Shopping bag, ${cartCount} items`}><BagIcon />{cartCount > 0 && <span className="count-badge">{cartCount}</span>}</Link>
        </div>
      </div>

      <nav className="main-nav" aria-label="Main navigation">
        <div className="nav-inner wrap">
          <Link href="/shop">New In</Link><Link href="/shop?department=Women">Women</Link><Link href="/shop?department=Men">Men</Link>
          <Link href="/shop?category=Dresses">Dresses</Link><Link href="/shop?category=Denim">Denim</Link><Link href="/shop?category=Sets">Sets</Link>
          <Link href="/shop?category=Streetwear">Streetwear</Link><Link href="/shop?category=Accessories">Accessories</Link>
          <Link href="/about">Our Story</Link><Link href="/track-order">Track Order</Link><Link href="/contact">Contact</Link>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="mobile-shop-menu" role="dialog" aria-modal="true" aria-label="BGV shop menu">
          <div className="mobile-menu-top">
            <button type="button" className="mobile-menu-close" onClick={closeMenu} aria-label="Close menu"><CloseIcon /></button>
            <Link href="/" className="mobile-menu-logo" onClick={closeMenu}>BGV</Link>
            <div className="mobile-menu-icons">
              <button type="button" onClick={() => { closeMenu(); setIsRegionModalOpen(true); }} aria-label="Region"><GlobeIcon /></button>
              <Link href={user ? "/account" : "/login"} onClick={closeMenu}><UserIcon /></Link>
              <Link href="/wishlist" onClick={closeMenu}><HeartIcon /></Link>
              <Link href="/cart" onClick={closeMenu} className="mobile-menu-bag"><BagIcon />{cartCount > 0 && <span>{cartCount}</span>}</Link>
            </div>
          </div>

          <form className="mobile-menu-search" onSubmit={handleSearch}>
            <SearchIcon />
            <input type="search" placeholder="Search BGV pieces" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </form>

          <div className="mobile-department-tabs">
            {["Women", "Men", "Unisex"].map((department) => (
              <button key={department} type="button" className={mobileDepartment === department ? "active" : ""} onClick={() => setMobileDepartment(department)}>{department}</button>
            ))}
          </div>

          <div className="mobile-feature-links">
            <Link href="/shop" onClick={closeMenu}><strong>NEW IN</strong><span>Latest BGV pieces</span></Link>
            <Link href="/shop?sort=best-selling" onClick={closeMenu}><strong>BEST SELLERS</strong><span>Most wanted</span></Link>
            <Link href="/shop?sale=true" onClick={closeMenu}><strong>SALE</strong><span>Selected edits</span></Link>
          </div>

          <section className="mobile-menu-section">
            <p>SHOP {mobileDepartment.toUpperCase()}</p>
            <Link className="mobile-menu-row featured" href={`/shop?department=${encodeURIComponent(mobileDepartment)}`} onClick={closeMenu}><span>Shop All {mobileDepartment}</span><b>›</b></Link>
            {shopLinks.slice(1).map(([label, href]) => (
              <Link className="mobile-menu-row" key={label} href={`${href}&department=${encodeURIComponent(mobileDepartment)}`} onClick={closeMenu}><span>{label}</span><b>›</b></Link>
            ))}
          </section>

          <section className="mobile-menu-section">
            <p>MY BGV</p>
            <Link className="mobile-menu-row" href={user ? "/account" : "/login"} onClick={closeMenu}><span>{user ? "My Account" : "Sign In / Register"}</span><b>›</b></Link>
            <Link className="mobile-menu-row" href="/wishlist" onClick={closeMenu}><span>Wishlist</span><b>›</b></Link>
            <Link className="mobile-menu-row" href="/track-order" onClick={closeMenu}><span>Track Order</span><b>›</b></Link>
            <Link className="mobile-menu-row" href="/about" onClick={closeMenu}><span>Our Story</span><b>›</b></Link>
            <Link className="mobile-menu-row" href="/contact" onClick={closeMenu}><span>Contact</span><b>›</b></Link>
          </section>
        </div>
      )}
    </header>
  );
}
