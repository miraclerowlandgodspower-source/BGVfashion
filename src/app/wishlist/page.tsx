"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Product } from "@/types";
import { useStore } from "@/context/StoreContext";
import { ProductCard } from "@/components/ProductCard";

export default function WishlistPage() {
  const { wishlist } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCatalogue() {
      try {
        setLoading(true);
        const res = await fetch("/api/products");
        const json = await res.json();
        if (json.success && json.data?.products) {
          setProducts(json.data.products);
        }
      } catch (err) {
        console.error("Error loading products:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCatalogue();
  }, []);

  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="wrap" style={{ paddingBottom: "80px" }}>
      <div className="breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <span>Wishlist</span>
      </div>

      <header className="page-head">
        <p className="eyebrow">SAVED EDITS</p>
        <h1 className="page-title">Your Favourites</h1>
        <p className="page-intro">
          Curate your seasonal wardrobe. Pieces you love, all in one place.
        </p>
      </header>

      {loading ? (
        <div className="empty-state">
          <h2>Loading favourites...</h2>
        </div>
      ) : wishlistedProducts.length > 0 ? (
        <div className="product-grid">
          {wishlistedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>Keep your favourites close.</h2>
          <p>Tap the heart icon on any piece to save it here for later.</p>
          <Link href="/shop" className="button coral">
            Explore the Collection
          </Link>
        </div>
      )}
    </div>
  );
}
