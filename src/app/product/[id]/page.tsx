"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { Product } from "@/types";
import { useStore } from "@/context/StoreContext";
import { formatMoney } from "@/lib/money";
import { BagIcon, HeartIcon } from "@/components/Icons";
import { ProductCard } from "@/components/ProductCard";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { addToCart, isWishlisted, toggleWishlist, currency } = useStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [sizeError, setSizeError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [adding, setAdding] = useState<boolean>(false);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        const res = await fetch(`/api/products/${id}`);
        const json = await res.json();
        if (json.success && json.data?.product) {
          setProduct(json.data.product);
          // Load other products for recommendations
          const allRes = await fetch("/api/products");
          const allJson = await allRes.json();
          if (allJson.success && allJson.data?.products) {
            const others = allJson.data.products.filter((p: Product) => p.id !== id).slice(0, 4);
            setRelated(others);
          }
        }
      } catch (err) {
        console.error("Error loading product:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="wrap" style={{ padding: "80px 0", textAlign: "center" }}>
        <h2>Loading piece details...</h2>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="wrap" style={{ padding: "80px 0" }}>
        <div className="empty-state">
          <h2>This piece could not be found.</h2>
          <p>It may have sold out or been removed from our current collection.</p>
          <Link href="/shop" className="button">
            Explore Collection
          </Link>
        </div>
      </div>
    );
  }

  const wished = isWishlisted(product.id);

  const handleAddToBag = async () => {
    if (!selectedSize) {
      setSizeError("Please select a size before adding to your bag.");
      return;
    }
    setSizeError("");
    setAdding(true);
    try {
      await addToCart(product, selectedSize, quantity);
    } catch (err: any) {
      setSizeError(err.message || "Failed to add to bag.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="wrap" style={{ paddingBottom: "70px" }}>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/shop">Collection</Link>
        <span>/</span>
        <Link href={`/shop?department=${product.department}`}>{product.department}</Link>
        <span>/</span>
        <span>{product.name}</span>
      </nav>

      <div className="product-detail">
        <div className={`photo q${product.quadrant}`}>
          <img
            src={`/images/${product.sheet}`}
            alt={product.name}
            width={1024}
            height={1536}
          />
        </div>

        <div className="product-copy">
          <p className="eyebrow">
            {product.department} / {product.category}
          </p>
          <h1>{product.name}</h1>
          <div className="detail-price">{formatMoney(product.price, currency)}</div>
          <p>{product.description}</p>

          <div style={{ marginTop: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: "0.875rem" }}>Select Size</span>
              <Link href="/help#sizes" className="text-link" style={{ fontSize: "0.8rem" }}>
                Size Guide ↗
              </Link>
            </div>

            <div className="size-options" role="group" aria-label="Size options">
              {product.sizes.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  className={selectedSize === sz ? "selected" : ""}
                  onClick={() => {
                    setSelectedSize(sz);
                    setSizeError("");
                  }}
                  aria-pressed={selectedSize === sz}
                >
                  {sz}
                </button>
              ))}
            </div>

            {sizeError && (
              <p className="error-message" role="alert">
                {sizeError}
              </p>
            )}

            <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
              <button
                type="button"
                className="button coral full-width"
                onClick={handleAddToBag}
                disabled={adding}
              >
                <BagIcon />
                {adding ? "Adding..." : "Add to Bag"}
              </button>

              <button
                type="button"
                className={`button secondary ${wished ? "wished" : ""}`}
                onClick={() => toggleWishlist(product.id)}
                aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
                style={{ padding: "0 18px" }}
              >
                <HeartIcon filled={wished} />
              </button>
            </div>
          </div>

          <div style={{ marginTop: "32px" }}>
            <details open>
              <summary>Composition & Care</summary>
              <p>
                Crafted from premium, breathable natural fibres tailored for durability and effortless movement.
                Hand wash or machine wash cold with like colours.
              </p>
            </details>

            <details>
              <summary>Shipping & Returns</summary>
              <p>
                Standard delivery: 2–4 business days within Nigeria. Express global shipping available at checkout.
                Free exchanges and 14-day hassle-free return window.
              </p>
            </details>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="section" style={{ borderTop: "1px solid var(--line)" }}>
          <div className="section-heading">
            <h2>Complete the look</h2>
            <Link href="/shop" className="text-link">
              View all <span aria-hidden="true">↗</span>
            </Link>
          </div>

          <div className="product-grid">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
